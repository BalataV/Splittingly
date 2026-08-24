// Obrazovky 16 a 16b — Vyrovnání dluhu a oslava vyrovnané skupiny.
//
// ŽÁDNÁ REKLAMA. Ani na potvrzení platby, ani na oslavě. Zvlášť ne na oslavě:
// je to jediný moment, kdy má uživatel z appky radost, a ten se nezpeněžuje.
//
// Appka peníze NEPŘEVÁDÍ. Zaznamenává, že k platbě došlo. Musí to být na
// obrazovce napsané, ne schované v nápovědě.

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Card, Button, Field, Avatar, HardShadow, Label } from '../components/ui';
import { Money, ApproxMoney } from '../components/Money';
import Mascot from '../components/Mascot';
import { useApp } from '../store';
import { t } from '../i18n';
import { quipFor, mascotVisible } from '../quips';
import { initial, ME } from '../logic';
import { fmt } from '../money';
import { SPACE, BORDER } from '../theme';
import type { PayMethod } from '../types';

const METHODS: { key: PayMethod; label: string }[] = [
  { key: 'cash', label: 'Cash / already settled' },
  { key: 'transfer', label: 'Bank transfer' },
  { key: 'other', label: 'Other' },
];

export default function SettleUp() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const tr = state.selectedTransfer;

  if (state.celebrate) return <Settled />;
  if (!tr) return <Screen title={t('SETTLE UP')} onBack={actions.goBack}><Text style={{ color: c.text }} /></Screen>;

  return (
    <Screen
      title={t('RECORD A\nPAYMENT')}
      onBack={actions.goBack}
      backLabel={t('Cancel')}
      footer={
        <Button
          label={t('Confirm {amount} received', { amount: fmt(tr.amountMinor, tr.currency) })}
          kind="positive"
          onPress={actions.confirmSettle}
          disabled={state.busy}
        />
      }
    >
      <HardShadow offset={5}>
        <View style={{ backgroundColor: c.surface, borderWidth: BORDER.card, borderColor: c.border, padding: 16, gap: SPACE.md, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE.md }}>
            <Avatar initial={initial(tr.from)} color="#101010" size={44} />
            <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 22, color: c.text }}>→</Text>
            <Avatar initial={initial(tr.to)} color={tr.to === ME ? state.avatarColor : '#101010'} size={44} />
          </View>
          <Text style={[ty('caption'), { color: c.textMuted }]}>
            {t('{from} pays {to}', { from: tr.from === ME ? t('You') : tr.from, to: tr.to === ME ? t('you') : tr.to })}
          </Text>
          <Money amountMinor={tr.amountMinor} currency={tr.currency} role="heroAmount" style={{ fontSize: 44 }} />
          <ApproxMoney amountMinor={tr.amountMinor} currency={tr.currency} />
          <Text style={[ty('caption'), { color: c.textMuted, textAlign: 'center' }]}>
            {t('Clears the full balance between you two.')}
          </Text>
        </View>
      </HardShadow>

      <Label>{t('HOW')}</Label>
      <View style={{ gap: 6 }}>
        {METHODS.map((m) => {
          const active = state.settleMethod === m.key;
          return (
            <Pressable key={m.key} onPress={() => actions.patch({ settleMethod: m.key })} accessibilityRole="radio" accessibilityState={{ selected: active }}>
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: SPACE.md,
                  backgroundColor: active ? c.accent : c.surface,
                  borderWidth: BORDER.small, borderColor: c.border,
                  padding: 13, minHeight: 52,
                }}
              >
                <Text style={{ color: active ? c.onAccent : c.textMuted, fontSize: 16 }}>{active ? '●' : '○'}</Text>
                <Text style={[ty('rowTitle'), { color: active ? c.onAccent : c.text, flex: 1 }]}>{t(m.label)}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Field
        label={t('NOTE (OPTIONAL)')}
        value={state.settleNote}
        onChangeText={(v) => actions.patch({ settleNote: v })}
        placeholder={t('Paid at the restaurant')}
      />

      <Card fill={c.surfaceSunken}>
        <Text style={[ty('caption'), { color: c.text }]}>
          {t('Splittingly records the payment; it does not move money. Both of you get a notification and the group balance updates immediately.')}
        </Text>
      </Card>
    </Screen>
  );
}

// ------------------------------------------------ 16b · vyrovnáno (vrchol)

function Settled() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const g = state.groups.find((x) => x.id === state.selectedGroup);

  return (
    <Screen
      fill={c.isDark ? c.bg : c.positive}
      footer={
        <View style={{ gap: 9 }}>
          <Button label={t('Share the receipt card')} kind="accent" onPress={() => { actions.patch({ celebrate: false }); actions.navigate('share_card'); }} />
          <Button label={t('Back to group')} kind="plain" onPress={() => { actions.patch({ celebrate: false }); actions.navigate('group'); }} />
        </View>
      }
    >
      <View style={{ backgroundColor: c.isDark ? c.surfaceSunken : c.surface, borderWidth: BORDER.card, borderColor: c.isDark ? c.accent : c.border, padding: 18, gap: SPACE.md, marginTop: SPACE.xl }}>
        <Label color={c.isDark ? c.accent : c.textMuted}>{t('SETTLED')}</Label>
        <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 36, lineHeight: 38, color: c.text }}>
          {t('EVERYONE\nIS EVEN.')}
        </Text>
        <Text style={[ty('bodySecondary'), { color: c.textMuted }]}>
          {g ? t('{group} is at zero.', { group: g.name }) : t('The group is at zero.')}
        </Text>
      </View>

      {/* Oba maskoti, celá postava, střídavě po stranách. Vypnutá postava
          zmizí sama za sebe, druhá zůstane na své straně. */}
      <View style={{ gap: SPACE.md, marginTop: SPACE.lg }}>
        {mascotVisible(state.notif, 'closer') && (
          <View style={{ flexDirection: 'row-reverse', gap: SPACE.md, alignItems: 'center' }}>
            <Mascot who="closer" size={72} variant="full" />
            <View style={{ flex: 1, backgroundColor: c.accent, borderWidth: BORDER.card, borderColor: c.border, padding: 11 }}>
              <Text style={[ty('caption'), { color: c.onAccent }]}>{quipFor('settled', 'closer', true)}</Text>
            </View>
          </View>
        )}
        {mascotVisible(state.notif, 'analyst') && (
          <View style={{ flexDirection: 'row', gap: SPACE.md, alignItems: 'center' }}>
            <Mascot who="analyst" size={72} variant="full" />
            <View style={{ flex: 1, backgroundColor: c.surface, borderWidth: BORDER.card, borderColor: c.border, padding: 11 }}>
              <Text style={[ty('caption'), { color: c.text }]}>{quipFor('settled', 'analyst', true)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Světlá varianta má patičku „BALANCE / 0.00" na plné zelené. */}
      {!c.isDark && (
        <View style={{ marginTop: SPACE.xl, borderTopWidth: BORDER.card, borderTopColor: c.border, paddingTop: SPACE.md }}>
          <Text style={[ty('label'), { color: '#FFFFFF' }]}>{t('BALANCE')}</Text>
          <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 40, color: '#FFFFFF' }}>0.00</Text>
        </View>
      )}
    </Screen>
  );
}
