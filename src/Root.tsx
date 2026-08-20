// Hlavní obal: splash, přepínání obrazovek, spodní navigace, banner, toast.
//
// Banner je ZÁMĚRNĚ mimo ScrollView jednotlivých obrazovek — obsah se pod něj
// nikdy nepodsune. Sedí nad tab barem, oddělený 3px linkou, takže čte jako
// přišroubovaný k telefonu, ne jako řádek aplikace.

import React from 'react';
import { View, Text, Pressable, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUi, UiProvider } from './components/ui';
import { BannerAd } from './components/AdSlot';
import { useApp } from './store';
import { t } from './i18n';
import { showBanner } from './ads';
import { SPACE, BORDER, THEMES } from './theme';
import type { TabName, ScreenName } from './types';

import { Onboarding, SignUp, LogIn, ForgotPassword, NewPassword, ConfirmEmail } from './screens/AuthScreens';
import Overview from './screens/Overview';
import CreateGroup from './screens/CreateGroup';
import JoinGroup from './screens/JoinGroup';
import GroupDetail from './screens/GroupDetail';
import AddExpense from './screens/AddExpense';
import ExpenseDetail from './screens/ExpenseDetail';
import SettleUp from './screens/SettleUp';
import Stats from './screens/Stats';
import YearInReview from './screens/YearInReview';
import Activity from './screens/Activity';
import Search from './screens/Search';
import ShareCard from './screens/ShareCard';
import { Profile, LanguagePicker, CurrencyPicker, Appearance, Notifications, RemoveAds, Privacy } from './screens/Settings';

/** Obrazovky bez spodní navigace — vstup do účtu a modální toky. */
const NO_CHROME: ScreenName[] = [
  'onboarding', 'signup', 'login', 'forgot', 'new_password', 'confirm_email',
  'add_expense', 'split_method', 'settle', 'create_group', 'join_group',
  'share_card', 'year_in_review', 'remove_ads',
];

export default function Root() {
  const { state } = useApp();
  const dark = state.mode === 'dark' || (state.mode === 'system' && state.systemDark);
  return (
    <UiProvider theme={state.theme} dark={dark} size={state.textSize}>
      <RootInner />
    </UiProvider>
  );
}

function RootInner() {
  const { c } = useUi();
  const { state } = useApp();

  if (state.booting) return <Splash />;

  const sc = state.screen;
  const chrome = !NO_CHROME.includes(sc);

  let screen: React.ReactNode = <Overview />;
  if (sc === 'onboarding') screen = <Onboarding />;
  else if (sc === 'signup') screen = <SignUp />;
  else if (sc === 'login') screen = <LogIn />;
  else if (sc === 'forgot') screen = <ForgotPassword />;
  else if (sc === 'new_password') screen = <NewPassword />;
  else if (sc === 'confirm_email') screen = <ConfirmEmail />;
  else if (sc === 'overview') screen = <Overview />;
  else if (sc === 'create_group') screen = <CreateGroup />;
  else if (sc === 'join_group') screen = <JoinGroup />;
  else if (sc === 'group') screen = <GroupDetail />;
  else if (sc === 'add_expense' || sc === 'split_method') screen = <AddExpense />;
  else if (sc === 'expense_detail') screen = <ExpenseDetail />;
  else if (sc === 'settle') screen = <SettleUp />;
  else if (sc === 'stats') screen = <Stats />;
  else if (sc === 'year_in_review') screen = <YearInReview />;
  else if (sc === 'activity') screen = <Activity />;
  else if (sc === 'search') screen = <Search />;
  else if (sc === 'share_card') screen = <ShareCard />;
  else if (sc === 'profile') screen = <Profile />;
  else if (sc === 'language') screen = <LanguagePicker />;
  else if (sc === 'currency') screen = <CurrencyPicker />;
  else if (sc === 'appearance') screen = <Appearance />;
  else if (sc === 'notifications') screen = <Notifications />;
  else if (sc === 'remove_ads') screen = <RemoveAds />;
  else if (sc === 'privacy') screen = <Privacy />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle={c.isDark ? 'light-content' : 'dark-content'} backgroundColor={c.bg} />
      <View style={{ flex: 1 }}>{screen}</View>

      {showBanner(sc, state.isPro, state.groups.length > 0) && <BannerAd />}
      {chrome && <TabBar />}
      {!!state.toast && <Toast text={state.toast} />}
    </View>
  );
}

// ------------------------------------------------------------------- 01 splash

function Splash() {
  const { c } = useUi();
  const { state } = useApp();
  const dark = state.mode === 'dark' || (state.mode === 'system' && state.systemDark);
  const ground = dark ? '#101010' : THEMES[state.theme].accent;
  const ink = dark ? '#FAF7F0' : '#101010';

  return (
    <View style={{ flex: 1, backgroundColor: ground, alignItems: 'center', justifyContent: 'center', gap: SPACE.lg }}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <AppMark size={110} ink={ink} accent={THEMES[state.theme].accent} primary={THEMES[state.theme].primary} />
      <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 34, lineHeight: 33, color: ink, textAlign: 'center', letterSpacing: -0.7 }}>
        {'SPLIT\nTINGLY'}
      </Text>

      {/* Určitý postup místo nekonečného kolečka — uživatel vidí, že to končí. */}
      <View style={{ position: 'absolute', bottom: 40, left: 40, right: 40, gap: SPACE.sm }}>
        <View style={{ height: 8, borderWidth: BORDER.card, borderColor: ink }}>
          <View style={{ width: '60%', height: '100%', backgroundColor: ink }} />
        </View>
        <Text style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, letterSpacing: 0.7, color: ink, textAlign: 'center' }}>
          {t('SYNCING YOUR GROUPS')}
        </Text>
      </View>
    </View>
  );
}

/**
 * Logo: čtverec rozťatý jednou úhlopříčkou — to je samo dělení.
 * Žlutá plocha ho udrží k nalezení na přeplněné ploše telefonu.
 */
export function AppMark({ size, ink, accent, primary }: { size: number; ink: string; accent: string; primary: string }) {
  return (
    <View style={{ position: 'relative' }}>
      <View style={{ position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, backgroundColor: ink }} />
      <View style={{ width: size, height: size, backgroundColor: accent, borderWidth: 4, borderColor: ink, overflow: 'hidden' }}>
        {/* modrý trojúhelník v horní levé polovině, poskládaný z okrajů */}
        <View
          style={{
            position: 'absolute', top: 0, left: 0,
            width: 0, height: 0,
            borderTopWidth: size, borderRightWidth: size,
            borderTopColor: primary, borderRightColor: 'transparent',
          }}
        />
        {/* inkoustová linka napříč středem */}
        <View
          style={{
            position: 'absolute', top: size / 2 - 2.5, left: -size * 0.1, width: size * 1.2, height: 5,
            backgroundColor: ink, transform: [{ rotate: '-38deg' }],
          }}
        />
      </View>
    </View>
  );
}

// ------------------------------------------------------------- spodní navigace

const TABS: { key: TabName; label: string; glyph: string }[] = [
  { key: 'overview', label: 'Overview', glyph: '▣' },
  { key: 'groups', label: 'Groups', glyph: '⊞' },
  { key: 'activity', label: 'Activity', glyph: '▤' },
  { key: 'stats', label: 'Stats', glyph: '◔' },
];

function TabBar() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: BORDER.card,
        borderTopColor: c.border,
        backgroundColor: c.surface,
        paddingTop: SPACE.sm,
        paddingBottom: Math.max(insets.bottom, 12) + SPACE.sm,
      }}
    >
      {TABS.map((tab) => {
        const active = state.tab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => actions.setTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t(tab.label)}
            style={{ flex: 1, alignItems: 'center', gap: 3, minHeight: 49, paddingHorizontal: 4 }}
          >
            <Text style={{ fontSize: 19, color: active ? c.text : c.textMuted }}>{tab.glyph}</Text>
            {/* Popisek se ZALAMUJE, neuřezává — podlaha je 9,5 px (viz typography). */}
            <Text style={[ty('tabLabel'), { color: active ? c.text : c.textMuted, textAlign: 'center' }]}>
              {t(tab.label)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// -------------------------------------------------------------------- toast

function Toast({ text }: { text: string }) {
  const { c, ty } = useUi();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ position: 'absolute', left: SPACE.screen, right: SPACE.screen, bottom: insets.bottom + 90 }}>
      <View style={{ position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, backgroundColor: c.shadow }} />
      <View style={{ backgroundColor: c.text, borderWidth: BORDER.card, borderColor: c.border, padding: 13 }}>
        <Text style={[ty('rowTitle'), { color: c.bg }]}>{text}</Text>
      </View>
    </View>
  );
}
