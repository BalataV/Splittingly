// Obrazovka 08 — Přehled. Souhrn „dostaneš / dlužíš" a seznam skupin.
// Zároveň nese prázdný stav (30), načítání (31), offline pruh (32).
//
// Reklama: ukotvený banner 320×50 nad tab barem. Obsah pod něj nikdy nezajede
// (banner je mimo ScrollView, viz Root.tsx).

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Card, Button, Row, Skeleton, Avatar, HardShadow } from '../components/ui';
import { Money, MoneySlot, balanceColor } from '../components/Money';
import Mascot, { MascotStrip } from '../components/Mascot';
import { useApp } from '../store';
import { t, plural } from '../i18n';
import { quipFor, mascotVisible } from '../quips';
import { totalOwe, totalOwed, hasAny, myNet, transfersFor, initial } from '../logic';
import { fmtMoneyMap } from '../money';
import { SPACE, BORDER } from '../theme';

export default function Overview() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const { groups, expenses, payments } = state;

  const owed = totalOwed(groups, expenses, payments);
  const owe = totalOwe(groups, expenses, payments);

  if (state.loading && !groups.length) return <OverviewSkeleton />;
  if (!groups.length) return <EmptyState />;

  return (
    <Screen
      title={t('OVERVIEW')}
      right={
        <Pressable onPress={() => actions.navigate('profile')} hitSlop={10} accessibilityLabel={t('Profile')}>
          <Avatar initial={initial(state.myName)} color={state.avatarColor} size={36} />
        </Pressable>
      }
    >
      {!state.sync.online && <OfflineStrip />}

      {/* karta „máš dostat" — plná zelená, největší číslo na obrazovce */}
      <HardShadow offset={5}>
        <View style={{ backgroundColor: c.positive, borderWidth: BORDER.card, borderColor: c.border, padding: 14 }}>
          <Text style={[ty('label'), { color: c.isDark ? '#0E3D22' : '#DFFFE9' }]}>{t('YOU ARE OWED')}</Text>
          <Text style={[ty('heroAmount'), { color: c.isDark ? '#101010' : '#FFFFFF', marginTop: 4 }]}>
            {fmtMoneyMap(owed)}
          </Text>
        </View>
      </HardShadow>

      {hasAny(owe) && (
        <Row>
          <Text style={[ty('rowTitle'), { color: c.text, flex: 1 }]}>{t('You owe')}</Text>
          <MoneySlot>
            <Text style={[ty('sectionAmount'), { color: c.negative, fontSize: 22 }]}>{fmtMoneyMap(owe)}</Text>
          </MoneySlot>
        </Row>
      )}

      <MascotStrip who="closer" text={quipFor('overview', 'closer', true) || ''} />

      <Text style={[ty('label'), { color: c.textMuted, marginTop: SPACE.sm }]}>{t('YOUR GROUPS')}</Text>

      <View style={{ gap: 7 }}>
        {groups.map((g) => {
          const net = myNet(g, expenses[g.id], payments[g.id]);
          const settled = transfersFor(g, expenses[g.id], payments[g.id]).length === 0;
          const count = (expenses[g.id] || []).length;
          const first = Object.keys(net)[0];
          const amount = first ? net[first] : 0;
          return (
            <Row key={g.id} border={BORDER.card} onPress={() => actions.openGroup(g.id)}>
              <View style={{ width: 32, height: 32, backgroundColor: g.coverColor, borderWidth: BORDER.small, borderColor: c.border }} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[ty('rowTitle'), { color: c.text }]}>{g.name}</Text>
                <Text style={[ty('rowMeta'), { color: c.textMuted }]}>
                  {/* Množné číslo přes plural() — slovanské jazyky mají tři tvary,
                      takže „1 expenses" nesmí vzniknout ani omylem. */}
                  {plural(g.members.length, '{n} member', '{n} members')}
                  {' · '}
                  {plural(count, '{n} expense', '{n} expenses')}
                </Text>
              </View>
              <MoneySlot>
                {settled ? (
                  <Text style={[ty('rowAmount'), { color: c.textMuted }]}>{t('Settled')}</Text>
                ) : (
                  <Money amountMinor={amount} currency={first || g.currency} color={balanceColor(amount, c)} signed />
                )}
              </MoneySlot>
            </Row>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: SPACE.sm, marginTop: SPACE.md }}>
        <Button label={t('Create a group')} kind="accent" onPress={() => actions.navigate('create_group')} style={{ flex: 1 }} />
        <Button label={t('Join')} kind="plain" onPress={() => actions.navigate('join_group')} style={{ flex: 1 }} />
      </View>
    </Screen>
  );
}

// ------------------------------------------------------------ 30 prázdný stav

export function EmptyState() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  return (
    <Screen title={t('OVERVIEW')}>
      <View style={{ borderWidth: BORDER.card, borderColor: c.border, borderStyle: 'dashed', backgroundColor: c.surface, padding: SPACE.xl, alignItems: 'center', gap: SPACE.md }}>
        <Text style={[ty('screenTitle'), { color: c.text, textAlign: 'center', fontSize: 24, lineHeight: 25 }]}>
          {t('NOTHING\nTO SPLIT\nYET.')}
        </Text>
        <Text style={[ty('bodySecondary'), { color: c.textMuted, textAlign: 'center' }]}>
          {t('Start a group for the flat, the trip or the next dinner. You can invite people later.')}
        </Text>
      </View>

      {/* Prázdný stav je jedno z pěti míst, kde vystupují OBA. Každý ale
          mizí sám za sebe — vypnutá postava nesmí po sobě nechat mezeru. */}
      <View style={{ gap: SPACE.md }}>
        {mascotVisible(state.notif, 'closer') && (
          <View style={{ flexDirection: 'row', gap: SPACE.md, alignItems: 'center' }}>
            <Mascot who="closer" size={66} variant="full" />
            <View style={{ flex: 1, backgroundColor: c.accent, borderWidth: BORDER.card, borderColor: c.border, padding: 10 }}>
              <Text style={[ty('caption'), { color: c.onAccent }]}>{quipFor('empty', 'closer', true)}</Text>
            </View>
          </View>
        )}
        {mascotVisible(state.notif, 'analyst') && (
          <View style={{ flexDirection: 'row-reverse', gap: SPACE.md, alignItems: 'center' }}>
            <Mascot who="analyst" size={66} variant="full" />
            <View style={{ flex: 1, backgroundColor: c.surface, borderWidth: BORDER.card, borderColor: c.border, padding: 10 }}>
              <Text style={[ty('caption'), { color: c.text }]}>{quipFor('empty', 'analyst', true)}</Text>
            </View>
          </View>
        )}
      </View>

      <Button label={t('Create a group')} kind="accent" onPress={() => actions.navigate('create_group')} offset={5} />
      <Button label={t('Join with a code')} kind="plain" onPress={() => actions.navigate('join_group')} />

      <Text style={[ty('caption'), { color: c.textMuted, textAlign: 'center' }]}>
        {t('No ads until you have something to look at.')}
      </Text>
    </Screen>
  );
}

// ---------------------------------------------------------------- 31 načítání

export function OverviewSkeleton() {
  const { c, ty } = useUi();
  return (
    <Screen title={t('OVERVIEW')}>
      {/* Kostry mají PŘESNĚ rozměry reálných bloků, takže při dopadu dat nic neposkočí.
          Žádný spinner, žádný maskot — nikdo není vtipný, když se čeká. */}
      <Skeleton height={96} />
      <Skeleton height={56} />
      <View style={{ gap: 7 }}>
        <Skeleton height={62} />
        <Skeleton height={62} />
        <Skeleton height={62} />
      </View>
      <Text style={[ty('caption'), { color: c.textDisabled, textAlign: 'center', marginTop: SPACE.lg }]}>
        {t('Loading your groups…')}
      </Text>
    </Screen>
  );
}

// ------------------------------------------------------------------ 32 offline

export function OfflineStrip() {
  const { c, ty } = useUi();
  const { state } = useApp();
  return (
    <View style={{ backgroundColor: c.negative, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', gap: SPACE.sm }}>
      <Text style={[ty('label'), { color: '#FFFFFF', flex: 1 }]}>{t('OFFLINE — CHANGES SAVED LOCALLY')}</Text>
      {state.sync.queued > 0 && (
        <Text style={[ty('label'), { color: '#FFFFFF' }]}>{state.sync.queued}</Text>
      )}
    </View>
  );
}
