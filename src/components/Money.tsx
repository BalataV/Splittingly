// Vysázení částky.
//
// Tři věci, které tahle komponenta hlídá za celou appku:
//   1. Archivo Black + tabulární číslice — jinak se v seznamu rozjede zarovnání,
//   2. `flexShrink: 0` — v řádku se smrskává POPISEK, nikdy číslo,
//   3. směrová izolace — číslo si i uvnitř arabské věty drží čtení zleva
//      doprava a zůstává zarovnané na konec řádku.

import React from 'react';
import { Text, View, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { fmt, fmtSigned } from '../money';
import { convert } from '../fx';
import { decimalsOf } from '../currencies';
import { useApp } from '../store';
import { t } from '../i18n';
import { useUi } from './ui';
import { TABULAR } from '../typography';
import type { Role } from '../typography';

interface MoneyProps {
  amountMinor: number;
  currency: string;
  role?: Role;
  color?: string;
  signed?: boolean;
  style?: StyleProp<TextStyle>;
}

export function Money({ amountMinor, currency, role = 'rowAmount', color, signed, style }: MoneyProps) {
  const { c, ty } = useUi();
  const text = signed ? fmtSigned(amountMinor, currency) : fmt(amountMinor, currency);
  return (
    <Text
      style={[
        ty(role),
        TABULAR,
        { color: color || c.text, flexShrink: 0, textAlign: 'right', writingDirection: 'ltr' },
        style,
      ]}
    >
      {text}
    </Text>
  );
}

/**
 * Slot pro částku v seznamu. Rezervuje šířku podle NEJŠIRŠÍ podporované měny
 * (Rp2.500.000), takže skupina za 12 € a skupina za 2,5 milionu rupií mají
 * identickou mřížku a přepnutí měny nikdy nepřeskládá obrazovku.
 */
export function MoneySlot({ children, minWidth = 104, style }: {
  children: React.ReactNode; minWidth?: number; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ minWidth, flexShrink: 0, alignItems: 'flex-end' }, style]}>
      {children}
    </View>
  );
}

/**
 * Orientační přepočet do MOJÍ měny: „≈ €12,34".
 *
 * Vykreslí se jen tehdy, když se měna liší a kurz je opravdu k dispozici —
 * radši nic než vymyšlené číslo. Do výpočtu dluhu tenhle údaj NIKDY
 * nevstupuje: skupina, která platila v bahtech, dluží v bahtech. Kdyby se
 * dluh přepočítával, měnil by se podle dne, kdy se na něj člověk podívá.
 */
export function ApproxMoney({ amountMinor, currency, style }: {
  amountMinor: number; currency: string; style?: StyleProp<TextStyle>;
}) {
  const { c, ty } = useUi();
  const { state } = useApp();
  if (currency === state.currency || !state.fxRates) return null;
  const converted = convert(
    amountMinor, currency, state.currency, state.fxRates,
    decimalsOf(currency), decimalsOf(state.currency),
  );
  if (converted === null) return null;
  return (
    <Text style={[ty('rowMeta'), { color: c.textMuted }, style]}>
      {t('≈ {amount}', { amount: fmt(converted, state.currency) })}
    </Text>
  );
}

/** Kladná zeleně, záporná červeně, nula tlumeně. Barvu určuje ZNAMÉNKO, nic jiného. */
export function balanceColor(amountMinor: number, c: { positive: string; negative: string; textMuted: string }): string {
  if (amountMinor > 0) return c.positive;
  if (amountMinor < 0) return c.negative;
  return c.textMuted;
}
