// Obrazovky 02–07: onboarding, registrace, přihlášení, obnova hesla,
// nové heslo, potvrzení e-mailu.
//
// Pravidlo pro chyby: co si pole umí říct samo, se NIKDY neříká toastem.
// Červený okraj nikdy nestojí bez věty vedle sebe.
//
// Reklama tady nemá co dělat — ani jedna z těchhle obrazovek jí nesmí být
// znečištěná (uživatel ještě neviděl, že produkt funguje).

import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Button, Field, Label, Card, Check, Rule } from '../components/ui';
import Mascot, { MascotStrip } from '../components/Mascot';
import { useApp } from '../store';
import { t } from '../i18n';
import { quipFor, mascotVisible } from '../quips';
import { SPACE, BORDER } from '../theme';

// ---------------------------------------------------------------- 02 onboarding

const SLIDES = [
  { head: 'ONE BILL.\nNO\nARGUMENTS.', body: 'Anyone logs what they paid. Splittingly works out who owes whom.', who: 'closer' as const },
  { head: 'SPLIT IT\nANY WAY\nYOU LIKE.', body: 'Equally, by shares, or exact amounts. Zero-decimal currencies included.', who: 'analyst' as const },
  { head: 'TEN DEBTS.\nONE\nPAYMENT.', body: 'The app collapses every balance into the fewest transfers possible.', who: 'closer' as const },
];

export function Onboarding() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];

  return (
    <Screen
      right={
        <Pressable onPress={() => actions.navigate('signup')} hitSlop={12} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={[ty('rowMeta'), { color: c.textMuted, fontSize: 12.5, fontWeight: '700' }]}>{t('Skip')}</Text>
        </Pressable>
      }
      footer={
        <View style={{ gap: 9 }}>
          <Button label={t('Continue with Google')} kind="plain" onPress={actions.logInGoogle} />
          {state.appleAvailable && <Button label={t('Continue with Apple')} kind="ink" onPress={actions.logInApple} />}
          <Button label={t('Sign up with email')} kind="plain" onPress={() => actions.navigate('signup')} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 4 }}>
            <Text style={[ty('caption'), { color: c.textMuted }]}>{t('Already have an account?')}</Text>
            <Pressable onPress={() => actions.navigate('login')} hitSlop={8}>
              <Text style={[ty('caption'), { color: c.primary, fontWeight: '700' }]}>{t('Log in')}</Text>
            </Pressable>
          </View>
        </View>
      }
    >
      {/* postup: aktivní pruh 22×5, neaktivní 8×5 */}
      <View style={{ flexDirection: 'row', gap: 5, marginBottom: SPACE.lg }}>
        {SLIDES.map((_, n) => (
          <Pressable key={n} onPress={() => setI(n)} hitSlop={14}>
            <View style={{ width: n === i ? 22 : 8, height: 5, backgroundColor: n === i ? c.text : c.borderInactive }} />
          </Pressable>
        ))}
      </View>

      {/* Přes t() — jinak zůstane úvod anglicky i v jazyce, který má
          přeloženo všechno ostatní. Klíče bere `scripts/i18n-keys.mjs`
          přímo ze `SLIDES` (viz DATA_FIELDS v tom skriptu). */}
      <Text style={[ty('screenTitle'), { color: c.text, fontSize: 32, lineHeight: 32 }]}>{t(slide.head)}</Text>
      <Text style={[ty('bodySecondary'), { color: c.textMuted }]}>{t(slide.body)}</Text>

      <View
        style={{
          flexDirection: 'row',
          gap: SPACE.md,
          alignItems: 'center',
          backgroundColor: slide.who === 'closer' ? c.accent : c.surface,
          borderWidth: BORDER.card,
          borderColor: c.border,
          padding: SPACE.md,
          marginTop: SPACE.lg,
        }}
      >
        <Mascot who={slide.who} size={72} variant="full" />
        <View style={{ flex: 1, backgroundColor: c.surface, borderWidth: BORDER.small, borderColor: c.border, padding: 10 }}>
          <Text style={[ty('caption'), { color: c.text }]}>
            {quipFor('welcome', slide.who, mascotVisible(state.notif, slide.who)) || slide.body}
          </Text>
        </View>
      </View>

      <Pressable onPress={() => (i < SLIDES.length - 1 ? setI(i + 1) : actions.navigate('signup'))} style={{ marginTop: SPACE.md }}>
        <Text style={[ty('rowTitle'), { color: c.primary, textAlign: 'center' }]}>
          {i < SLIDES.length - 1 ? t('Next') : t('Get started')}
        </Text>
      </Pressable>
    </Screen>
  );
}

// ------------------------------------------------------------------ 03 sign up

function StrengthMeter({ password }: { password: string }) {
  const { c, ty } = useUi();
  const score = [password.length >= 8, /\d/.test(password), /[A-Z]/.test(password), password.length >= 12]
    .filter(Boolean).length;
  const caption = score >= 4 ? t('Strong — 12 characters, one number.')
    : score >= 2 ? t('Fine. Longer is better.')
    : t('Too short to be interesting.');
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1, height: 7, borderWidth: BORDER.inner, borderColor: c.border,
              backgroundColor: i < score ? (score === 1 ? c.negative : c.positive) : 'transparent',
            }}
          />
        ))}
      </View>
      <Text style={[ty('rowMeta'), { color: c.textMuted, fontSize: 12.5 }]}>{caption}</Text>
    </View>
  );
}

export function SignUp() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const [show, setShow] = useState(false);
  const emailError = state.authError && state.authError.includes('domain') ? state.authError : null;

  return (
    <Screen
      title={t('CREATE YOUR\nACCOUNT')}
      onBack={actions.goBack}
      footer={<Button label={t('Create account')} onPress={actions.signUp} disabled={state.busy || !state.consentAccepted} />}
    >
      <Field label={t('NAME')} value={state.authName} onChangeText={(v) => actions.patch({ authName: v })}
        placeholder={t('What friends call you')} autoCapitalize="words" />
      <Field label={t('EMAIL')} value={state.authEmail} onChangeText={(v) => actions.patch({ authEmail: v, authError: null })}
        placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error={emailError} />
      <Field
        label={t('PASSWORD')} value={state.authPassword}
        onChangeText={(v) => actions.patch({ authPassword: v })}
        secureTextEntry={!show} autoCapitalize="none"
        trailing={
          <Pressable onPress={() => setShow(!show)} hitSlop={10}>
            <Text style={[ty('caption'), { color: c.primary, fontWeight: '700' }]}>{show ? t('Hide') : t('Show')}</Text>
          </Pressable>
        }
      />
      <StrengthMeter password={state.authPassword} />

      <View style={{ flexDirection: 'row', gap: SPACE.md, alignItems: 'flex-start', marginTop: SPACE.sm }}>
        <Check checked={state.consentAccepted} onPress={() => actions.patch({ consentAccepted: !state.consentAccepted })} size={26} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[ty('caption'), { color: c.text }]}>
            {t('I accept the Terms and the Privacy Policy.')}
          </Text>
          <Text style={[ty('caption'), { color: c.textMuted }]}>
            {t('Splittingly never touches your bank account.')}
          </Text>
        </View>
      </View>

      {!!state.authError && !emailError && (
        <Text style={[ty('caption'), { color: c.negative }]}>{state.authError}</Text>
      )}
    </Screen>
  );
}

// -------------------------------------------------------------------- 04 log in

export function LogIn() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const failed = !!state.authError;

  return (
    <Screen
      title={t('LOG IN')}
      onBack={actions.goBack}
      footer={
        <View style={{ gap: 9 }}>
          <Button label={t('Log in')} onPress={actions.logIn} disabled={state.busy} />
          <Button label={t('Continue with Google')} kind="plain" onPress={actions.logInGoogle} />
          {state.appleAvailable && <Button label={t('Continue with Apple')} kind="ink" onPress={actions.logInApple} />}
        </View>
      }
    >
      {failed && (
        <Card fill={c.negativeSurface} borderColor={c.negative}>
          <Text style={[ty('caption'), { color: c.isDark ? c.negativeTextOnSurface : c.negative }]}>{state.authError}</Text>
        </Card>
      )}

      <Field label={t('EMAIL')} value={state.authEmail} onChangeText={(v) => actions.patch({ authEmail: v, authError: null })}
        keyboardType="email-address" autoCapitalize="none" />
      <Field label={t('PASSWORD')} value={state.authPassword} onChangeText={(v) => actions.patch({ authPassword: v })}
        secureTextEntry autoCapitalize="none" />

      <Pressable onPress={() => actions.navigate('forgot')} hitSlop={10} style={{ alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' }}>
        <Text style={[ty('caption'), { color: c.primary, fontWeight: '700' }]}>{t('Forgot password?')}</Text>
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE.md, marginVertical: SPACE.sm }}>
        <Rule style={{ flex: 1 }} />
        <Text style={[ty('label'), { color: c.textMuted }]}>{t('OR')}</Text>
        <Rule style={{ flex: 1 }} />
      </View>

      {/* Maskot u hesla mluví AŽ po neúspěšném pokusu — jinak by to bylo drzé. */}
      <MascotStrip
        who={failed ? 'analyst' : 'closer'}
        text={quipFor('login_failed', failed ? 'analyst' : 'closer', true) || ''}
      />
    </Screen>
  );
}

// ---------------------------------------------------------- 05 forgot password

export function ForgotPassword() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const [sent, setSent] = useState(false);

  return (
    <Screen
      title={t('RESET YOUR\nPASSWORD')}
      onBack={actions.goBack}
      footer={<Button label={t('Send the link')} onPress={async () => { await actions.sendReset(); setSent(true); }} disabled={state.busy} />}
    >
      <Text style={[ty('bodySecondary'), { color: c.textMuted }]}>
        {t('The link works once and expires in 30 minutes.')}
      </Text>
      <Field label={t('EMAIL')} value={state.authEmail} onChangeText={(v) => actions.patch({ authEmail: v })}
        keyboardType="email-address" autoCapitalize="none" />

      {sent && (
        <Card fill={c.accent}>
          <Label color={c.onAccent}>{t('SENT — CHECK YOUR INBOX')}</Label>
          <Text style={[ty('caption'), { color: c.onAccent, marginTop: 6 }]}>
            {t('If nothing arrives in five minutes, look in spam, then try again.')}
          </Text>
        </Card>
      )}

      <Text style={[ty('caption'), { color: c.textMuted }]}>
        {t('Your groups and expenses are unaffected by a password reset. Other members see nothing.')}
      </Text>
    </Screen>
  );
}

// ------------------------------------------------------------- 06 new password

export function NewPassword() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const [repeat, setRepeat] = useState('');
  const matched = repeat.length > 0 && repeat === state.authPassword;

  return (
    <Screen
      title={t('SET A NEW\nPASSWORD')}
      footer={<Button label={t('Save and log in')} onPress={actions.saveNewPassword} disabled={!matched || state.busy} />}
    >
      <Field label={t('NEW PASSWORD')} value={state.authPassword} onChangeText={(v) => actions.patch({ authPassword: v })}
        secureTextEntry autoCapitalize="none" />
      <StrengthMeter password={state.authPassword} />
      <Field label={t('REPEAT PASSWORD')} value={repeat} onChangeText={setRepeat}
        secureTextEntry autoCapitalize="none" success={matched}
        trailing={matched ? <Text style={{ color: c.positive, fontSize: 18 }}>✓</Text> : undefined} />

      <Card fill={c.surfaceSunken}>
        <Text style={[ty('caption'), { color: c.text }]}>
          {t('Saving this signs you out on every other device. You stay signed in here.')}
        </Text>
      </Card>
    </Screen>
  );
}

// ----------------------------------------------------------- 07 confirm email

export function ConfirmEmail() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const code = state.authCode;

  return (
    <Screen
      title={t('CONFIRM\nYOUR EMAIL')}
      onBack={actions.goBack}
      footer={
        <View style={{ gap: 9 }}>
          <Button label={t('Confirm')} onPress={actions.confirmEmailCode} disabled={code.length < 6 || state.busy} />
          <Pressable onPress={() => actions.navigate('signup')} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={[ty('caption'), { color: c.textMuted, textAlign: 'center' }]}>{t('Change email address')}</Text>
          </Pressable>
        </View>
      }
    >
      <Text style={[ty('bodySecondary'), { color: c.textMuted }]}>
        {t('We sent six digits to {email}.', { email: state.authEmail })}
      </Text>

      {/* Šest buněk. Píše se do skrytého pole, buňky jen zobrazují stav. */}
      <View style={{ flexDirection: 'row', gap: 7 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const filled = i < code.length;
          const active = i === code.length;
          return (
            <View
              key={i}
              style={{
                flex: 1, aspectRatio: 0.78, borderWidth: BORDER.card,
                borderColor: active ? c.primary : c.border,
                backgroundColor: filled ? c.surface : c.surfaceSunken,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 24, color: active ? c.primary : c.text }}>
                {code[i] || ''}
              </Text>
            </View>
          );
        })}
      </View>

      <Field label={t('CODE')} value={code} onChangeText={(v) => actions.patch({ authCode: v.replace(/\D/g, '').slice(0, 6) })}
        keyboardType="numeric" placeholder="123456" />

      <Pressable onPress={actions.resendCode} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={[ty('caption'), { color: c.primary, textAlign: 'center' }]}>{t('Resend the code')}</Text>
      </Pressable>

      {!!state.authError && <Text style={[ty('caption'), { color: c.negative }]}>{state.authError}</Text>}

      <MascotStrip who="closer" text={quipFor('confirm_email', 'closer', true) || ''} />
    </Screen>
  );
}
