// Obrazovka 20 — Vyhledávání ve výdajích. Bez reklamy (je to nástroj, ne feed).
import React from 'react';
import { View, Text } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Field, Chip, Card, Row, Label } from '../components/ui';
import { Money, MoneySlot } from '../components/Money';
import { MascotStrip } from '../components/Mascot';
import { useApp } from '../store';
import { fmtMoneyMap } from '../money';
import { t, fmtDate } from '../i18n';
import { quipFor } from '../quips';
import { category } from '../categories';
import { ME } from '../logic';
import { SPACE, BORDER } from '../theme';

export default function Search() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const q = state.searchQuery.trim().toLowerCase();

  const all = state.groups.flatMap((g) =>
    (state.expenses[g.id] || []).map((e) => ({ e, groupName: g.name })));

  const results = q
    ? all.filter(({ e }) =>
        e.desc.toLowerCase().includes(q) ||
        t(category(e.category).label).toLowerCase().includes(q) ||
        e.payer.toLowerCase().includes(q))
    : [];

  // Součet po měnách — nikdy jeden přepočtený součet napříč měnami.
  // Formát řeší `fmtMoneyMap` z money.ts: měny bez haléřů (JPY), symboly
  // i oddělovače. Ruční `/ 100` by u JPY ukázalo desetinu a zahodilo symbol.
  const totals: Record<string, number> = {};
  results.forEach(({ e }) => { totals[e.currency] = (totals[e.currency] || 0) + e.amountMinor; });

  return (
    <Screen title={t('SEARCH')} onBack={actions.goBack} backLabel={t('Cancel')}>
      <Field
        value={state.searchQuery}
        onChangeText={(v) => actions.patch({ searchQuery: v })}
        placeholder={t('taxi, groceries, over 100…')}
        autoCapitalize="none"
      />

      <View style={{ flexDirection: 'row', gap: SPACE.sm, flexWrap: 'wrap' }}>
        <Chip label={t('All groups')} active />
        <Chip label={'🍽 ' + t('Food')} onPress={() => actions.patch({ searchQuery: 'food' })} />
        <Chip label={t('This month')} />
        <Chip label={t('Paid by me')} onPress={() => actions.patch({ searchQuery: t('You') })} />
      </View>

      {!!q && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: SPACE.sm }}>
          <Text style={[ty('label'), { color: c.textMuted }]}>
            {t('{n} RESULTS', { n: results.length })}
          </Text>
          <Text style={[ty('label'), { color: c.textMuted }]}>
            {Object.keys(totals).length > 0 ? fmtMoneyMap(totals) : ''}
          </Text>
        </View>
      )}

      <View style={{ gap: 7 }}>
        {results.map(({ e, groupName }) => (
          <Row key={e.id} onPress={() => { actions.patch({ selectedGroup: e.groupId }); actions.openExpense(e.id); }}>
            <View style={{ width: 28, height: 28, backgroundColor: c.accent, borderWidth: BORDER.small, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 13 }}>{category(e.category).glyph}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              {/* Shodu zvýrazňujeme akcentní plochou s inkoustovým textem. */}
              <Highlight text={e.desc} query={q} />
              <Text style={[ty('rowMeta'), { color: c.textMuted }]}>
                {groupName} · {e.payer === ME ? t('You') : e.payer} · {fmtDate(e.spentAt)}
              </Text>
            </View>
            <MoneySlot><Money amountMinor={e.amountMinor} currency={e.currency} /></MoneySlot>
          </Row>
        ))}
      </View>

      {!q && state.recentSearches.length > 0 && (
        <Card>
          <Label>{t('RECENT SEARCHES')}</Label>
          <View style={{ flexDirection: 'row', gap: SPACE.sm, flexWrap: 'wrap', marginTop: SPACE.sm }}>
            {state.recentSearches.map((r) => (
              <Chip key={r} label={r} onPress={() => actions.patch({ searchQuery: r })} />
            ))}
          </View>
        </Card>
      )}

      {!!q && results.length > 0 && (
        <MascotStrip who="analyst" text={quipFor('search', 'analyst', true) || ''} />
      )}
    </Screen>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const { c, ty } = useUi();
  const i = query ? text.toLowerCase().indexOf(query) : -1;
  if (i < 0) return <Text style={[ty('rowTitle'), { color: c.text }]}>{text}</Text>;
  return (
    <Text style={[ty('rowTitle'), { color: c.text }]}>
      {text.slice(0, i)}
      <Text style={{ backgroundColor: c.accent, color: c.onAccent }}>{text.slice(i, i + query.length)}</Text>
      {text.slice(i + query.length)}
    </Text>
  );
}
