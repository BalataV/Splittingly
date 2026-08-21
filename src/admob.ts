// Centrální AdMob konfigurace: ID jednotek + test/produkční přepínač.
//
// DVA MÍSTA, DRŽ JE SPOLU: App ID (celá appka v AdMobu) se natvrdo zapisuje
// i do `app.json` → `plugins` → `react-native-google-mobile-ads` — prebuild
// ho vkládá do AndroidManifest.xml / Info.plist a JSON se nemůže odkazovat
// sám na sebe. Jednotky reklam (banner, obdélník) stačí jen tady v `extra`,
// čtou se za běhu.
//
// Dokud v `extra` nejsou REÁLNÉ hodnoty z AdMob konzole, appka běží na
// Googlem vydaných TESTOVACÍCH ID — ty jsou bezpečné i v produkčním
// buildu (nikdy nevrátí skutečnou reklamu ani peníze, ale nic tím
// neporušíš). Nahraď je hned, jak v AdMob konzoli založíš appku
// (Android i iOS zvlášť) a vytvoříš jednotky — viz IMPLEMENTACE.md, krok 12.

import { useSyncExternalStore } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import mobileAds, { AdsConsent, AdsConsentStatus, TestIds } from 'react-native-google-mobile-ads';

const extra = (Constants.expoConfig?.extra || {}) as Record<string, string>;

/**
 * Expo Go nemá nativní modul AdMob zabudovaný — volání SDK by appku
 * spadlo. V Expo Go proto vždycky zůstává starý prázdný rám, skutečná
 * reklama se ukáže až v dev buildu nebo v produkci.
 */
export const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function unitId(real: string | undefined, test: string): string {
  return real && real.trim() ? real : test;
}

export const ADMOB_BANNER_ID = (Platform.select({
  ios: unitId(extra.admobBannerIos, TestIds.BANNER),
  android: unitId(extra.admobBannerAndroid, TestIds.BANNER),
}) || TestIds.BANNER) as string;

// TestIds nemá zvlášť ID pro obdélník — testovací bannerová jednotka
// obsluhuje libovolnou velikost, kterou si od ní vyžádáš (viz `BannerAdSize`
// níž v `AdSlot.tsx`), takže se stejné testovací ID hodí i sem.
export const ADMOB_RECTANGLE_ID = (Platform.select({
  ios: unitId(extra.admobRectangleIos, TestIds.BANNER),
  android: unitId(extra.admobRectangleAndroid, TestIds.BANNER),
}) || TestIds.BANNER) as string;

// --------------------------------------------------------- souhlas + inicializace

/**
 * `true`, jakmile smí appka reklamy skutečně ptát AdMob o výplň.
 *
 * Dokud tenhle flag nesvítí, `AdSlot.tsx` kreslí placeholder — nikdy ne
 * skutečnou reklamu bez odsouhlaseného stavu. Přes `useSyncExternalStore`,
 * protože se mění mimo React (asynchronně po startu appky) a komponenty
 * na to musí samy překreslit.
 */
let adsReady = false;
const listeners = new Set<() => void>();
function setAdsReady(v: boolean) {
  if (adsReady === v) return;
  adsReady = v;
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function useAdsReady(): boolean {
  return useSyncExternalStore(subscribe, () => adsReady, () => false);
}

/**
 * Pořadí, které vyžadují oba právní rámce zapojené do reklamy:
 *
 * 1. EU souhlas (Předpis o souhlasu uživatele v rámci EU z podmínek AdSense) —
 *    přes Google UMP (`AdsConsent`), který appka dostala zdarma s tímhle SDK.
 *    Mimo EHP `requestInfoUpdate` sám vrátí „není potřeba" a nic se neukáže.
 * 2. iOS ATT (App Tracking Transparency, Apple Developer Program License
 *    Agreement §3.3.3(E)) — appka MUSÍ zkontrolovat `Tracking Preference`
 *    dřív, než smí AdMobu dovolit sledovací identifikátor použít.
 *
 * Teprve PO obojím se smí zavolat `mobileAds().initialize()` a pustit
 * reklamy. Volá se jednou při startu appky (`App.tsx`), nikdy z obrazovky.
 */
export async function initAds(): Promise<void> {
  if (IS_EXPO_GO) return;
  try {
    if (Platform.OS === 'ios') {
      const ATT = await import('expo-tracking-transparency');
      await ATT.requestTrackingPermissionsAsync();
    }

    const info = await AdsConsent.requestInfoUpdate();
    if (info.isConsentFormAvailable && info.status === AdsConsentStatus.REQUIRED) {
      await AdsConsent.loadAndShowConsentFormIfRequired();
    }
    const after = await AdsConsent.getConsentInfo();
    // Uživatel v EU řekl ne — appka zůstává bez reklam, ne že by je vnutila.
    if (!after.canRequestAds) return;

    await mobileAds().initialize();
    setAdsReady(true);
  } catch {
    // Reklama je vedlejší příjem, ne kritická cesta — když souhlas nebo
    // inicializace selže, appka běží dál bez reklam místo pádu.
  }
}
