// Agregace pro statistiky (17), roční přehled (18) a sdílecí kartičku (21).
//
// Vše se počítá po měnách. Když skupina utrácela ve dvou měnách, statistika
// ukáže dva bloky — nikdy jeden přepočtený součet.

import { shareOf } from './money';
import { CATEGORIES } from './categories';
import type { Expense, StatsPeriod, Group } from './types';

export interface CategoryTotal { key: string; amountMinor: number; pct: number; }
export interface SpenderTotal { name: string; amountMinor: number; }

function since(period: StatsPeriod): number {
  const now = Date.now();
  if (period === 'month') return now - 30 * 86400000;
  if (period === 'trip') return now - 14 * 86400000;
  return 0;
}

export function inPeriod(expenses: Expense[], period: StatsPeriod): Expense[] {
  const from = since(period);
  if (!from) return expenses;
  return expenses.filter((e) => new Date(e.spentAt).getTime() >= from);
}

/** Hlavní měna skupiny podle objemu — v ní se kreslí graf. */
export function dominantCurrency(expenses: Expense[], fallback: string): string {
  const totals: Record<string, number> = {};
  expenses.forEach((e) => { totals[e.currency] = (totals[e.currency] || 0) + e.amountMinor; });
  const keys = Object.keys(totals);
  if (!keys.length) return fallback;
  return keys.sort((a, b) => totals[b] - totals[a])[0];
}

export function total(expenses: Expense[], currency: string): number {
  return expenses.filter((e) => e.currency === currency).reduce((a, e) => a + e.amountMinor, 0);
}

export function byCategory(expenses: Expense[], currency: string): CategoryTotal[] {
  const sums: Record<string, number> = {};
  expenses.filter((e) => e.currency === currency).forEach((e) => {
    sums[e.category] = (sums[e.category] || 0) + e.amountMinor;
  });
  const all = Object.values(sums).reduce((a, b) => a + b, 0) || 1;
  return CATEGORIES
    .map((c) => ({ key: c.key, amountMinor: sums[c.key] || 0, pct: Math.round(((sums[c.key] || 0) / all) * 100) }))
    .filter((c) => c.amountMinor > 0)
    .sort((a, b) => b.amountMinor - a.amountMinor);
}

/** Kdo utrácí nejvíc — podle toho, kolik na koho PŘIPADLO, ne kolik zaplatil. */
export function bySpender(group: Group, expenses: Expense[], currency: string): SpenderTotal[] {
  const sums: Record<string, number> = {};
  group.members.forEach((m) => { sums[m] = 0; });
  expenses.filter((e) => e.currency === currency).forEach((e) => {
    e.parts.forEach((p) => {
      sums[p] = (sums[p] || 0) + shareOf(e.amountMinor, e.parts, e.splitType, e.shares, e.exactMinor, e.payer, p);
    });
  });
  return Object.keys(sums)
    .map((name) => ({ name, amountMinor: sums[name] }))
    .sort((a, b) => b.amountMinor - a.amountMinor);
}

/** Sedm sloupců = posledních sedm dní. Graf v handoffu má přesně tenhle tvar. */
export function weeklyBars(expenses: Expense[], currency: string): { day: string; amountMinor: number }[] {
  const initials = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const out: { day: string; amountMinor: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * 86400000);
    const next = d.getTime() + 86400000;
    const sum = expenses
      .filter((e) => e.currency === currency)
      .filter((e) => {
        const t = new Date(e.spentAt).getTime();
        return t >= d.getTime() && t < next;
      })
      .reduce((a, e) => a + e.amountMinor, 0);
    out.push({ day: initials[d.getDay()], amountMinor: sum });
  }
  return out;
}

// --------------------------------------------------------------- spending trends
//
// Pro feature „spending trends" (batch 2). Jen výpočet — obrazovku staví
// ui-a-lokalizace. Vše po měnách, nikdy jeden přepočtený součet. Hranice
// měsíce v LOKÁLNÍM čase zařízení, stejně jako `weeklyBars` výše.

export interface MonthlyTotal { month: string; totalMinor: number; }
export interface CategoryDrift {
  category: string;
  currentMinor: number;
  prevMinor: number;
  deltaMinor: number;
}
export interface TrendSummary {
  thisMonthMinor: number;
  lastMonthMinor: number;
  /** Procentní změna proti minulému měsíci; `null` když minulý měsíc byl 0. */
  pctChange: number | null;
}

/** Klíč kalendářního měsíce v lokálním čase: `2026-08`. */
function monthKey(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

/**
 * Součty výdajů po kalendářních měsících za posledních `monthsBack` měsíců
 * (poslední prvek = aktuální, ještě neuzavřený měsíc). Souvislá řada:
 * měsíc bez výdajů má `totalMinor: 0`. Jen daná měna.
 */
export function monthlyTotals(expenses: Expense[], currency: string, monthsBack: number): MonthlyTotal[] {
  const n = Math.max(0, Math.floor(monthsBack));
  if (n === 0) return [];
  const now = new Date();
  const buckets: MonthlyTotal[] = [];
  const at: Record<string, number> = {};
  for (let i = n - 1; i >= 0; i -= 1) {
    // Date normalizuje záporný měsíc → přelom roku řeší sám.
    const key = monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1));
    at[key] = buckets.length;
    buckets.push({ month: key, totalMinor: 0 });
  }
  expenses
    .filter((e) => e.currency === currency)
    .forEach((e) => {
      const d = new Date(e.spentAt);
      if (Number.isNaN(d.getTime())) return;
      const idx = at[monthKey(d)];
      if (idx !== undefined) buckets[idx].totalMinor += e.amountMinor;
    });
  return buckets;
}

/**
 * Posun útraty po kategoriích: `monthsBack` uzavřených měsíců těsně před
 * aktuálním měsícem („current") proti stejně dlouhému oknu před nimi
 * („prev"). Pro `monthsBack = 1` je to „poslední dokončený měsíc vs.
 * předchozí". Jen daná měna. Řazeno podle `abs(deltaMinor)` sestupně,
 * při shodě podle názvu kategorie (deterministicky).
 */
export function categoryDrift(expenses: Expense[], currency: string, monthsBack: number): CategoryDrift[] {
  const w = Math.max(1, Math.floor(monthsBack));
  const now = new Date();
  const currentEnd = new Date(now.getFullYear(), now.getMonth(), 1).getTime();       // začátek aktuálního měsíce, exkluzivně
  const currentStart = new Date(now.getFullYear(), now.getMonth() - w, 1).getTime();
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 2 * w, 1).getTime();
  const prevEnd = currentStart;

  const cur: Record<string, number> = {};
  const prev: Record<string, number> = {};
  expenses
    .filter((e) => e.currency === currency)
    .forEach((e) => {
      const t = new Date(e.spentAt).getTime();
      if (Number.isNaN(t)) return;
      if (t >= currentStart && t < currentEnd) cur[e.category] = (cur[e.category] || 0) + e.amountMinor;
      else if (t >= prevStart && t < prevEnd) prev[e.category] = (prev[e.category] || 0) + e.amountMinor;
    });

  return Array.from(new Set([...Object.keys(cur), ...Object.keys(prev)]))
    .map((category) => {
      const currentMinor = cur[category] || 0;
      const prevMinor = prev[category] || 0;
      return { category, currentMinor, prevMinor, deltaMinor: currentMinor - prevMinor };
    })
    .sort((a, b) => (Math.abs(b.deltaMinor) - Math.abs(a.deltaMinor)) || a.category.localeCompare(b.category));
}

/** Tento měsíc vs. minulý (daná měna). `pctChange` je `null`, když minulý měsíc byl 0. */
export function trendSummary(expenses: Expense[], currency: string): TrendSummary {
  const now = new Date();
  const thisKey = monthKey(new Date(now.getFullYear(), now.getMonth(), 1));
  const lastKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  let thisMonthMinor = 0;
  let lastMonthMinor = 0;
  expenses
    .filter((e) => e.currency === currency)
    .forEach((e) => {
      const d = new Date(e.spentAt);
      if (Number.isNaN(d.getTime())) return;
      const key = monthKey(d);
      if (key === thisKey) thisMonthMinor += e.amountMinor;
      else if (key === lastKey) lastMonthMinor += e.amountMinor;
    });
  const pctChange = lastMonthMinor === 0
    ? null
    : ((thisMonthMinor - lastMonthMinor) / lastMonthMinor) * 100;
  return { thisMonthMinor, lastMonthMinor, pctChange };
}

/** Hravé superlativy do žebříčku (obrazovka 18). Text prochází přes t(). */
export const SUPERLATIVES = [
  'Most generous payer',
  'Fastest to settle up',
  'Longest unpaid streak',
  'Smallest expense',
  'Most expenses logged',
];
