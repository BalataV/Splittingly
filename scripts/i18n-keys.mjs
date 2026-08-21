// Vytáhne ze zdrojáků všechny překladové klíče.
//
// Klíč = anglická věta v `t('…')` nebo obě formy v `plural(n, '…', '…')`.
// Skript je zdroj pravdy pro to, CO se má přeložit — ruční seznam by se
// s realitou rozešel při první nové obrazovce.
//
//   node scripts/i18n-keys.mjs           → vypíše klíče, jeden na řádek
//   node scripts/i18n-keys.mjs --json    → vypíše JSON pole
//
// POZOR na escapované apostrofy: `t('… people\'s balances …')`. Naivní regex
// `'[^']*'` se na nich usekne a klíč vyjde zkomolený — pak by ho žádný
// slovník netrefil a překlad by tiše propadl do angličtiny. Proto se tu
// řetězce parsují znak po znaku s respektem k `\`.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const SRC = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (['.ts', '.tsx'].includes(extname(p))) out.push(p);
  }
  return out;
}

/**
 * Přečte řetězcový literál začínající na `i` (na uvozovce) a vrátí
 * [obsah, indexZaLiterálem].
 *
 * Escapy se ROZBALUJÍ na to, co uvidí runtime: `\n` je v `t('A\nB')`
 * skutečné zalomení řádku, ne dvojice znaků. Kdyby se nechalo doslovně,
 * klíč ze slovníku by se s tím, čím appka opravdu volá `t()`, nikdy
 * nepotkal — a všechny víceřádkové nadpisy by tiše zůstaly anglicky.
 */
const ESCAPES = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };

function readString(src, i) {
  const quote = src[i];
  let out = '';
  let j = i + 1;
  while (j < src.length) {
    const ch = src[j];
    if (ch === '\\') {
      const next = src[j + 1];
      out += next in ESCAPES ? ESCAPES[next] : next;
      j += 2;
      continue;
    }
    if (ch === quote) return [out, j + 1];
    // Skutečné zalomení uvnitř '…' nebo "…" znamená, že to není literál
    // (nejspíš jsme trefili apostrof v komentáři) — zahoď.
    if (ch === '\n' && quote !== '`') return [null, j];
    out += ch;
    j += 1;
  }
  return [null, j];
}

/** Najde volání `name(` a vrátí prvních `count` řetězcových argumentů. */
function collectCalls(src, name, count, skipArgs = 0) {
  const found = [];
  const re = new RegExp(`(^|[^\\w$.])${name}\\s*\\(`, 'g');
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length;
    let taken = 0;
    let skipped = 0;
    let depth = 0;
    while (i < src.length && taken < count) {
      const ch = src[i];
      if (ch === '(') { depth += 1; i += 1; continue; }
      if (ch === ')' && depth > 0) { depth -= 1; i += 1; continue; }
      if (ch === ')') break;
      if (ch === "'" || ch === '"' || ch === '`') {
        const [str, next] = readString(src, i);
        i = next;
        if (str === null) break;
        if (skipped < skipArgs) { skipped += 1; continue; }
        found.push(str);
        taken += 1;
        continue;
      }
      // Argument, který není řetězec (proměnná, výraz) — přeskoč po čárku.
      if (ch === ',') { if (skipped < skipArgs) skipped += 1; i += 1; continue; }
      i += 1;
    }
  }
  return found;
}

const keys = new Set();
for (const file of walk(SRC)) {
  // i18n.ts sám obsahuje slovníky — jeho hodnoty nejsou klíče.
  if (file.endsWith(`${'i18n'}.ts`)) continue;
  const src = readFileSync(file, 'utf8');
  collectCalls(src, 't', 1).forEach((k) => keys.add(k));
  // plural(n, one, other) — první argument je číslo, ne řetězec.
  collectCalls(src, 'plural', 2).forEach((k) => keys.add(k));
}

/**
 * Klíče, které se do `t()` dostávají PŘES PROMĚNNOU, ne jako literál:
 * `t(tab.label)`, `t(cat.label)`, `t(cur.name)`, `t(m.label)`.
 *
 * Regex výš je nevidí, protože v místě volání žádný text není — bydlí
 * v datové tabulce o pár souborů dál. Kdyby se sem nedoplnily, appka by
 * měla přeložené obrazovky, ale ANGLICKÉ názvy záložek, kategorií a měn.
 * Přesně tak vzniká dojem „napůl přeložené appky“.
 *
 * Když přibude další tabulka s překládaným popiskem, přidej ji sem.
 */
const DATA_FIELDS = [
  ['quips.ts', 'text'],        // hlášky maskotů
  ['Root.tsx', 'label'],       // názvy záložek ve spodní liště
  ['categories.ts', 'label'],  // kategorie výdajů
  ['currencies.ts', 'name'],   // názvy měn
  ['screens/SettleUp.tsx', 'label'],    // způsoby platby
  ['screens/AuthScreens.tsx', 'head'],  // nadpisy úvodních obrazovek
  ['screens/AuthScreens.tsx', 'body'],  // podnadpisy úvodních obrazovek
];

for (const [file, field] of DATA_FIELDS) {
  const src = readFileSync(join(SRC, file), 'utf8');
  const re = new RegExp(`\\b${field}:\\s*(['"])`, 'g');
  let m;
  while ((m = re.exec(src))) {
    const [str] = readString(src, m.index + m[0].length - 1);
    if (str) keys.add(str);
  }
}

// Akce v historii výdaje (`t(a.action)`) — hodnoty píše databáze, ne kód.
['created', 'edited', 'deleted'].forEach((a) => keys.add(a));

const sorted = [...keys].filter(Boolean).sort();
if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(sorted, null, 2) + '\n');
} else {
  process.stdout.write(sorted.join('\n') + '\n');
}
process.stderr.write(`${sorted.length} klíčů\n`);
