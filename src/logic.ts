// Výpočet bilancí a minimalizace počtu převodů.
//
// „You" = přihlášený uživatel. Ve store se člen, jehož `user_id` sedí na můj
// účet, přejmenuje na „You"; celá tahle vrstva je tedy jméno-orientovaná.
//
// Každá měna se počítá ZVLÁŠŤ. Deset eur a tisíc bahtů se nikdy nesečte —
// orientační přepočet je jen popisek navíc, nikdy vstup do výpočtu.

import { shareOf } from './money';
import type { Group, Expense, Payment, Transfer, MoneyMap } from './types';

export const ME = 'You';

/** Které měny se ve skupině reálně vyskytují. */
export function currenciesIn(expenses: Expense[] = [], payments: Payment[] = [], fallback = 'EUR'): string[] {
  const s = new Set<string>();
  expenses.forEach((e) => s.add(e.currency));
  payments.forEach((p) => s.add(p.currency));
  if (!s.size) s.add(fallback);
  return Array.from(s);
}

/**
 * Čistá bilance členů pro JEDNU měnu: co zaplatil minus jeho podíl,
 * upraveno o už provedené platby. Kladné číslo = má dostat.
 */
export function netFor(
  group: Group,
  expenses: Expense[] = [],
  payments: Payment[] = [],
  currency = 'EUR',
): Record<string, number> {
  const net: Record<string, number> = {};
  group.members.forEach((m) => { net[m] = 0; });

  expenses.filter((e) => e.currency === currency).forEach((e) => {
    net[e.payer] = (net[e.payer] || 0) + e.amountMinor;
    e.parts.forEach((p) => {
      net[p] = (net[p] || 0) - shareOf(e.amountMinor, e.parts, e.splitType, e.shares, e.exactMinor, e.payer, p);
    });
  });

  // Provedená platba: kdo poslal, ten si dluh snížil; komu přišla, tomu ubyla pohledávka.
  payments.filter((p) => p.currency === currency).forEach((p) => {
    net[p.from] = (net[p.from] || 0) + p.amountMinor;
    net[p.to] = (net[p.to] || 0) - p.amountMinor;
  });

  return net;
}

/**
 * Minimalizace počtu převodů — hladový algoritmus: největší dlužník platí
 * největšímu věřiteli, dokud jednomu z nich nedojde částka. U n členů
 * potřebuje nejvýš n−1 převodů (místo n×(n−1)/2 párových vyrovnání).
 *
 * Je to heuristika, ne důkazově minimální rozklad — hledání skutečného
 * minima je NP-těžké a pro pět kamarádů u večeře by to byla parodie na
 * inženýrství. Na reálných skupinách dává stejný výsledek.
 */
export function transfersFor(group: Group, expenses: Expense[] = [], payments: Payment[] = []): Transfer[] {
  const out: Transfer[] = [];
  currenciesIn(expenses, payments, group.currency).forEach((cur) => {
    const net = netFor(group, expenses, payments, cur);
    const cred: { n: string; a: number }[] = [];
    const deb: { n: string; a: number }[] = [];
    Object.keys(net).forEach((n) => {
      if (net[n] > 0) cred.push({ n, a: net[n] });
      else if (net[n] < 0) deb.push({ n, a: -net[n] });
    });
    cred.sort((x, y) => y.a - x.a);
    deb.sort((x, y) => y.a - x.a);

    let i = 0;
    let j = 0;
    while (i < deb.length && j < cred.length) {
      const m = Math.min(deb[i].a, cred[j].a);
      if (m > 0) {
        out.push({
          id: [group.id, cur, deb[i].n, cred[j].n].join('|'),
          groupId: group.id,
          currency: cur,
          from: deb[i].n,
          to: cred[j].n,
          amountMinor: m,
        });
      }
      deb[i].a -= m;
      cred[j].a -= m;
      if (deb[i].a === 0) i += 1;
      if (cred[j].a === 0) j += 1;
    }
  });
  return out;
}

/** Je skupina vyrovnaná? (Emocionální vrchol appky — obrazovka 16b.) */
export function isSettled(group: Group, expenses: Expense[] = [], payments: Payment[] = []): boolean {
  return transfersFor(group, expenses, payments).length === 0;
}

/** Moje bilance ve skupině po měnách. */
export function myNet(group: Group, expenses: Expense[] = [], payments: Payment[] = []): MoneyMap {
  const map: MoneyMap = {};
  currenciesIn(expenses, payments, group.currency).forEach((cur) => {
    const n = netFor(group, expenses, payments, cur)[ME] || 0;
    if (n) map[cur] = n;
  });
  return map;
}

function collect(
  groups: Group[],
  expenses: Record<string, Expense[]>,
  payments: Record<string, Payment[]>,
  pick: (t: Transfer) => boolean,
): Transfer[] {
  const all: Transfer[] = [];
  groups.forEach((g) => {
    transfersFor(g, expenses[g.id], payments[g.id]).forEach((tr) => { if (pick(tr)) all.push(tr); });
  });
  return all;
}

export function myDebts(groups: Group[], expenses: Record<string, Expense[]>, payments: Record<string, Payment[]>): Transfer[] {
  return collect(groups, expenses, payments, (t) => t.from === ME);
}

export function myCredits(groups: Group[], expenses: Record<string, Expense[]>, payments: Record<string, Payment[]>): Transfer[] {
  return collect(groups, expenses, payments, (t) => t.to === ME);
}

function sumByCurrency(transfers: Transfer[]): MoneyMap {
  const map: MoneyMap = {};
  transfers.forEach((t) => { map[t.currency] = (map[t.currency] || 0) + t.amountMinor; });
  return map;
}

export function totalOwe(groups: Group[], e: Record<string, Expense[]>, p: Record<string, Payment[]>): MoneyMap {
  return sumByCurrency(myDebts(groups, e, p));
}

export function totalOwed(groups: Group[], e: Record<string, Expense[]>, p: Record<string, Payment[]>): MoneyMap {
  return sumByCurrency(myCredits(groups, e, p));
}

export function hasAny(map: MoneyMap): boolean {
  return Object.keys(map || {}).some((k) => map[k] !== 0);
}

/** Iniciála pro avatar. „You" má vlastní značku, ať se neplete s cizím jménem. */
export function initial(name: string): string {
  if (name === ME) return '★';
  return name ? name.trim()[0].toUpperCase() : '?';
}
