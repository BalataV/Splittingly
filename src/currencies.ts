// Tabulka měn. Rozsah měn kopíruje rozsah jazyků (stejné regiony),
// ALE volí se NEZÁVISLE na jazyku — appka italsky a počítání v thajských
// bahtech je běžný stav, ne okrajový případ.
//
// O formátu částky rozhoduje MĚNA, ne jazyk:
//   • kolik desetinných míst (JPY/KRW/VND/ISK a spol. mají nula),
//   • na které straně stojí symbol,
//   • jaký je oddělovač tisíců a desetinné čárky.
// O směru čtení, pořadí data a skloňování rozhoduje JAZYK. Nic z toho se
// navzájem nepřebíjí.

export interface CurrencyDef {
  code: string;
  symbol: string;
  /** Počet desetinných míst. 0 = měna bez haléřů (viz ZERO_DECIMAL). */
  decimals: number;
  /** Stojí symbol před částkou, nebo za ní? */
  pos: 'before' | 'after';
  /** Oddělovač tisíců: '.' | ',' | ' ' (úzká mezera) | '' */
  group: string;
  /** Desetinný oddělovač: '.' | ',' */
  dec: string;
  /** Mezera mezi číslem a symbolem. */
  space: boolean;
  name: string;
}

/** Měny bez desetinných míst. Fraction se zahazuje VŠUDE, i v dělení. */
export const ZERO_DECIMAL = ['JPY', 'KRW', 'VND', 'ISK', 'HUF', 'CLP', 'IDR', 'RWF', 'UGX', 'XAF', 'XOF'];

export const CURRENCIES: CurrencyDef[] = [
  // --- eurozóna a západní Evropa -------------------------------------------
  { code: 'EUR', symbol: '€',   decimals: 2, pos: 'before', group: '.', dec: ',', space: false, name: 'Euro' },
  { code: 'GBP', symbol: '£',   decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'British Pound' },
  { code: 'CHF', symbol: 'CHF', decimals: 2, pos: 'before', group: ' ', dec: '.', space: true,  name: 'Swiss Franc' },
  { code: 'NOK', symbol: 'kr',  decimals: 2, pos: 'after',  group: ' ', dec: ',', space: true,  name: 'Norwegian Krone' },
  { code: 'SEK', symbol: 'kr',  decimals: 2, pos: 'after',  group: ' ', dec: ',', space: true,  name: 'Swedish Krona' },
  { code: 'DKK', symbol: 'kr.', decimals: 2, pos: 'after',  group: '.', dec: ',', space: true,  name: 'Danish Krone' },
  { code: 'ISK', symbol: 'kr',  decimals: 0, pos: 'after',  group: '.', dec: ',', space: true,  name: 'Icelandic Krona' },

  // --- střední a východní Evropa -------------------------------------------
  { code: 'CZK', symbol: 'Kč',  decimals: 2, pos: 'after',  group: ' ', dec: ',', space: true,  name: 'Czech Koruna' },
  { code: 'PLN', symbol: 'zł',  decimals: 2, pos: 'after',  group: ' ', dec: ',', space: true,  name: 'Polish Zloty' },
  { code: 'HUF', symbol: 'Ft',  decimals: 0, pos: 'after',  group: ' ', dec: ',', space: true,  name: 'Hungarian Forint' },
  { code: 'RON', symbol: 'lei', decimals: 2, pos: 'after',  group: '.', dec: ',', space: true,  name: 'Romanian Leu' },
  { code: 'BGN', symbol: 'лв',  decimals: 2, pos: 'after',  group: ' ', dec: ',', space: true,  name: 'Bulgarian Lev' },
  { code: 'HRK', symbol: 'kn',  decimals: 2, pos: 'after',  group: '.', dec: ',', space: true,  name: 'Croatian Kuna' },
  { code: 'RSD', symbol: 'дин', decimals: 2, pos: 'after',  group: '.', dec: ',', space: true,  name: 'Serbian Dinar' },
  { code: 'UAH', symbol: '₴',   decimals: 2, pos: 'after',  group: ' ', dec: ',', space: true,  name: 'Ukrainian Hryvnia' },
  { code: 'RUB', symbol: '₽',   decimals: 2, pos: 'after',  group: ' ', dec: ',', space: true,  name: 'Russian Ruble' },
  { code: 'TRY', symbol: '₺',   decimals: 2, pos: 'before', group: '.', dec: ',', space: false, name: 'Turkish Lira' },

  // --- Amerika --------------------------------------------------------------
  { code: 'USD', symbol: '$',   decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'US Dollar' },
  { code: 'CAD', symbol: '$',   decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'Canadian Dollar' },
  { code: 'MXN', symbol: '$',   decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$',  decimals: 2, pos: 'before', group: '.', dec: ',', space: true,  name: 'Brazilian Real' },
  { code: 'ARS', symbol: '$',   decimals: 2, pos: 'before', group: '.', dec: ',', space: true,  name: 'Argentine Peso' },
  { code: 'CLP', symbol: '$',   decimals: 0, pos: 'before', group: '.', dec: ',', space: false, name: 'Chilean Peso' },
  { code: 'COP', symbol: '$',   decimals: 2, pos: 'before', group: '.', dec: ',', space: true,  name: 'Colombian Peso' },
  { code: 'PEN', symbol: 'S/',  decimals: 2, pos: 'before', group: ',', dec: '.', space: true,  name: 'Peruvian Sol' },

  // --- Asie a Tichomoří -----------------------------------------------------
  { code: 'JPY', symbol: '¥',   decimals: 0, pos: 'before', group: ',', dec: '.', space: false, name: 'Japanese Yen' },
  { code: 'KRW', symbol: '₩',   decimals: 0, pos: 'before', group: ',', dec: '.', space: false, name: 'South Korean Won' },
  { code: 'CNY', symbol: '¥',   decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'Chinese Yuan' },
  { code: 'TWD', symbol: 'NT$', decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'New Taiwan Dollar' },
  { code: 'HKD', symbol: 'HK$', decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'Hong Kong Dollar' },
  { code: 'SGD', symbol: 'S$',  decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'Singapore Dollar' },
  { code: 'THB', symbol: '฿',   decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'Thai Baht' },
  { code: 'VND', symbol: '₫',   decimals: 0, pos: 'after',  group: '.', dec: ',', space: true,  name: 'Vietnamese Dong' },
  { code: 'IDR', symbol: 'Rp',  decimals: 0, pos: 'before', group: '.', dec: ',', space: false, name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM',  decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'Malaysian Ringgit' },
  { code: 'PHP', symbol: '₱',   decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'Philippine Peso' },
  { code: 'INR', symbol: '₹',   decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'Indian Rupee' },
  { code: 'PKR', symbol: 'Rs',  decimals: 2, pos: 'before', group: ',', dec: '.', space: true,  name: 'Pakistani Rupee' },
  { code: 'BDT', symbol: '৳',   decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'Bangladeshi Taka' },
  { code: 'AUD', symbol: 'A$',  decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'Australian Dollar' },
  { code: 'NZD', symbol: 'NZ$', decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'New Zealand Dollar' },

  // --- Blízký východ a Afrika ----------------------------------------------
  { code: 'AED', symbol: 'د.إ', decimals: 2, pos: 'before', group: ',', dec: '.', space: true,  name: 'UAE Dirham' },
  { code: 'SAR', symbol: 'ر.س', decimals: 2, pos: 'before', group: ',', dec: '.', space: true,  name: 'Saudi Riyal' },
  { code: 'ILS', symbol: '₪',   decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'Israeli Shekel' },
  { code: 'EGP', symbol: 'E£',  decimals: 2, pos: 'before', group: ',', dec: '.', space: true,  name: 'Egyptian Pound' },
  { code: 'MAD', symbol: 'DH',  decimals: 2, pos: 'after',  group: ' ', dec: ',', space: true,  name: 'Moroccan Dirham' },
  { code: 'ZAR', symbol: 'R',   decimals: 2, pos: 'before', group: ' ', dec: ',', space: true,  name: 'South African Rand' },
  { code: 'NGN', symbol: '₦',   decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', decimals: 2, pos: 'before', group: ',', dec: '.', space: true,  name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: '₵',   decimals: 2, pos: 'before', group: ',', dec: '.', space: false, name: 'Ghanaian Cedi' },
];

const BY_CODE: Record<string, CurrencyDef> = {};
CURRENCIES.forEach((c) => { BY_CODE[c.code] = c; });

/** Definice měny; neznámý kód spadne na univerzální dvoudesetinný tvar. */
export function currency(code: string): CurrencyDef {
  return BY_CODE[code] || { code, symbol: code, decimals: 2, pos: 'after', group: ',', dec: '.', space: true, name: code };
}

/** Kolik desetinných míst má měna. Jediné místo, kde se to rozhoduje. */
export function decimalsOf(code: string): number {
  return currency(code).decimals;
}

/** Kolik minor units tvoří jednu jednotku měny. EUR → 100, JPY → 1. */
export function minorFactor(code: string): number {
  return Math.pow(10, decimalsOf(code));
}

/** Nejčastější měny nahoře v seznamu (obrazovka 24). */
export const FAVOURITE_CURRENCIES = ['EUR', 'USD', 'GBP', 'THB', 'JPY'];

/**
 * Nejširší podporovaný tvar částky. Layout si podle něj rezervuje místo,
 * aby skupina za 12 € a skupina za 2 500 000 IDR měly stejnou mřížku.
 */
export const WIDEST_AMOUNT_SAMPLE = 'Rp2.500.000';
