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

/** Hravé superlativy do žebříčku (obrazovka 18). Text prochází přes t(). */
export const SUPERLATIVES = [
  'Most generous payer',
  'Fastest to settle up',
  'Longest unpaid streak',
  'Smallest expense',
  'Most expenses logged',
];
