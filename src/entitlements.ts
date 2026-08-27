// Co umí bezplatná verze a co odemyká Pro.
//
// JEDINÉ MÍSTO, kde se to rozhoduje. Obrazovky se sem ptají, nikdy si
// pravidlo nedomýšlejí samy — jinak se za půl roku rozejdou.
//
// ŘÍDÍCÍ PRINCIP:
//   Omezuj jen to, co se dotkne PLÁTCE. Nikdy to, co se dotkne ostatních
//   členů skupiny.
//
// Skupina je sdílená. Kdyby si Kenji nemohl přidat výdaj jen proto, že
// Mira nekoupila Pro, doplácejí na obchodní model lidé, kteří s ním nemají
// nic společného. Proto se NIKDY neomezuje počet skupin, členů ani výdajů,
// výpočet vyrovnání ani sdílení pozvánkou.
//
// Účtenka je zvláštní případ: není to bonus, je to DŮKAZ — přesně ta věc,
// která brání hádce, o kterou v celé appce jde. Proto se nevypíná, jen se
// omezuje počet. Free si účtenku vyfotí taky; Pro jich unese kolik chce.
// (Zároveň je to jediná položka, která reálně žere úložiště.)

import type { StatsPeriod, ThemeName } from './types';
import { THEMES } from './theme';

/**
 * Kolik účtenek smí viset na jednom výdaji.
 *
 * POZNÁMKA K VYNUCENÍ: tenhle limit je KLIENTSKÝ. RLS o Pro nic neví, takže
 * kdo si pohraje s API, obejde ho. Je to vědomé rozhodnutí — cena za obcházení
 * je pár fotek navíc, ne únik dat. Kdyby to začalo vadit (náklady na úložiště),
 * přidej do `schema.sql` politiku, která u insertu do `expense_receipts`
 * porovná počet řádků s `profiles.is_pro`.
 */
export const FREE_RECEIPTS_PER_EXPENSE = 1;

export function maxReceipts(isPro: boolean): number {
  return isPro ? Infinity : FREE_RECEIPTS_PER_EXPENSE;
}

export function canAddReceipt(isPro: boolean, current: number): boolean {
  return current < maxReceipts(isPro);
}

/** Období ve statistikách. Bez Pro jen aktuální měsíc. */
export function allowedPeriods(isPro: boolean): StatsPeriod[] {
  return isPro ? ['month', 'trip', 'all'] : ['month'];
}

export function canUsePeriod(isPro: boolean, period: StatsPeriod): boolean {
  return allowedPeriods(isPro).includes(period);
}

/** Koláčový graf rozpadu podle kategorie ve statistikách. */
export function canUsePieChart(isPro: boolean): boolean {
  return isPro;
}

/**
 * Barevná témata. „Dusk" je za Pro, nebo dočasně za odměněné video (7 dní).
 * Odměněná reklama je jediná, kterou si uživatel vybere sám.
 */
export function canUseTheme(theme: ThemeName, isPro: boolean, rewardTheme: ThemeName | null, rewardUntil: string | null): boolean {
  if (!THEMES[theme]?.pro) return true;
  if (isPro) return true;
  if (rewardTheme === theme && rewardUntil && new Date(rewardUntil) > new Date()) return true;
  return false;
}

/** Export skupiny do CSV / PDF. */
export function canExport(isPro: boolean): boolean {
  return isPro;
}

/**
 * Opakované výdaje — šablona, která sama vytváří výdaje podle rozvrhu
 * (nájem, předplatné). Automatizace je perk plátce: free uživatel ten samý
 * výdaj přidá ručně, takže se neomezuje nic, co se dotkne ostatních členů
 * skupiny — jen se plátci ušetří klikání.
 *
 * POZNÁMKA K VYNUCENÍ: tenhle gate je KLIENTSKÝ, stejně jako
 * `FREE_RECEIPTS_PER_EXPENSE`. RLS o Pro neví, takže kdo si pohraje s API,
 * šablonu si založí i bez Pro. Vědomé rozhodnutí — cena za obcházení je pár
 * automaticky přidaných výdajů ve vlastní skupině, ne únik dat. Kdyby to
 * začalo vadit, přidej do `schema.sql` k politice `recurring_insert`
 * porovnání s `profiles.is_pro`.
 */
export function canUseRecurring(isPro: boolean): boolean {
  return isPro;
}

/**
 * Trendy ve statistikách (vývoj útrat v čase, meziměsíční srovnání).
 *
 * POZNÁMKA K VYNUCENÍ: klientský gate jako `FREE_RECEIPTS_PER_EXPENSE`.
 * Jde jen o zobrazení nad daty, která uživatel stejně vidí — obejití přes
 * API nikoho nepoškodí, jen si plátce zpřehlední vlastní čísla.
 */
export function canUseTrends(isPro: boolean): boolean {
  return isPro;
}

/**
 * Zakládání vlastních kategorií skupiny. Default kategorie (`src/categories.ts`)
 * i custom kategorie od Pro členů vidí a používají všichni — omezené je jen
 * *vytvoření* nové.
 *
 * POZNÁMKA K VYNUCENÍ: klientský gate jako `FREE_RECEIPTS_PER_EXPENSE`. RLS
 * pouští insert každému členovi skupiny. Kdo si pohraje s API, kategorii si
 * založí i bez Pro — nikoho jiného to nepoškodí. Kdyby vadilo, přidej do
 * `schema.sql` k politice `categories_insert` porovnání s `profiles.is_pro`.
 */
export function canUseCustomCategories(isPro: boolean): boolean {
  return isPro;
}

/**
 * Zamčení převodního kurzu na výdaji (`expenses.fx_rate` / `fx_ccy`).
 *
 * POZNÁMKA K VYNUCENÍ: klientský gate jako `FREE_RECEIPTS_PER_EXPENSE`.
 * Kurz je jen doplňkové zobrazení — s penězi se počítá výhradně v měně
 * výdaje. Obejití přes API nikoho jiného nepoškodí.
 */
export function canUseFxLock(isPro: boolean): boolean {
  return isPro;
}

/**
 * Roční přehled a sdílecí kartička zůstávají ZDARMA i bez Pro.
 *
 * Je to jediná funkce, kterou uživatel dobrovolně ukáže dál — zamknout si ji
 * znamená zamknout si vlastní růst. Placené je detailní rozpad ve
 * statistikách, ne hravé shrnutí ke sdílení.
 */
export const YEAR_IN_REVIEW_IS_FREE = true;

/** Co se ukazuje na obrazovce 27 jako seznam výhod. Pořadí je záměrné. */
export const PRO_BENEFITS = [
  'No banners, no native rows, no interstitials',
  'Unlimited receipt photos',
  'Full stats history — trip and all-time, not just this month',
  'Pie chart breakdown by category',
  'All colour themes, including Dusk',
  'CSV and PDF export per group',
  'Recurring expenses — set up rent or a subscription once, it adds itself',
];
