// CSV, PDF a hranice mezi free a Pro.
//
// CSV nečte člověk, ale tabulkový procesor — a ten je nemilosrdný.
// Středník v popisu výdaje, uvozovka v poznámce nebo částka
// naformátovaná podle národního prostředí rozhodí celý sloupec,
// aniž by kdokoli dostal chybu.

import { buildExpensesCsv, buildGroupPdfHtml } from '../src/export';
import {
  canExport, canUsePieChart, canAddReceipt, maxReceipts,
  canUsePeriod, canUseTheme, FREE_RECEIPTS_PER_EXPENSE,
} from '../src/entitlements';
import { ME } from '../src/logic';
import type { Group, Expense, Payment } from '../src/types';

const group: Group = {
  id: 'g1', name: 'Barcelona Trip', currency: 'EUR', coverColor: 'blue',
  shareCode: 'ABC123', members: [ME, 'Mira'],
  memberList: [{ id: '1', name: ME } as any, { id: '2', name: 'Mira' } as any],
  archived: false,
};

const expense = (o: Partial<Expense> & { amountMinor: number }): Expense => ({
  id: 'e1', groupId: 'g1', desc: 'Dinner', currency: 'EUR', payer: ME,
  parts: [ME, 'Mira'], splitType: 'equal', shares: null, exactMinor: null,
  category: 'Food', spentAt: '2026-08-23T10:00:00', receipts: [],
  editCount: 0, createdAt: '2026-08-23T10:00:00', ...o,
});

const payment = (o: Partial<Payment> & { amountMinor: number }): Payment => ({
  id: 'p1', groupId: 'g1', currency: 'EUR', from: 'Mira', to: ME,
  method: 'cash', note: null, createdAt: '2026-08-24T10:00:00', ...o,
});

describe('buildExpensesCsv', () => {
  it('má hlavičku a řádek na každý záznam', () => {
    const csv = buildExpensesCsv([expense({ amountMinor: 6000 })], [payment({ amountMinor: 1000 })]);
    const lines = csv.trim().split(/\r?\n/);
    expect(lines.length).toBe(3); // hlavička + výdaj + platba
  });

  it('částku píše jako holé desetinné číslo, ne podle národního formátu', () => {
    // „60,00 €" by tabulkový procesor v anglickém prostředí přečetl jako text
    const csv = buildExpensesCsv([expense({ amountMinor: 6000 })], []);
    expect(csv).toContain('60.00');
    expect(csv).not.toContain('€');
  });

  it('měny bez desetinných míst nedostanou umělé nuly', () => {
    const csv = buildExpensesCsv([expense({ amountMinor: 1000, currency: 'JPY' })], []);
    expect(csv).toMatch(/(^|[;,])"?1000"?([;,]|$)/m);
  });

  it('uvozovku v textu zdvojí, aby nerozsekla sloupec', () => {
    const csv = buildExpensesCsv([expense({ amountMinor: 100, desc: 'Bar "U Kotvy"' })], []);
    expect(csv).toContain('""U Kotvy""');
  });

  it('oddělovač uvnitř textu neposune sloupce', () => {
    const csv = buildExpensesCsv([expense({ amountMinor: 100, desc: 'Jídlo, pití a spropitné' })], []);
    const lines = csv.trim().split(/\r?\n/);
    const cols = (s: string) => (s.match(/"/g) || []).length;
    // text je v uvozovkách, takže počet uvozovek je sudý na každém řádku
    lines.forEach((l) => expect(cols(l) % 2).toBe(0));
  });

  it('nová řádka v poznámce nerozbije počet řádků', () => {
    const csv = buildExpensesCsv([expense({ amountMinor: 100, desc: 'první\ndruhá' })], []);
    expect(csv).toContain('"');
  });

  it('prázdná skupina dá aspoň hlavičku, ne prázdný soubor', () => {
    const csv = buildExpensesCsv([], []);
    expect(csv.trim().length).toBeGreaterThan(0);
  });
});

describe('buildGroupPdfHtml', () => {
  it('obsahuje jméno skupiny a je to celý HTML dokument', () => {
    const html = buildGroupPdfHtml(group, [expense({ amountMinor: 6000 })], []);
    expect(html).toContain('Barcelona Trip');
    expect(html.toLowerCase()).toContain('<html');
  });

  it('uživatelský text se do HTML nedostane jako značka', () => {
    // jinak by popis výdaje mohl přepsat sazbu celého PDF
    const html = buildGroupPdfHtml(group, [expense({ amountMinor: 100, desc: '<script>x</script>' })], []);
    expect(html).not.toContain('<script>x</script>');
  });

  // Formát stránky (A4 595×842, ne US Letter) se nezadává v HTML, ale až
  // v `printToFileAsync` v `exportGroupPdf` — do téhle šablony tedy nepatří.

  it('prázdná skupina dá platný dokument, ne půlku šablony', () => {
    const html = buildGroupPdfHtml(group, [], []);
    expect(html.toLowerCase()).toContain('</html>');
  });
});

describe('entitlements', () => {
  it('export je jen pro Pro', () => {
    expect(canExport(false)).toBe(false);
    expect(canExport(true)).toBe(true);
  });

  it('koláčový graf je jen pro Pro', () => {
    expect(canUsePieChart(false)).toBe(false);
    expect(canUsePieChart(true)).toBe(true);
  });

  it('free účet má jednu účtenku na výdaj, Pro víc', () => {
    expect(maxReceipts(false)).toBe(FREE_RECEIPTS_PER_EXPENSE);
    expect(maxReceipts(true)).toBeGreaterThan(FREE_RECEIPTS_PER_EXPENSE);
    expect(canAddReceipt(false, 0)).toBe(true);
    expect(canAddReceipt(false, FREE_RECEIPTS_PER_EXPENSE)).toBe(false);
    expect(canAddReceipt(true, FREE_RECEIPTS_PER_EXPENSE)).toBe(true);
  });

  it('nezpoplatněné téma je volné i bez odměny', () => {
    expect(canUseTheme('acid' as any, false, null, null)).toBe(true);
  });

  it('odměněné téma platí, dokud neuplyne, a pak ne', () => {
    // `dusk` je jediné prémiové téma — na volném by se okno odměny neprojevilo
    const zitra = new Date(Date.now() + 86400000).toISOString();
    const vcera = new Date(Date.now() - 86400000).toISOString();
    expect(canUseTheme('dusk' as any, false, null, null)).toBe(false);
    expect(canUseTheme('dusk' as any, false, 'dusk' as any, zitra)).toBe(true);
    expect(canUseTheme('dusk' as any, false, 'dusk' as any, vcera)).toBe(false);
    expect(canUseTheme('dusk' as any, true, null, null)).toBe(true);
    // odměna na JINÉ téma neodemyká dusk
    expect(canUseTheme('dusk' as any, false, 'acid' as any, zitra)).toBe(false);
  });

  it('Pro má všechna období statistik', () => {
    expect(canUsePeriod(true, 'all' as any)).toBe(true);
    expect(canUsePeriod(true, 'month' as any)).toBe(true);
  });
});
