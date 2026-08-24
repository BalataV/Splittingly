// Peníze. Nejdražší místo v celé appce: chyba tady se neprojeví pádem,
// ale tím, že si dva lidé přestanou věřit.
//
// `scripts/check-money.mjs` hlídá 14 formátovacích případů. Tady jde
// o něco jiného — o vlastnosti, které musí platit pro KAŽDÝ vstup:
// dělení se vždycky sečte zpátky na celek a nikdy nevyrobí ani neztratí
// jednu setinu.

import {
  fmt, fmtNumber, fmtSigned, parseAmount, toInputText,
  splitEqual, splitShares, remainderOf, shareOf,
} from '../src/money';

describe('splitEqual', () => {
  it('se vždy sečte zpátky na celek', () => {
    for (const total of [1, 7, 100, 999, 1000, 10000, 123457]) {
      for (let count = 1; count <= 9; count += 1) {
        const parts = splitEqual(total, count, 0);
        expect(parts).toHaveLength(count);
        expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
      }
    }
  });

  it('dá zbytek plátci, ne prvnímu v seznamu', () => {
    // ¥10 000 na tři: 3334/3333/3333, ta navíc patří tomu, kdo platil
    expect(splitEqual(10000, 3, 1)).toEqual([3333, 3334, 3333]);
    expect(splitEqual(10000, 3, 2)).toEqual([3333, 3333, 3334]);
  });

  it('rozdá víc zbytkových jednotek postupně od plátce', () => {
    // 100 na 3 = 34/33/33; 101 na 3 = 34/34/33 počínaje plátcem
    expect(splitEqual(101, 3, 0)).toEqual([34, 34, 33]);
    expect(splitEqual(101, 3, 2)).toEqual([34, 33, 34]);
  });

  it('zvládne zápornou částku bez ztráty jednotky', () => {
    const parts = splitEqual(-10000, 3, 0);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(-10000);
  });

  it('vrátí prázdné pole pro nulový počet lidí místo dělení nulou', () => {
    expect(splitEqual(1000, 0, 0)).toEqual([]);
  });
});

describe('splitShares', () => {
  it('se vždy sečte zpátky na celek', () => {
    const cases: [number, number[]][] = [
      [1000, [1, 1, 1]],
      [1000, [1, 2, 3]],
      [999, [1, 1]],
      [10, [1, 1, 1, 1, 1, 1, 1]],
      [123457, [5, 3, 2]],
    ];
    for (const [total, shares] of cases) {
      const parts = splitShares(total, shares, 0);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
    }
  });

  it('respektuje poměr podílů', () => {
    expect(splitShares(6000, [1, 2, 3], 0)).toEqual([1000, 2000, 3000]);
  });

  it('nulový podíl neplatí nic', () => {
    expect(splitShares(1000, [1, 0, 1], 0)).toEqual([500, 0, 500]);
  });

  it('samé nuly nespadnou na dělení nulou', () => {
    expect(splitShares(1000, [0, 0], 0)).toEqual([0, 0]);
  });

  it('záporný podíl se bere jako nula, ne jako sleva', () => {
    const parts = splitShares(1000, [-5, 1, 1], 0);
    expect(parts[0]).toBe(0);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(1000);
  });
});

describe('parseAmount ↔ toInputText', () => {
  it('projde tam a zpátky beze změny', () => {
    for (const [minor, code] of [[1234, 'EUR'], [1000, 'JPY'], [5, 'USD'], [250000, 'IDR']] as const) {
      expect(parseAmount(toInputText(minor, code), code)).toBe(minor);
    }
  });

  it('bere čárku i tečku jako desetinný oddělovač', () => {
    expect(parseAmount('12,34', 'EUR')).toBe(1234);
    expect(parseAmount('12.34', 'EUR')).toBe(1234);
  });

  it('u měny bez desetinných míst zahodí zlomek', () => {
    expect(parseAmount('1234,56', 'JPY')).toBe(1234);
  });

  it('z nesmyslu udělá nulu, ne NaN', () => {
    for (const junk of ['', '   ', 'abc', '-', ',', '.']) {
      expect(parseAmount(junk, 'EUR')).toBe(0);
    }
  });
});

describe('remainderOf', () => {
  it('nula znamená, že přesné částky sedí', () => {
    expect(remainderOf(1000, [500, 500])).toBe(0);
  });
  it('kladné číslo = ještě zbývá rozdělit', () => {
    expect(remainderOf(1000, [500, 400])).toBe(100);
  });
  it('záporné = rozdělilo se víc, než kolik výdaj je', () => {
    expect(remainderOf(1000, [600, 600])).toBe(-200);
  });
});

describe('shareOf', () => {
  const parts = ['You', 'Mira', 'Tom'];

  it('kdo není účastník, neplatí nic', () => {
    expect(shareOf(3000, parts, 'equal', null, null, 'You', 'Nikdo')).toBe(0);
  });

  it('rovným dílem se sečte na celek', () => {
    const sum = parts.reduce((a, who) => a + shareOf(1000, parts, 'equal', null, null, 'You', who), 0);
    expect(sum).toBe(1000);
  });

  it('přesné částky se berou tak, jak jsou zadané', () => {
    expect(shareOf(1000, parts, 'exact', null, [100, 200, 700], 'You', 'Tom')).toBe(700);
  });

  it('při špatné délce pole přesných částek spadne zpět na rovný díl', () => {
    // jinak by se tiše vrátila nula a výdaj by se rozplynul
    const sum = parts.reduce(
      (a, who) => a + shareOf(900, parts, 'exact', null, [100, 200], 'You', who), 0,
    );
    expect(sum).toBe(900);
  });
});

describe('formátování', () => {
  it('fmtNumber nedává symbol, fmt ano', () => {
    expect(fmtNumber(123456, 'EUR')).not.toMatch(/€/);
    expect(fmt(123456, 'EUR')).toMatch(/€/);
  });

  it('fmtSigned drží znaménko u kladných i záporných', () => {
    // Řetězec je obalený bidi izolátory (U+2066/U+2069), aby se v arabštině
    // znaménko neodstěhovalo na druhý konec řádku, a mínus je typografické
    // U+2212, ne ASCII spojovník. Test proto hledá znak, ne začátek.
    expect(fmtSigned(100, 'USD')).toContain('+');
    expect(fmtSigned(-100, 'USD')).toContain('−');
  });

  it('nula nemá znaménko', () => {
    expect(fmtSigned(0, 'USD')).not.toMatch(/^[+-]/);
  });
});
