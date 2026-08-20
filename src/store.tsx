// Globální stav aplikace (React Context).
//
// Dva režimy:
//   • CLOUD  — klíče Supabase jsou v `app.json`, data se sdílí a synchronizují.
//   • LOKÁLNÍ — klíče nejsou, data žijí jen v telefonu (AsyncStorage).
// Každá asynchronní akce má obě větve. Díky tomu se dá appka rozjet a
// proklikat dřív, než vůbec vznikne projekt v Supabase.
//
// IDENTITA: v databázi jsou reálná jména. V appce se člen, jehož `user_id`
// sedí na můj účet, zobrazuje jako „You" (konstanta ME v logic.ts). Celá
// výpočetní vrstva je jméno-orientovaná, převod tam a zpět dělá `norm`/`denorm`.

import React, { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { Appearance, BackHandler, Share, Platform, I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import * as Localization from 'expo-localization';
import * as Updates from 'expo-updates';

import { authApi, groupsApi, expensesApi, storageApi } from './api';
import type { RawExpense } from './api/expenses';
import { supabase, isSupabaseConfigured } from './supabase';
import { setLangGlobal } from './i18n';
import { language, isRTL } from './languages';
import { parseAmount, splitEqual, splitShares, remainderOf } from './money';
import { decimalsOf } from './currencies';
import { ME, transfersFor } from './logic';
import { landingJoinUrl } from './config';
import { loadRates } from './fx';
import { registerForPush, notifyGroup, inQuietHours } from './notifications';
import { canAddReceipt, FREE_RECEIPTS_PER_EXPENSE } from './entitlements';
import * as queue from './queue';
import * as haptics from './haptics';
import type {
  AppState, Actions, AppContextValue, Patch, Group, Expense, Payment,
  ScreenName, TabName, ThemeName, ModeName, TextSize, NotifPrefs, Transfer,
  SplitType, ExpenseDraft, JoinPreview,
} from './types';

export const CLOUD_MODE = isSupabaseConfigured;

const STATE_KEY = '@splittingly/prefs-v1';
const DATA_KEY = '@splittingly/data-v1';

const AppContext = createContext<AppContextValue | null>(null);

const denorm = (name: string, myName: string) => (name === ME ? myName : name);
const norm = (name: string, myName: string) => (name === myName ? ME : name);

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function emptyDraft(): ExpenseDraft {
  return {
    id: null, groupId: null, desc: '', amountText: '', currency: 'EUR',
    payer: ME, parts: [], splitType: 'equal', shares: {}, exactText: {},
    category: 'food', spentAt: new Date().toISOString(), receipts: [],
  };
}

/** Jazyk telefonu, pokud ho podporujeme; jinak angličtina. */
function detectLang(): string {
  try {
    const tags = Localization.getLocales();
    for (const l of tags) {
      const exact = l.languageTag;
      const base = l.languageCode || '';
      if (language(exact).code === exact) return exact;
      if (language(base).code === base) return base;
    }
  } catch {
    // detekce je pohodlí, ne požadavek
  }
  return 'en';
}

/** Měna podle regionu telefonu — jen jako první nabídka, uživatel si ji mění sám. */
function detectCurrency(): string {
  try {
    const c = Localization.getLocales()[0]?.currencyCode;
    if (c) return c;
  } catch {
    // nevadí
  }
  return 'EUR';
}

function makeInitialState(): AppState {
  const lang = detectLang();
  return {
    screen: 'onboarding',
    tab: 'overview',
    history: [],
    selectedGroup: null,
    selectedExpense: null,
    selectedTransfer: null,

    booting: true,
    busy: false,
    loading: false,
    toast: null,
    errorText: null,
    celebrate: false,
    dialog: null,
    deleteConfirmText: '',

    meUid: null,
    myName: '',
    myEmail: '',
    avatarColor: '#1F49FF',
    emailVerified: false,
    appleAvailable: false,
    googleEnabled: true,

    lang,
    langChosen: false,
    currency: detectCurrency(),
    theme: 'acid',
    mode: 'system',
    systemDark: Appearance.getColorScheme() === 'dark',
    textSize: 'medium',
    notif: {
      expense: true, settled: true, edited: true, weekly: false,
      closer: true, analyst: true, quietFrom: 23, quietTo: 8,
    },
    personalisedAds: false,
    isPro: false,
    rewardTheme: null,
    rewardUntil: null,
    mascotsOn: true,

    authEmail: '',
    authPassword: '',
    authName: '',
    authCode: '',
    authError: null,
    authAttemptsLeft: 3,
    consentAccepted: false,

    newGroupName: '',
    newGroupColor: '#FFE500',
    newGroupCurrency: detectCurrency(),
    newGroupMembers: [],
    newMemberInput: '',

    joinCodeInput: '',
    joinPreview: null,

    draft: emptyDraft(),

    settleMethod: 'cash',
    settleNote: '',

    searchQuery: '',
    searchFilters: [],
    recentSearches: [],

    statsPeriod: 'month',

    groups: [],
    expenses: {},
    payments: {},
    audit: {},
    fxRates: null,
    sync: { online: true, lastSyncedAt: null, queued: 0 },
  };
}

// Kam vede systémové „zpět" z každé obrazovky.
const BACK_MAP: Partial<Record<ScreenName, ScreenName>> = {
  signup: 'onboarding', login: 'onboarding', forgot: 'login',
  new_password: 'login', confirm_email: 'signup',
  create_group: 'overview', join_group: 'overview',
  group: 'overview', add_expense: 'group', split_method: 'add_expense',
  receipt: 'add_expense', expense_detail: 'group', settle: 'group',
  stats: 'overview', year_in_review: 'stats', activity: 'overview',
  search: 'overview', share_card: 'group',
  profile: 'overview', language: 'profile', currency: 'profile',
  appearance: 'profile', notifications: 'profile', remove_ads: 'profile',
  privacy: 'profile', settings: 'profile',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(makeInitialState);
  // Reference na aktuální stav — asynchronní akce nesmí číst zavřený `state`.
  const stateRef = useRef(state);
  stateRef.current = state;

  const patch = (p: Patch) => {
    setState((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) }));
  };

  const showToast = (text: string) => {
    patch({ toast: text });
    setTimeout(() => patch({ toast: null }), 2600);
  };

  // ---------------------------------------------------------------- navigace

  const navigate = (screen: ScreenName) => {
    setState((s) => (s.screen === screen ? s : { ...s, screen, history: [...s.history, s.screen] }));
  };

  const goBack = (): boolean => {
    const s = stateRef.current;
    if (s.dialog) { patch({ dialog: null }); return true; }
    if (s.screen === 'overview' || s.screen === 'onboarding') return false;
    const prev = s.history.length ? s.history[s.history.length - 1] : (BACK_MAP[s.screen] || 'overview');
    setState((st) => ({ ...st, screen: prev, history: st.history.slice(0, -1) }));
    return true;
  };

  const setTab = (tab: TabName) => {
    const screen: ScreenName = tab === 'activity' ? 'activity' : tab === 'stats' ? 'stats' : 'overview';
    setState((s) => ({ ...s, tab, screen, history: [] }));
  };

  // ------------------------------------------------------------- perzistence

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STATE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          patch(saved);
          if (saved.lang) setLangGlobal(saved.lang);
        }
      } catch {
        // poškozené předvolby nejsou důvod nespustit appku
      }
      patch({ appleAvailable: await authApi.isAppleAvailable().catch(() => false) });
      await boot();
    })();

    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      patch({ systemDark: colorScheme === 'dark' });
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Uložení předvoleb při každé změně (data se ukládají zvlášť).
  useEffect(() => {
    if (state.booting) return;
    const prefs = {
      lang: state.lang, langChosen: state.langChosen, currency: state.currency,
      theme: state.theme, mode: state.mode, textSize: state.textSize,
      notif: state.notif, personalisedAds: state.personalisedAds,
      isPro: state.isPro, rewardTheme: state.rewardTheme, rewardUntil: state.rewardUntil,
      mascotsOn: state.mascotsOn, recentSearches: state.recentSearches,
    };
    AsyncStorage.setItem(STATE_KEY, JSON.stringify(prefs)).catch(() => undefined);
  }, [
    state.booting, state.lang, state.langChosen, state.currency, state.theme, state.mode,
    state.textSize, state.notif, state.personalisedAds, state.isPro, state.rewardTheme,
    state.rewardUntil, state.mascotsOn, state.recentSearches,
  ]);

  // Systémové „zpět" na Androidu.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => goBack());
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------- start

  async function boot() {
    if (!CLOUD_MODE) {
      const local = await loadLocal();
      patch({ ...local, booting: false, screen: local.groups.length ? 'overview' : 'onboarding', meUid: 'local', myName: 'You' });
      return;
    }
    try {
      const session = await authApi.getSession();
      if (!session) { patch({ booting: false, screen: 'onboarding' }); return; }
      const profile = await authApi.fetchProfile();
      patch({
        meUid: session.user.id,
        myEmail: session.user.email || '',
        emailVerified: !!session.user.email_confirmed_at,
        myName: profile?.displayName || session.user.email?.split('@')[0] || 'You',
        avatarColor: profile?.avatarColor || '#1F49FF',
        lang: stateRef.current.langChosen ? stateRef.current.lang : (profile?.lang || stateRef.current.lang),
        currency: profile?.currency || stateRef.current.currency,
        theme: (profile?.theme || 'acid') as ThemeName,
        mode: (profile?.mode || 'system') as ModeName,
        textSize: (profile?.textSize || 'medium') as TextSize,
        notif: profile?.notif || stateRef.current.notif,
        personalisedAds: !!profile?.personalisedAds,
        isPro: !!profile?.isPro,
        rewardTheme: profile?.rewardTheme || null,
        rewardUntil: profile?.rewardUntil || null,
        screen: 'overview',
      });
      setLangGlobal(stateRef.current.lang);
      patch({ sync: { ...stateRef.current.sync, queued: await queue.count() } });
      await refreshAll(true);
      registerForPush().catch(() => undefined);
    } catch {
      patch({ screen: 'onboarding' });
    } finally {
      patch({ booting: false });
    }
  }

  // ---------------------------------------------------------- lokální režim

  async function loadLocal(): Promise<Pick<AppState, 'groups' | 'expenses' | 'payments'>> {
    try {
      const raw = await AsyncStorage.getItem(DATA_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // nevadí
    }
    return { groups: [], expenses: {}, payments: {} };
  }

  /**
   * Uloží data lokálního režimu.
   *
   * POZOR: `stateRef` se aktualizuje až při dalším renderu, takže hned po
   * `patch()` je ještě STARÝ. Kdo volá tuhle funkci po zápisu, MUSÍ předat
   * novou podobu dat výslovně — jinak se poslední změna neuloží.
   */
  async function saveLocal(data?: Partial<Pick<AppState, 'groups' | 'expenses' | 'payments'>>) {
    const s = stateRef.current;
    await AsyncStorage.setItem(DATA_KEY, JSON.stringify({
      groups: data?.groups ?? s.groups,
      expenses: data?.expenses ?? s.expenses,
      payments: data?.payments ?? s.payments,
    })).catch(() => undefined);
  }

  // ------------------------------------------------------------ načtení dat

  /** Převod „raw" výdaje z DB na model appky — ID členů se překládají na jména. */
  function mapExpense(raw: RawExpense, group: Group, myName: string): Expense {
    const byId: Record<string, string> = {};
    group.memberList.forEach((m) => { byId[m.id] = norm(m.name, myName); });
    const payer = raw.payerId && byId[raw.payerId] ? byId[raw.payerId] : norm(raw.payerName, myName);
    const parts = raw.partIds.length
      ? raw.partIds.map((id, i) => byId[id] || norm(raw.partNames[i] || '', myName)).filter(Boolean)
      : raw.partNames.map((n) => norm(n, myName));
    return {
      id: raw.id, groupId: raw.groupId, desc: raw.desc, amountMinor: raw.amountMinor,
      currency: raw.currency, payer, parts, splitType: raw.splitType,
      shares: raw.shares, exactMinor: raw.exactMinor, category: raw.category,
      spentAt: raw.spentAt, receipts: raw.receipts, editCount: raw.editCount, createdAt: raw.createdAt,
    };
  }

  /**
   * Zkusí odeslat frontu čekajících zápisů a promítne výsledek do `sync`.
   * Volá se při startu, při každém obnovení dat a po každém úspěšném zápisu.
   */
  async function flushQueue(): Promise<void> {
    if (!CLOUD_MODE) return;
    const left = await queue.flush({
      addExpense: async (input, receipts) => {
        const newId = await expensesApi.addExpense(input);
        for (const url of receipts) await expensesApi.addReceipt(newId, input.groupId, url).catch(() => undefined);
      },
      updateExpense: (id, input) => expensesApi.updateExpense(id, input, []),
      deleteExpense: (id, gid) => expensesApi.deleteExpense(id, gid),
      addPayment: (input) => expensesApi.addPayment(input),
    });
    patch((st) => ({ sync: { ...st.sync, queued: left, online: left === 0 ? true : st.sync.online } }));
  }

  async function refreshAll(force = false) {
    if (!CLOUD_MODE) return;
    const s = stateRef.current;
    if (!s.meUid) return;
    if (!force && s.loading) return;
    patch({ loading: true });
    // Nejdřív doručit, co čeká — jinak by čerstvě načtená data přepsala
    // lokální zápisy, které ještě neodešly.
    await flushQueue().catch(() => undefined);
    try {
      const rawGroups = await groupsApi.fetchGroups();
      const myName = s.myName;
      const groups: Group[] = rawGroups.map((g) => {
        const mine = g.members.find((m) => m.userId === s.meUid);
        const realMyName = mine?.name || myName;
        return {
          id: g.id, name: g.name, currency: g.currency, coverColor: g.coverColor,
          shareCode: g.shareCode, archived: g.archived,
          memberList: g.members,
          members: g.members.map((m) => norm(m.name, realMyName)),
        };
      });

      const ids = groups.map((g) => g.id);
      const [rawExpenses, rawPayments] = await Promise.all([
        expensesApi.fetchExpensesForGroups(ids),
        expensesApi.fetchPaymentsForGroups(ids),
      ]);

      const expenses: Record<string, Expense[]> = {};
      const payments: Record<string, Payment[]> = {};
      groups.forEach((g) => {
        const mine = g.memberList.find((m) => m.userId === s.meUid);
        const realMyName = mine?.name || myName;
        expenses[g.id] = (rawExpenses[g.id] || []).map((e) => mapExpense(e, g, realMyName));
        payments[g.id] = (rawPayments[g.id] || []).map((p: any) => ({
          id: p.id, groupId: g.id,
          from: norm(p.from_name, realMyName), to: norm(p.to_name, realMyName),
          amountMinor: Number(p.amount_minor) || 0, currency: p.currency,
          method: p.method, note: p.note, createdAt: p.created_at,
        }));
      });

      const queued = await queue.count();
      patch({ groups, expenses, payments, sync: { online: true, lastSyncedAt: new Date().toISOString(), queued } });
    } catch {
      patch({ sync: { ...stateRef.current.sync, online: false } });
    } finally {
      patch({ loading: false });
    }
    loadRates(stateRef.current.currency).then((rates) => patch({ fxRates: rates })).catch(() => undefined);
  }

  async function refreshGroup(id: string) {
    if (!CLOUD_MODE) return;
    const s = stateRef.current;
    const group = s.groups.find((g) => g.id === id);
    if (!group) return;
    try {
      const raws = await expensesApi.fetchExpenses(id);
      const mine = group.memberList.find((m) => m.userId === s.meUid);
      const realMyName = mine?.name || s.myName;
      patch((st) => ({ expenses: { ...st.expenses, [id]: raws.map((r) => mapExpense(r, group, realMyName)) } }));
    } catch {
      patch({ sync: { ...stateRef.current.sync, online: false } });
    }
  }

  // Živá synchronizace otevřené skupiny.
  useEffect(() => {
    if (!CLOUD_MODE || !state.selectedGroup) return;
    const gid = state.selectedGroup;
    const channel = supabase
      .channel('group:' + gid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${gid}` },
        () => { refreshGroup(gid); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `group_id=eq.${gid}` },
        () => { refreshAll(true); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedGroup]);

  // -------------------------------------------------------------------- účet

  const signUp = async () => {
    const s = stateRef.current;
    if (!s.consentAccepted) { patch({ authError: 'Please accept the terms to continue.' }); return; }
    if (!/^\S+@\S+\.\S+$/.test(s.authEmail)) { patch({ authError: 'That address is missing a domain.' }); return; }
    if (s.authPassword.length < 8) { patch({ authError: 'Use at least eight characters.' }); return; }
    patch({ busy: true, authError: null });
    try {
      if (!CLOUD_MODE) { patch({ meUid: 'local', myName: s.authName || 'You', screen: 'overview' }); return; }
      const { needsConfirm } = await authApi.signUpEmail(s.authEmail, s.authPassword, s.authName);
      if (needsConfirm) { navigate('confirm_email'); showToast('Check your inbox for the code.'); }
      else await boot();
    } catch (e: any) {
      patch({ authError: humanAuthError(e) });
    } finally {
      patch({ busy: false });
    }
  };

  const logIn = async () => {
    const s = stateRef.current;
    patch({ busy: true, authError: null });
    try {
      if (!CLOUD_MODE) { patch({ meUid: 'local', myName: 'You', screen: 'overview' }); return; }
      await authApi.signInEmail(s.authEmail, s.authPassword);
      await boot();
    } catch (e: any) {
      const left = Math.max(0, stateRef.current.authAttemptsLeft - 1);
      patch({
        authError: left > 0
          ? `Email or password is wrong. ${left} ${left === 1 ? 'attempt' : 'attempts'} left before a short lockout.`
          : 'Too many attempts. Try again in a few minutes.',
        authAttemptsLeft: left,
      });
    } finally {
      patch({ busy: false });
    }
  };

  const logInGoogle = async () => {
    patch({ busy: true, authError: null });
    try { await authApi.signInGoogle(); await boot(); }
    catch (e: any) { patch({ authError: humanAuthError(e) }); }
    finally { patch({ busy: false }); }
  };

  const logInApple = async () => {
    patch({ busy: true, authError: null });
    try { await authApi.signInApple(); await boot(); }
    catch { patch({ authError: null }); } // zrušené Apple přihlášení není chyba
    finally { patch({ busy: false }); }
  };

  const sendReset = async () => {
    patch({ busy: true, authError: null });
    try {
      await authApi.sendPasswordReset(stateRef.current.authEmail);
      showToast('Reset link sent.');
    } catch (e: any) {
      patch({ authError: humanAuthError(e) });
    } finally { patch({ busy: false }); }
  };

  const saveNewPassword = async () => {
    patch({ busy: true, authError: null });
    try { await authApi.updatePassword(stateRef.current.authPassword); await boot(); }
    catch (e: any) { patch({ authError: humanAuthError(e) }); }
    finally { patch({ busy: false }); }
  };

  const confirmEmailCode = async () => {
    const s = stateRef.current;
    patch({ busy: true, authError: null });
    try { await authApi.verifyEmailOtp(s.authEmail, s.authCode); await boot(); }
    catch { patch({ authError: 'That code did not match. Check the last email.' }); }
    finally { patch({ busy: false }); }
  };

  const resendCode = async () => {
    try { await authApi.resendConfirmation(stateRef.current.authEmail); showToast('Code sent again.'); }
    catch { showToast('Could not resend right now.'); }
  };

  const logOut = async () => {
    // Fronta patří k účtu — kdyby zůstala, doručila by se pod cizím
    // přihlášením. Radši ji zahodíme; nedoručené zápisy má uživatel
    // pořád vidět v seznamu, dokud se neodhlásí.
    await queue.clear();
    if (CLOUD_MODE) await authApi.signOut();
    setState({ ...makeInitialState(), booting: false, screen: 'onboarding' });
  };

  const deleteAccount = async () => {
    patch({ busy: true });
    try {
      if (CLOUD_MODE) await authApi.deleteAccount();
      await AsyncStorage.multiRemove([STATE_KEY, DATA_KEY]);
      setState({ ...makeInitialState(), booting: false, screen: 'onboarding' });
    } catch {
      showToast('Could not delete the account. Try again.');
    } finally { patch({ busy: false, dialog: null }); }
  };

  // -------------------------------------------------------------- předvolby

  const saveProfile = (columns: Record<string, unknown>) => {
    if (CLOUD_MODE && stateRef.current.meUid) authApi.updateProfile(columns).catch(() => undefined);
  };

  const setLang = (l: string) => {
    const wasRTL = isRTL(stateRef.current.lang);
    const nowRTL = isRTL(l);
    setLangGlobal(l);
    patch({ lang: l, langChosen: true });
    saveProfile({ lang: l });

    // React Native přepíná směr čtení NA ÚROVNI PROCESU. Rozhraní se sice
    // překreslí hned (komponenty čtou `rtl` z kontextu), ale úplné zrcadlení
    // všech kontejnerů, gest a systémových prvků nastane až po restartu.
    // Proto se restartuje jen při skutečné ZMĚNĚ směru — ne při každé volbě
    // jazyka, to by bylo obtěžování.
    if (wasRTL !== nowRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(nowRTL);
      showToast(nowRTL ? 'Switching to right-to-left…' : 'Switching to left-to-right…');
      if (Platform.OS !== 'web') {
        setTimeout(() => { Updates.reloadAsync().catch(() => undefined); }, 900);
      }
    }
  };
  const setCurrency = (c: string) => {
    patch({ currency: c });
    saveProfile({ currency: c });
    loadRates(c).then((rates) => patch({ fxRates: rates })).catch(() => undefined);
  };
  const setTheme = (t: ThemeName) => { patch({ theme: t }); saveProfile({ theme: t }); };
  const setMode = (m: ModeName) => { patch({ mode: m }); saveProfile({ mode: m }); };
  const setTextSize = (s: TextSize) => { patch({ textSize: s }); saveProfile({ text_size: s }); };
  const setNotif = (k: keyof NotifPrefs, v: boolean | number) => {
    patch((s) => ({ notif: { ...s.notif, [k]: v } as NotifPrefs }));
    const col: Record<string, string> = {
      expense: 'notif_expense', settled: 'notif_settled', edited: 'notif_edited',
      weekly: 'notif_weekly', closer: 'notif_closer', analyst: 'notif_analyst',
      quietFrom: 'quiet_from', quietTo: 'quiet_to',
    };
    if (col[k]) saveProfile({ [col[k]]: v });
  };
  const setPersonalisedAds = (v: boolean) => { patch({ personalisedAds: v }); saveProfile({ personalised_ads: v }); };

  /**
   * Nákup Pro. Skutečné IAP (expo-in-app-purchases / RevenueCat) se doplní
   * ve vývojovém buildu — v Expo Go neběží. Tady je zápis výsledku.
   */
  const buyPro = async () => {
    patch({ isPro: true });
    saveProfile({ is_pro: true, pro_since: new Date().toISOString() });
    haptics.success();
    showToast('Pro is active. The ads are gone.');
  };
  const restorePro = async () => { showToast('Nothing to restore on this account yet.'); };

  const unlockThemeByReward = async (t: ThemeName) => {
    const until = new Date(Date.now() + 7 * 86400000).toISOString();
    patch({ rewardTheme: t, rewardUntil: until, theme: t });
    saveProfile({ reward_theme: t, reward_until: until, theme: t });
    showToast('Theme unlocked for seven days.');
  };

  // ----------------------------------------------------------------- skupiny

  const openGroup = (id: string) => { patch({ selectedGroup: id }); navigate('group'); if (CLOUD_MODE) refreshGroup(id); };

  const addDraftMember = () => {
    const s = stateRef.current;
    const name = s.newMemberInput.trim();
    if (!name || s.newGroupMembers.includes(name)) return;
    patch({ newGroupMembers: [...s.newGroupMembers, name], newMemberInput: '' });
  };
  const removeDraftMember = (name: string) => {
    patch((s) => ({ newGroupMembers: s.newGroupMembers.filter((n) => n !== name) }));
  };

  const createGroup = async () => {
    const s = stateRef.current;
    const name = s.newGroupName.trim();
    if (!name) { showToast('Give the group a name.'); return; }
    patch({ busy: true });
    try {
      const memberNames = [s.myName || 'You', ...s.newGroupMembers];
      if (CLOUD_MODE) {
        const g = await groupsApi.createGroup(name, s.newGroupCurrency, s.newGroupColor, memberNames, s.myName);
        await refreshAll(true);
        patch({ selectedGroup: g.id, newGroupName: '', newGroupMembers: [], newMemberInput: '' });
      } else {
        const id = uid();
        const group: Group = {
          id, name, currency: s.newGroupCurrency, coverColor: s.newGroupColor,
          shareCode: uid().slice(0, 6).toUpperCase(), archived: false,
          memberList: memberNames.map((n) => ({ id: uid(), name: n, color: null, userId: n === s.myName ? 'local' : null, leftAt: null })),
          members: memberNames.map((n) => norm(n, s.myName)),
        };
        const groups = [group, ...s.groups];
        const expenses = { ...s.expenses, [id]: [] };
        const payments = { ...s.payments, [id]: [] };
        patch({
          groups, expenses, payments,
          selectedGroup: id, newGroupName: '', newGroupMembers: [], newMemberInput: '',
        });
        await saveLocal({ groups, expenses, payments });
      }
      navigate('group');
    } catch {
      showToast('Could not create the group.');
    } finally { patch({ busy: false }); }
  };

  const joinByCode = async (code?: string) => {
    const raw = (code ?? stateRef.current.joinCodeInput).trim().toUpperCase();
    if (raw.length < 6) return;
    patch({ busy: true });
    try {
      const preview = CLOUD_MODE ? await groupsApi.groupPreview(raw) : null;
      patch({ joinPreview: preview as JoinPreview | null });
      if (!preview) showToast('No group with that code.');
    } catch {
      showToast('No group with that code.');
      patch({ joinPreview: null });
    } finally { patch({ busy: false }); }
  };

  const finishJoin = async (opts: { claimName?: string; newName?: string }) => {
    const s = stateRef.current;
    if (!s.joinPreview) return;
    patch({ busy: true });
    try {
      const gid = await groupsApi.joinGroupChoose(s.joinPreview.code, opts.claimName || null, opts.newName || null);
      await refreshAll(true);
      patch({ selectedGroup: gid, joinPreview: null, joinCodeInput: '' });
      navigate('group');
    } catch (e: any) {
      showToast(e?.message === 'NAME_ALREADY_TAKEN' ? 'Someone just took that name.' : 'Could not join the group.');
    } finally { patch({ busy: false }); }
  };

  const leaveGroup = async (id: string) => {
    if (CLOUD_MODE) await groupsApi.leaveGroup(id).catch(() => undefined);
    patch((s) => ({ groups: s.groups.filter((g) => g.id !== id), selectedGroup: null }));
    navigate('overview');
  };

  const shareInvite = async (id: string) => {
    const g = stateRef.current.groups.find((x) => x.id === id);
    if (!g) return;
    const url = landingJoinUrl(g.shareCode);
    await Share.share({ message: `Join "${g.name}" on Splittingly: ${url}`, url }).catch(() => undefined);
  };

  // ------------------------------------------------------------------ výdaje

  const startAddExpense = () => {
    const s = stateRef.current;
    const g = s.groups.find((x) => x.id === s.selectedGroup);
    if (!g) return;
    patch({
      draft: {
        ...emptyDraft(),
        groupId: g.id,
        currency: g.currency,
        parts: [...g.members],
        payer: ME,
        shares: Object.fromEntries(g.members.map((m) => [m, 1])),
      },
    });
    navigate('add_expense');
  };

  const startEditExpense = (id: string) => {
    const s = stateRef.current;
    const gid = s.selectedGroup;
    if (!gid) return;
    const e = (s.expenses[gid] || []).find((x) => x.id === id);
    if (!e) return;
    const dec = decimalsOf(e.currency);
    patch({
      draft: {
        id: e.id, groupId: gid, desc: e.desc,
        amountText: dec === 0 ? String(e.amountMinor) : (e.amountMinor / Math.pow(10, dec)).toFixed(dec),
        currency: e.currency, payer: e.payer, parts: [...e.parts], splitType: e.splitType,
        shares: Object.fromEntries(e.parts.map((p, i) => [p, e.shares?.[i] ?? 1])),
        exactText: Object.fromEntries(e.parts.map((p, i) => [
          p, e.exactMinor ? (dec === 0 ? String(e.exactMinor[i]) : (e.exactMinor[i] / Math.pow(10, dec)).toFixed(dec)) : '',
        ])),
        category: e.category, spentAt: e.spentAt, receipts: [...e.receipts],
      },
      selectedExpense: id,
    });
    navigate('add_expense');
  };

  const setDraft = (p: Partial<ExpenseDraft>) => patch((s) => ({ draft: { ...s.draft, ...p } }));
  const setPayer = (name: string) => setDraft({ payer: name });
  const togglePart = (name: string) => {
    patch((s) => {
      const has = s.draft.parts.includes(name);
      const parts = has ? s.draft.parts.filter((n) => n !== name) : [...s.draft.parts, name];
      // poslední účastník se odebrat nedá — výdaj bez účastníka nemá smysl
      return { draft: { ...s.draft, parts: parts.length ? parts : s.draft.parts } };
    });
  };
  const setSplitType = (t: SplitType) => setDraft({ splitType: t });
  const setShare = (name: string, delta: number) => {
    patch((s) => ({
      draft: { ...s.draft, shares: { ...s.draft.shares, [name]: Math.max(0, (s.draft.shares[name] ?? 1) + delta) } },
    }));
  };
  const setExact = (name: string, text: string) => {
    patch((s) => ({ draft: { ...s.draft, exactText: { ...s.draft.exactText, [name]: text } } }));
  };

  const attachReceipt = async (from: 'camera' | 'library') => {
    // Limit se hlídá TADY, ne na obrazovce — jinak by ho obešla jiná cesta
    // k té samé akci (foťák, galerie, sdílení z jiné appky).
    const st = stateRef.current;
    if (!canAddReceipt(st.isPro, st.draft.receipts.length)) {
      showToast(`Free includes ${FREE_RECEIPTS_PER_EXPENSE} receipt per expense. Pro removes the limit.`);
      navigate('remove_ads');
      return;
    }
    try {
      const perm = from === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { showToast('Permission denied.'); return; }
      const res = from === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ['images'] });
      if (res.canceled || !res.assets?.length) return;
      const localUri = res.assets[0].uri;
      const gid = stateRef.current.draft.groupId;
      let url = localUri;
      if (CLOUD_MODE && gid) url = await storageApi.uploadReceipt(localUri, gid);
      patch((s) => ({ draft: { ...s.draft, receipts: [...s.draft.receipts, url] } }));
    } catch {
      showToast('Could not attach the photo.');
    }
  };

  const removeReceipt = (url: string) => {
    patch((s) => ({ draft: { ...s.draft, receipts: s.draft.receipts.filter((u) => u !== url) } }));
  };

  const saveExpense = async () => {
    const s = stateRef.current;
    const d = s.draft;
    const g = s.groups.find((x) => x.id === d.groupId);
    if (!g) return;
    const amountMinor = parseAmount(d.amountText, d.currency);
    if (amountMinor <= 0) { showToast('Enter an amount above zero.'); return; }
    if (!d.parts.length) { showToast('Pick at least one person.'); return; }

    const shares = d.splitType === 'shares' ? d.parts.map((p) => d.shares[p] ?? 1) : null;
    const exactMinor = d.splitType === 'exact' ? d.parts.map((p) => parseAmount(d.exactText[p] || '', d.currency)) : null;
    if (exactMinor && remainderOf(amountMinor, exactMinor) !== 0) {
      showToast('The exact amounts do not add up yet.');
      return;
    }

    patch({ busy: true });
    try {
      if (CLOUD_MODE) {
        const idFor = (display: string) => {
          const real = denorm(display, g.memberList.find((m) => m.userId === s.meUid)?.name || s.myName);
          return g.memberList.find((m) => m.name === real)?.id || null;
        };
        const realName = (display: string) =>
          denorm(display, g.memberList.find((m) => m.userId === s.meUid)?.name || s.myName);

        const input = {
          groupId: g.id, desc: d.desc.trim() || 'Expense', amountMinor, currency: d.currency,
          payerId: idFor(d.payer), payerName: realName(d.payer),
          partIds: d.parts.map(idFor).filter(Boolean) as string[],
          partNames: d.parts.map(realName),
          splitType: d.splitType, shares, exactMinor,
          category: d.category, spentAt: d.spentAt,
        };
        try {
          if (d.id) {
            await expensesApi.updateExpense(d.id, input, [{ field: 'amount', from: '', to: String(amountMinor) }]);
          } else {
            const newId = await expensesApi.addExpense(input);
            for (const url of d.receipts) await expensesApi.addReceipt(newId, g.id, url).catch(() => undefined);
          }
          await refreshGroup(g.id);
          if (s.notif.expense && !inQuietHours(s.notif)) {
            notifyGroup(g.id, g.name, `${s.myName} added ${d.desc || 'an expense'}`).catch(() => undefined);
          }
          await flushQueue();
        } catch (err) {
          // Bez připojení výdaj NEZAHAZUJEME. Uloží se do fronty, promítne se
          // do stavu a odejde, jakmile se síť vrátí — přesně proto appka
          // existuje i v hospodě bez signálu.
          if (!queue.looksOffline(err)) throw err;
          const queued = await queue.enqueue(
            d.id
              ? { kind: 'expense.update', groupId: g.id, expenseId: d.id, input }
              : { kind: 'expense.add', groupId: g.id, input, receipts: d.receipts },
          );
          const local: Expense = {
            id: d.id || 'local-' + uid(), groupId: g.id, desc: input.desc, amountMinor,
            currency: d.currency, payer: d.payer, parts: d.parts, splitType: d.splitType,
            shares, exactMinor, category: d.category, spentAt: d.spentAt,
            receipts: d.receipts, editCount: d.id ? 1 : 0, createdAt: new Date().toISOString(),
          };
          patch((st) => ({
            expenses: {
              ...st.expenses,
              [g.id]: d.id
                ? (st.expenses[g.id] || []).map((e) => (e.id === d.id ? local : e))
                : [local, ...(st.expenses[g.id] || [])],
            },
            sync: { ...st.sync, online: false, queued },
          }));
          showToast('Saved on this phone. It will upload when you are back online.');
        }
      } else {
        const expense: Expense = {
          id: d.id || uid(), groupId: g.id, desc: d.desc.trim() || 'Expense', amountMinor,
          currency: d.currency, payer: d.payer, parts: d.parts, splitType: d.splitType,
          shares, exactMinor, category: d.category, spentAt: d.spentAt,
          receipts: d.receipts, editCount: d.id ? 1 : 0, createdAt: new Date().toISOString(),
        };
        const list = s.expenses[g.id] || [];
        const expenses = {
          ...s.expenses,
          [g.id]: d.id ? list.map((e) => (e.id === d.id ? expense : e)) : [expense, ...list],
        };
        patch({ expenses });
        await saveLocal({ expenses });
      }
      patch({ draft: emptyDraft(), selectedExpense: null });
      haptics.press();
      goBack();
    } catch {
      showToast('Could not save the expense.');
    } finally { patch({ busy: false }); }
  };

  const deleteExpense = async (id: string) => {
    const s = stateRef.current;
    const gid = s.selectedGroup;
    if (!gid) return;
    try {
      if (CLOUD_MODE) await expensesApi.deleteExpense(id, gid);
      const expenses = { ...s.expenses, [gid]: (s.expenses[gid] || []).filter((e) => e.id !== id) };
      patch({ expenses });
      if (!CLOUD_MODE) await saveLocal({ expenses });
      patch({ dialog: null, selectedExpense: null });
      navigate('group');
    } catch {
      showToast('Could not delete the expense.');
    }
  };

  const openExpense = (id: string) => { patch({ selectedExpense: id }); navigate('expense_detail'); };

  // -------------------------------------------------------------- vyrovnání

  const startSettle = (tr: Transfer) => { patch({ selectedTransfer: tr, settleMethod: 'cash', settleNote: '' }); navigate('settle'); };

  const confirmSettle = async () => {
    const s = stateRef.current;
    const tr = s.selectedTransfer;
    if (!tr) return;
    const g = s.groups.find((x) => x.id === tr.groupId);
    if (!g) return;
    patch({ busy: true });
    try {
      const realMyName = g.memberList.find((m) => m.userId === s.meUid)?.name || s.myName;
      if (CLOUD_MODE) {
        const idFor = (display: string) => g.memberList.find((m) => m.name === denorm(display, realMyName))?.id || null;
        const paymentInput = {
          groupId: g.id,
          fromId: idFor(tr.from), toId: idFor(tr.to),
          fromName: denorm(tr.from, realMyName), toName: denorm(tr.to, realMyName),
          amountMinor: tr.amountMinor, currency: tr.currency,
          method: s.settleMethod, note: s.settleNote || null,
        };
        try {
          await expensesApi.addPayment(paymentInput);
          await refreshAll(true);
          if (s.notif.settled && !inQuietHours(s.notif)) {
            notifyGroup(g.id, g.name, `${tr.from} settled up with ${tr.to}`).catch(() => undefined);
          }
        } catch (err) {
          if (!queue.looksOffline(err)) throw err;
          const queued = await queue.enqueue({ kind: 'payment.add', groupId: g.id, input: paymentInput });
          const local: Payment = {
            id: 'local-' + uid(), groupId: g.id, from: tr.from, to: tr.to,
            amountMinor: tr.amountMinor, currency: tr.currency,
            method: s.settleMethod, note: s.settleNote || null, createdAt: new Date().toISOString(),
          };
          patch((st) => ({
            payments: { ...st.payments, [g.id]: [...(st.payments[g.id] || []), local] },
            sync: { ...st.sync, online: false, queued },
          }));
        }
      } else {
        const payment: Payment = {
          id: uid(), groupId: g.id, from: tr.from, to: tr.to,
          amountMinor: tr.amountMinor, currency: tr.currency,
          method: s.settleMethod, note: s.settleNote || null, createdAt: new Date().toISOString(),
        };
        const payments = { ...s.payments, [g.id]: [...(s.payments[g.id] || []), payment] };
        patch({ payments });
        await saveLocal({ payments });
      }

      // Emocionální vrchol: když je po platbě skupina na nule, ukaž oslavu.
      //
      // Bilanci počítáme z ČERSTVĚ načteného stavu, ne ze `stateRef` — ten se
      // aktualizuje až při dalším renderu, takže hned po zápisu je ještě starý
      // a oslava by nenaskočila nikdy.
      const after = CLOUD_MODE ? stateRef.current : null;
      const paymentsAfter = after
        ? after.payments[g.id]
        : [...(s.payments[g.id] || []), {
            id: 'pending', groupId: g.id, from: tr.from, to: tr.to,
            amountMinor: tr.amountMinor, currency: tr.currency,
            method: s.settleMethod, note: null, createdAt: new Date().toISOString(),
          } as Payment];
      const expensesAfter = (after || s).expenses[g.id];
      const settled = transfersFor(g, expensesAfter, paymentsAfter).length === 0;
      haptics.success();
      patch({ celebrate: settled, selectedTransfer: null });
      if (!settled) navigate('group');
    } catch {
      showToast('Could not record the payment.');
    } finally { patch({ busy: false }); }
  };

  // ----------------------------------------------------------------- hledání

  const runSearch = (q: string) => {
    patch((s) => ({
      searchQuery: q,
      recentSearches: q.trim() && !s.recentSearches.includes(q.trim())
        ? [q.trim(), ...s.recentSearches].slice(0, 6)
        : s.recentSearches,
    }));
  };

  // --------------------------------------------------------------------------

  const actions: Actions = {
    patch, showToast, navigate, goBack, setTab,
    signUp, logIn, logInGoogle, logInApple, sendReset, saveNewPassword,
    confirmEmailCode, resendCode, logOut, deleteAccount,
    setLang, setCurrency, setTheme, setMode, setTextSize, setNotif,
    setPersonalisedAds, buyPro, restorePro, unlockThemeByReward,
    openGroup, createGroup, addDraftMember, removeDraftMember,
    joinByCode, finishJoin, leaveGroup, shareInvite,
    startAddExpense, startEditExpense, setDraft, setPayer, togglePart,
    setSplitType, setShare, setExact, attachReceipt, removeReceipt,
    saveExpense, deleteExpense, openExpense,
    startSettle, confirmSettle,
    refreshAll, refreshGroup, runSearch,
  };

  const value = useMemo<AppContextValue>(() => ({ state, actions }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const v = useContext(AppContext);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
}

/** Chyby ze Supabase přeložené do věty, kterou má smysl číst. */
function humanAuthError(e: any): string {
  const m = String(e?.message || '').toLowerCase();
  if (m.includes('already registered')) return 'That address already has an account. Log in instead.';
  if (m.includes('invalid login')) return 'Email or password is wrong.';
  if (m.includes('email not confirmed')) return 'Confirm your email first — check your inbox.';
  if (m.includes('password')) return 'Use at least eight characters.';
  if (m.includes('network')) return 'No connection. Your changes are saved on this phone.';
  return 'Something went wrong. Try again.';
}

// Pomocné výpočty, které chce víc obrazovek naráz.
export { Linking, splitEqual, splitShares };
