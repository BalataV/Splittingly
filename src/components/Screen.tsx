// Obal obrazovky: bezpečné zóny, posuv, hlavička a spodní ukotvená akce.
//
// Bezpečné zóny: horní výřez 44 pt, spodní gesture pill 34 pt. Do žádné z nich
// nesmí zasáhnout okraj, částka ani dotykový cíl — proto se insety počítají
// tady jednou a obrazovky je neřeší.

import React, { ReactNode } from 'react';
import { View, Text, ScrollView, Pressable, Keyboard, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUi } from './ui';
import { SPACE, BORDER } from '../theme';

interface ScreenProps {
  title?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
  footer?: ReactNode;         // ukotvená akce dole (mimo posuv)
  scroll?: boolean;
  fill?: string;              // celoplošné pozadí (např. roční přehled)
  padded?: boolean;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export default function Screen({
  title, onBack, backLabel, right, footer, scroll = true, fill, padded = true, children, contentStyle,
}: ScreenProps) {
  const { c, ty, rtl } = useUi();
  const insets = useSafeAreaInsets();
  const bg = fill || c.bg;

  const header = (title || onBack || right) ? (
    <View style={{ paddingHorizontal: padded ? SPACE.screen : 0, paddingBottom: SPACE.md, gap: SPACE.sm }}>
      {(onBack || right) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={[ty('rowTitle'), { color: c.text }]}>
                {rtl ? '→ ' : '← '}{backLabel || 'Back'}
              </Text>
            </Pressable>
          ) : <View />}
          {right}
        </View>
      )}
      {!!title && (
        // Titulek nikdy neuřízneme — dlouhý překlad si vezme druhý řádek.
        <Text style={[ty('screenTitle'), { color: c.text }]}>{title}</Text>
      )}
    </View>
  ) : null;

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        { paddingHorizontal: padded ? SPACE.screen : 0, paddingBottom: SPACE.xl, gap: SPACE.md },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingHorizontal: padded ? SPACE.screen : 0, gap: SPACE.md }, contentStyle]}>
      {children}
    </View>
  );

  return (
    // Ťuknutí kamkoli mimo pole zavře klávesnici; potomci mají přednost.
    <Pressable onPress={Keyboard.dismiss} accessible={false} style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flex: 1, paddingTop: Math.max(insets.top, 12) + SPACE.sm }}>
        {header}
        {body}
        {!!footer && (
          <View
            style={{
              borderTopWidth: BORDER.card,
              borderTopColor: c.border,
              backgroundColor: bg,
              paddingHorizontal: SPACE.screen,
              paddingTop: SPACE.md,
              paddingBottom: Math.max(insets.bottom, 12) + SPACE.sm,
            }}
          >
            {footer}
          </View>
        )}
      </View>
    </Pressable>
  );
}

/** Nadpis sekce uvnitř obrazovky. */
export function SectionTitle({ children }: { children: ReactNode }) {
  const { c, ty } = useUi();
  return <Text style={[ty('label'), { color: c.textMuted, marginTop: SPACE.sm }]}>{children}</Text>;
}
