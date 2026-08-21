// Koláčový graf rozpadu podle kategorie. Pro verze.
//
// Kreslí se jako prstenec z plných barevných oblouků (`strokeDasharray`
// na otočeném kruhu) — žádné zaoblené konce, žádný přechod barev, aby to
// drželo stejnou tvrdou řeč jako zbytek appky. Řádky pod grafem (`BY
// CATEGORY` v `Stats.tsx`) fungují jako legenda; tenhle graf jen dává
// stejným datům tvar, který se čte na první pohled.

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useUi } from './ui';
import { Money } from './Money';
import { category } from '../categories';
import { t } from '../i18n';
import { SPACE } from '../theme';
import type { CategoryTotal } from '../stats';

const SIZE = 168;
const STROKE = 30;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3; // px mezera mezi oblouky

export function PieChart({ cats, totalMinor, currency }: {
  cats: CategoryTotal[]; totalMinor: number; currency: string;
}) {
  const { c } = useUi();
  let cumulative = 0;

  return (
    <View style={{ alignItems: 'center', gap: SPACE.md }}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* podkladový kruh — drží tvar i tam, kde skupina má jen jednu kategorii */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={c.surfaceSunken}
            strokeWidth={STROKE}
            fill="none"
          />
          {/* -90° = oblouky začínají na 12. hodině, ne vpravo */}
          <G rotation={-90} origin={`${SIZE / 2}, ${SIZE / 2}`}>
            {cats.map((cat) => {
              const def = category(cat.key);
              const arcLen = (cat.pct / 100) * CIRCUMFERENCE;
              const dash = Math.max(arcLen - GAP, 0);
              const offset = CIRCUMFERENCE - cumulative;
              cumulative += arcLen;
              return (
                <Circle
                  key={cat.key}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke={def.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                  fill="none"
                />
              );
            })}
          </G>
        </Svg>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Money amountMinor={totalMinor} currency={currency} role="rowTitle" />
        </View>
      </View>
    </View>
  );
}

/**
 * Zamčený stav pro bezplatnou appku: stejný tvar, jen jedna šedá barva —
 * appka ukazuje, CO si kupuješ, ne prázdnou zeď. Ťuknutí vede na nabídku Pro,
 * stejně jako zamčená období ve statistikách.
 */
export function LockedPieChart({ onUpgrade }: { onUpgrade: () => void }) {
  const { c, ty } = useUi();
  return (
    <Pressable onPress={onUpgrade} accessibilityRole="button" style={{ alignItems: 'center', gap: SPACE.md }}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={c.surfaceSunken} strokeWidth={STROKE} fill="none" />
        </Svg>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: c.text, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={[ty('label'), { color: c.accent, fontSize: 11 }]}>PRO</Text>
          </View>
        </View>
      </View>
      <Text style={[ty('caption'), { color: c.textMuted, textAlign: 'center' }]}>
        {t('Unlock the pie chart breakdown with Pro')}
      </Text>
    </Pressable>
  );
}
