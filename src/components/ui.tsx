// Knihovna komponent směru „Hard Split".
//
// Tři pravidla, která se tu nikde neporušují:
//   1. poloměr rohů je 0,
//   2. okraj je vždy `c.border` (inkoust / kostěná), nikdy šedý,
//   3. stín je posunutý obdélník BEZ rozostření — v RN se kreslí jako
//      podložená View, protože `shadowRadius: 0` se na Androidu chová jinak
//      než na iOS a elevation přidává nežádoucí rozostření.
//
// Žádná karta nemá pevnou výšku. Když text nabobtná (němčina, finština),
// roste kontejner, ne ellipsis. `numberOfLines` se v téhle appce nepoužívá.

import React, { createContext, useContext, useMemo, useRef, useState, ReactNode } from 'react';
import {
  View, Text, Pressable, TextInput, StyleProp, ViewStyle, TextStyle, I18nManager,
} from 'react-native';
import { makePalette, onColor, THEMES, BORDER, SHADOW, SPACE, TOUCH } from '../theme';
import { type as typeFor, TABULAR, Role } from '../typography';
import { currentScript, currentRTL } from '../i18n';
import type { Palette, TextSize, ThemeName } from '../types';
import type { ScriptName } from '../languages';
import { useEnsureVisible } from './keyboardScroll';
import * as haptics from '../haptics';

// ---------------------------------------------------------------- kontext

export interface UiTheme {
  c: Palette;
  ty: (role: Role) => TextStyle;
  rtl: boolean;
  script: ScriptName;
  size: TextSize;
}

const UiContext = createContext<UiTheme | null>(null);

export function UiProvider({
  theme, dark, size, children,
}: { theme: ThemeName; dark: boolean; size: TextSize; children: ReactNode }) {
  const script = currentScript();
  const rtl = currentRTL();
  const value = useMemo<UiTheme>(() => {
    const c = makePalette(theme, dark);
    return {
      c,
      ty: (role: Role) => typeFor(role, script, size) as TextStyle,
      rtl,
      script,
      size,
    };
  }, [theme, dark, size, script, rtl]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiTheme {
  const v = useContext(UiContext);
  if (!v) {
    // Bezpečná záloha — komponenta vykreslená mimo provider nesmí shodit appku.
    const c = makePalette('acid', false);
    return { c, ty: (r) => typeFor(r) as TextStyle, rtl: false, script: 'latin', size: 'medium' };
  }
  return v;
}

/** Zkratka, když komponenta potřebuje jen barvy. */
export function useColors(): Palette {
  return useUi().c;
}

// ------------------------------------------------------------- tvrdý stín

interface ShadowProps {
  offset?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * Kontejner s posunutým stínem. V RTL se vodorovný posun otáčí — jinak by
 * stín po zrcadlení layoutu ukazoval „ven" z obrazovky.
 */
export function HardShadow({ offset = SHADOW.card, color, style, children }: ShadowProps) {
  const { c, rtl } = useUi();
  const dx = rtl ? -offset : offset;
  return (
    <View style={[{ position: 'relative' }, style]}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: offset,
          bottom: -offset,
          left: dx,
          right: -dx,
          backgroundColor: color || c.shadow,
        }}
      />
      {children}
    </View>
  );
}

// -------------------------------------------------------------- stisknutí

interface PushableProps {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  /** Ztlumit průhledností? Prvky s vlastním vypnutým stavem posílají false —
   *  jinak se ztlumení sečte s šedou výplní a text přestane být čitelný. */
  dimWhenDisabled?: boolean;
  offset?: number;
  shadowColor?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  haptic?: boolean;
  children?: ReactNode;
}

/**
 * Podpisová interakce směru: při stisku stín spadne ze 6 na 2 a prvek se
 * posune o +3,+3. Devadesát milisekund, žádné easing křivky.
 */
export function Pushable({
  onPress, onLongPress, disabled, dimWhenDisabled = true, offset = SHADOW.hero,
  shadowColor, style, contentStyle, accessibilityLabel, haptic = true, children,
}: PushableProps) {
  const { c, rtl } = useUi();
  const [pressed, setPressed] = useState(false);
  const o = pressed ? SHADOW.pressed : offset;
  const shift = pressed ? 3 : 0;
  const dx = rtl ? -o : o;

  return (
    <View style={[{ position: 'relative', opacity: disabled && dimWhenDisabled ? 0.5 : 1 }, style]}>
      {offset > 0 && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: o,
            bottom: -o,
            left: dx,
            right: -dx,
            backgroundColor: shadowColor || c.shadow,
          }}
        />
      )}
      <Pressable
        disabled={disabled}
        onPress={() => { if (haptic) haptics.tap(); onPress?.(); }}
        onLongPress={onLongPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !!disabled }}
        style={[
          { transform: [{ translateX: rtl ? -shift : shift }, { translateY: shift }] },
          contentStyle,
        ]}
      >
        {children}
      </Pressable>
    </View>
  );
}

// ------------------------------------------------------------------ karta

interface CardProps {
  fill?: string;
  border?: number;
  offset?: number;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  dashed?: boolean;
  borderColor?: string;
  children?: ReactNode;
}

export function Card({
  fill, border = BORDER.card, offset = 0, padding = 14, style, dashed, borderColor, children,
}: CardProps) {
  const { c } = useUi();
  const inner = (
    <View
      style={[
        {
          backgroundColor: fill || c.surface,
          borderWidth: border,
          borderColor: borderColor || c.border,
          borderStyle: dashed ? 'dashed' : 'solid',
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  return offset > 0 ? <HardShadow offset={offset}>{inner}</HardShadow> : inner;
}

// --------------------------------------------------------------- tlačítko

export type ButtonKind = 'primary' | 'accent' | 'positive' | 'negative' | 'plain' | 'ink' | 'outline';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  offset?: number;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
}

/**
 * Tlačítko. Text je vycentrovaný a ROSTE DO VÝŠKY — nikdy se neuřízne a
 * nikdy se nezmenší písmo. Německé „Zahlung bestätigen" prostě zabere dva
 * řádky a tlačítko je vyšší; to je záměr, ne chyba.
 */
export function Button({ label, onPress, kind = 'primary', disabled, offset = SHADOW.card, style, icon }: ButtonProps) {
  const { c, ty } = useUi();

  const map: Record<ButtonKind, { bg: string; fg: string; border: string }> = {
    primary:  { bg: c.primary,  fg: c.onPrimary,  border: c.border },
    accent:   { bg: c.accent,   fg: c.onAccent,   border: c.border },
    positive: { bg: c.positive, fg: c.onPositive, border: c.border },
    negative: { bg: c.negative, fg: '#FFFFFF',    border: c.border },
    plain:    { bg: c.surface,  fg: c.text,       border: c.border },
    ink:      { bg: c.text,     fg: c.bg,         border: c.border },
    outline:  { bg: 'transparent', fg: c.text,    border: c.border },
  };
  // Vypnuté tlačítko musí zůstat ČITELNÉ — uživatel z něj má vyčíst, co má
  // udělat, aby se odemklo. Tyhle dvojice drží kontrast nad 4.5:1.
  const s = disabled
    ? c.isDark
      ? { bg: '#2E2E2E', fg: '#B4B4B4', border: '#5A5A5A' }
      : { bg: '#E4E0D5', fg: '#4A4A4A', border: '#9A9488' }
    : map[kind];

  return (
    <Pushable
      onPress={onPress}
      disabled={disabled}
      dimWhenDisabled={false}
      offset={kind === 'outline' ? 0 : offset}
      style={style}
    >
      <View
        style={{
          backgroundColor: s.bg,
          borderWidth: BORDER.card,
          borderColor: s.border,
          minHeight: 52,
          paddingVertical: 14,
          paddingHorizontal: SPACE.lg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: SPACE.sm,
        }}
      >
        {icon}
        <Text style={[ty('button'), { color: s.fg, textAlign: 'center' }]}>{label}</Text>
      </View>
    </Pushable>
  );
}

// ------------------------------------------------------------------ popisek

export function Label({ children, color, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  const { c, ty } = useUi();
  return <Text style={[ty('label'), { color: color || c.textMuted }, style]}>{children}</Text>;
}

// -------------------------------------------------------------------- chip

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  dashed?: boolean;
  fill?: string;
}

export function Chip({ label, active, onPress, onRemove, dashed, fill }: ChipProps) {
  const { c, ty } = useUi();
  const bg = fill || (active ? c.accent : c.surface);
  // Barva textu se počítá ze SKUTEČNÉ výplně, ne z příznaku `active`.
  // Dřív se brala z `active`, takže chip s vlastním tmavým `fill` (období
  // ve statistikách) dostal inkoustový text na inkoustovém podkladu a
  // vybraná položka zmizela.
  const fg = dashed ? c.text : onColor(bg);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: dashed ? 'transparent' : bg,
        borderWidth: BORDER.small,
        borderColor: c.border,
        borderStyle: dashed ? 'dashed' : 'solid',
        paddingVertical: 8,
        paddingHorizontal: 11,
        minHeight: TOUCH - 8,
      }}
    >
      <Text style={[ty('rowTitle'), { color: fg }]}>{label}</Text>
      {!!onRemove && (
        <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={'Remove ' + label}>
          <Text style={[ty('rowTitle'), { color: fg, opacity: 0.7 }]}>✕</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

// -------------------------------------------------- segmentovaný přepínač

interface SegmentedProps<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

/**
 * Tři stejně široké buňky oddělené 3px linkou. V RTL se dělicí linka musí
 * kreslit vpravo místo vlevo, jinak zůstane osiřelá na kraji.
 */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const { c, ty, rtl } = useUi();
  return (
    <View style={{ flexDirection: 'row', borderWidth: BORDER.card, borderColor: c.border }}>
      {options.map((o, i) => {
        const active = o.key === value;
        const divider = i > 0
          ? (rtl ? { borderRightWidth: BORDER.card } : { borderLeftWidth: BORDER.card })
          : null;
        return (
          <Pressable
            key={o.key}
            onPress={() => { haptics.tap(); onChange(o.key); }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[
              {
                flex: 1,
                minHeight: TOUCH,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 11,
                paddingHorizontal: 6,
                backgroundColor: active ? c.text : c.surface,
                borderColor: c.border,
              },
              divider,
            ]}
          >
            <Text style={[ty('rowTitle'), { color: active ? c.bg : c.text, textAlign: 'center' }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------- přepínač

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  const { c } = useUi();
  return (
    <Pressable
      onPress={() => { haptics.tap(); onChange(!value); }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      hitSlop={8}
      style={{
        width: 48,
        height: 28,
        borderWidth: BORDER.card,
        borderColor: c.border,
        backgroundColor: value ? c.accent : c.surface,
        justifyContent: 'center',
        paddingHorizontal: 2,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          backgroundColor: value ? c.text : c.textMuted,
          alignSelf: value ? 'flex-end' : 'flex-start',
        }}
      />
    </Pressable>
  );
}

// ---------------------------------------------------------------- zaškrtnutí

export function Check({ checked, onPress, size = 22 }: { checked: boolean; onPress?: () => void; size?: number }) {
  const { c } = useUi();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={{
        width: size,
        height: size,
        borderWidth: BORDER.small,
        borderColor: c.border,
        backgroundColor: checked ? c.primary : c.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && <Text style={{ color: c.onPrimary, fontSize: size * 0.6, lineHeight: size }}>✓</Text>}
    </Pressable>
  );
}

// ------------------------------------------------------------------ avatar

export function Avatar({ initial, color, size = 30, borderWidth = BORDER.small }: {
  initial: string; color: string; size?: number; borderWidth?: number;
}) {
  const { c } = useUi();
  const light = color === '#FFE500' || color === '#00E5C0';
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderWidth,
        borderColor: c.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: light ? '#101010' : '#FFFFFF',
          fontFamily: 'ArchivoBlack_400Regular',
          fontSize: Math.round(size * 0.42),
        }}
      >
        {initial}
      </Text>
    </View>
  );
}

// ------------------------------------------------------------- vstupní pole

interface FieldProps {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string | null;
  success?: boolean;
  trailing?: ReactNode;
  multiline?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Vstupní pole. Chybu NIKDY neneseme toastem — pole si ji řekne samo a
 * červený okraj nikdy nestojí bez textu vedle sebe.
 */
export function Field({
  label, value, onChangeText, placeholder, secureTextEntry, keyboardType = 'default',
  autoCapitalize = 'sentences', error, success, trailing, multiline, style,
}: FieldProps) {
  const { c, ty, rtl } = useUi();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? c.negative : success ? c.positive : focused ? c.primary : c.border;

  // Po zaostření si řekneme obrazovce, ať na pole odscrolluje — jinak by
  // u delšího formuláře uživatel psal naslepo pod klávesnicí.
  const boxRef = useRef<View>(null);
  const ensureVisible = useEnsureVisible();

  return (
    <View style={style} ref={boxRef} collapsable={false}>
      {!!label && <Label color={error ? c.negative : c.textMuted} style={{ marginBottom: 6 }}>{label}</Label>}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: error ? c.negativeSurface : c.surface,
          borderWidth: BORDER.card,
          borderColor,
          paddingHorizontal: 14,
          minHeight: TOUCH + 6,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.textDisabled}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          multiline={multiline}
          onFocus={() => { setFocused(true); ensureVisible(boxRef); }}
          onBlur={() => setFocused(false)}
          style={[
            ty('body'),
            {
              flex: 1,
              color: c.text,
              paddingVertical: 12,
              textAlign: rtl ? 'right' : 'left',
              writingDirection: rtl ? 'rtl' : 'ltr',
            },
          ]}
        />
        {trailing}
      </View>
      {!!error && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'flex-start' }}>
          <View style={{ width: 20, height: 20, backgroundColor: c.negative, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontFamily: 'ArchivoBlack_400Regular', fontSize: 12 }}>!</Text>
          </View>
          <Text style={[ty('caption'), { color: c.isDark ? c.negativeTextOnSurface : c.negative, flex: 1 }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ------------------------------------------------------------------ stepper

export function Stepper({ value, onChange, min = 0, max = 99 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  const { c, ty } = useUi();
  const btn = (glyph: string, delta: number, fill?: string) => (
    <Pressable
      onPress={() => { haptics.tap(); onChange(Math.min(max, Math.max(min, value + delta))); }}
      accessibilityRole="button"
      accessibilityLabel={delta > 0 ? 'Increase' : 'Decrease'}
      style={{ width: 34, minHeight: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: fill || 'transparent' }}
    >
      <Text style={[ty('rowTitle'), { color: fill ? c.onAccent : c.text, fontSize: 18 }]}>{glyph}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', borderWidth: BORDER.card, borderColor: c.border, alignItems: 'stretch' }}>
      {btn('−', -1)}
      <View style={{
        width: 36, alignItems: 'center', justifyContent: 'center',
        borderLeftWidth: BORDER.small, borderRightWidth: BORDER.small, borderColor: c.border,
      }}>
        <Text style={[ty('rowAmount'), TABULAR, { color: c.text }]}>{value}</Text>
      </View>
      {btn('+', 1, c.accent)}
    </View>
  );
}

// ------------------------------------------------------------------ skeleton

/**
 * Kostra při načítání. NEPULZUJE a rozměry se shodují s reálnými bloky,
 * takže při dopadu dat nic neposkočí. U načítání se maskoti neukazují.
 */
export function Skeleton({ width, height, style }: { width?: number | string; height: number; style?: StyleProp<ViewStyle> }) {
  const { c } = useUi();
  return (
    <View
      style={[
        { width: (width as any) ?? '100%', height, backgroundColor: c.skeleton, borderWidth: BORDER.inner, borderColor: c.borderInactive },
        style,
      ]}
    />
  );
}

// -------------------------------------------------------------------- řádek

export function Row({ children, onPress, style, border = BORDER.small, fill, dashed, borderColor }: {
  children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle>;
  border?: number; fill?: string; dashed?: boolean; borderColor?: string;
}) {
  const { c } = useUi();
  const body = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACE.md,
          backgroundColor: fill || c.surface,
          borderWidth: border,
          borderColor: borderColor || c.border,
          borderStyle: dashed ? 'dashed' : 'solid',
          paddingVertical: 11,
          paddingHorizontal: 13,
          minHeight: 56,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return body;
  return <Pressable onPress={() => { haptics.tap(); onPress(); }} accessibilityRole="button">{body}</Pressable>;
}

/** Vodorovná linka uvnitř karty — 2px, jiná barva než okraj. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c } = useUi();
  return <View style={[{ height: BORDER.inner, backgroundColor: c.dividerInner }, style]} />;
}

/** Silná linka (3px) v barvě okraje — dělí sekce uvnitř karty. */
export function Rule({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c } = useUi();
  return <View style={[{ height: BORDER.card, backgroundColor: c.border }, style]} />;
}

export { I18nManager };
