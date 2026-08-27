// Formátování a dělení částek.
//
// Vše počítá v MINOR UNITS (celá čísla). Díky tomu platí, že součet podílů
// se VŽDY rovná celku — u desetinných čísel by to neplatilo a skupina by po
// třech dělených večeřích viděla, že jí chybí cent.
//
// Formát určuje MĚNA (viz currencies.ts), ne jazyk. Směr čtení určuje jazyk,
// ale číslo si i uvnitř arabské věty drží směr zleva doprava — od toho jsou
// obalové znaky LRI/PDI.

import { currency, decimalsOf, minorFactor } from './currencies';

// Izolace směru textu: číslo uvnitř RTL věty musí zůstat LTR a zarovnané
// doprava. U+2066 = LEFT-TO-RIGHT ISOLATE, U+2069 = POP DIRECTIONAL ISOLATE.
const LRI = '⁦';
const PDI = '⁩';

function groupDigits(intPart: string, sep: string): string {
  if (!sep) return intPart;
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/**
 * Částka bez symbolu měny: 123456 (EUR) → "1.234,56", 1235 (JPY) → "1.235".
 */
export function fmtNumber(amountMinor: number, code: string): string {
  const c = currency(code);
  const neg = amountMinor < 0;
  const abs = Math.abs(Math.round(amountMinor));
  const factor = minorFactor(code);
  const whole = Math.floor(abs / factor);
  const frac = abs - whole * factor;
  let out = groupDigits(String(whole), c.group);
  if (c.decimals > 0) out += c.dec + String(frac).padStart(c.decimals, '0');
  return (neg ? '-' : '') + out;
}

/**
 * Částka i se symbolem, na správné straně: "€1.234,56" / "1 234,56 Kč" / "¥1,235".
 * `isolate` obalí výsledek značkami směru — používej všude, kde částka stojí
 * uvnitř věty, která může být arabská.
 */
export function fmt(amountMinor: number, code: string, isolate = true): string {
  const c = currency(code);
  const num = fmtNumber(amountMinor, code);
  const gap = c.space ? ' ' : '';
  const s = c.pos === 'before' ? c.symbol + gap + num : num + gap + c.symbol;
  return isolate ? LRI + s + PDI : s;
}

/** Částka se znaménkem navíc (pro kladné/záporné bilance). */
export function fmtSigned(amountMinor: number, code: string): string {
  if (amountMinor === 0) return fmt(0, code);
  const sign = amountMinor > 0 ? '+' : '−';
  return LRI + sign + fmt(Math.abs(amountMinor), code, false) + PDI;
}

/**
 * Mapa po měnách → čitelný řetězec. Měny se NIKDY nesčítají dohromady:
 * dluh 20 € a 500 THB je pořád dvojí dluh, ne jeden přepočtený.
 */
export function fmtMoneyMap(map: Record<string, number>): string {
  const parts = Object.keys(map || {})
    .filter((k) => Math.round(map[k]) !== 0)
    .map((k) => fmt(map[k], k));
  return parts.length ? parts.join('  ·  ') : fmt(0, 'EUR');
}

/**
 * Text z klávesnice → minor units. Přijímá tečku i čárku jako desetinný
 * oddělovač, protože uživatel píše tak, jak je zvyklý, ne jak velí měna.
 * "12,5" v EUR → 1250. "1000" v JPY → 1000. Nadbytečná místa se ořežou.
 */
export function parseAmount(text: string, code: string): number {
  const dec = decimalsOf(code);
  const cleaned = (text || '').replace(/[^\d.,-]/g, '').replace(/,/g, '.');
  // víc teček → poslední je desetinná, předchozí byly oddělovače tisíců
  const bits = cleaned.split('.');
  let whole = bits.length > 1 ? bits.slice(0, -1).join('') : bits[0];
  let frac = bits.length > 1 ? bits[bits.length - 1] : '';
  const neg = whole.trim().startsWith('-');
  whole = whole.replace(/-/g, '');
  if (!whole) whole = '0';
  if (dec === 0) {
    // měna bez haléřů: desetinná část se zahazuje, ne zaokrouhluje nahoru
    const v = parseInt(whole, 10) || 0;
    return neg && v !== 0 ? -v : v;
  }
  frac = (frac + '0'.repeat(dec)).slice(0, dec);
  const v = (parseInt(whole, 10) || 0) * minorFactor(code) + (parseInt(frac, 10) || 0);
  // `neg ? -v : v` by ze samotného „-" udělalo -0: rovná se nule, ale
  // Object.is(-0, 0) je false a 1/-0 je -Infinity. Nula nemá znaménko.
  return neg && v !== 0 ? -v : v;
}

/** Minor units → text do vstupního pole ("1234" EUR → "12.34"). */
export function toInputText(amountMinor: number, code: string): string {
  const dec = decimalsOf(code);
  if (!amountMinor) return '';
  if (dec === 0) return String(Math.round(amountMinor));
  const factor = minorFactor(code);
  const whole = Math.floor(Math.abs(amountMinor) / factor);
  const frac = Math.abs(amountMinor) - whole * factor;
  const sign = amountMinor < 0 ? '-' : '';
  return sign + whole + '.' + String(frac).padStart(dec, '0');
}

// ------------------------------------------------------------------ dělení

/**
 * Rovným dílem. Zbytek po dělení (jedna nejmenší jednotka na osobu) připadne
 * PLÁTCI — to je pravidlo z design handoffu a je jediné, kde se nedá nic
 * „spravedlivěji" vymyslet, aniž by se ztratil cent.
 *
 * Vrací pole ve stejném pořadí jako `names`.
 */
export function splitEqual(totalMinor: number, count: number, payerIndex: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(Math.abs(totalMinor) / count);
  const sign = totalMinor < 0 ? -1 : 1;
  let rest = Math.abs(totalMinor) - base * count;
  const out = new Array(count).fill(base);
  // zbytek přidáme plátci, pak dalším v pořadí (u 3 lidí a ¥10 000 → 3334/3333/3333)
  let i = payerIndex >= 0 && payerIndex < count ? payerIndex : 0;
  while (rest > 0) {
    out[i] += 1;
    rest -= 1;
    i = (i + 1) % count;
  }
  return out.map((v) => v * sign);
}

/**
 * Dělení podílem. Metoda největšího zbytku: každý dostane svůj celý díl a
 * zbylé jednotky se rozdají tomu, komu se useklo nejvíc. Součet sedí přesně.
 */
export function splitShares(totalMinor: number, shares: number[], payerIndex: number): number[] {
  const sum = shares.reduce((a, b) => a + (b > 0 ? b : 0), 0);
  if (sum <= 0) return shares.map(() => 0);
  const sign = totalMinor < 0 ? -1 : 1;
  const total = Math.abs(totalMinor);
  const exact = shares.map((s) => (total * Math.max(0, s)) / sum);
  const floor = exact.map((v) => Math.floor(v));
  let rest = total - floor.reduce((a, b) => a + b, 0);
  // Úplné pořadí: největší zbytek první; při shodě zbytku dostane jednotku
  // plátce, jinak nižší index. Předchozí `|| (a.i === payerIndex ? -1 : 1)`
  // nebylo tranzitivní — dva ne-plátci se shodným zbytkem vraceli 1 v obou
  // směrech a výsledek pak záležel na řadicím algoritmu enginu.
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => {
      if (b.frac !== a.frac) return b.frac - a.frac;
      if (a.i === payerIndex) return -1;
      if (b.i === payerIndex) return 1;
      return a.i - b.i;
    });
  let k = 0;
  while (rest > 0 && order.length) {
    floor[order[k % order.length].i] += 1;
    rest -= 1;
    k += 1;
  }
  return floor.map((v) => v * sign);
}

/** Kolik ještě zbývá rozdělit u režimu „přesné částky". 0 = lze uložit. */
export function remainderOf(totalMinor: number, exactMinor: number[]): number {
  return totalMinor - exactMinor.reduce((a, b) => a + (b || 0), 0);
}

/**
 * Podíl jednoho účastníka na výdaji. Jediné místo, kde se rozhoduje,
 * co který režim dělení znamená — obrazovky se na to jen ptají.
 */
export function shareOf(
  amountMinor: number,
  parts: string[],
  splitType: 'equal' | 'shares' | 'exact',
  shares: number[] | null,
  exactMinor: number[] | null,
  payer: string,
  who: string,
): number {
  const i = parts.indexOf(who);
  if (i < 0) return 0;
  const payerIndex = parts.indexOf(payer);
  if (splitType === 'exact' && exactMinor && exactMinor.length === parts.length) {
    return exactMinor[i] || 0;
  }
  if (splitType === 'shares' && shares && shares.length === parts.length) {
    return splitShares(amountMinor, shares, payerIndex)[i];
  }
  return splitEqual(amountMinor, parts.length, payerIndex)[i];
}

export { LRI, PDI };
