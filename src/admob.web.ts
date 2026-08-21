// Webová náhrada za `admob.ts`.
//
// `react-native-google-mobile-ads` importuje nativní `codegenNativeComponent`,
// který web bundler neumí — i jen import `TestIds` z balíčku by stáhl celý
// řetězec přes `index.js` → `BannerAd.js` a bundlování webu by spadlo. Web
// (`npm run web`) je tu ale JEN nástroj pro vývoj a screenshoty (viz
// AGENTS.md) — appka se na web nikdy nenasazuje, takže tenhle soubor prostě
// nic neinicializuje a `AdSlot.tsx` díky `useAdsReady() === false` vždycky
// zůstane u placeholderu.
//
// Metro si tenhle soubor vybere pro platformu `web` automaticky (přípona
// `.web.ts` má přednost před `.ts`) — `admob.ts` se pro web vůbec nenačte.

import { useSyncExternalStore } from 'react';

export const IS_EXPO_GO = false;
export const ADMOB_BANNER_ID = '';
export const ADMOB_RECTANGLE_ID = '';

export function useAdsReady(): boolean {
  return useSyncExternalStore(() => () => undefined, () => false, () => false);
}

export async function initAds(): Promise<void> {
  // Na webu se reklama nikdy neinicializuje.
}
