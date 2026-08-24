// Obrazovka 11 — Detail skupiny. Kdo komu dluží, výdaje, členové.
//
// TADY se komentáře obou maskotů potkávají — je to jedna z pěti obrazovek,
// kde vystupují spolu.
//
// ŽÁDNÁ REKLAMA: sídlí tu akce „Settle up", tedy potvrzení peněz.

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Card, Button, Row, Avatar, HardShadow, Rule } from '../components/ui';
import { Money, MoneySlot } from '../components/Money';
import { DualMascotStrip } from '../components/Mascot';
import { useApp } from '../store';
import { t, plural, fmtDate } from '../i18n';
import { quipFor } from '../quips';
import { transfersFor, initial, ME } from '../logic';
import { shareOf } from '../money';
import { category } from '../categories';
import { SPACE, BORDER } from '../theme';

export default function GroupDetail() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const g = state.groups.find((x) => x.id === state.selectedGroup);
  if (!g) return <Screen title={t('GROUP')} onBack={actions.goBack}><Text style={{ color: c.text }}>{t('Group not found.')}</Text></Screen>;

  const expenses = state.expenses[g.id] || [];
  const payments = state.payments[g.id] || [];
  const transfers = transfersFor(g, expenses, payments);
  const settled = transfers.length === 0;

  return (
    <Screen
      title={g.name}
      onBack={actions.goBack}
      backLabel={t('Overview')}
      right={
        <View style={{ flexDirection: 'row' }}>
          {/* překrývající se avataři, poslední je „+N" */}
          {g.members.slice(0, 3).map((m, i) => (
            <View key={m} style={{ marginLeft: i === 0 ? 0 : -8 }}>
              <Avatar initial={initial(m)} color={m === ME ? state.avatarColor : '#101010'} size={30} />
            </View>
          ))}
          {g.members.length > 3 && (
            <View style={{ marginLeft: -8, width: 30, height: 30, backgroundColor: c.surface, borderWidth: BORDER.small, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[ty('rowMeta'), { color: c.text }]}>+{g.members.length - 3}</Text>
            </View>
          )}
        </View>
      }
      footer={<Button label={t('+ Add expense')} kind="ink" onPress={actions.startAddExpense} />}
    >
      {/* karta vyrovnání */}
      <HardShadow offset={5}>
        <View style={{ backgroundColor: c.surface, borderWidth: BORDER.card, borderColor: c.border, padding: 14, gap: SPACE.md }}>
          <Text style={[ty('label'), { color: c.textMuted }]}>
            {settled
              ? t('EVERYONE IS EVEN')
              : plural(transfers.length, '{n} TRANSFER SETTLES EVERYTHING', '{n} TRANSFERS SETTLE EVERYTHING')}
          </Text>

          {transfers.map((tr) => (
            <Pressable key={tr.id} onPress={() => actions.startSettle(tr)} accessibilityRole="button">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE.sm }}>
                <Text style={[ty('rowTitle'), { color: c.text, flex: 1 }]}>
                  {tr.from === ME ? t('You') : tr.from} → {tr.to === ME ? t('you') : tr.to}
                </Text>
                <MoneySlot>
                  <Money amountMinor={tr.amountMinor} currency={tr.currency} role="rowAmount" style={{ fontSize: 17 }} />
                </MoneySlot>
              </View>
            </Pressable>
          ))}

          {!settled && (
            <Button label={t('Settle up')} kind="accent" offset={0} onPress={() => actions.startSettle(transfers[0])} />
          )}
        </View>
      </HardShadow>

      {/* jediné místo v hlavním toku, kde mluví oba */}
      <DualMascotStrip
        closer={quipFor('group', 'closer', true) || ''}
        analyst={quipFor('group', 'analyst', true) || ''}
      />

      <Text style={[ty('label'), { color: c.textMuted, marginTop: SPACE.sm }]}>{t('EXPENSES')}</Text>

      {!expenses.length ? (
        <View style={{ borderWidth: BORDER.card, borderColor: c.border, borderStyle: 'dashed', padding: SPACE.xl, alignItems: 'center' }}>
          <Text style={[ty('bodySecondary'), { color: c.textMuted, textAlign: 'center' }]}>
            {t('No expenses yet. Add the first one.')}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 7 }}>
          {expenses.map((e) => {
            const mine = shareOf(e.amountMinor, e.parts, e.splitType, e.shares, e.exactMinor, e.payer, ME);
            const lent = e.payer === ME ? e.amountMinor - mine : -mine;
            const cat = category(e.category);
            return (
              <Row key={e.id} onPress={() => actions.openExpense(e.id)}>
                <View style={{ width: 28, height: 28, backgroundColor: c.accent, borderWidth: BORDER.small, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 13 }}>{cat.glyph}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[ty('rowTitle'), { color: c.text }]}>{e.desc}</Text>
                  <Text style={[ty('rowMeta'), { color: c.textMuted }]}>
                    {e.payer === ME ? t('You paid') : t('{who} paid', { who: e.payer })} · {fmtDate(e.spentAt)}
                  </Text>
                </View>
                <MoneySlot>
                  <Money amountMinor={e.amountMinor} currency={e.currency} />
                  <Text style={[ty('rowMeta'), { color: lent >= 0 ? c.positive : c.negative, fontWeight: '700' }]}>
                    {lent >= 0 ? t('lent') : t('owe')}
                  </Text>
                </MoneySlot>
              </Row>
            );
          })}
        </View>
      )}

      <Rule style={{ marginTop: SPACE.lg }} />
      {/* 2×2, ne čtyři v řadě — na 390pt telefonu se čtyři tlačítka vejdou
          jen v angličtině s krátkými slovy. Delší překlad (nebo i jen
          „Search"/„Export" bez místa na zalomení mezi slovy) by se zalomil
          UPROSTŘED slova, což čte jako rozbité UI, ne jako záměr. */}
      <View style={{ gap: SPACE.sm }}>
        <View style={{ flexDirection: 'row', gap: SPACE.sm }}>
          <Button label={t('Invite')} kind="plain" offset={0} onPress={() => actions.shareInvite(g.id)} style={{ flex: 1 }} />
          <Button label={t('Stats')} kind="plain" offset={0} onPress={() => actions.navigate('stats')} style={{ flex: 1 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: SPACE.sm }}>
          <Button label={t('Search')} kind="plain" offset={0} onPress={() => actions.navigate('search')} style={{ flex: 1 }} />
          {/* Bez Pro appka rovnou pošle na nabídku (viz `exportGroup` ve
              store.tsx) — tlačítko proto zůstává vidět i pro free účet,
              nikdy se neschovává. */}
          <Button label={t('Export')} kind="plain" offset={0} onPress={() => actions.exportGroup(g.id)} style={{ flex: 1 }} />
        </View>
      </View>
    </Screen>
  );
}
