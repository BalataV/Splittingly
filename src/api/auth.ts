// Přihlášení, registrace, profil a jeho předvolby.
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from '../supabase';
import { LANDING_BASE } from '../config';
import type { ThemeName, ModeName, TextSize, NotifPrefs } from '../types';

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarColor: string;
  lang: string;
  currency: string;
  theme: ThemeName;
  mode: ModeName;
  textSize: TextSize;
  notif: NotifPrefs;
  personalisedAds: boolean;
  isPro: boolean;
  rewardTheme: ThemeName | null;
  rewardUntil: string | null;
}

function mapProfile(p: any): Profile {
  return {
    id: p.id,
    email: p.email || '',
    displayName: p.display_name || '',
    avatarColor: p.avatar_color || '#1F49FF',
    lang: p.lang || 'en',
    currency: p.currency || 'EUR',
    theme: (p.theme || 'acid') as ThemeName,
    mode: (p.mode || 'system') as ModeName,
    textSize: (p.text_size || 'medium') as TextSize,
    notif: {
      expense: p.notif_expense !== false,
      settled: p.notif_settled !== false,
      edited: p.notif_edited !== false,
      weekly: !!p.notif_weekly,
      closer: p.notif_closer !== false,
      analyst: p.notif_analyst !== false,
      quietFrom: p.quiet_from ?? 23,
      quietTo: p.quiet_to ?? 8,
    },
    personalisedAds: !!p.personalised_ads,
    isPro: !!p.is_pro,
    rewardTheme: (p.reward_theme || null) as ThemeName | null,
    rewardUntil: p.reward_until || null,
  };
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signUpEmail(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: name.trim() },
      emailRedirectTo: LANDING_BASE + '/app/',
    },
  });
  if (error) throw error;
  // `session === null` znamená, že je zapnuté potvrzení e-mailu → uživatel
  // musí kliknout v e-mailu. To NENÍ chyba, jen jiný další krok.
  return { needsConfirm: !data.session, user: data.user };
}

export async function signInEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Obnova hesla — odkaz vede na statickou stránku `/app/`, ne do appky. */
export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: LANDING_BASE + '/app/',
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

/** Šestimístný kód z e-mailu (obrazovka 07). */
export async function verifyEmailOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email' });
  if (error) throw error;
  return data.session;
}

export async function resendConfirmation(email: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
  if (error) throw error;
}

/**
 * Google. V nativní appce otevřeme prohlížeč sami a vracíme se přes
 * vlastní scheme (`splittingly://`); na webu si to klient vyřídí sám.
 */
export async function signInGoogle() {
  const redirectTo = Platform.OS === 'web' ? undefined : Linking.createURL('auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
  });
  if (error) throw error;
  if (Platform.OS !== 'web' && data?.url && redirectTo) {
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type === 'success' && res.url) {
      const parsed = Linking.parse(res.url);
      const code = (parsed.queryParams?.code as string) || '';
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) throw exErr;
      }
    }
  }
}

export async function isAppleAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function signInApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) throw new Error('APPLE_NO_TOKEN');
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;
}

// ----------------------------------------------------------------- profil

export async function fetchProfile(): Promise<Profile | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', u.user.id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProfile(data);
}

/** Uloží jen to, co se změnilo. Klíče jsou názvy sloupců v DB. */
export async function updateProfile(patch: Record<string, unknown>) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { error } = await supabase.from('profiles').update(patch).eq('id', u.user.id);
  if (error) throw error;
}

export async function setDisplayName(name: string) {
  await updateProfile({ display_name: name });
}

/** GDPR mazání účtu. Výdaje ve skupinách zůstanou pod „former member". */
export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await supabase.auth.signOut();
}
