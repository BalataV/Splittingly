// Obal obrazovky: bezpečné zóny, posuv, hlavička a spodní ukotvená akce.
//
// Bezpečné zóny: horní výřez 44 pt, spodní gesture pill 34 pt. Do žádné z nich
// nesmí zasáhnout okraj, částka ani dotykový cíl — proto se insety počítají
// tady jednou a obrazovky je neřeší.
//
// KLÁVESNICE se řeší na čtyřech úrovních, protože ani jedna sama nestačí:
//   1. `softwareKeyboardLayoutMode: 'resize'` (app.json) — Android okno zmenší,
//      místo aby ho klávesnice překryla,
//   2. `KeyboardAvoidingView` — vytlačí ukotvenou spodní akci nad klávesnici,
//   3. `ensureVisible` — po zaostření pole na něj ScrollView odscrolluje.
//   4. kompenzace při ZAVŘENÍ klávesnice (Android) — viz níž.
//
// Bez toho třetího kroku by uživatel u dlouhého formuláře (nový výdaj) psal
// naslepo do pole schovaného pod klávesnicí.

import React, { ReactNode, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Keyboard, StyleProp, ViewStyle,
  KeyboardAvoidingView, Platform, findNodeHandle, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUi } from './ui';
import { KeyboardScrollContext, type EnsureVisible } from './keyboardScroll';
import { SPACE, BORDER } from '../theme';
import { t } from '../i18n';

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

  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  }, []);

  /**
   * Android: `adjustResize` zmenší okno, když klávesnice vyjede, a zase ho
   * zvětší, když zajede. Když byl seznam odscrollovaný blízko konce, ScrollView
   * při tom zvětšení automaticky OŘÍZNE offset na nové (menší) maximum — a
   * řádek, na který uživatel právě ťukl, „poskočí" jinam, i když on sám
   * nikam nescrolloval. Kompenzujeme to tak, že po zavření klávesnice
   * dorovnáme offset zpátky o výšku, kterou klávesnice zabírala.
   *
   * iOS klávesnice okno nezmenšuje (plave nad obsahem, řeší `KeyboardAvoidingView`
   * výš), takže se ho tohle netýká.
   */
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    let openHeight = 0;
    const onShow = Keyboard.addListener('keyboardDidShow', (e) => {
      openHeight = e.endCoordinates?.height || 0;
    });
    const onHide = Keyboard.addListener('keyboardDidHide', () => {
      if (openHeight > 0) {
        scrollRef.current?.scrollTo({ y: scrollY.current + openHeight, animated: false });
      }
      openHeight = 0;
    });
    return () => { onShow.remove(); onHide.remove(); };
  }, []);

  const ensureVisible = useCallback<EnsureVisible>((node) => {
    const scroller = scrollRef.current;
    if (!node?.current || !scroller) return;
    // Krátká prodleva: klávesnice teprve vyjíždí a než dojede, nemá smysl
    // počítat, kolik místa zbylo.
    setTimeout(() => {
      const handle = findNodeHandle(scroller);
      if (!handle || !node.current) return;
      node.current.measureLayout(
        handle,
        (_x, y) => {
          // 90 px nad polem — ať je vidět i jeho popisek, ne jen rámeček.
          scroller.scrollTo({ y: Math.max(0, y - 90), animated: true });
        },
        () => undefined,
      );
    }, 180);
  }, []);

  const header = (title || onBack || right) ? (
    <View style={{ paddingHorizontal: padded ? SPACE.screen : 0, paddingBottom: SPACE.md, gap: SPACE.sm }}>
      {(onBack || right) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={[ty('rowTitle'), { color: c.text }]}>
                {rtl ? '→ ' : '← '}{backLabel || t('Back')}
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
      ref={scrollRef}
      // „handled" znamená: ťuknutí, které nezachytí žádný potomek, zavře
      // klávesnici. Díky tomu NEPOTŘEBUJEME obalový Pressable — a ten by
      // navíc bral ScrollView gesta (viz komentář u návratové hodnoty).
      keyboardShouldPersistTaps="handled"
      // Zavření tažením. Na iOS klávesnice jede s prstem, na Androidu zmizí.
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      // iOS si při vyjeté klávesnici sám upraví vnitřní odsazení; bez toho
      // by spodek obsahu zůstal pod ní i po odscrollování.
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      onScroll={onScroll}
      scrollEventThrottle={16}
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

  const inner = (
    <KeyboardScrollContext.Provider value={ensureVisible}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          // iOS klávesnice plave nad obsahem → odsazujeme sami.
          // Android okno zmenšuje sám (`softwareKeyboardLayoutMode: resize`),
          // takže druhá vrstva odsazení by obsah vytlačila dvakrát.
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
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
      </KeyboardAvoidingView>
    </KeyboardScrollContext.Provider>
  );

  // POZOR na obalový Pressable: kdyby obaloval i posouvatelný obsah, sebral
  // by ScrollView dotyk na prázdném místě a listování by šlo až na několikátý
  // pokus (na tlačítku ano, vedle něj ne). Proto je jen na obrazovkách BEZ
  // posuvu — tam se nemá co rozbít a klávesnici je pořád čím zavřít.
  // Na posouvatelných obrazovkách to obstará samotný ScrollView přes
  // `keyboardShouldPersistTaps` a `keyboardDismissMode`.
  return scroll ? (
    <View style={{ flex: 1, backgroundColor: bg }}>{inner}</View>
  ) : (
    <Pressable onPress={Keyboard.dismiss} accessible={false} style={{ flex: 1, backgroundColor: bg }}>
      {inner}
    </Pressable>
  );
}

/** Nadpis sekce uvnitř obrazovky. */
export function SectionTitle({ children }: { children: ReactNode }) {
  const { c, ty } = useUi();
  return <Text style={[ty('label'), { color: c.textMuted, marginTop: SPACE.sm }]}>{children}</Text>;
}
