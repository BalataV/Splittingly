// Úvodní nastavení po první registraci.
//
// PROČ VŮBEC: jazyk a měna jsou v této appce dvě nezávislá rozhodnutí a obě
// ovlivňují každou obrazovku. Schovat je do nastavení znamená, že je většina
// lidí nikdy nenajde a bude appku používat v jazyce, který si nevybrala.
//
// PROČ JEN DVA KROKY: čím delší úvod, tím víc lidí ho proklikne bez čtení.
// Všechno ostatní (téma, velikost písma, notifikace) má rozumnou výchozí
// hodnotu a dá se změnit později — tyhle dvě věci ne.
//
// Přeskočit jde kdykoli; výchozí hodnoty jsou použitelné.

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Button, Field, Card, Row, Label } from '../components/ui';
import { MascotStrip } from '../components/Mascot';
import { useApp } from '../store';
import { t, translationCoverage } from '../i18n';
import { quipFor } from '../quips';
import { searchLanguages, LANGUAGES, language } from '../languages';
import { CURRENCIES, currency } from '../currencies';
import { fmt } from '../money';
import { SPACE, BORDER } from '../theme';

export default function Setup() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const [step, setStep] = useState<0 | 1>(0);
  const [q, setQ] = useState('');

  const isLast = step === 1;

  return (
    <Screen
      title={step === 0 ? t('PICK YOUR\nLANGUAGE') : t('PICK YOUR\nCURRENCIES')}
      footer={
        <View style={{ gap: 9 }}>
          <Button
            label={isLast ? t('Start using Splittingly') : t('Next')}
            kind={isLast ? 'accent' : 'primary'}
            onPress={() => (isLast ? actions.finishSetup() : setStep(1))}
          />
          <Pressable onPress={actions.finishSetup} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={[ty('caption'), { color: c.textMuted, textAlign: 'center' }]}>
              {t('Skip — you can change all of this later')}
            </Text>
          </Pressable>
        </View>
      }
    >
      {/* postup: dva kroky, aktivní pruh širší */}
      <View style={{ flexDirection: 'row', gap: 5, marginBottom: SPACE.sm }}>
        {[0, 1].map((n) => (
          <View key={n} style={{ width: n === step ? 22 : 8, height: 5, backgroundColor: n === step ? c.text : c.borderInactive }} />
        ))}
      </View>

      {step === 0 ? <LanguageStep query={q} setQuery={setQ} /> : <CurrencyStep query={q} setQuery={setQ} />}
    </Screen>
  );
}

// ------------------------------------------------------------------ 1 · jazyk

function LanguageStep({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  // Bez dotazu ukážeme všech 50 (Screen scrolluje). Usekem na 30 se první
  // obrazovka zastavila u islandštiny a japonština, čínština nebo arabština
  // šly najít jen přes hledání — které uživatel v cizím UI nečeká.
  const matches = searchLanguages(query);
  const list = query ? matches.slice(0, 30) : matches;

  return (
    <>
      <Text style={[ty('bodySecondary'), { color: c.textMuted }]}>
        {t('Splittingly speaks {n} languages. Which one is yours?', { n: LANGUAGES.length })}
      </Text>

      <Field value={query} onChangeText={setQuery} placeholder={t('Search languages')} autoCapitalize="none" />

      <View style={{ gap: 6 }}>
        {list.map((l) => {
          const selected = state.lang === l.code;
          // 0 % = žádný slovník ani přes základní jazyk → rozhraní celé anglicky.
          // Mezi tím = rozpracované. Obojí se přizná dřív, než uživatel přepne.
          const coverage = translationCoverage(l.code);
          return (
            <Row key={l.code} onPress={() => actions.setLang(l.code)} fill={selected ? c.accent : undefined}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[ty('rowTitle'), { color: selected ? c.onAccent : c.text }]}>{l.endonym}</Text>
                <Text style={[ty('rowMeta'), { color: selected ? c.onAccent : c.textMuted }]}>
                  {l.english}{l.rtl ? ' · RTL' : ''}
                  {coverage === 0 ? ' · ' + t('English only')
                    : coverage < 1 ? ' · ' + t('partly translated') : ''}
                </Text>
              </View>
              {selected && <Text style={{ color: c.onAccent, fontSize: 16 }}>✓</Text>}
            </Row>
          );
        })}
      </View>

      <Card fill={c.accent}>
        <Text style={[ty('caption'), { color: c.onAccent }]}>
          {t('Language and currency are separate settings. Changing the language never changes how a group counts money.')}
        </Text>
      </Card>
    </>
  );
}

// -------------------------------------------------------------------- 2 · měny

function CurrencyStep({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  const { c, ty } = useUi();
  const { state, actions } = useApp();

  const s = query.trim().toLowerCase();
  const list = CURRENCIES.filter((cur) =>
    !s || cur.code.toLowerCase().includes(s) || cur.name.toLowerCase().includes(s));

  // Oblíbené nahoru — u padesáti měn je to rozdíl mezi „ťuknu" a „hledám".
  const sorted = [...list].sort((a, b) => {
    const fa = state.favouriteCurrencies.includes(a.code) ? 0 : 1;
    const fb = state.favouriteCurrencies.includes(b.code) ? 0 : 1;
    return fa - fb;
  }).slice(0, 30);

  return (
    <>
      <Text style={[ty('bodySecondary'), { color: c.textMuted }]}>
        {t('Star the currencies you actually use. They stay at the top of every list.')}
      </Text>

      <Field value={query} onChangeText={setQuery} placeholder={t('Search currencies')} autoCapitalize="characters" />

      <Label>{t('YOUR DISPLAY CURRENCY')}</Label>
      <Row>
        <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 15, color: c.text, width: 44 }}>
          {state.currency}
        </Text>
        <Text style={[ty('rowTitle'), { color: c.text, flex: 1 }]}>{t(currency(state.currency).name)}</Text>
        <Text style={[ty('rowMeta'), { color: c.textMuted }]}>
          {fmt(currency(state.currency).decimals === 0 ? 1235 : 123456, state.currency)}
        </Text>
      </Row>

      <View style={{ gap: 6, marginTop: SPACE.sm }}>
        {sorted.map((cur) => {
          const fav = state.favouriteCurrencies.includes(cur.code);
          const isMine = state.currency === cur.code;
          return (
            <Row key={cur.code} onPress={() => actions.setCurrency(cur.code)}>
              <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 15, color: c.text, width: 44 }}>
                {cur.code}
              </Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[ty('rowTitle'), { color: c.text }]}>{t(cur.name)}</Text>
                <Text style={[ty('rowMeta'), { color: c.textMuted }]}>
                  {fmt(cur.decimals === 0 ? 1235 : 123456, cur.code)}
                </Text>
              </View>
              {isMine && <Text style={[ty('rowMeta'), { color: c.primary }]}>{t('displayed')}</Text>}
              {/* Hvězdička je samostatný cíl — ťuknutí na řádek mění zobrazovací
                  měnu, ťuknutí na hvězdu jen oblíbenost. */}
              <Pressable
                onPress={() => actions.toggleFavouriteCurrency(cur.code)}
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
        })}
      </View>

      <MascotStrip who="analyst" text={quipFor('welcome', 'analyst', true) || ''} />
    </>
  );
}
