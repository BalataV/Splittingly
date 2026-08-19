// Obrazovka 17 — Statistiky skupiny.
//
// Reklama: obdélník 300×250 na ÚPLNÉM KONCI obsahu, nikdy mezi dvěma
// datovými bloky. V Pro verzi zmizí a layout se ZAVŘE — žádná díra po něm.
// Na jeho místo přijde žebříček „TOP SPENDERS".

import React from 'react';
import { View, Text } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Card, HardShadow, Chip, Label } from '../components/ui';
import { Money, MoneySlot } from '../components/Money';
import { MascotStrip } from '../components/Mascot';
import { RectangleAd, ProStrip } from '../components/AdSlot';
import { useApp } from '../store';
import { t } from '../i18n';
import { quipFor } from '../quips';
import { inPeriod, dominantCurrency, total, byCategory, bySpender, weeklyBars } from '../stats';
import { category } from '../categories';
import { showRectangle } from '../ads';
import { canUsePeriod } from '../entitlements';
import { PRO_PRICE_FALLBACK } from '../config';
import { initial, ME } from '../logic';
import { SPACE, BORDER } from '../theme';
import type { StatsPeriod } from '../types';

export default function Stats() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();

  const g = state.groups.find((x) => x.id === state.selectedGroup) || state.groups[0];
  if (!g) return <Screen title={t('STATS')} onBack={actions.goBack}><Text style={{ color: c.text }}>{t('No group yet.')}</Text></Screen>;

  const all = state.expenses[g.id] || [];
  const period = inPeriod(all, state.statsPeriod);
  const cur = dominantCurrency(period, g.currency);
  const sum = total(period, cur);
  const cats = byCategory(period, cur);
  const spenders = bySpender(g, period, cur);
  const bars = weeklyBars(period, cur);
  const peak = Math.max(...bars.map((b) => b.amountMinor), 1);
  const twoPeaks = [...bars].sort((a, b) => b.amountMinor - a.amountMinor).slice(0, 2).map((b) => b.amountMinor);

  const periods: { key: StatsPeriod; label: string }[] = [
    { key: 'month', label: t('Month') },
    { key: 'trip', label: t('Trip') },
    { key: 'all', label: t('All time') },
  ];

  return (
    <Screen title={t('STATS')} onBack={actions.goBack}>
      {/* Trip a All time jsou za Pro. Zamčené období se NESKRÝVÁ — uživatel
          má vidět, co si kupuje, a ťuknutí ho pošle na nabídku, ne do zdi. */}
      <View style={{ flexDirection: 'row', gap: SPACE.sm }}>
        {periods.map((p) => {
          const allowed = canUsePeriod(state.isPro, p.key);
          return (
            <Chip
              key={p.key}
              label={allowed ? p.label : p.label + ' · PRO'}
              active={state.statsPeriod === p.key}
              fill={state.statsPeriod === p.key ? c.text : (allowed ? undefined : c.surfaceSunken)}
              onPress={() => (allowed ? actions.patch({ statsPeriod: p.key }) : actions.navigate('remove_ads'))}
            />
          );
        })}
      </View>

      {/* celkem + týdenní graf */}
      <HardShadow offset={5}>
        <View style={{ backgroundColor: c.surface, borderWidth: BORDER.card, borderColor: c.border, padding: 14, gap: SPACE.md }}>
          <Label>{t('GROUP TOTAL')}</Label>
          <Money amountMinor={sum} currency={cur} role="sectionAmount" style={{ textAlign: 'left' }} />

          {/* Sloupce mají flex:1 — při delších popiscích (finština) se sníží
              výška grafu, ne šířka sloupce. Struktura zůstává. */}
          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'flex-end', height: 62 }}>
            {bars.map((b, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: '100%',
                    height: Math.max(4, (b.amountMinor / peak) * 48),
                    backgroundColor: twoPeaks.includes(b.amountMinor) && b.amountMinor > 0 ? c.accent : c.primary,
                    borderWidth: BORDER.small,
                    borderColor: c.border,
                  }}
                />
                <Text style={[ty('label'), { color: c.textMuted, fontSize: 9.5 }]}>{b.day}</Text>
              </View>
            ))}
          </View>
        </View>
      </HardShadow>

      {state.mascotsOn && <MascotStrip who="analyst" text={quipFor('stats', 'analyst', true) || ''} />}

      <Label>{t('BY CATEGORY')}</Label>
      <View style={{ gap: SPACE.md }}>
        {cats.map((cat) => {
          const def = category(cat.key);
          return (
            <View key={cat.key} style={{ gap: 5 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: SPACE.sm }}>
                <Text style={[ty('rowTitle'), { color: c.text, flex: 1 }]}>{def.glyph} {t(def.label)}</Text>
                <MoneySlot><Money amountMinor={cat.amountMinor} currency={cur} /></MoneySlot>
              </View>
              <View style={{ height: 13, borderWidth: BORDER.small, borderColor: c.border, backgroundColor: c.surface }}>
                <View style={{ width: `${cat.pct}%`, height: '100%', backgroundColor: def.color }} />
              </View>
            </View>
          );
        })}
      </View>

      {/* V Pro verzi je tady žebříček; v bezplatné je až za reklamou. */}
      {state.isPro && (
        <>
          <Label>{t('TOP SPENDERS')}</Label>
          <View style={{ borderWidth: BORDER.card, borderColor: c.border }}>
            {spenders.map((s, i) => (
              <View
                key={s.name}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: SPACE.md, padding: 11,
                  backgroundColor: i === 0 ? c.accent : c.surface,
                  borderTopWidth: i === 0 ? 0 : BORDER.inner, borderTopColor: c.dividerInner,
                }}
              >
                <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 17, color: i === 0 ? c.onAccent : c.text }}>{i + 1}</Text>
                <Text style={[ty('rowTitle'), { color: i === 0 ? c.onAccent : c.text, flex: 1 }]}>
                  {s.name === ME ? t('You') : s.name}
                </Text>
                <MoneySlot><Money amountMinor={s.amountMinor} currency={cur} color={i === 0 ? c.onAccent : c.text} /></MoneySlot>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Obdélník 300×250 — POSLEDNÍ prvek obsahu, nikdy dřív. */}
      {showRectangle('stats', state.isPro, all.length > 0) && (
        <RectangleAd onUpgrade={() => actions.navigate('remove_ads')} />
      )}

      {/* Tichá cesta k Pro. Jedna ze tří povolených. */}
      {!state.isPro && <ProStrip price={PRO_PRICE_FALLBACK} onPress={() => actions.navigate('remove_ads')} />}
    </Screen>
  );
}
