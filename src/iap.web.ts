// Webová varianta nákupu Pro.
//
// `npm run web` je nástroj pro vývoj a screenshoty, ne prodejní kanál —
// obchod na webu neexistuje a `react-native-iap` sáhne při importu do
// nativního registru, takže by bundler ani neprošel. Stejné dělení jako
// u `admob.web.ts`.
//
// Rozhraní musí zůstat shodné s `iap.ts`, jinak by se rozdíl projevil až
// za běhu na jedné platformě.

export const IAP_UNAVAILABLE = true;

export type PurchaseResult =
  | { ok: true }
  | { ok: false; reason: 'cancelled' | 'unavailable' | 'failed' | 'unverified' };

export async function fetchProPrice(): Promise<string | null> {
  return null;
}

export async function buyPro(): Promise<PurchaseResult> {
  return { ok: false, reason: 'unavailable' };
}

export async function restorePro(): Promise<boolean> {
  return false;
}

export async function endIap(): Promise<void> {
  // není co ukončovat
}
