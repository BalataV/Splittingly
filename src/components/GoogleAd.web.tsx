// Webová náhrada za `GoogleAd.tsx` — `useAdsReady()` je na webu vždycky
// `false` (viz `admob.web.ts`), takže se tahle komponenta nikdy reálně
// nevykreslí. Existuje jen proto, aby `AdSlot.tsx` mělo co importovat, aniž
// by se do webového bundlu dostal nativní `react-native-google-mobile-ads`.
export const BannerAdSize = { BANNER: 'BANNER', MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE' } as const;

export function GoogleBannerAd(_props: { unitId: string; size: string }) {
  return null;
}
