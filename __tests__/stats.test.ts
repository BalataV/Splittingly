// Spending trends — čisté výpočetní funkce (Pro, batch 2).
//
// Datum výdaje se zařazuje do kalendářního měsíce v LOKÁLNÍM čase zařízení.
// Testy staví data relativně k `new Date()`, aby nezávisely na dni spuštění.
// Den 15 v měsíci drží data bezpečně daleko od hranice měsíce i po převodu
// přes ISO (UTC), takže se měsíc nezmění posunem časové zóny.

import { monthlyTotals, categoryDrift, trendSummary, byCategory } from '../src/stats';
import type { Expense } from '../src/types';

const mk = (o: Partial<Expense> & { amountMinor: number; spentAt: string }): Expense => ({
  id: 'e' + Math.random(),
  groupId: 'g1',
  desc: 'x',
  currency: 'EUR',
  payer: 'You',
  parts: ['You'],
  splitType: 'equal',
  shares: null,
  exactMinor: null,
  category: 'Food',
  receipts: [],
  editCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  ...o,
});

/** ISO řetězec pro 15. den měsíce `k` měsíců zpět od teď. */
const agoIso = (k: number, day = 15): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - k, day).toISOString();
};

/** Klíč `YYYY-MM` pro měsíc `k` měsíců zpět od teď (lokálně). */
const agoKey = (k: number): string => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
};

/** Následující kalendářní měsíc k danému klíči (přes přelom roku). */
const nextKey = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m, 1); // m je 1-based → new Date(y, m) = následující měsíc
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
};

describe('monthlyTotals', () => {
  it('prázdný vstup → souvislá řada samých nul', () => {
    const s = monthlyTotals([], 'EUR', 6);
    expect(s).toHaveLength(6);
    expect(s.every((b) => b.totalMinor === 0)).toBe(true);
    expect(s[s.length - 1].month).toBe(agoKey(0)); // poslední = aktuální měsíc
    expect(s[0].month).toBe(agoKey(5));
  });

  it('monthsBack 0 nebo záporné → prázdné pole', () => {
    expect(monthlyTotals([], 'EUR', 0)).toEqual([]);
    expect(monthlyTotals([], 'EUR', -3)).toEqual([]);
  });

  it('jedna měna: součty padnou do správných měsíců', () => {
    const e = [
      mk({ amountMinor: 1000, spentAt: agoIso(0) }),
      mk({ amountMinor: 250, spentAt: agoIso(0) }),
      mk({ amountMinor: 4000, spentAt: agoIso(2) }),
    ];
    const s = monthlyTotals(e, 'EUR', 4);
    expect(s.map((b) => b.totalMinor)).toEqual([0, 4000, 0, 1250]);
  });

  it('víc měn: cizí měna se ignoruje', () => {
    const e = [
      mk({ amountMinor: 1000, spentAt: agoIso(0), currency: 'EUR' }),
      mk({ amountMinor: 9999, spentAt: agoIso(0), currency: 'USD' }),
      mk({ amountMinor: 500, spentAt: agoIso(1), currency: 'EUR' }),
    ];
    const s = monthlyTotals(e, 'EUR', 3);
    expect(s.map((b) => b.totalMinor)).toEqual([0, 500, 1000]);
  });

  it('měsíc bez výdajů uprostřed řady zůstane nulový', () => {
    const e = [
      mk({ amountMinor: 700, spentAt: agoIso(3) }),
      mk({ amountMinor: 800, spentAt: agoIso(0) }),
    ];
    const s = monthlyTotals(e, 'EUR', 4);
    expect(s.map((b) => b.totalMinor)).toEqual([700, 0, 0, 800]);
  });

  it('řada delší než rok má souvislé po sobě jdoucí měsíce (přelom roku)', () => {
    const s = monthlyTotals([], 'EUR', 15);
    expect(s).toHaveLength(15);
    for (let i = 1; i < s.length; i += 1) {
      expect(s[i].month).toBe(nextKey(s[i - 1].month));
    }
    // v 15 po sobě jdoucích měsících je aspoň jeden leden → přelom roku pokryt
    expect(s.some((b) => b.month.endsWith('-01'))).toBe(true);
  });

  it('výdaj mimo okno se nezapočítá', () => {
    const e = [mk({ amountMinor: 5000, spentAt: agoIso(10) })];
    const s = monthlyTotals(e, 'EUR', 3);
    expect(s.every((b) => b.totalMinor === 0)).toBe(true);
  });

  it('neplatné datum výdaj vynechá, nespadne', () => {
    const e = [
      mk({ amountMinor: 100, spentAt: 'není datum' }),
      mk({ amountMinor: 900, spentAt: agoIso(0) }),
    ];
    const s = monthlyTotals(e, 'EUR', 2);
    expect(s.map((b) => b.totalMinor)).toEqual([0, 900]);
  });
});

describe('categoryDrift', () => {
  it('prázdný vstup → prázdné pole', () => {
    expect(categoryDrift([], 'EUR', 1)).toEqual([]);
  });

  it('monthsBack 1: poslední dokončený měsíc vs. předchozí, per kategorie', () => {
    const e = [
      // poslední dokončený měsíc (1 zpět)
      mk({ amountMinor: 5000, spentAt: agoIso(1), category: 'Food' }),
      mk({ amountMinor: 1500, spentAt: agoIso(1), category: 'Bar' }),
      // předchozí měsíc (2 zpět)
      mk({ amountMinor: 3000, spentAt: agoIso(2), category: 'Food' }),
      mk({ amountMinor: 4000, spentAt: agoIso(2), category: 'Taxi' }),
    ];
    const d = categoryDrift(e, 'EUR', 1);
    // Taxi zmizelo (−4000), Food +2000, Bar přibyl (+1500) → řazeno dle abs
    expect(d).toEqual([
      { category: 'Taxi', currentMinor: 0, prevMinor: 4000, deltaMinor: -4000 },
      { category: 'Food', currentMinor: 5000, prevMinor: 3000, deltaMinor: 2000 },
      { category: 'Bar', currentMinor: 1500, prevMinor: 0, deltaMinor: 1500 },
    ]);
  });

  it('aktuální (neuzavřený) měsíc se do „current" nepočítá', () => {
    const e = [
      mk({ amountMinor: 9999, spentAt: agoIso(0), category: 'Food' }), // tento měsíc — ignorovat
      mk({ amountMinor: 1000, spentAt: agoIso(1), category: 'Food' }),
      mk({ amountMinor: 400, spentAt: agoIso(2), category: 'Food' }),
    ];
    expect(categoryDrift(e, 'EUR', 1)).toEqual([
      { category: 'Food', currentMinor: 1000, prevMinor: 400, deltaMinor: 600 },
    ]);
  });

  it('monthsBack 2: okna jsou dvouměsíční a sousedí', () => {
    const e = [
      // current okno = měsíce 1 a 2 zpět
      mk({ amountMinor: 1000, spentAt: agoIso(1), category: 'Food' }),
      mk({ amountMinor: 1000, spentAt: agoIso(2), category: 'Food' }),
      // prev okno = měsíce 3 a 4 zpět
      mk({ amountMinor: 500, spentAt: agoIso(3), category: 'Food' }),
      mk({ amountMinor: 300, spentAt: agoIso(4), category: 'Food' }),
      // mimo obě okna
      mk({ amountMinor: 7777, spentAt: agoIso(5), category: 'Food' }),
    ];
    expect(categoryDrift(e, 'EUR', 2)).toEqual([
      { category: 'Food', currentMinor: 2000, prevMinor: 800, deltaMinor: 1200 },
    ]);
  });

  it('cizí měna se ignoruje', () => {
    const e = [
      mk({ amountMinor: 1000, spentAt: agoIso(1), category: 'Food', currency: 'EUR' }),
      mk({ amountMinor: 5000, spentAt: agoIso(1), category: 'Food', currency: 'USD' }),
      mk({ amountMinor: 200, spentAt: agoIso(2), category: 'Food', currency: 'EUR' }),
    ];
    expect(categoryDrift(e, 'EUR', 1)).toEqual([
      { category: 'Food', currentMinor: 1000, prevMinor: 200, deltaMinor: 800 },
    ]);
  });

  it('shodná abs(delta) → deterministické pořadí podle názvu kategorie', () => {
    const e = [
      mk({ amountMinor: 1000, spentAt: agoIso(1), category: 'Zebra' }),
      mk({ amountMinor: 1000, spentAt: agoIso(1), category: 'Apple' }),
    ];
    const d = categoryDrift(e, 'EUR', 1);
    expect(d.map((x) => x.category)).toEqual(['Apple', 'Zebra']);
  });
});

describe('byCategory', () => {
  it('vlastní (custom) kategorie se objeví pod svým klíčem', () => {
    const e = [
      mk({ amountMinor: 3000, spentAt: agoIso(0), category: 'food' }),
      mk({ amountMinor: 5000, spentAt: agoIso(0), category: 'Ski pass' }),
    ];
    const rows = byCategory(e, 'EUR');
    const keys = rows.map((r) => r.key);
    expect(keys).toContain('Ski pass');
    expect(rows.find((r) => r.key === 'Ski pass')?.amountMinor).toBe(5000);
  });

  it('řadí podle částky sestupně, mixuje výchozí i custom', () => {
    const e = [
      mk({ amountMinor: 1000, spentAt: agoIso(0), category: 'food' }),
      mk({ amountMinor: 8000, spentAt: agoIso(0), category: 'Ski pass' }),
      mk({ amountMinor: 4000, spentAt: agoIso(0), category: 'transport' }),
    ];
    expect(byCategory(e, 'EUR').map((r) => r.key)).toEqual(['Ski pass', 'transport', 'food']);
  });

  it('procenta sedí na 100 (bez zaokrouhlovacího zbytku v tomto případě)', () => {
    const e = [
      mk({ amountMinor: 7500, spentAt: agoIso(0), category: 'Ski pass' }),
      mk({ amountMinor: 2500, spentAt: agoIso(0), category: 'food' }),
    ];
    const rows = byCategory(e, 'EUR');
    expect(rows.find((r) => r.key === 'Ski pass')?.pct).toBe(75);
    expect(rows.find((r) => r.key === 'food')?.pct).toBe(25);
  });

  it('cizí měna se do rozpadu nezapočítá', () => {
    const e = [
      mk({ amountMinor: 1000, spentAt: agoIso(0), category: 'Ski pass', currency: 'EUR' }),
      mk({ amountMinor: 9999, spentAt: agoIso(0), category: 'Ski pass', currency: 'USD' }),
    ];
    const rows = byCategory(e, 'EUR');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ key: 'Ski pass', amountMinor: 1000 });
  });

  it('shodná částka → deterministické pořadí podle klíče', () => {
    const e = [
      mk({ amountMinor: 1000, spentAt: agoIso(0), category: 'Zebra pass' }),
      mk({ amountMinor: 1000, spentAt: agoIso(0), category: 'Apple pass' }),
    ];
    expect(byCategory(e, 'EUR').map((r) => r.key)).toEqual(['Apple pass', 'Zebra pass']);
  });

  it('prázdný vstup → prázdné pole', () => {
    expect(byCategory([], 'EUR')).toEqual([]);
  });
});

describe('trendSummary', () => {
  it('prázdný vstup → nuly a pctChange null', () => {
    expect(trendSummary([], 'EUR')).toEqual({
      thisMonthMinor: 0, lastMonthMinor: 0, pctChange: null,
    });
  });

  it('minulý měsíc 0 → pctChange null i když tento měsíc má útratu', () => {
    const e = [mk({ amountMinor: 4200, spentAt: agoIso(0) })];
    expect(trendSummary(e, 'EUR')).toEqual({
      thisMonthMinor: 4200, lastMonthMinor: 0, pctChange: null,
    });
  });

  it('nárůst proti minulému měsíci → kladné procento', () => {
    const e = [
      mk({ amountMinor: 15000, spentAt: agoIso(0) }),
      mk({ amountMinor: 10000, spentAt: agoIso(1) }),
    ];
    expect(trendSummary(e, 'EUR')).toEqual({
      thisMonthMinor: 15000, lastMonthMinor: 10000, pctChange: 50,
    });
  });

  it('pokles proti minulému měsíci → záporné procento', () => {
    const e = [
      mk({ amountMinor: 5000, spentAt: agoIso(0) }),
      mk({ amountMinor: 10000, spentAt: agoIso(1) }),
    ];
    expect(trendSummary(e, 'EUR').pctChange).toBe(-50);
  });

  it('starší měsíce a cizí měna do součtů nespadnou', () => {
    const e = [
      mk({ amountMinor: 1000, spentAt: agoIso(0) }),
      mk({ amountMinor: 2000, spentAt: agoIso(1) }),
      mk({ amountMinor: 9999, spentAt: agoIso(3) }),                    // moc staré
      mk({ amountMinor: 8888, spentAt: agoIso(0), currency: 'USD' }),   // cizí měna
    ];
    expect(trendSummary(e, 'EUR')).toEqual({
      thisMonthMinor: 1000, lastMonthMinor: 2000, pctChange: -50,
    });
  });
});
