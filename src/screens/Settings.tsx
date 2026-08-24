// Obrazovky 22–29 — profil, jazyk, měna, vzhled, notifikace, odstranění
// reklam, zásady ochrany údajů, smazání účtu.
//
// Reklama tu není nikde kromě jediného tichého řádku k Pro (obrazovka 22).

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import * as Application from 'expo-application';
import Screen, { SectionTitle } from '../components/Screen';
import { useUi, Card, Button, Field, Row, Label, Toggle, Segmented, Avatar, Rule, Stepper } from '../components/ui';
import Mascot from '../components/Mascot';
import { useApp } from '../store';
import { t, translationCoverage } from '../i18n';
import { LANGUAGES, searchLanguages, language } from '../languages';
import { CURRENCIES, currency } from '../currencies';
import { fmt } from '../money';
import { THEMES, THEME_ORDER, AVATAR_COLORS, SPACE, BORDER, TEXT_SCALE } from '../theme';
import { PRIVACY_URL, TERMS_URL, SUPPORT_EMAIL, PRO_PRICE_FALLBACK } from '../config';
import { PRO_BENEFITS, canUseTheme } from '../entitlements';
import { initial } from '../logic';
import type { ThemeName, ModeName, TextSize } from '../types';

/**
 * Verze a číslo buildu.
 *
 * Bez tohohle se nedá poznat, kterou instalaci člověk zrovna drží.
 * `version` je pro všechny buildy stejná (1.0.0), takže ani systémový
 * seznam aplikací nepomůže — jediné, co je odliší, je `versionCode`,
 * a ten Android nikde neukazuje. Když pak přijde hlášení „stáhl jsem
 * nový build a změny tam nejsou", jde to tímhle rozhodnout na jedno
 * pohlednutí místo hádání.
 *
 * V Expo Go jsou obě hodnoty `null` — tam se prostě nic nevypíše.
 */
const BUILD_LABEL = [Application.nativeApplicationVersion, Application.nativeBuildVersion]
  .filter(Boolean)
  .join(' · ');

/** Celá hodina ve 24h tvaru. Minuty se nenastavují, tak jsou vždy nuly. */
const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;

// -------------------------------------------------------------- 22 · profil

export function Profile() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const [name, setName] = useState(state.myName);

  return (
    <Screen title={t('PROFILE')} onBack={actions.goBack}>
      <Card offset={5}>
        <View style={{ flexDirection: 'row', gap: SPACE.md, alignItems: 'center' }}>
          <Avatar initial={initial(name || 'You')} color={state.avatarColor} size={64} borderWidth={BORDER.card} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 19, color: c.text }}>{name || t('You')}</Text>
            <Text style={[ty('rowMeta'), { color: c.textMuted, fontSize: 12.5 }]}>{state.myEmail}</Text>
          </View>
        </View>
      </Card>

      <Field
        label={t('DISPLAY NAME')}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <Text style={[ty('caption'), { color: c.textMuted }]}>
        {t('This is what other members see in every group.')}
      </Text>
      {name !== state.myName && (
        <Button label={t('Save name')} onPress={() => actions.patch({ myName: name })} />
      )}

      <Label>{t('AVATAR COLOUR')}</Label>
      <View style={{ flexDirection: 'row', gap: SPACE.sm }}>
        {AVATAR_COLORS.map((col) => {
          const selected = state.avatarColor === col;
          return (
            <Pressable key={col} onPress={() => actions.patch({ avatarColor: col })} accessibilityLabel={t('Avatar colour')}>
              <View style={{ position: 'relative' }}>
                {selected && <View style={{ position: 'absolute', top: 3, left: 3, right: -3, bottom: -3, backgroundColor: c.shadow }} />}
                <View style={{ width: 44, height: 44, backgroundColor: col, borderWidth: BORDER.card, borderColor: c.border }} />
              </View>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>{t('SETTINGS')}</SectionTitle>
      <View style={{ gap: 6 }}>
        <SettingRow label={t('Language')} value={language(state.lang).endonym} onPress={() => actions.navigate('language')} />
        <SettingRow label={t('Currency')} value={state.currency} onPress={() => actions.navigate('currency')} />
        <SettingRow label={t('Appearance')} value={THEMES[state.theme].label} onPress={() => actions.navigate('appearance')} />
        <SettingRow label={t('Notifications')} onPress={() => actions.navigate('notifications')} />
        {/* Jedna ze tří povolených cest k Pro. */}
        <SettingRow
          label={state.isPro ? t('Splittingly Pro') : t('Remove the ads')}
          value={state.isPro ? t('Active') : (state.proPrice ?? PRO_PRICE_FALLBACK)}
          onPress={() => actions.navigate('remove_ads')}
        />
        <SettingRow label={t('Privacy policy')} onPress={() => actions.navigate('privacy')} />
      </View>

      <SectionTitle>{t('ACCOUNT')}</SectionTitle>
      <View style={{ gap: 6 }}>
        <SettingRow label={t('Change password')} onPress={() => actions.navigate('forgot')} />
        <SettingRow label={t('Contact support')} onPress={() => Linking.openURL('mailto:' + SUPPORT_EMAIL)} />
        <SettingRow label={t('Log out')} onPress={actions.logOut} />
      </View>

      <Rule style={{ marginTop: SPACE.lg }} />
      <Pressable onPress={() => actions.patch({ dialog: 'delete_account' })}>
        <View style={{ borderWidth: BORDER.card, borderColor: c.negative, padding: 14, alignItems: 'center' }}>
          <Text style={[ty('button'), { color: c.negative }]}>{t('Delete account')}</Text>
        </View>
      </Pressable>

      {!!BUILD_LABEL && (
        <Text style={[ty('caption'), { color: c.textMuted, textAlign: 'center', marginTop: SPACE.md }]}>
          {BUILD_LABEL}
        </Text>
      )}

      {state.dialog === 'delete_account' && <DeleteAccountDialog />}
    </Screen>
  );
}

function SettingRow({ label, value, onPress }: { label: string; value?: string; onPress: () => void }) {
  const { c, ty } = useUi();
  return (
    <Row onPress={onPress}>
      <Text style={[ty('rowTitle'), { color: c.text, flex: 1 }]}>{label}</Text>
      {!!value && <Text style={[ty('rowMeta'), { color: c.textMuted, flexShrink: 0 }]}>{value}</Text>}
      <Text style={{ color: c.textMuted, fontSize: 18 }}>›</Text>
    </Row>
  );
}

// --------------------------------------------------------------- 23 · jazyk

export function LanguagePicker() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const [q, setQ] = useState('');
  const list = searchLanguages(q);

  return (
    <Screen title={t('LANGUAGE')} onBack={actions.goBack}>
      <Field value={q} onChangeText={setQ} placeholder={t('Search 50 languages')} autoCapitalize="none" />
      <Text style={[ty('label'), { color: c.textMuted }]}>
        {t('{n} OF {total} MATCH', { n: list.length, total: LANGUAGES.length })}
      </Text>

      <View style={{ gap: 6 }}>
        {list.map((l) => {
          const selected = state.lang === l.code;
          return (
            <Row key={l.code} onPress={() => actions.setLang(l.code)}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[ty('rowTitle'), { color: c.text }]}>{l.endonym}</Text>
                <Text style={[ty('rowMeta'), { color: c.textMuted }]}>
                  {l.english}{l.rtl ? ' · RTL' : ''}
                  {/* Rozpracovaný překlad se přizná dopředu. Uživatel má vědět,
                      že uvidí půl rozhraní anglicky, dřív než přepne. */}
                  {translationCoverage(l.code) < 1
                    ? ' · ' + t('partly translated')
                    : ''}
                </Text>
              </View>
              {selected && (
                <View style={{ width: 24, height: 24, backgroundColor: c.accent, borderWidth: BORDER.small, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: c.onAccent, fontSize: 13 }}>✓</Text>
                </View>
              )}
            </Row>
          );
        })}
      </View>

      <Card fill={c.accent}>
        <Text style={[ty('caption'), { color: c.onAccent }]}>
          {t('Language and currency are separate settings. Changing the language never changes how a group counts money.')}
        </Text>
      </Card>
    </Screen>
  );
}

// ----------------------------------------------------------------- 24 · měna

/**
 * Výběr měny ve dvou režimech.
 *
 * `display` (výchozí) mění MOJI zobrazovací měnu — nastavení profilu.
 * `expense` mění měnu rozepsaného výdaje a nic v profilu nesahá.
 *
 * Bez toho rozlišení tu byla tichá záměna: klepnutí na kód měny u částky
 * v „Nový výdaj" otevřelo tenhle seznam, ten ale uměl jen `setCurrency`,
 * takže výdaj zůstal ve staré měně a místo něj se člověku přepsala
 * zobrazovací měna celého účtu — změna, o kterou nežádal a která se
 * neprojevila tam, kam se díval.
 *
 * Skupina může nést víc měn zároveň; `netFor` počítá každou zvlášť
 * a `transfersFor` vrací převod pro každou měnu, takže je to podporovaný
 * stav, ne obcházení modelu.
 */
export function CurrencyPicker({ target = 'display' }: { target?: 'display' | 'expense' }) {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const [q, setQ] = useState('');
  const forExpense = target === 'expense';

  const match = (code: string) => {
    const cur = currency(code);
    const s = q.toLowerCase();
    return !s || cur.code.toLowerCase().includes(s) || cur.name.toLowerCase().includes(s);
  };
  // Oblíbené si volí uživatel (úvodní nastavení nebo hvězdička zde).
  const favourites = state.favouriteCurrencies.filter(match);
  const rest = CURRENCIES.map((x) => x.code)
    .filter((code) => !state.favouriteCurrencies.includes(code))
    .filter(match);

  const pick = (code: string) => {
    if (forExpense) {
      actions.setDraft({ currency: code });
      actions.goBack();
      return;
    }
    actions.setCurrency(code);
  };

  const CurrencyRow = ({ code }: { code: string }) => {
    const cur = currency(code);
    const selected = (forExpense ? state.draft.currency : state.currency) === code;
    const fav = state.favouriteCurrencies.includes(code);
    return (
      <Row onPress={() => pick(code)}>
        <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 15, color: c.text, width: 44 }}>{cur.code}</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[ty('rowTitle'), { color: c.text }]}>{t(cur.name)}</Text>
          {/* Živý vzorek formátu — hned je vidět, jak bude částka vypadat. */}
          <Text style={[ty('rowMeta'), { color: c.textMuted }]}>
            {fmt(cur.decimals === 0 ? 1235 : 123456, code)}
          </Text>
        </View>
        {selected && (
          <View style={{ width: 22, height: 22, backgroundColor: c.primary, borderWidth: BORDER.small, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.onPrimary, fontSize: 11 }}>✓</Text>
          </View>
        )}
        {/* Hvězdička je samostatný cíl: řádek vybírá měnu,
            hvězda jen to, jestli je nahoře v seznamu. */}
        <Pressable
          onPress={() => actions.toggleFavouriteCurrency(code)}
          hitSlop={12}
          accessibilityLabel={fav ? t('Remove from favourites') : t('Add to favourites')}
        >
          <View style={{
            width: 30, height: 30,
            backgroundColor: fav ? c.accent : c.surface,
            borderWidth: BORDER.small, borderColor: c.border,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: fav ? c.onAccent : c.textMuted, fontSize: 14 }}>★</Text>
          </View>
        </Pressable>
      </Row>
    );
  };

  return (
    <Screen title={forExpense ? t('CURRENCY') : t('YOUR DISPLAY CURRENCY')} onBack={actions.goBack}>
      <Field value={q} onChangeText={setQ} placeholder={t('Search currencies')} autoCapitalize="characters" />

      {favourites.length > 0 && (
        <>
          <Label>{t('FAVOURITES')}</Label>
          <View style={{ gap: 6 }}>{favourites.map((code) => <CurrencyRow key={code} code={code} />)}</View>
        </>
      )}

      <Label>{t('ALL')}</Label>
      <View style={{ gap: 6 }}>{rest.map((code) => <CurrencyRow key={code} code={code} />)}</View>

      <Card fill={c.accent}>
        <Text style={[ty('caption'), { color: c.onAccent }]}>
          {t('Zero-decimal currencies (JPY, KRW, VND, ISK) drop the fraction everywhere, including split maths. Symbol position, thousands separator and decimal mark all follow the currency, not the language.')}
        </Text>
      </Card>
    </Screen>
  );
}

// --------------------------------------------------------------- 25 · vzhled

export function Appearance() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();

  return (
    <Screen title={t('APPEARANCE')} onBack={actions.goBack}>
      <Label>{t('MODE')}</Label>
      <Segmented<ModeName>
        value={state.mode}
        onChange={actions.setMode}
        options={[
          { key: 'light', label: t('Light') },
          { key: 'dark', label: t('Dark') },
          { key: 'system', label: t('System') },
        ]}
      />

      <Label>{t('THEME')}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm }}>
        {THEME_ORDER.map((key) => {
          const th = THEMES[key];
          const locked = !canUseTheme(key, state.isPro, state.rewardTheme, state.rewardUntil);
          const selected = state.theme === key;
          return (
            <Pressable
              key={key}
              onPress={() => (locked ? actions.navigate('remove_ads') : actions.setTheme(key as ThemeName))}
              style={{ width: '48%' }}
            >
              <View style={{ position: 'relative' }}>
                {selected && <View style={{ position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, backgroundColor: c.shadow }} />}
                <View style={{ backgroundColor: locked ? c.surfaceSunken : c.surface, borderWidth: BORDER.card, borderColor: c.border, padding: 12, gap: SPACE.sm }}>
                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    {[th.accent, th.primary, th.secondary].map((col) => (
                      <View key={col} style={{ width: 22, height: 22, backgroundColor: col, borderWidth: 2, borderColor: c.border }} />
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[ty('rowTitle'), { color: c.text }]}>{th.label}</Text>
                    {th.pro && (
                      <View style={{ backgroundColor: c.text, paddingHorizontal: 5, paddingVertical: 1 }}>
                        <Text style={[ty('label'), { color: c.accent, fontSize: 9 }]}>PRO</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Label>{t('TEXT SIZE')}</Label>
      <Segmented<TextSize>
        value={state.textSize}
        onChange={actions.setTextSize}
        options={[
          { key: 'small', label: t('Small') },
          { key: 'medium', label: t('Medium') },
          { key: 'large', label: t('Large') },
        ]}
      />

      {/* Zapnutí postav je rozhodnutí o VZHLEDU, ne o upozorněních: nejvíc
          se projeví na obrazovkách, kde ty pruhy s hláškami stojí. Proto
          bydlí tady, vedle tématu a velikosti písma.

          Je to týž stav (`notif.closer` / `notif.analyst`), který zároveň
          řídí, jestli postavy mluví i v push zprávách — vypnutí platí na
          obě strany. Funkční oznámení („někdo vyrovnal", „nový výdaj")
          se tím neztratí, ta se přepínají zvlášť v Notifikacích. */}
      <Label>{t('FROM THE CAST')}</Label>
      <View style={{ gap: 6 }}>
        <Row>
          <Mascot who="closer" size={28} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[ty('rowTitle'), { color: c.text }]}>{t('The Closer')}</Text>
            <Text style={[ty('rowMeta'), { color: c.textMuted }]}>{t('Celebrations, big rounds')}</Text>
          </View>
          <Toggle value={state.notif.closer} onChange={(v) => actions.setNotif('closer', v)} label={t('The Closer')} />
        </Row>
        <Row>
          <Mascot who="analyst" size={28} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[ty('rowTitle'), { color: c.text }]}>{t('The Analyst')}</Text>
            <Text style={[ty('rowMeta'), { color: c.textMuted }]}>{t('Reminders, warnings')}</Text>
          </View>
          <Toggle value={state.notif.analyst} onChange={(v) => actions.setNotif('analyst', v)} label={t('The Analyst')} />
        </Row>
      </View>
      <Text style={[ty('caption'), { color: c.textMuted }]}>
        {t('Both characters can be switched off entirely without losing any functional notification.')}
      </Text>

      {/* Živý náhled v AKTUÁLNÍM jazyce a měně appky — uživatel má vidět svůj
          vlastní vzhled, ne vzorový (dřív tu bylo natvrdo německé „Zahlung
          bestätigen", zvolené proto, že bývá dlouhé). Pravidlo, že text
          nikdy neuřízne tlačítko, platí furt — jen se to teď ověřuje na
          reálném textu uživatele, ne na vybrané ukázce. */}
      <Card fill={c.surfaceSunken}>
        <Label>{t('PREVIEW')}</Label>
        <View style={{ marginTop: SPACE.sm, backgroundColor: c.primary, borderWidth: BORDER.card, borderColor: c.border, padding: 14, alignItems: 'center' }}>
          <Text style={{
            fontFamily: 'SpaceGrotesk_700Bold',
            fontSize: 16 * TEXT_SCALE[state.textSize],
            lineHeight: 21 * TEXT_SCALE[state.textSize],
            color: c.onPrimary,
            textAlign: 'center',
          }}>
            {t('Confirm payment')} · {fmt(6420, state.currency)}
          </Text>
        </View>
        <Text style={[ty('caption'), { color: c.textMuted, marginTop: SPACE.sm }]}>
          {t('Buttons grow with the label — never truncate, never scroll sideways.')}
        </Text>
      </Card>
    </Screen>
  );
}

// ----------------------------------------------------------- 26 · notifikace

export function Notifications() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();

  const rows: { key: keyof typeof state.notif; title: string; scope: string }[] = [
    { key: 'expense', title: t('New expense added'), scope: t('Every group you are in') },
    { key: 'settled', title: t('Someone settled up'), scope: t('Only payments that involve you') },
    { key: 'edited', title: t('Expense edited or deleted'), scope: t('Changes to expenses you can see') },
    { key: 'weekly', title: t('Weekly summary'), scope: t('One message, Sunday evening') },
  ];

  return (
    <Screen title={t('NOTIFICATIONS')} onBack={actions.goBack}>
      <Label>{t('PUSH')}</Label>
      <View style={{ gap: 6 }}>
        {rows.map((r) => (
          <Row key={String(r.key)}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[ty('rowTitle'), { color: c.text }]}>{r.title}</Text>
              <Text style={[ty('rowMeta'), { color: c.textMuted }]}>{r.scope}</Text>
            </View>
            <Toggle
              value={state.notif[r.key] as boolean}
              onChange={(v) => actions.setNotif(r.key, v)}
              label={r.title}
            />
          </Row>
        ))}
      </View>

      {/* Tichých hodin se dřív šlo jen dočíst — řádek neměl `onPress` ani
          žádný ovládací prvek, takže klepnutí nedělalo nic.

          Popisek je nad ovladači, ne vedle nich: dvě krokovadla zaberou
          skoro tři sta bodů a na telefon už na text vedle nich zbyde
          čtyřicet, do kterých se „Quiet hours" zalomí na tři řádky a řádek
          naroste na 66 bodů. Jako nadpis sekce se přitom chová stejně jako
          MODE nebo THEME o kus výš.

          Hodiny jsou schválně bez minut: ticho se nastavuje po hodinách
          a kolečko s minutami by k němu nic nepřidalo. Krokovadla přetáčejí
          přes půlnoc, protože „od 23 do 8" je ten obvyklý případ. */}
      <Label>{t('Quiet hours')}</Label>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm }}>
        <Stepper
          value={state.notif.quietFrom}
          onChange={(v) => actions.setNotif('quietFrom', v)}
          min={0} max={23} wrap
          format={hourLabel}
        />
        <Text style={[ty('rowTitle'), { color: c.textMuted }]}>–</Text>
        <Stepper
          value={state.notif.quietTo}
          onChange={(v) => actions.setNotif('quietTo', v)}
          min={0} max={23} wrap
          format={hourLabel}
        />
      </View>

      {/* Stejné „od" i „do" znamená, že se neztlumí nic — `inQuietHours()`
          takový interval vrací jako prázdný. Ať to člověk pozná tady,
          ne až z toho, že mu ve tři ráno pípne telefon. */}
      {state.notif.quietFrom === state.notif.quietTo && (
        <Text style={[ty('caption'), { color: c.textMuted }]}>
          {t('Same hour on both sides means nothing is silenced.')}
        </Text>
      )}
    </Screen>
  );
}

// ------------------------------------------------------- 27 · odstranit reklamy

export function RemoveAds() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();

  // Seznam výhod žije v entitlements.ts, ať se nerozejde s tím, co appka
  // opravdu odemyká.
  const benefits = PRO_BENEFITS.map((b) => t(b));

  return (
    <Screen
      fill={c.text}
      onBack={actions.goBack}
      footer={
        <View style={{ gap: 9 }}>
          <Button label={t('Buy Pro — {price}', { price: state.proPrice ?? PRO_PRICE_FALLBACK })} kind="accent" onPress={actions.buyPro} />
          <Pressable onPress={actions.restorePro} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={[ty('caption'), { color: c.textMuted, textAlign: 'center' }]}>{t('Restore a previous purchase')}</Text>
          </Pressable>
        </View>
      }
    >
      <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 34, lineHeight: 33, color: c.bg, marginTop: SPACE.lg }}>
        {t('REMOVE\nTHE ADS.')}
      </Text>
      <Text style={[ty('bodySecondary'), { color: c.isDark ? c.textMuted : '#9A9A9A' }]}>
        {t('One payment. No subscription. Applies to every group you are in.')}
      </Text>

      <View style={{ position: 'relative', marginTop: SPACE.lg }}>
        <View style={{ position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, backgroundColor: c.bg }} />
        <View style={{ backgroundColor: c.accent, borderWidth: BORDER.card, borderColor: c.border, padding: 16, gap: SPACE.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: SPACE.sm }}>
            <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 20, color: c.onAccent, flex: 1 }}>
              {t('SPLITTINGLY PRO')}
            </Text>
            <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 24, color: c.onAccent }}>{state.proPrice ?? PRO_PRICE_FALLBACK}</Text>
          </View>
          <View style={{ height: BORDER.card, backgroundColor: c.onAccent }} />
          {benefits.map((b) => (
            <View key={b} style={{ flexDirection: 'row', gap: SPACE.sm }}>
              <Text style={{ color: c.onAccent, fontSize: 15 }}>✓</Text>
              <Text style={[ty('caption'), { color: c.onAccent, flex: 1 }]}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Odměněná reklama — JEDINÁ, kterou si uživatel vybere sám. */}
      <View style={{ borderWidth: BORDER.card, borderColor: c.bg, padding: 14, gap: SPACE.sm, marginTop: SPACE.xl }}>
        <Label color={c.bg}>{t('NOT READY?')}</Label>
        <Text style={[ty('caption'), { color: c.isDark ? c.textMuted : '#9A9A9A' }]}>
          {t('Watch a short video to unlock any theme for seven days. Rewarded video is the only ad you ever choose to see.')}
        </Text>
        <Pressable onPress={() => actions.unlockThemeByReward('dusk')}>
          <View style={{ borderWidth: BORDER.small, borderColor: c.bg, padding: 12, alignItems: 'center', marginTop: SPACE.sm }}>
            <Text style={[ty('button'), { color: c.bg }]}>{t('Watch and unlock a theme')}</Text>
          </View>
        </Pressable>
      </View>

      {state.isPro && (
        <Text style={[ty('caption'), { color: c.accent, marginTop: SPACE.lg }]}>{t('Pro is already active on this account.')}</Text>
      )}
    </Screen>
  );
}

// ------------------------------------------------------------- 28 · soukromí

export function Privacy() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();

  const summary = [
    { bold: t('We never connect to your bank.'), body: t('There is no bank integration and no card on file. Splittingly records what people tell it.') },
    { bold: t('Your group data stays in your groups.'), body: t('Expenses are visible to the members of that group and nobody else.') },
    { bold: t('Ads are contextless.'), body: t('No expense text, amount, category or group name is shared with an ad network.') },
  ];

  const sections = [
    t('What we collect'),
    t('How we use it'),
    t('Who else sees it'),
    t('How long we keep it'),
    t('Your rights and how to use them'),
  ];

  return (
    <Screen title={t('PRIVACY')} onBack={actions.goBack}>
      <Text style={[ty('caption'), { color: c.textMuted }]}>
        {t('Last updated 4 June 2026 · plain-language summary first')}
      </Text>

      <Card fill={c.accent}>
        <Label color={c.onAccent}>{t('THE SHORT VERSION')}</Label>
        <View style={{ gap: SPACE.md, marginTop: SPACE.sm }}>
          {summary.map((s) => (
            <View key={s.bold} style={{ gap: 3 }}>
              <Text style={[ty('rowTitle'), { color: c.onAccent }]}>{s.bold}</Text>
              <Text style={[ty('caption'), { color: c.onAccent }]}>{s.body}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={{ gap: 6 }}>
        {sections.map((s, i) => (
          <Row key={s} onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 15, color: c.text, width: 26 }}>{i + 1}</Text>
            <Text style={[ty('rowTitle'), { color: c.text, flex: 1 }]}>{s}</Text>
            <Text style={{ color: c.textMuted, fontSize: 18 }}>›</Text>
          </Row>
        ))}
      </View>

      <Row>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[ty('rowTitle'), { color: c.text }]}>{t('Personalised ads')}</Text>
          <Text style={[ty('rowMeta'), { color: c.textMuted }]}>
            {t('Off by default. With it off you still see ads, just untargeted ones.')}
          </Text>
        </View>
        <Toggle value={state.personalisedAds} onChange={actions.setPersonalisedAds} label={t('Personalised ads')} />
      </Row>

      <Button label={t('Read the full policy')} kind="plain" onPress={() => Linking.openURL(PRIVACY_URL)} />
      <Button label={t('Terms of use')} kind="plain" offset={0} onPress={() => Linking.openURL(TERMS_URL)} />
    </Screen>
  );
}

// ------------------------------------------------------ 29 · smazání účtu

export function DeleteAccountDialog() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const typed = state.deleteConfirmText.trim().toUpperCase() === 'DELETE';

  return (
    <View style={{ marginTop: SPACE.lg }}>
      <View style={{ position: 'relative' }}>
        <View style={{ position: 'absolute', top: 7, left: 7, right: -7, bottom: -7, backgroundColor: c.shadow }} />
        <View style={{ backgroundColor: c.surface, borderWidth: BORDER.frame, borderColor: c.border, padding: 20, gap: SPACE.md }}>
          <View style={{ width: 44, height: 44, backgroundColor: c.negative, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontFamily: 'ArchivoBlack_400Regular', fontSize: 24 }}>!</Text>
          </View>

          <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 24, lineHeight: 25, color: c.text }}>
            {t('DELETE YOUR\nACCOUNT?')}
          </Text>

          <Text style={[ty('caption'), { color: c.textMuted }]}>
            {t('This cannot be undone. Expenses you created stay in the group as "former member" so other people\'s balances remain correct.')}
          </Text>

          <View style={{ backgroundColor: c.negativeSurface, borderWidth: BORDER.small, borderColor: c.negative, padding: 11 }}>
            <Text style={[ty('caption'), { color: c.isDark ? c.negativeTextOnSurface : c.negative }]}>
              {t('Settle any open balance first, or the group keeps the record open.')}
            </Text>
          </View>

          <Field
            label={t('TYPE DELETE TO CONFIRM')}
            value={state.deleteConfirmText}
            onChangeText={(v) => actions.patch({ deleteConfirmText: v })}
            autoCapitalize="characters"
          />

          <View style={{ flexDirection: 'row', gap: SPACE.sm }}>
            <Button label={t('Cancel')} kind="plain" offset={0} onPress={() => actions.patch({ dialog: null, deleteConfirmText: '' })} style={{ flex: 1 }} />
            <Button label={t('Delete')} kind="negative" offset={0} disabled={!typed} onPress={actions.deleteAccount} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </View>
  );
}
