// Designové tokeny směru „Hard Split" (neo-brutalismus).
// Hodnoty jsou 1:1 z design handoffu — nic tu nevymýšlej, jen doplňuj.
//
// Pravidla, která z toho plynou pro celou appku:
//  • poloměr rohů je VŠUDE 0,
//  • každý okraj je `ink` (světlý režim) nebo `bone` (tmavý) — nikdy šedý,
//    jediná výjimka je rám reklamy (`adFrame`),
//  • stín je jeden jediný: posunutý, BEZ rozostření,
//  • žlutá `accent` nese vždy inkoustový text, nikdy bílý.

import type { Palette, ThemeName, TextSize } from './types';

// ------------------------------------------------------------- základní ink
const INK = '#101010';
const BONE = '#FAF7F0';

// ---------------------------------------------------------------- akcenty
// Každé téma je trojice (accent, primary, secondary). Výchozí je Acid.
// „Dusk" je za Pro nákupem nebo za odměněnou reklamou (7 dní).
export interface ThemeDef {
  name: ThemeName;
  label: string;
  accent: string;
  primary: string;
  secondary: string;
  pro: boolean;
}

export const THEMES: Record<ThemeName, ThemeDef> = {
  acid: { name: 'acid', label: 'Acid', accent: '#FFE500', primary: '#1F49FF', secondary: '#FF2D16', pro: false },
  mint: { name: 'mint', label: 'Mint', accent: '#00E5C0', primary: '#101010', secondary: '#FF7A00', pro: false },
  neon: { name: 'neon', label: 'Neon', accent: '#FF4FD8', primary: '#2B0A5E', secondary: '#FFE500', pro: false },
  dusk: { name: 'dusk', label: 'Dusk', accent: '#C8A0FF', primary: '#4A2E8A', secondary: '#FFD9B0', pro: true },
};

export const THEME_ORDER: ThemeName[] = ['acid', 'mint', 'neon', 'dusk'];

/** Barvy avataru, které si uživatel může zvolit (obrazovka 22). */
export const AVATAR_COLORS = ['#FFE500', '#1F49FF', '#FF2D16', '#00A34A', '#101010'];

/** Barvy obálky skupiny (obrazovka 09). */
export const COVER_COLORS = ['#FFE500', '#1F49FF', '#FF2D16', '#00A34A'];

// ------------------------------------------------------------------ pomůcky

/** Je barva tmavá? Rozhoduje, jestli na ni patří světlý, nebo inkoustový text. */
export function isDark(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

/** Text, který je na dané barvě čitelný (WCAG AA). */
export function onColor(hex: string): string {
  return isDark(hex) ? BONE : INK;
}

/** Zesvětlení akcentu pro tmavý režim (aby držel kontrast). */
function liftForDark(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  // posuneme jen tmavé barvy — světlé (žlutá, mátová) zůstávají beze změny
  if (0.299 * r + 0.587 * g + 0.114 * b > 150) return hex;
  const k = 0.42;
  r = Math.round(r + (255 - r) * k);
  g = Math.round(g + (255 - g) * k);
  b = Math.round(b + (255 - b) * k);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ------------------------------------------------------------------ palety

/**
 * Sestaví paletu pro dané téma a režim.
 * Tmavý režim je PLNÁ INVERZE, ne ztlumení: okraje se překlopí z inkoustu na
 * kostěnou, stejně tak stín. Kladná/záporná se zvednou, aby držely kontrast.
 */
export function makePalette(theme: ThemeName, dark: boolean): Palette {
  const t = THEMES[theme] || THEMES.acid;
  const accent = t.accent;
  const primary = dark ? liftForDark(t.primary) : t.primary;

  if (!dark) {
    return {
      bg: '#FAF7F0',
      surface: '#FFFFFF',
      surfaceSunken: '#EFEDE4',
      text: '#101010',
      textMuted: '#5A5A5A',
      textDisabled: '#8A8A8A',
      primary,
      primaryPressed: '#0A2FCC',
      onPrimary: onColor(primary),
      accent,
      onAccent: onColor(accent),
      positive: '#00A34A',
      positiveSurface: '#DFFFE9',
      onPositive: '#FFFFFF',
      negative: '#FF2D16',
      negativeSurface: '#FFE7E3',
      negativeTextOnSurface: '#B3160A',
      accentSurface: '#FFF9CC',
      border: '#101010',
      dividerInner: '#E0DCD0',
      borderInactive: '#C9C4B6',
      skeleton: '#E4E0D5',
      adFrame: '#5F5F5F',
      adText: '#5F5F5F',
      shadow: '#101010',
      scrim: 'rgba(16,16,16,0.55)',
      isDark: false,
    };
  }

  return {
    bg: '#101010',
    surface: '#1C1C1C',
    surfaceSunken: '#171717',
    text: '#FAF7F0',
    textMuted: '#9A9A9A',
    textDisabled: '#6A6A6A',
    primary,
    primaryPressed: liftForDark(t.primary),
    onPrimary: '#101010',
    accent,                       // akcent se v tmavém režimu NEMĚNÍ
    onAccent: '#101010',          // …a vždy nese inkoust
    positive: '#2BE07A',
    positiveSurface: '#0E3D22',
    onPositive: '#101010',
    negative: '#FF5C45',
    negativeSurface: '#2A1512',
    negativeTextOnSurface: '#FF9A8A',
    accentSurface: '#2A2600',
    border: '#FAF7F0',            // okraj = kostěná
    dividerInner: '#3A3A3A',
    borderInactive: '#3A3A3A',
    skeleton: '#2A2A2A',
    adFrame: '#6A6A6A',
    adText: '#8A8A8A',
    shadow: '#FAF7F0',            // i stín je kostěný
    scrim: 'rgba(0,0,0,0.65)',
    isDark: true,
  };
}

// -------------------------------------------------------------- rozestupy
// 4pt mřížka. Vodorovné odsazení obrazovky 18, mezery mezi řádky 6–8.
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, screen: 18 };

// Poloměr rohů: nula. Konstanta existuje jen proto, aby šlo v kódu hledat,
// kde by případný designový posun musel zasáhnout.
export const RADIUS = 0;

// Tloušťky okrajů podle role prvku.
export const BORDER = { frame: 3.5, card: 3, small: 2.5, inner: 2, ad: 2 };

// Posun tvrdého stínu podle důležitosti prvku.
export const SHADOW = { card: 5, hero: 6, frame: 8, pressed: 2 };

// Minimální dotykový cíl (Apple i Google shodně 44).
export const TOUCH = 44;
export const ROW_H = 56;
export const BTN_H = 52;

// --------------------------------------------------------------- typografie
// Archivo Black = displej + KAŽDÁ částka. Space Grotesk = běžný text.
// Obě pokrývají latinku, cyrilici i řečtinu → napříč těmito jazyky se
// hierarchie nemění. Pro CJK/thajštinu/dévanágarí/arabštinu viz `scriptFont`.
export const FONTS = {
  display: 'ArchivoBlack_400Regular',
  body: 'SpaceGrotesk_400Regular',
  bodyMedium: 'SpaceGrotesk_500Medium',
  bodyBold: 'SpaceGrotesk_700Bold',
};

/** Násobič velikosti písma podle uživatelského nastavení (obrazovka 25). */
export const TEXT_SCALE: Record<TextSize, number> = {
  small: 0.92,
  medium: 1,
  large: 1.18,
};

export { INK, BONE };
