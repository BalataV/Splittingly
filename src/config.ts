// Centrální konfigurace veřejných adres.
//
// ⚠️ DOMÉNA: splittingly.com zatím nemáš koupenou. Dokud ji nekoupíš, nech tady
// dočasnou adresu GitHub Pages a v `app.json` NECH `associatedDomains` /
// `intentFilters` tak, jak jsou — jen si uvědom, že hluboké odkazy
// (App Links / Universal Links) začnou fungovat AŽ na vlastní doméně.
// Podrobně viz IMPLEMENTACE.md, krok 2.
//
// Až doménu koupíš, změň jediný řádek níž a přepiš host v `app.json`.
export const LANDING_BASE = 'https://splittingly.com';

// Odkaz, který se sdílí kamarádům.
//
// POZOR na tvar adresy: musí být na VLASTNÍ cestě `/join/`, ne na kořeni.
// Android App Links umí filtrovat jen podle cesty, ne podle query — kdyby
// pozvánka byla `/?g=KÓD`, filtr by musel chytat celou doménu a appka by
// spolkla i `/app/?token_hash=…`, tedy odkazy na potvrzení e-mailu a obnovu
// hesla. Ty musí zůstat v prohlížeči. Díky `/join/` si každý bere svoje.
export function landingJoinUrl(code: string): string {
  return LANDING_BASE + '/join/?g=' + code;
}

// Veřejně hostované dokumenty (obchody je vyžadují).
export const PRIVACY_URL = LANDING_BASE + '/privacy.html';
export const TERMS_URL = LANDING_BASE + '/terms.html';
export const SUPPORT_URL = LANDING_BASE + '/support.html';
export const DELETE_ACCOUNT_URL = LANDING_BASE + '/delete-account.html';
export const SUPPORT_EMAIL = 'support@splittingly.com';

// Odkazy do obchodů — doplň po vydání.
export const APP_STORE_URL = '';
export const PLAY_STORE_URL = '';

// Jednorázový nákup „bez reklam".
//
// ZÁMĚRNĚ NENÍ PŘEDPLATNÉ. Splittingly se používá nárazově (dovolená, pár
// měsíců spolubydlení, pak pauza) — měsíční platba za takovou appku se ruší
// a stahuje hodnocení dolů. „One payment. No subscription." je navíc jeden
// z mála argumentů, kterým se produkt odliší; je natvrdo na obrazovce 27
// i na webu. Než to změníš, přepiš obojí.
//
// Skutečnou cenu vždycky čti z obchodu (StoreKit / Play Billing) — tahle
// konstanta je jen záloha, než se ceník načte, a pro měny se to jinak rozjede.
export const PRO_PRODUCT_ID = 'splittingly_pro';
export const PRO_PRICE_FALLBACK = '$4.99';
