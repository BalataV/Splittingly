// Obrazovky 12 a 13 — Nový výdaj a výběr způsobu dělení.
//
// ŽÁDNÁ REKLAMA, NIKDY. Tohle je obrazovka, kde uživatel zadává peníze;
// jakákoli komerční plocha tady poškozuje důvěru v číslo.
//
// Dělení:
//   • Equal — přepočítá se při každém přepnutí účastníka,
//   • Shares — steppery, částky se přepočítávají živě,
//   • Exact — dokud zbytek není nula, hlavní tlačítko je vypnuté a zbytek
//     svítí červeně. Rozdíl jedné nejmenší jednotky připadne plátci.

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Button, Field, Label, Segmented, Check, Chip, Avatar, Stepper, HardShadow } from '../components/ui';
import { Money, MoneySlot } from '../components/Money';
import { MascotStrip } from '../components/Mascot';
import { useApp } from '../store';
import { t, plural } from '../i18n';
import { quipFor } from '../quips';
import { parseAmount, splitEqual, splitShares, remainderOf, fmt } from '../money';
import { currency, decimalsOf } from '../currencies';
import { CATEGORIES } from '../categories';
import { initial, ME } from '../logic';
import { canAddReceipt, FREE_RECEIPTS_PER_EXPENSE } from '../entitlements';
import { SPACE, BORDER } from '../theme';
import type { SplitType } from '../types';

export default function AddExpense() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const d = state.draft;
  const g = state.groups.find((x) => x.id === d.groupId);
  if (!g) return <Screen title={t('NEW EXPENSE')} onBack={actions.goBack}><Text style={{ color: c.text }} /></Screen>;

  const cur = currency(d.currency);
  const amountMinor = parseAmount(d.amountText, d.currency);
  const parts = d.parts;
  const payerIndex = parts.indexOf(d.payer);

  // Rozdělené částky na osobu — jediný zdroj pravdy pro celou obrazovku.
  const perPerson: number[] = (() => {
    if (d.splitType === 'exact') return parts.map((p) => parseAmount(d.exactText[p] || '', d.currency));
    if (d.splitType === 'shares') return splitShares(amountMinor, parts.map((p) => d.shares[p] ?? 1), payerIndex);
    return splitEqual(amountMinor, parts.length, payerIndex);
  })();

  const remainder = d.splitType === 'exact' ? remainderOf(amountMinor, perPerson) : 0;
  const canSave = amountMinor > 0 && parts.length > 0 && remainder === 0;

  return (
    <Screen
      title={d.id ? t('EDIT EXPENSE') : t('NEW EXPENSE')}
      onBack={actions.goBack}
      backLabel={t('Cancel')}
      footer={
        <Button
          label={amountMinor > 0 ? t('Add {amount}', { amount: fmt(amountMinor, d.currency) }) : t('Add expense')}
          onPress={actions.saveExpense}
          disabled={!canSave || state.busy}
        />
      }
    >
      {/* karta s částkou — největší prvek obrazovky */}
      <HardShadow offset={5}>
        <View style={{ backgroundColor: c.surface, borderWidth: BORDER.card, borderColor: c.border, paddingVertical: 12, paddingHorizontal: 16 }}>
          <Label>{t('AMOUNT')}</Label>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: SPACE.sm }}>
            <Field
              value={d.amountText}
              onChangeText={(v) => actions.setDraft({ amountText: v })}
              keyboardType="decimal-pad"
              placeholder={decimalsOf(d.currency) === 0 ? '0' : '0' + cur.dec + '00'}
              style={{ flex: 1 }}
            />
            <Pressable onPress={() => actions.navigate('currency')} hitSlop={10} style={{ paddingBottom: 14 }}>
              <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 22, color: c.primary }}>{cur.code}</Text>
            </Pressable>
          </View>
        </View>
      </HardShadow>

      <Field
        value={d.desc}
        onChangeText={(v) => actions.setDraft({ desc: v })}
        placeholder={t('What was it?')}
        trailing={
          <Pressable onPress={() => actions.navigate('receipt')} hitSlop={10} accessibilityLabel={t('Attach receipt')}>
            <Text style={{ fontSize: 18 }}>📷</Text>
          </Pressable>
        }
      />

      {/* Kdo platil a kategorie jako vodorovné lišty.
          Původně to byly dvě poloviční karty, které při ťuknutí cyklovaly na
          další položku — u osmi kategorií to znamenalo až sedm ťuknutí a
          uživatel navíc nevidí, z čeho vybírá. Lišta ukáže všechno naráz
          a vybere se jedním dotykem. */}
      <View style={{ gap: 6 }}>
        <Label>{t('PAID BY')}</Label>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: SPACE.sm, paddingRight: SPACE.screen }}
        >
          {g.members.map((m) => (
            <Chip
              key={m}
              label={m === ME ? t('You') : m}
              active={d.payer === m}
              onPress={() => actions.setPayer(m)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: 6 }}>
        <Label>{t('CATEGORY')}</Label>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: SPACE.sm, paddingRight: SPACE.screen }}
        >
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.key}
              label={cat.glyph + '  ' + t(cat.label)}
              active={d.category === cat.key}
              onPress={() => actions.setDraft({ category: cat.key })}
            />
          ))}
        </ScrollView>
      </View>

      {/* 13 — způsob dělení */}
      <Segmented<SplitType>
        value={d.splitType}
        onChange={actions.setSplitType}
        options={[
          { key: 'equal', label: t('Equal') },
          { key: 'shares', label: t('Shares') },
          { key: 'exact', label: t('Exact') },
        ]}
      />

      <View style={{ borderWidth: BORDER.card, borderColor: c.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 11, borderBottomWidth: BORDER.inner, borderBottomColor: c.dividerInner }}>
          <Text style={[ty('label'), { color: c.textMuted }]}>
            {plural(parts.length, 'SPLIT BETWEEN {n} PERSON', 'SPLIT BETWEEN {n} PEOPLE')}
          </Text>
          {d.splitType === 'shares' && (
            <Text style={[ty('label'), { color: c.textMuted }]}>
              {plural(parts.reduce((a, p) => a + (d.shares[p] ?? 1), 0), '{n} SHARE', '{n} SHARES')}
            </Text>
          )}
        </View>

        {g.members.map((m) => {
          const included = parts.includes(m);
          const idx = parts.indexOf(m);
          return (
            <View
              key={m}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: SPACE.md,
                paddingVertical: 10, paddingHorizontal: 11,
                borderTopWidth: BORDER.inner, borderTopColor: c.dividerInner,
              }}
            >
              <Avatar initial={initial(m)} color={m === ME ? state.avatarColor : '#101010'} size={28} />
              <Text style={[ty('rowTitle'), { color: included ? c.text : c.textDisabled, flex: 1 }]}>
                {m === ME ? t('You') : m}
              </Text>

              {included && d.splitType === 'shares' && (
                <Stepper value={d.shares[m] ?? 1} onChange={(v) => actions.setShare(m, v - (d.shares[m] ?? 1))} />
              )}

              {included && d.splitType === 'exact' ? (
                <View style={{ minWidth: 88 }}>
                  <Field
                    value={d.exactText[m] || ''}
                    onChangeText={(v) => actions.setExact(m, v)}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                </View>
              ) : (
                <MoneySlot minWidth={80}>
                  {included && <Money amountMinor={perPerson[idx] || 0} currency={d.currency} color={c.textMuted} />}
                </MoneySlot>
              )}

              <Check checked={included} onPress={() => actions.togglePart(m)} />
            </View>
          );
        })}
      </View>

      {/* potvrzovací / varovný pruh */}
      {d.splitType === 'exact' && (
        <View style={{ backgroundColor: remainder === 0 ? c.positive : c.negative, padding: 11 }}>
          <Text style={[ty('rowTitle'), { color: remainder === 0 ? c.onPositive : '#FFFFFF' }]}>
            {remainder === 0
              ? t('Assigned — {total} of {total} ✓', { total: fmt(amountMinor, d.currency) })
              : t('Left to assign — {rest}', { rest: fmt(remainder, d.currency) })}
          </Text>
        </View>
      )}

      {d.splitType === 'exact' && remainder !== 0 && state.mascotsOn && (
        <MascotStrip who="analyst" text={quipFor('split_error', 'analyst', true) || ''} />
      )}

      {/* účtenky */}
      {d.receipts.length > 0 && (
        <View style={{ flexDirection: 'row', gap: SPACE.sm, flexWrap: 'wrap' }}>
          {d.receipts.map((url) => (
            <Pressable key={url} onLongPress={() => actions.removeReceipt(url)} accessibilityLabel={t('Receipt')}>
              <View style={{ width: 56, height: 56, backgroundColor: c.surfaceSunken, borderWidth: BORDER.small, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18 }}>🧾</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Účtenka se ve free verzi NEVYPÍNÁ, jen se omezuje počet — je to
          důkaz, ne bonus. Limit se říká dopředu, ne až po zmáčknutí. */}
      <Pressable onPress={() => actions.navigate(canAddReceipt(state.isPro, d.receipts.length) ? 'receipt' : 'remove_ads')}>
        <View style={{ borderWidth: BORDER.card, borderColor: c.border, borderStyle: 'dashed', padding: 14, alignItems: 'center', gap: 4 }}>
          <Text style={[ty('rowTitle'), { color: c.text }]}>📷 {t('Attach receipt')}</Text>
          {!state.isPro && (
            <Text style={[ty('rowMeta'), { color: c.textMuted, textAlign: 'center' }]}>
              {d.receipts.length >= FREE_RECEIPTS_PER_EXPENSE
                ? t('Pro removes the limit')
                : t('{n} of {max} used', { n: d.receipts.length, max: FREE_RECEIPTS_PER_EXPENSE })}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Orientační přepočet do MOJÍ měny. Do výpočtu dluhu nikdy nevstupuje. */}
      {d.currency !== state.currency && amountMinor > 0 && (
        <Text style={[ty('caption'), { color: c.textMuted }]}>
          {t('This group counts in {cur}. Your display currency is {mine}.', { cur: d.currency, mine: state.currency })}
        </Text>
      )}
    </Screen>
  );
}
