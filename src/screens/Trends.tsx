// Obrazovka 32 — Trendy útrat skupiny (Pro).
//
// Čistá projekce nad `stats.ts` (`monthlyTotals` / `trendSummary` /
// `categoryDrift`) — žádný nový stav ve store, okno měsíců je lokální.
// Jen daná měna (měna skupiny) — napříč měnami se útraty nikdy nesčítají.
//
// ŽÁDNÁ REKLAMA: nastavení / přehled skupiny, ne feed.

import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Card, HardShadow, Chip, Label } from '../components/ui';
import { Money, MoneySlot } from '../components/Money';
import { useApp } from '../store';
import { t } from '../i18n';
import { fmt } from '../money';
import { category } from '../categories';
import { monthlyTotals, categoryDrift, trendSummary } from '../stats';
import { canUseTrends } from '../entitlements';
import { SPACE, BORDER } from '../theme';

const WINDOWS = [3, 6, 12];

export default function Trends() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const g = state.groups.find((x) => x.id === state.selectedGroup);
  const [months, setMonths] = useState(6);

  if (!g) return <Screen title={t('TRENDS')} onBack={actions.goBack}><Text style={{ color: c.text }} /></Screen>;

  if (!canUseTrends(state.isPro)) {
    return (
      <Screen
        title={t('TRENDS')}
        onBack={actions.goBack}
        footer={<Chip label={t('Unlock trends with Pro')} active onPress={() => actions.navigate('remove_ads')} />}
      >
        <Card fill={c.accent}>
          <Text style={[ty('caption'), { color: c.onAccent }]}>
            {t('See how the group spends month over month, and which categories are climbing.')}
          </Text>
        </Card>
      </Screen>
    );
  }

  const exp = state.expenses[g.id] || [];
  const cur = g.currency;
  const bars = monthlyTotals(exp, cur, months);
  const summary = trendSummary(exp, cur);
  const drift = categoryDrift(exp, cur, 1);
  const peak = Math.max(1, ...bars.map((b) => b.totalMinor));

  const pct = summary.pctChange;
  const pctLabel =
    pct === null ? t('No comparison yet')
    : pct === 0 ? t('Same as last month')
    : pct > 0 ? t('↑ {n}% vs last month', { n: Math.round(pct) })
    : t('↓ {n}% vs last month', { n: Math.round(Math.abs(pct)) });

  return (
    <Screen title={t('TRENDS')} onBack={actions.goBack}>
      <View style={{ flexDirection: 'row', gap: SPACE.sm }}>
        {WINDOWS.map((w) => (
          <Chip key={w} label={t('{n} months', { n: w })} active={w === months} onPress={() => setMonths(w)} />
        ))}
      </View>

      <HardShadow>
        <View style={{ backgroundColor: c.surface, borderWidth: BORDER.card, borderColor: c.border, padding: SPACE.md, gap: SPACE.sm }}>
          <Label>{t('THIS MONTH')}</Label>
          <Money amountMinor={summary.thisMonthMinor} currency={cur} role="sectionAmount" style={{ textAlign: 'left' }} />
          <Text style={[ty('rowMeta'), { color: c.textMuted }]}>{pctLabel}</Text>

          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'flex-end', height: 66, marginTop: SPACE.sm }}>
            {bars.map((b) => (
              <View key={b.month} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: '100%',
                    height: Math.max(4, (b.totalMinor / peak) * 48),
                    backgroundColor: c.primary,
                    borderWidth: BORDER.small,
                    borderColor: c.border,
                  }}
                />
                <Text style={[ty('label'), { color: c.textMuted, fontSize: 9.5 }]}>{b.month.slice(5)}</Text>
              </View>
            ))}
          </View>
        </View>
      </HardShadow>

      {drift.length > 0 && (
        <>
          <Label>{t('BIGGEST CHANGES')}</Label>
          <View style={{ gap: SPACE.md }}>
            {drift.map((d) => {
              const def = category(d.category);
              const up = d.deltaMinor > 0;
              return (
                <View key={d.category} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE.sm }}>
                  <Text style={[ty('rowTitle'), { color: c.text, flex: 1 }]}>
                    {def.glyph} {t(def.label)}
                  </Text>
                  <Text style={[ty('rowMeta'), { color: up ? c.negative : c.positive }]}>
                    {up ? '↑' : '↓'} {fmt(Math.abs(d.deltaMinor), cur)}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}
