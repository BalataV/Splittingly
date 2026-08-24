// Nákup Pro přes obchod. Jednorázově, ne předplatné.
//
// Digitální obsah uvnitř aplikace MUSÍ jít přes Google Play Billing
// a Apple In-App Purchase — Stripe ani PayPal tu nejsou volba, ale
// důvod k zamítnutí (Apple 3.1.1, Google Play Payments policy).
//
// Kde se co děje:
//   • tady           — dialog obchodu, příjem účtenky, dokončení nákupu,
//   • Edge Function  — OVĚŘENÍ účtenky u Googlu/Applu a zápis `is_pro`,
//   • store.tsx      — jen zavolá `buyPro()` a přepíše stav.
//
// ⚠️ Klient nikdy nenastavuje `is_pro` sám. Kdyby ano, stačilo by appku
// odchytit proxy a Pro si zapnout zdarma — a hlavně by se nákup neudržel
// mezi Androidem a iOSem, protože jeden obchod o druhém neví. Pravdu drží
// profil na serveru, ne telefon.

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as IapModule from 'react-native-iap';
import { supabase } from './supabase';
import { PRO_PRODUCT_ID } from './config';

/**
 * Expo Go nemá nativní modul obchodu — stejná past jako u AdMobu.
 * `import` se vyhodnotí i uvnitř `if`, protože ho bundler zvedne nahoru,
 * takže se knihovna načítá `require`m až ve chvíli, kdy se na něj dojde.
 */
export const IAP_UNAVAILABLE =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Platform.OS === 'web';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const iap: typeof IapModule | null = IAP_UNAVAILABLE ? null : (require('react-native-iap') as typeof IapModule);

let connected = false;

/** Naváže spojení s obchodem. Volá se líně, až když je potřeba. */
async function connect(): Promise<boolean> {
  if (!iap) return false;
  if (connected) return true;
  try {
    await iap.initConnection();
    connected = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * Cena z obchodu, ve správné měně a se správným formátem pro danou zemi.
 *
 * `PRO_PRICE_FALLBACK` v configu je jen záloha pro první vykreslení —
 * ukazovat „$4.99" člověku v Indii je špatně, cenu určuje ceník obchodu.
 */
export async function fetchProPrice(): Promise<string | null> {
  if (!(await connect()) || !iap) return null;
  try {
    const products = await iap.fetchProducts({ skus: [PRO_PRODUCT_ID], type: 'in-app' });
    const first = (products ?? [])[0] as { displayPrice?: string } | undefined;
    return first?.displayPrice ?? null;
  } catch {
    return null;
  }
}

export type PurchaseResult =
  | { ok: true }
  | { ok: false; reason: 'cancelled' | 'unavailable' | 'failed' | 'unverified' };

/**
 * Ověří účtenku na serveru a nechá si nastavit `is_pro`.
 *
 * Vrací `true` jen tehdy, když Edge Function řekla, že účtenka je platná.
 * Když ne, nákup se ZÁMĚRNĚ nedokončí (`finishTransaction` se nezavolá) —
 * obchod ho pak zopakuje při dalším startu a člověk o zaplacené peníze
 * nepřijde kvůli výpadku sítě.
 */
async function verify(purchase: IapModule.Purchase): Promise<boolean> {
  // Verze 16 token sjednotila: na Androidu je to `purchaseToken` pro Play
  // Developer API, na iOSu podepsané JWS ze StoreKit 2. Server podle
  // `platform` pozná, co dostal, a ověří to jinou cestou.
  const receipt = purchase.purchaseToken;
  if (!receipt) return false;
  try {
    const { data, error } = await supabase.functions.invoke('verify-purchase', {
      body: {
        platform: Platform.OS,
        productId: purchase.productId,
        receipt,
      },
    });
    if (error) return false;
    return data?.isPro === true;
  } catch {
    return false;
  }
}

/** Spustí nákup. Rozlišuje zrušení uživatelem od skutečné chyby. */
export async function buyPro(): Promise<PurchaseResult> {
  if (!(await connect()) || !iap) return { ok: false, reason: 'unavailable' };
  try {
    // `requestPurchase` výsledek NEVRACÍ — ten přijde událostí. Návratovou
    // hodnotu použít nelze, i kdyby vypadala rozumně.
    const purchase = await new Promise<IapModule.Purchase>((resolve, reject) => {
      const done = iap.purchaseUpdatedListener((p) => { done.remove(); fail.remove(); resolve(p); });
      const fail = iap.purchaseErrorListener((e) => { done.remove(); fail.remove(); reject(e); });
      iap.requestPurchase({
        request: {
          apple: { sku: PRO_PRODUCT_ID },
          google: { skus: [PRO_PRODUCT_ID] },
        },
        type: 'in-app',
      }).catch(reject);
    });

    if (!(await verify(purchase))) return { ok: false, reason: 'unverified' };

    // Až TEĎ, po ověření. Non-consumable → `isConsumable: false`,
    // jinak by ho Play nabídl ke koupi znovu.
    await iap.finishTransaction({ purchase, isConsumable: false });
    return { ok: true };
  } catch (e: any) {
    const code = e?.code || '';
    if (code === 'E_USER_CANCELLED' || code === 'E_USER_ERROR') return { ok: false, reason: 'cancelled' };
    return { ok: false, reason: 'failed' };
  }
}

/**
 * Obnovení dřívějšího nákupu.
 *
 * Apple to VYŽADUJE — aplikace bez funkčního obnovení se zamítá. Týká se
 * to člověka s novým telefonem i toho, kdo appku smazal a nainstaloval znovu.
 */
export async function restorePro(): Promise<boolean> {
  if (!(await connect()) || !iap) return false;
  try {
    const purchases = await iap.getAvailablePurchases();
    const mine = purchases.filter((p) => p.productId === PRO_PRODUCT_ID);
    for (const p of mine) {
      if (await verify(p)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Uklidí spojení s obchodem. Volá se při odhlášení a ukončení appky. */
export async function endIap(): Promise<void> {
  if (!iap || !connected) return;
  try { await iap.endConnection(); } catch { /* nevadí */ }
  connected = false;
}
