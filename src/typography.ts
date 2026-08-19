// Typografie: velikosti, váhy a to nejdůležitější — jak se rozhraní chová,
// když se text vysází jiným písmem než latinkou.
//
// Archivo Black a Space Grotesk pokrývají latinku, cyrilici a řečtinu. Napříč
// těmito jazyky se tedy hierarchie NEMĚNÍ a částky nemění rodinu.
// Pro CJK, thajštinu, dévanágarí a arabské písmo se přechází na odpovídající
// Noto o +1 bod a s vyšším řádkem — řádek povyroste, mřížka ne.

import { FONTS, TEXT_SCALE } from './theme';
import type { ScriptName } from './languages';
import type { TextSize } from './types';

export interface TypeStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: 'uppercase' | 'none';
}

/** Role textu podle handoffu. Klíč je jediné, co obrazovka musí znát. */
export type Role =
  | 'screenTitle' | 'heroAmount' | 'sectionAmount' | 'rowAmount'
  | 'body' | 'bodySecondary' | 'rowTitle' | 'rowMeta' | 'caption'
  | 'label' | 'button' | 'tabLabel';

const BASE: Record<Role, TypeStyle> = {
  screenTitle:    { fontFamily: FONTS.display, fontSize: 26, lineHeight: 27, letterSpacing: -0.5, textTransform: 'uppercase' },
  heroAmount:     { fontFamily: FONTS.display, fontSize: 42, lineHeight: 44, letterSpacing: -0.8 },
  sectionAmount:  { fontFamily: FONTS.display, fontSize: 32, lineHeight: 34, letterSpacing: -0.6 },
  rowAmount:      { fontFamily: FONTS.display, fontSize: 15, lineHeight: 17 },
  body:           { fontFamily: FONTS.body,    fontSize: 17, lineHeight: 25 },
  bodySecondary:  { fontFamily: FONTS.body,    fontSize: 15, lineHeight: 22 },
  rowTitle:       { fontFamily: FONTS.bodyBold, fontSize: 14.5, lineHeight: 19 },
  rowMeta:        { fontFamily: FONTS.body,    fontSize: 11.5, lineHeight: 15 },
  caption:        { fontFamily: FONTS.body,    fontSize: 13, lineHeight: 18 },
  label:          { fontFamily: FONTS.bodyBold, fontSize: 11, lineHeight: 14, letterSpacing: 1.1, textTransform: 'uppercase' },
  button:         { fontFamily: FONTS.bodyBold, fontSize: 16, lineHeight: 21 },
  tabLabel:       { fontFamily: FONTS.bodyBold, fontSize: 11, lineHeight: 14 },
};

/**
 * Úpravy pro jednotlivá písma. `add` je přírůstek velikosti, `lh` násobič
 * výšky řádku. Hodnoty ověřené v prototypu (A2 - Internationalization).
 */
const SCRIPT: Record<ScriptName, { add: number; lh: number; weightCap?: boolean }> = {
  latin:      { add: 0,   lh: 1 },
  cyrillic:   { add: 0,   lh: 1.05 },
  greek:      { add: 0,   lh: 1.05 },
  cjk:        { add: 1,   lh: 1.22 },
  thai:       { add: 1,   lh: 1.38 },   // vysoké značky nad i pod řádkem
  devanagari: { add: 1,   lh: 1.32 },   // spřežky
  arabic:     { add: 1,   lh: 1.38, weightCap: true }, // váha max 600, ne 700
  hebrew:     { add: 1,   lh: 1.25 },
  other:      { add: 1,   lh: 1.25 },
};

/**
 * Vysází roli textu pro dané písmo a uživatelské nastavení velikosti.
 *
 * Absolutní podlaha: 11 pro verzálkové popisky, 13 pro obsah. Nikdy níž —
 * ani při „malém" nastavení, ani při dlouhých překladech.
 */
export function type(role: Role, script: ScriptName = 'latin', size: TextSize = 'medium'): TypeStyle {
  const b = BASE[role];
  const s = SCRIPT[script] || SCRIPT.latin;
  const scale = TEXT_SCALE[size] || 1;
  const floor = role === 'label' || role === 'tabLabel' ? 9.5 : 13;
  const fontSize = Math.max(floor, Math.round((b.fontSize + s.add) * scale * 10) / 10);
  const lineHeight = Math.round(fontSize * (b.lineHeight / b.fontSize) * s.lh);
  return { ...b, fontSize, lineHeight };
}

/**
 * Rodina písma pro dané písmo. Latinka/cyrilice/řečtina zůstávají u Space
 * Grotesku; ostatní přecházejí na systémové Noto (na telefonu je vždycky).
 *
 * POZOR: `undefined` znamená „nech systému" a to je u exotických písem
 * SPRÁVNĚ — vlastní font, který znak nemá, vykreslí prázdný obdélník.
 */
export function scriptFont(script: ScriptName, weight: 'body' | 'bold' | 'display'): string | undefined {
  if (script === 'latin' || script === 'cyrillic' || script === 'greek') {
    if (weight === 'display') return FONTS.display;
    return weight === 'bold' ? FONTS.bodyBold : FONTS.body;
  }
  return undefined; // systémové písmo si znak najde samo
}

/**
 * Ekvivalent `fontWeight` pro písma, kde je 700 příliš těžké (arabština).
 */
export function scriptWeight(script: ScriptName, wanted: '400' | '500' | '700' | '900'): '400' | '500' | '600' | '700' | '900' {
  if (script === 'arabic' && (wanted === '700' || wanted === '900')) return '600';
  return wanted;
}

/**
 * Částky mají VŽDY tabulární číslice, jinak se v seznamu rozjede zarovnání.
 * V React Native se to zapíná přes `fontVariant`.
 */
export const TABULAR = { fontVariant: ['tabular-nums' as const] };
