// Reklamní plochy.
//
// Přerušovaný šedý rám (#5F5F5F) je SDĚLENÍ, ne dekorace: nikde jinde
// v appce se nevyskytuje, takže sám tvar čte jako „tohle nejsme my".
// Nepoužívej ho na nic dalšího a nikdy ho neodstraňuj kvůli estetice.
//
// Banner a obdélník teď táhnou SKUTEČNÉ AdMob jednotky (`src/admob.ts`,
// test ID dokud v `app.json` nejsou reálné). Placeholder zůstává, dokud
// `useAdsReady()` neřekne, že appka smí reklamu ptát o výplň — buď proto,
// že jsme v Expo Go (nativní modul tam chybí, appka by na jeho zavolání
// spadla), nebo proto, že souhlas (EU) / ATT (iOS) ještě nedoběhly.
//
// Nativní řádek v aktivitě (`NativeAdRow` níž) je ZATÍM POŘÁD jen
// placeholder — vlastní `NativeAd` layout je samostatný krok, ne součást
// tohohle zapojení.

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { GoogleBannerAd, BannerAdSize } from './GoogleAd';
import { useUi } from './ui';
import { AD_SIZES } from '../ads';
import { ADMOB_BANNER_ID, ADMOB_RECTANGLE_ID, useAdsReady } from '../admob';
import { t } from '../i18n';
import { SPACE, BORDER } from '../theme';

function PlaceholderFrame({ w, h }: { w: number; h: number }) {
  const { c, ty } = useUi();
  return (
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
        gap: 4,
      }}
    >
      <View style={{ position: 'absolute', top: 4, left: 4, borderWidth: 2, borderColor: c.adFrame, paddingHorizontal: 4, paddingVertical: 1 }}>
        <Text style={[ty('label'), { color: c.adText, fontSize: 9 }]}>{t('AD')}</Text>
      </View>
      <Text style={[ty('caption'), { color: c.adText, textAlign: 'center', paddingHorizontal: 8 }]}>
        {t('Ad space')}
      </Text>
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
  const ready = useAdsReady();
  return (
    <View style={{ borderTopWidth: BORDER.card, borderTopColor: c.border, backgroundColor: c.bg, padding: SPACE.sm, alignItems: 'center' }}>
      {ready ? (
        <View style={{ borderWidth: BORDER.ad, borderColor: c.adFrame, borderStyle: 'dashed' }}>
          <GoogleBannerAd unitId={ADMOB_BANNER_ID} size={BannerAdSize.BANNER} />
        </View>
      ) : (
        <PlaceholderFrame w={AD_SIZES.banner.w} h={AD_SIZES.banner.h} />
      )}
    </View>
  );
}

/**
 * Obdélník 300×250. Výhradně na ÚPLNÉM KONCI statistik, nikdy nad přehybem
 * a nikdy mezi dvěma datovými bloky.
 *
 * Odkaz na Pro sedí POD reklamou, nikdy na ní — dokud šlo o placeholder,
 * bylo ✕ přímo na rámu, ale nad SKUTEČNOU reklamou by dotyk u jejího
 * okraje AdMob počítal jako neplatné kliknutí (riziko postihu účtu).
 */
export function RectangleAd({ onUpgrade }: { onUpgrade: () => void }) {
  const { c, ty } = useUi();
  const ready = useAdsReady();
  return (
    <View style={{ marginTop: SPACE.xl, alignItems: 'center', gap: SPACE.sm }}>
      {ready ? (
        <View style={{ borderWidth: BORDER.ad, borderColor: c.adFrame, borderStyle: 'dashed' }}>
          <GoogleBannerAd unitId={ADMOB_RECTANGLE_ID} size={BannerAdSize.MEDIUM_RECTANGLE} />
        </View>
      ) : (
        <PlaceholderFrame w={AD_SIZES.rectangle.w} h={AD_SIZES.rectangle.h} />
      )}
      <Pressable onPress={onUpgrade} hitSlop={10} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={[ty('caption'), { color: c.adText, textDecorationLine: 'underline' }]}>
          {t('Remove ads with Pro')}
        </Text>
      </Pressable>
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
