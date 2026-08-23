// Hlídá hodnoty, které sedí na CIZÍM klíči.
//
// `i18n-align.mjs` porovnává překladový soubor řádek po řádku a pozná POSUN —
// když překladateli vypadne řádek, všechno pod ním se rozjede. Jenže prohození
// nebo rotace uvnitř bloku posun neudělá: počet řádků sedí, placeholdery sedí,
// slovník se postaví bez jediné stížnosti a chyba jde rovnou do obchodu.
//
// Dvakrát se to stalo doopravdy:
//   • „Feb" = „Fine. Longer is better." ve 29 jazycích — únor se v seznamu
//     výdajů vykresloval jako věta o heslech,
//   • rotace o jeden řádek přes „UAE Dirham / US Dollar / Ukrainian Hryvnia /
//     Unlock the pie chart…" ve 28 jazycích — dirham se jmenoval „Odemkni
//     koláčový graf s Pro" a hřivna byla americký dolar.
//
// Obojí má stejný podpis: hodnota má jinou DÉLKU, než jakou má tentýž klíč
// ve zbytku slovníků. Proto se neporovnává s angličtinou (překlad se roztáhne
// i o polovinu), ale s MEDIÁNEM všech jazyků. Aby to neřvalo na čínštinu,
// která je proti latince zhruba poloviční, má každý jazyk vlastní měřítko —
// spočítané z jeho vlastních řádků, ne odhadnuté podle písma.
//
// Spuštění: node scripts/i18n-audit-shape.mjs

import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'src', 'translations');

/** Placeholder má stejnou délku v každém jazyce — do porovnání nepatří. */
function delka(s) {
  return s.replace(/\{[^}]+\}/g, '').replace(/\s+/g, ' ').trim().length;
}

function median(pole) {
  if (!pole.length) return 0;
  const s = [...pole].sort((a, b) => a - b);
  const p = Math.floor(s.length / 2);
  return s.length % 2 ? s[p] : (s[p - 1] + s[p]) / 2;
}

const soubory = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));
const slovniky = new Map(
  soubory.map((f) => [f, JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))]),
);

// Mediánová délka každého klíče napříč jazyky.
const vsechnyKlice = new Set();
for (const d of slovniky.values()) Object.keys(d).forEach((k) => vsechnyKlice.add(k));

const norma = new Map();
for (const k of vsechnyKlice) {
  const delky = [];
  for (const d of slovniky.values()) if (d[k]) delky.push(delka(d[k]));
  if (delky.length >= 5) norma.set(k, median(delky));
}

// Měřítko jazyka: o kolik je proti mediánu celkově delší nebo kratší.
// Čínština vyjde kolem 0,4, finština nad 1,1 — a obojí je v pořádku.
const meritko = new Map();
for (const [f, d] of slovniky) {
  const pomery = [];
  for (const [k, v] of Object.entries(d)) {
    const m = norma.get(k);
    if (m && m >= 8 && v) pomery.push(delka(v) / m);
  }
  meritko.set(f, median(pomery) || 1);
}

let nalezeno = 0;

for (const [f, d] of slovniky) {
  const s = meritko.get(f);
  const hlaseni = [];

  for (const [k, v] of Object.entries(d)) {
    if (!v) continue;
    const m = norma.get(k);
    if (!m || m < 5) continue;              // krátké klíče kolísají, nemá cenu
    const cekano = m * s;
    const skutecne = delka(v);
    if (skutecne > cekano * 2.6 + 4 || skutecne < cekano * 0.36 - 1) {
      hlaseni.push(
        `  "${k.replace(/\n/g, '\n').slice(0, 44)}" → "${v.replace(/\n/g, '\n').slice(0, 52)}"` +
        `  (${skutecne} zn., čekáno ~${Math.round(cekano)})`,
      );
    }
  }

  if (hlaseni.length) {
    console.log(`\n${f}  (${hlaseni.length}, měřítko ${meritko.get(f).toFixed(2)})`);
    hlaseni.forEach((r) => console.log(r));
    nalezeno += hlaseni.length;
  }
}

console.log(
  nalezeno
    ? `\nPodezřelých hodnot: ${nalezeno} — projdi je ručně, ne každá je chyba.`
    : '\nŽádná hodnota nesedí na cizím klíči.',
);
