// Bilance a minimalizace převodů.
//
// Tohle je to, kvůli čemu appka existuje: „deset dluhů, jedna platba".
// Když se tady něco rozjede, uživatel to nepozná z chybové hlášky —
// pozná to z toho, že mu kamarád pošle jinou částku, než čekal.
//
// Klíčová vlastnost, na kterou se testuje pořád dokola: součet všech
// bilancí ve skupině musí být PŘESNĚ nula. Když není, někde se ztratil
// nebo přibyl cent.

import { netFor, transfersFor, isSettled, currenciesIn, ME } from '../src/logic';
import type { Group, Expense, Payment } from '../src/types';

const group = (members: string[], currency = 'EUR'): Group => ({
  id: 'g1', name: 'Test', currency, coverColor: 'blue', shareCode: 'ABC123',
  members, memberList: members.map((m, i) => ({ id: String(i), name: m, userId: null } as any)),
  archived: false,
});

const expense = (o: Partial<Expense> & { amountMinor: number; payer: string; parts: string[] }): Expense => ({
  id: 'e' + Math.random(), groupId: 'g1', desc: 'x', currency: 'EUR',
  splitType: 'equal', shares: null, exactMinor: null, category: 'Food',
  spentAt: '2026-08-01T12:00:00Z', receipts: [], editCount: 0,
  createdAt: '2026-08-01T12:00:00Z', ...o,
});

const payment = (o: Partial<Payment> & { amountMinor: number; from: string; to: string }): Payment => ({
  id: 'p' + Math.random(), groupId: 'g1', currency: 'EUR', method: 'cash',
  note: null, createdAt: '2026-08-02T12:00:00Z', ...o,
});

describe('netFor', () => {
  it('součet bilancí je vždy přesně nula', () => {
    const g = group([ME, 'Mira', 'Tom']);
    // 100,01 € na tři — dělení, které se nedá rozdělit rovnoměrně
    const e = [expense({ amountMinor: 10001, payer: ME, parts: [ME, 'Mira', 'Tom'] })];
    const net = netFor(g, e, [], 'EUR');
    const sum = Object.values(net).reduce((a, b) => a + b, 0);
    expect(sum).toBe(0);
  });

  it('drží nulu i po několika výdajích a platbě', () => {
    const g = group([ME, 'Mira', 'Tom']);
    const e = [
      expense({ amountMinor: 6000, payer: ME, parts: [ME, 'Mira', 'Tom'] }),
      expense({ amountMinor: 3333, payer: 'Mira', parts: [ME, 'Mira'] }),
      expense({ amountMinor: 777, payer: 'Tom', parts: [ME, 'Mira', 'Tom'] }),
    ];
    const p = [payment({ amountMinor: 1000, from: 'Mira', to: ME })];
    const sum = Object.values(netFor(g, e, p, 'EUR')).reduce((a, b) => a + b, 0);
    expect(sum).toBe(0);
  });

  it('kdo zaplatil za ostatní, je v plusu o jejich část', () => {
    const g = group([ME, 'Mira']);
    const e = [expense({ amountMinor: 1000, payer: ME, parts: [ME, 'Mira'] })];
    const net = netFor(g, e, [], 'EUR');
    expect(net[ME]).toBe(500);
    expect(net['Mira']).toBe(-500);
  });

  it('platba bilanci umaže', () => {
    const g = group([ME, 'Mira']);
    const e = [expense({ amountMinor: 1000, payer: ME, parts: [ME, 'Mira'] })];
    const p = [payment({ amountMinor: 500, from: 'Mira', to: ME })];
    const net = netFor(g, e, p, 'EUR');
    expect(net[ME]).toBe(0);
    expect(net['Mira']).toBe(0);
  });

  it('míchá jen stejnou měnu — cizí výdaj do bilance nespadne', () => {
    const g = group([ME, 'Mira']);
    const e = [
      expense({ amountMinor: 1000, payer: ME, parts: [ME, 'Mira'] }),
      expense({ amountMinor: 90000, payer: 'Mira', parts: [ME, 'Mira'], currency: 'JPY' }),
    ];
    expect(netFor(g, e, [], 'EUR')[ME]).toBe(500);
    expect(netFor(g, e, [], 'JPY')[ME]).toBe(-45000);
  });
});

describe('transfersFor', () => {
  it('vyrovná skupinu tak, že po převodech je bilance nulová', () => {
    const g = group([ME, 'Mira', 'Tom']);
    const e = [
      expense({ amountMinor: 9000, payer: ME, parts: [ME, 'Mira', 'Tom'] }),
      expense({ amountMinor: 3000, payer: 'Tom', parts: [ME, 'Mira', 'Tom'] }),
    ];
    const transfers = transfersFor(g, e, []);
    // převody aplikujeme jako platby a bilance musí padnout na nulu
    const asPayments = transfers.map((tr) =>
      payment({ amountMinor: tr.amountMinor, from: tr.from, to: tr.to, currency: tr.currency }));
    const net = netFor(g, e, asPayments, 'EUR');
    Object.values(net).forEach((v) => expect(v).toBe(0));
  });

  it('deset dluhů umí srazit na míň převodů, než je lidí', () => {
    const members = [ME, 'A', 'B', 'C', 'D', 'E'];
    const g = group(members);
    // jeden platí všechno, pětkrát
    const e = [expense({ amountMinor: 60000, payer: ME, parts: members })];
    const transfers = transfersFor(g, e, []);
    expect(transfers.length).toBe(members.length - 1);
    const asPayments = transfers.map((tr) =>
      payment({ amountMinor: tr.amountMinor, from: tr.from, to: tr.to, currency: tr.currency }));
    Object.values(netFor(g, e, asPayments, 'EUR')).forEach((v) => expect(v).toBe(0));
  });

  it('vyrovnaná skupina nemá co převádět', () => {
    const g = group([ME, 'Mira']);
    expect(transfersFor(g, [], [])).toEqual([]);
  });

  it('žádný převod není nulový ani záporný', () => {
    const g = group([ME, 'Mira', 'Tom']);
    const e = [
      expense({ amountMinor: 10001, payer: ME, parts: [ME, 'Mira', 'Tom'] }),
      expense({ amountMinor: 1, payer: 'Mira', parts: ['Mira', 'Tom'] }),
    ];
    transfersFor(g, e, []).forEach((tr) => expect(tr.amountMinor).toBeGreaterThan(0));
  });

  it('každou měnu vyrovná zvlášť, nikdy je nesečte', () => {
    const g = group([ME, 'Mira']);
    const e = [
      expense({ amountMinor: 1000, payer: ME, parts: [ME, 'Mira'] }),
      expense({ amountMinor: 90000, payer: 'Mira', parts: [ME, 'Mira'], currency: 'JPY' }),
    ];
    const transfers = transfersFor(g, e, []);
    const codes = transfers.map((tr) => tr.currency).sort();
    expect(codes).toEqual(['EUR', 'JPY']);
  });
});

describe('isSettled', () => {
  it('prázdná skupina je vyrovnaná', () => {
    expect(isSettled(group([ME, 'Mira']), [], [])).toBe(true);
  });

  it('nezaplacený výdaj vyrovnaný není', () => {
    const g = group([ME, 'Mira']);
    const e = [expense({ amountMinor: 1000, payer: ME, parts: [ME, 'Mira'] })];
    expect(isSettled(g, e, [])).toBe(false);
  });

  it('po doplacení je vyrovnaná', () => {
    const g = group([ME, 'Mira']);
    const e = [expense({ amountMinor: 1000, payer: ME, parts: [ME, 'Mira'] })];
    const p = [payment({ amountMinor: 500, from: 'Mira', to: ME })];
    expect(isSettled(g, e, p)).toBe(true);
  });

  it('výdaj, který platil jeden sám za sebe, skupinu nerozhodí', () => {
    const g = group([ME, 'Mira']);
    const e = [expense({ amountMinor: 1000, payer: ME, parts: [ME] })];
    expect(isSettled(g, e, [])).toBe(true);
  });
});

describe('currenciesIn', () => {
  it('bez dat vrátí měnu skupiny', () => {
    expect(currenciesIn([], [], 'THB')).toEqual(['THB']);
  });

  it('posbírá měny z výdajů i plateb, každou jednou', () => {
    const e = [
      expense({ amountMinor: 1, payer: ME, parts: [ME], currency: 'EUR' }),
      expense({ amountMinor: 1, payer: ME, parts: [ME], currency: 'JPY' }),
      expense({ amountMinor: 1, payer: ME, parts: [ME], currency: 'EUR' }),
    ];
    const p = [payment({ amountMinor: 1, from: ME, to: 'Mira', currency: 'USD' })];
    expect(currenciesIn(e, p, 'EUR').sort()).toEqual(['EUR', 'JPY', 'USD']);
  });
});
