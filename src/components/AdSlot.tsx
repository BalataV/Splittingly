// Reklamní plochy.
//
// Přerušovaný šedý rám (#5F5F5F) je SDĚLENÍ, ne dekorace: nikde jinde
// v appce se nevyskytuje, takže sám tvar čte jako „tohle nejsme my".
// Nepoužívej ho na nic dalšího a nikdy ho neodstraňuj kvůli estetice.
//
// ⚠️ SDK: tady je zatím jen RÁM a rezervované místo. Skutečné bannery
// (react-native-google-mobile-ads) potřebují vlastní vývojový build, ne
// Expo Go — proto se doplňují až v kroku „dev build" (IMPLEMENTACE.md, 12).
// Vnitřek se pak vymění za <BannerAd/>, rozměry a rámy zůstávají.

import React, { ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useUi } from './ui';
import { AD_SIZES } from '../ads';
import { t } from '../i18n';
import { SPACE, BORDER } from '../theme';

function AdFrame({ w, h, children, onClose }: { w: number; h: number; children?: ReactNode; onClose?: () => void }) {
  const { c, ty } = useUi();
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: w,
          height: h,
          maxWidth: '100%',
          backgroundColor: c.surfaceSunken,
          borderWidth: BORDER.ad,
          borderColor: c.adFrame,
          borderStyle: 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
        <View style={{ position: 'absolute', top: 4, left: 4, borderWidth: 2, borderColor: c.adFrame, paddingHorizontal: 4, paddingVertical: 1 }}>
          <Text style={[ty('label'), { color: c.adText, fontSize: 9 }]}>{t('AD')}</Text>
        </View>
        {!!onClose && (
          // Zavírací cíl musí mít 44×44 pt i když je vizuálně malý.
          <Pressable
            onPress={onClose}
            hitSlop={14}
            accessibilityLabel={t('Close ad')}
            style={{ position: 'absolute', top: 2, right: 2, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: c.adText, fontSize: 16 }}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/**
 * Ukotvený banner 320×50. Sedí NAD tab barem, oddělený 3px linkou —
 * tím čte jako přišroubovaný k telefonu, ne jako řádek aplikace.
 * Obsah pod ním nikdy neprojíždí.
 */
export function BannerAd() {
  const { c } = useUi();
  return (
    <View style={{ borderTopWidth: BORDER.card, borderTopColor: c.border, backgroundColor: c.bg, padding: SPACE.sm }}>
      <AdFrame w={AD_SIZES.banner.w} h={AD_SIZES.banner.h} />
    </View>
  );
}

/**
 * Obdélník 300×250. Výhradně na ÚPLNÉM KONCI statistik, nikdy nad přehybem
 * a nikdy mezi dvěma datovými bloky. ✕ vede na nabídku Pro.
 */
export function RectangleAd({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <View style={{ marginTop: SPACE.xl }}>
      <AdFrame w={AD_SIZES.rectangle.w} h={AD_SIZES.rectangle.h} onClose={onUpgrade} />
    </View>
  );
}

/**
 * Nativní řádek v aktivitě, každý dvanáctý.
 * Pozná se podle toho, co NEMÁ: žádný avatar a žádná částka. Každý skutečný
 * řádek nese obojí, takže se s ním tenhle nedá splést — a přesně proto se
 * na něj nikdo neklikne omylem.
 */
export function NativeAdRow({ onUpgrade }: { onUpgrade: () => void }) {
  const { c, ty } = useUi();
  return (
    <View
      style={{
        backgroundColor: c.surfaceSunken,
        borderWidth: BORDER.ad,
        borderColor: c.adFrame,
        borderStyle: 'dashed',
        paddingVertical: 11,
        paddingHorizontal: 13,
        gap: 4,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[ty('label'), { color: c.adText }]}>{t('SPONSORED')}</Text>
        <Pressable onPress={onUpgrade} hitSlop={14} accessibilityLabel={t('Close ad')}>
          <Text style={{ color: c.adText, fontSize: 14 }}>✕</Text>
        </Pressable>
      </View>
      <Text style={[ty('caption'), { color: c.adText }]}>{t('Advertisement placeholder')}</Text>
    </View>
  );
}

/**
 * Tichá cesta k placené verzi. Jedna z pouhých tří — víc jich být nesmí,
 * jinak se z upsellu stane obsah.
 */
export function ProStrip({ onPress, price }: { onPress: () => void; price: string }) {
  const { c, ty } = useUi();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACE.md,
        borderWidth: BORDER.small,
        borderColor: c.border,
        backgroundColor: c.surface,
        paddingVertical: 11,
        paddingHorizontal: 13,
        marginTop: SPACE.lg,
      }}
    >
      <Text style={[ty('caption'), { color: c.textMuted, flex: 1 }]}>
        {t('Splittingly Pro — no ads, CSV export, all themes')}
      </Text>
      <Text style={[ty('rowTitle'), { color: c.primary, flexShrink: 0 }]}>{price}</Text>
    </Pressable>
  );
}
