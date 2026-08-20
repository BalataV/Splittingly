// Pravidla pro reklamu. Jsou součástí návrhu, ne obchodní vsuvka.
//
// PRINCIP: přerušovaná šedá linka (#5F5F5F) je SDĚLENÍ. Nikde jinde v appce
// se nevyskytuje, takže její tvar sám o sobě čte jako „tohle nejsme my".
// Nikdy proto ten rám nepoužívej na nic jiného.
//
// TVRDÉ PRAVIDLO: obrazovky, kde uživatel zadává nebo potvrzuje peníze,
// zůstávají komerčně prázdné. Chrání to důvěru v číslo — a to je jediná věc,
// kterou tahle appka prodává.

import type { ScreenName } from './types';

export type AdSlot = 'banner' | 'rectangle' | 'native' | 'interstitial' | 'rewarded';

/** Rozměry v pt, přesně podle zadání. */
export const AD_SIZES = {
  banner: { w: 320, h: 50 },
  rectangle: { w: 300, h: 250 },
};

/** Obrazovky, kde reklama NESMÍ být za žádných okolností. */
const AD_FREE: ScreenName[] = [
  'onboarding', 'signup', 'login', 'forgot', 'new_password', 'confirm_email', // 01–07
  'setup',                                                                     // úvodní nastavení
  'add_expense', 'split_method',                                               // zadávání peněz
  'settle',                                                                    // potvrzení platby
  'group',                                                                     // sídlí tu akce „Settle up"
];

/** Ukotvený banner 320×50 — jen tyhle čtyři obrazovky, vždy nad tab barem. */
const BANNER_SCREENS: ScreenName[] = ['overview', 'activity', 'stats'];

/** Obdélník 300×250 — výhradně na konci statistik, nikdy mezi dva datové bloky. */
const RECTANGLE_SCREENS: ScreenName[] = ['stats'];

/**
 * `hasContent` = uživatel už má aspoň jednu skupinu.
 *
 * Dokud nemá, reklama se NEUKÁŽE — prázdný stav to slibuje doslova
 * („No ads until you have something to look at.") a banner za tou větou by
 * z ní udělal lež. Zároveň je to obchodně správně: reklama předtím, než
 * člověk viděl produkt fungovat, jen zvyšuje šanci, že appku smaže.
 */
export function showBanner(screen: ScreenName, isPro: boolean, hasContent: boolean): boolean {
  if (isPro || !hasContent) return false;
  if (AD_FREE.includes(screen)) return false;
  return BANNER_SCREENS.includes(screen);
}

export function showRectangle(screen: ScreenName, isPro: boolean, hasContent = true): boolean {
  if (isPro || !hasContent) return false;
  if (AD_FREE.includes(screen)) return false;
  return RECTANGLE_SCREENS.includes(screen);
}

/**
 * Nativní řádek v aktivitě: každý dvanáctý. Poznávací znamení je to, co
 * NEMÁ — avatar a částku. Každý skutečný řádek má obojí, takže řádek bez
 * nich se nedá splést se skutečným obsahem.
 */
export const NATIVE_EVERY = 12;

export function isNativeAdRow(index: number, isPro: boolean): boolean {
  if (isPro) return false;
  return index > 0 && index % NATIVE_EVERY === 0;
}

/**
 * Celoobrazovková reklama: JEDNOU za spuštění a jedině po sdílení kartičky
 * nebo ročního přehledu. Nikdy při startu, nikdy po vyrovnání dluhu —
 * to je moment, který se nesmí zpeněžit.
 */
let interstitialShownThisSession = false;

export function mayShowInterstitial(trigger: 'share' | 'year', isPro: boolean): boolean {
  if (isPro) return false;
  if (interstitialShownThisSession) return false;
  return trigger === 'share' || trigger === 'year';
}

export function markInterstitialShown(): void {
  interstitialShownThisSession = true;
}

/** Doba, po kterou nejde zavřít. Zavírací cíl musí být 44×44 pt. */
export const INTERSTITIAL_MAX_SECONDS = 5;

/**
 * Odměněná reklama je JEDINÁ, kterou si uživatel vybere sám.
 * Za co dává smysl: odemknout barevné téma na 7 dní, nebo jednorázový export.
 */
export type RewardKind = 'theme' | 'export';
export const REWARD_THEME_DAYS = 7;

/** Nenápadná, ale přítomná cesta k placené verzi. Tři místa, víc ne. */
export const PRO_ENTRY_POINTS = [
  'settings_row',      // jeden řádek v nastavení
  'rectangle_close',   // ✕ na obdélníku ve statistikách
  'stats_footer',      // tichý pruh na konci statistik
] as const;
