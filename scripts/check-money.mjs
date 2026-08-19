// Rychlá kontrola peněžní matematiky bez testovacího frameworku.
// Spuštění:  node scripts/check-money.mjs
//
// Kontroluje tři věci, na kterých appka stojí:
//   1. součet podílů se VŽDY rovná celku (jinak skupině mizí koruny),
//   2. měny bez desetinných míst se dělí bez zlomků,
//   3. formát respektuje měnu (oddělovače, strana symbolu, počet míst).

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass += 1; console.log('  ok   ' + name); }
  else { fail += 1; console.log('  FAIL ' + name + (extra ? '  → ' + extra : '')); }
}

// --- 1. rovným dílem ---------------------------------------------------------
function splitEqual(totalMinor, count, payerIndex) {
  if (count <= 0) return [];
  const base = Math.floor(Math.abs(totalMinor) / count);
  const sign = totalMinor < 0 ? -1 : 1;
  let rest = Math.abs(totalMinor) - base * count;
  const out = new Array(count).fill(base);
  let i = payerIndex >= 0 && payerIndex < count ? payerIndex : 0;
  while (rest > 0) { out[i] += 1; rest -= 1; i = (i + 1) % count; }
  return out.map((v) => v * sign);
}

console.log('splitEqual');
const a = splitEqual(10000, 3, 0);          // ¥10 000 na tři
check('¥10000 / 3 = 3334+3333+3333', a.join('+') === '3334+3333+3333', a.join('+'));
check('součet sedí', a.reduce((x, y) => x + y, 0) === 10000);

const b = splitEqual(8640, 4, 2);           // €86,40 na čtyři, plátce třetí
check('€86.40 / 4 beze zbytku', b.every((v) => v === 2160), b.join('+'));

const cc = splitEqual(1000, 7, 3);
check('1000 / 7 součet sedí', cc.reduce((x, y) => x + y, 0) === 1000, cc.join('+'));
check('zbytek dostal plátce', cc[3] === Math.max(...cc), cc.join('+'));

// --- 2. podílem --------------------------------------------------------------
function splitShares(totalMinor, shares, payerIndex) {
  const sum = shares.reduce((x, y) => x + (y > 0 ? y : 0), 0);
  if (sum <= 0) return shares.map(() => 0);
  const sign = totalMinor < 0 ? -1 : 1;
  const total = Math.abs(totalMinor);
  const exact = shares.map((s) => (total * Math.max(0, s)) / sum);
  const floor = exact.map((v) => Math.floor(v));
  let rest = total - floor.reduce((x, y) => x + y, 0);
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((x, y) => (y.frac - x.frac) || (x.i === payerIndex ? -1 : 1));
  let k = 0;
  while (rest > 0 && order.length) { floor[order[k % order.length].i] += 1; rest -= 1; k += 1; }
  return floor.map((v) => v * sign);
}

console.log('splitShares');
const s1 = splitShares(10000, [1, 1, 2], 0);
check('1:1:2 z 10000 = 2500/2500/5000', s1.join('/') === '2500/2500/5000', s1.join('/'));
const s2 = splitShares(10001, [1, 1, 1], 0);
check('nedělitelné: součet sedí', s2.reduce((x, y) => x + y, 0) === 10001, s2.join('/'));
const s3 = splitShares(999, [3, 2, 1, 1], 1);
check('4 nerovné podíly: součet sedí', s3.reduce((x, y) => x + y, 0) === 999, s3.join('/'));

// --- 3. formát ---------------------------------------------------------------
const CUR = {
  EUR: { symbol: '€', decimals: 2, pos: 'before', group: '.', dec: ',', space: false },
  USD: { symbol: '$', decimals: 2, pos: 'before', group: ',', dec: '.', space: false },
  SEK: { symbol: 'kr', decimals: 2, pos: 'after', group: ' ', dec: ',', space: true },
  JPY: { symbol: '¥', decimals: 0, pos: 'before', group: ',', dec: '.', space: false },
  IDR: { symbol: 'Rp', decimals: 0, pos: 'before', group: '.', dec: ',', space: false },
  ISK: { symbol: 'kr', decimals: 0, pos: 'after', group: '.', dec: ',', space: true },
};

function fmt(amountMinor, code) {
  const c = CUR[code];
  const factor = Math.pow(10, c.decimals);
  const abs = Math.abs(Math.round(amountMinor));
  const whole = Math.floor(abs / factor);
  const frac = abs - whole * factor;
  let out = c.group ? String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, c.group) : String(whole);
  if (c.decimals > 0) out += c.dec + String(frac).padStart(c.decimals, '0');
  const gap = c.space ? ' ' : '';
  const body = c.pos === 'before' ? c.symbol + gap + out : out + gap + c.symbol;
  return (amountMinor < 0 ? '-' : '') + body;
}

console.log('fmt');
check('EUR 123456 → €1.234,56', fmt(123456, 'EUR') === '€1.234,56', fmt(123456, 'EUR'));
check('USD 123456 → $1,234.56', fmt(123456, 'USD') === '$1,234.56', fmt(123456, 'USD'));
check('SEK 123456 → 1 234,56 kr', fmt(123456, 'SEK') === '1 234,56 kr', fmt(123456, 'SEK'));
check('JPY 1235 → ¥1,235', fmt(1235, 'JPY') === '¥1,235', fmt(1235, 'JPY'));
check('IDR 2500000 → Rp2.500.000', fmt(2500000, 'IDR') === 'Rp2.500.000', fmt(2500000, 'IDR'));
check('ISK 1235 → 1.235 kr', fmt(1235, 'ISK') === '1.235 kr', fmt(1235, 'ISK'));

console.log('');
console.log(fail === 0 ? `Vše v pořádku (${pass} kontrol).` : `${fail} kontrol SELHALO z ${pass + fail}.`);
process.exit(fail === 0 ? 0 : 1);
