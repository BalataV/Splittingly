// Obrazovka 18 — Roční / celkový přehled se žebříčkem. Plná primární plocha.
// Jedna z pěti obrazovek, kde vystupují oba maskoti.
import React from 'react';
import { View, Text } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Button, Label } from '../components/ui';
import { Money, MoneySlot } from '../components/Money';
import { DualMascotStrip } from '../components/Mascot';
import { useApp } from '../store';
import { t } from '../i18n';
import { quipFor } from '../quips';
import { dominantCurrency, total, bySpender, SUPERLATIVES } from '../stats';
import { initial, ME } from '../logic';
import { SPACE, BORDER } from '../theme';

export default function YearInReview() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const g = state.groups.find((x) => x.id === state.selectedGroup) || state.groups[0];
  if (!g) return <Screen title={t('YEAR IN REVIEW')} onBack={actions.goBack}><Text style={{ color: c.text }} /></Screen>;

  const expenses = state.expenses[g.id] || [];
  const cur = dominantCurrency(expenses, g.currency);
  const sum = total(expenses, cur);
  const spenders = bySpender(g, expenses, cur);
  const year = new Date().getFullYear();

  return (
    <Screen
      fill={c.primary}
      onBack={actions.goBack}
      footer={<Button label={t('Share the year card')} kind="accent" onPress={() => actions.navigate('share_card')} />}
    >
      <Label color={c.onPrimary}>{g.name.toUpperCase()} · {year}</Label>
      <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 38, lineHeight: 36, color: c.onPrimary }}>
        {t('THE YEAR\nIN NUMBERS')}
      </Text>

      <View style={{ backgroundColor: c.accent, borderWidth: BORDER.card, borderColor: c.border, padding: 16, gap: SPACE.sm, marginTop: SPACE.lg }}>
        <Label color={c.onAccent}>{t('TOGETHER YOU SPENT')}</Label>
        <Money amountMinor={sum} currency={cur} role="heroAmount" color={c.onAccent} style={{ textAlign: 'left' }} />
        <Text style={[ty('caption'), { color: c.onAccent }]}>
          {t('Across {n} expenses.', { n: expenses.length })}
        </Text>
      </View>

      <Label color={c.onPrimary}>{t('LEADERBOARD')}</Label>
      <View style={{ backgroundColor: c.surface, borderWidth: BORDER.card, borderColor: c.border }}>
        {spenders.slice(0, 4).map((s, i) => (
          <View
            key={s.name}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: SPACE.md, padding: 12,
              backgroundColor: i === 0 ? c.accent : 'transparent',
              borderTopWidth: i === 0 ? 0 : BORDER.inner, borderTopColor: c.dividerInner,
            }}
          >
            <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 17, color: i === 0 ? c.onAccent : c.text, width: 22 }}>
              {i + 1}
            </Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[ty('rowTitle'), { color: i === 0 ? c.onAccent : c.text }]}>
                {s.name === ME ? t('You') : s.name}
              </Text>
              <Text style={[ty('rowMeta'), { color: i === 0 ? c.onAccent : c.textMuted, fontSize: 10.5 }]}>
                {t(SUPERLATIVES[i] || SUPERLATIVES[0])}
              </Text>
            </View>
            <MoneySlot>
              <Money amountMinor={s.amountMinor} currency={cur} color={i === 0 ? c.onAccent : c.text} />
            </MoneySlot>
          </View>
        ))}
      </View>

      {state.mascotsOn && (
        <DualMascotStrip
          closer={quipFor('year', 'closer', true) || ''}
          analyst={quipFor('year', 'analyst', true) || ''}
        />
      )}
    </Screen>
  );
}
