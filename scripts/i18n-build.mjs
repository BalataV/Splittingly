// Sestaví slovník z řádkového seznamu překladů.
//
//   node scripts/i18n-build.mjs es preklady-es.txt
//
// Vstupní soubor má PŘESNĚ tolik řádků, kolik má appka klíčů, a ve stejném
// pořadí jako `node scripts/i18n-keys.mjs`. Prázdný řádek = nepřeloženo
// (klíč se do slovníku nedostane a `t()` propadne do angličtiny).
//
// PROČ TAKHLE a ne rovnou JSON: klíč musí sedět ZNAK PO ZNAKU, jinak ho
// `t()` nenajde a překlad tiše zmizí. Když se klíče opisují ručně, dřív nebo
// později se někde liší apostrof nebo tečka. Tady se opisují jen překlady
// a klíče doplní skript ze zdrojáků, takže se rozejít nemůžou.
//
// Víceřádkové překlady (klíče s `\n`) piš na jeden řádek s `\n` jako dvěma
// znaky — přesně jak jsou v klíči.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2).filter((a) => a !== '--missing');
const onlyMissing = process.argv.includes('--missing');
const [lang, valuesPath] = args;
if (!lang || !valuesPath) {
  console.error('Použití: node scripts/i18n-build.mjs [--missing] <kód jazyka> <soubor s překlady>');
  console.error('  --missing: řádky se párují jen s klíči, které jazyk ještě NEMÁ,');
  console.error('             a hotové překlady zůstanou. Pro doplňování po částech.');
  process.exit(1);
}

const here = new URL('./', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const target = join(here, '..', 'src', 'translations', `${lang}.json`);

const all = JSON.parse(execFileSync(process.execPath, [here + 'i18n-keys.mjs', '--json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
}));

const existing = onlyMissing && existsSync(target) ? JSON.parse(readFileSync(target, 'utf8')) : {};
const keys = onlyMissing ? all.filter((k) => !(k in existing)) : all;

const lines = readFileSync(valuesPath, 'utf8').replace(/\r\n/g, '\n').split('\n');
// Poslední prázdný řádek po koncovém \n není překlad.
if (lines.length && lines[lines.length - 1] === '') lines.pop();

if (lines.length !== keys.length) {
  console.error(`✗ Nesedí počet řádků: soubor má ${lines.length}, appka má ${keys.length} klíčů.`);
  console.error('  Seznam klíčů ve správném pořadí: node scripts/i18n-keys.mjs');
  process.exit(1);
}

const dict = onlyMissing ? { ...existing } : {};
let filled = 0;
keys.forEach((key, i) => {
  const value = lines[i].trim();
  if (!value) return;           // prázdný řádek = zatím nepřeloženo
  // `\n` napsané jako dva znaky → skutečné zalomení, aby překlad odpovídal
  // klíči (ten má po rozbalení escapů taky skutečné zalomení).
  dict[key] = value.replace(/\\n/g, '\n');
  filled += 1;
});

mkdirSync(join(here, '..', 'src', 'translations'), { recursive: true });
const sorted = {};
Object.keys(dict).sort().forEach((k) => { sorted[k] = dict[k]; });
writeFileSync(target, JSON.stringify(sorted, null, 2) + '\n', 'utf8');

console.log(`${lang}: +${filled}, celkem ${Object.keys(sorted).length}/${all.length} → src/translations/${lang}.json`);
