// Tenký obal kolem `react-native-google-mobile-ads`, kvůli dvěma věcem
// najednou: platformnímu štěpení pro web (`GoogleAd.web.tsx`) a bezpečnému
// importu v Expo Go, kde nativní modul chybí.
//
// `require()` uvnitř `if`, NE `export … from` na vrcholu souboru — `import`/
// `export … from` se v JS vyhodnotí VŽDY (bundler ho zvedne nad zbytek
// modulu), a knihovna při pouhém importu sáhne do nativního registru. V Expo
// Go appka na tomhle spadne s „RNGoogleMobileAdsModule could not be found"
// dřív, než se stihne zeptat na `IS_EXPO_GO`. Stejný důvod je v `admob.ts`.
import { IS_EXPO_GO } from '../admob';
import type * as GoogleMobileAds from 'react-native-google-mobile-ads';

const admob: typeof GoogleMobileAds | null = IS_EXPO_GO
  ? null
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  : (require('react-native-google-mobile-ads') as typeof GoogleMobileAds);

export const BannerAdSize = admob
  ? admob.BannerAdSize
  : ({ BANNER: 'BANNER', MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE' } as const);

export function GoogleBannerAd(props: { unitId: string; size: string }) {
  if (!admob) return null;
  const Real = admob.BannerAd;
  return <Real unitId={props.unitId} size={props.size as GoogleMobileAds.BannerAdSize} />;
}
