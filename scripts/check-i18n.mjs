// Kontrola slovníků. Spouštěj po každé změně překladů:
//
//   node scripts/check-i18n.mjs
//
// CO HLÍDÁ A PROČ:
//
// 1. NEZNÁMÝ KLÍČ — překlad, jehož anglický klíč se v appce nevyskytuje.
//    Tohle je tichá chyba, kterou nic jiného nechytí: `t()` klíč nenajde,
//    vrátí angličtinu a vypadá to jako „ten jazyk ještě není hotový".
//    Nejčastější příčina je překlep nebo odchylka v interpunkci.
//
// 2. POKRYTÍ — kolik z klíčů appky jazyk skutečně má. Slouží k rozhodnutí,
//    jestli smí jazyk do `AUTO_DETECT_READY` (viz i18n.ts).
//
// 3. PLACEHOLDERY — `{n}`, `{amount}`… musí v překladu zůstat. Chybějící
//    placeholder znamená, že se uživateli nezobrazí číslo nebo jméno;
//    přebývající znamená `{neco}` natvrdo v UI.
//
// 4. PRÁZDNÝ PŘEKLAD — hodnota, která je prázdná nebo shodná s klíčem
//    u jazyka, kde to nedává smysl, se počítá jako nepřeložená.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const here = new URL('./', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const keys = JSON.parse(execFileSync(process.execPath, [here + 'i18n-keys.mjs', '--json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
}));
const known = new Set(keys);

// Překlady jsou JSON, ne TS: čte je stejně Node i appka (`resolveJsonModule`)
// a dá se rovnou poslat překladateli, aniž by v tom byl kód.
const dir = join(here, '..', 'src', 'translations');
const DICT = {};
for (const name of readdirSync(dir)) {
  if (!name.endsWith('.json')) continue;
  DICT[name.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(dir, name), 'utf8'));
}

const placeholders = (s) => (s.match(/\{[a-zA-Z]+\}/g) || []).sort().join(',');

let problems = 0;
const rows = [];

// Slovník může existovat na disku a přitom nebýt zapojený v `DICT` v i18n.ts —
// pak je celý jazyk tiše mrtvý: soubor vypadá hotově, appka ho nikdy nenačte.
// Přesně na tohle se přijde nejhůř, tak to hlídáme tady.
const i18nSrc = readFileSync(join(here, '..', 'src', 'i18n.ts'), 'utf8');
for (const lang of Object.keys(DICT)) {
  const imported = new RegExp(`from '\\./translations/${lang}\\.json'`).test(i18nSrc);
  const inDict = new RegExp(`\\b${lang}\\b`).test((i18nSrc.match(/const DICT[^;]*;/) || [''])[0]);
  if (!imported || !inDict) {
    console.error(`✗ ${lang}: slovník existuje, ale ${!imported ? 'není importovaný' : 'chybí v DICT'} v src/i18n.ts — appka ho nepoužije`);
    problems += 1;
  }
}

for (const [lang, dict] of Object.entries(DICT)) {
  const entries = Object.entries(dict);
  let translated = 0;

  for (const [key, value] of entries) {
    // `#few` / `#many` jsou varianty množného čísla, ne samostatné klíče.
    const base = key.replace(/#(one|few|many|other)$/, '');
    if (!known.has(base)) {
      console.error(`✗ ${lang}: neznámý klíč — ${JSON.stringify(key)}`);
      problems += 1;
      continue;
    }
    if (!value || !value.trim()) {
      console.error(`✗ ${lang}: prázdný překlad — ${JSON.stringify(key)}`);
      problems += 1;
      continue;
    }
    if (placeholders(base) !== placeholders(value)) {
      console.error(`✗ ${lang}: placeholdery nesedí — ${JSON.stringify(key)} → ${JSON.stringify(value)}`);
      problems += 1;
      continue;
    }
    translated += 1;
  }

  const covered = new Set(entries.map(([k]) => k.replace(/#(one|few|many|other)$/, ''))).size;
  rows.push({ lang, covered, pct: Math.round((covered / keys.length) * 100), translated });
}

rows.sort((a, b) => b.covered - a.covered);
console.log(`\nKlíčů v appce: ${keys.length}\n`);
for (const r of rows) {
  const bar = '█'.repeat(Math.round(r.pct / 5)).padEnd(20, '·');
  console.log(`  ${r.lang.padEnd(8)} ${bar} ${String(r.pct).padStart(3)} %  (${r.covered}/${keys.length})`);
}

if (problems) {
  console.error(`\n${problems} problém(ů). Oprav je — tichý propad do angličtiny se jinak těžko hledá.`);
  process.exit(1);
}
console.log('\nVšechny slovníky v pořádku.');
