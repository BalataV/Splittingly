// Ikony spodní lišty.
//
// Dřív to byly Unicode znaky (▣ ▤ ◔ ◎) vykreslené jako text. Dva problémy:
//
//   • geometrické tvary vyplňují jen část em-boxu, typicky kolem dvou třetin,
//     takže `fontSize: 24` opticky vypadá jako patnáctka — zvětšování písma
//     to dohání jen částečně a rozvahu mezi ikonou a popiskem rozbije,
//   • na Androidu tyhle znaky nemusí být v systémovém písmu a spadnou do
//     fallbacku, který kreslí jiné proporce i jinou tloušťku čáry.
//
// Kreslené tvary mají přesně tu velikost, která se zadá, na obou platformách
// stejnou. Tloušťka čáry jde z `BORDER`, aby ikony seděly ke zbytku rozhraní —
// stejná linka jako u karet a rámů. Poloměr rohů nula, jako všude.

import React from 'react';
import Svg, { Rect, Circle, Path, Line } from 'react-native-svg';
import { BORDER } from '../theme';

export type TabIconName = 'overview' | 'activity' | 'stats' | 'profile';

type Props = {
  name: TabIconName;
  color: string;
  size?: number;
};

/**
 * Kreslí se do mřížky 24×24 a škáluje přes `size`. Čára je uprostřed dráhy,
 * takže obrys drží půl tloušťky od okraje — jinak by se na krajích ořízl.
 */
export function TabIcon({ name, color, size = 28 }: Props) {
  const w = BORDER.small;
  const common = { stroke: color, strokeWidth: w, fill: 'none' as const };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'overview' && (
        <>
          <Rect x={2} y={2} width={20} height={20} {...common} />
          <Rect x={8} y={8} width={8} height={8} fill={color} />
        </>
      )}

      {name === 'activity' && (
        <>
          <Rect x={2} y={2} width={20} height={20} {...common} />
          <Line x1={2} y1={9} x2={22} y2={9} stroke={color} strokeWidth={w} />
          <Line x1={2} y1={15} x2={22} y2={15} stroke={color} strokeWidth={w} />
        </>
      )}

      {/* Čtvrtina výseče — stejný motiv jako koláčový graf ve statistikách. */}
      {name === 'stats' && (
        <>
          <Circle cx={12} cy={12} r={10} {...common} />
          <Path d="M12 12 L12 2 A10 10 0 0 1 22 12 Z" fill={color} />
        </>
      )}

      {name === 'profile' && (
        <>
          <Circle cx={12} cy={12} r={10} {...common} />
          <Circle cx={12} cy={12} r={4} fill={color} />
        </>
      )}
    </Svg>
  );
}
