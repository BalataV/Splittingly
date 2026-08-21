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
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [lang, valuesPath] = process.argv.slice(2);
if (!lang || !valuesPath) {
  console.error('Použití: node scripts/i18n-build.mjs <kód jazyka> <soubor s překlady>');
  process.exit(1);
}

const here = new URL('./', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const keys = JSON.parse(execFileSync(process.execPath, [here + 'i18n-keys.mjs', '--json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
}));

const lines = readFileSync(valuesPath, 'utf8').replace(/\r\n/g, '\n').split('\n');
// Poslední prázdný řádek po koncovém \n není překlad.
if (lines.length && lines[lines.length - 1] === '') lines.pop();

if (lines.length !== keys.length) {
  console.error(`✗ Nesedí počet řádků: soubor má ${lines.length}, appka má ${keys.length} klíčů.`);
  console.error('  Seznam klíčů ve správném pořadí: node scripts/i18n-keys.mjs');
  process.exit(1);
}

const dict = {};
let filled = 0;
keys.forEach((key, i) => {
  const value = lines[i].trim();
  if (!value) return;           // prázdný řádek = zatím nepřeloženo
  // `\n` napsané jako dva znaky → skutečné zalomení, aby překlad odpovídal
  // klíči (ten má po rozbalení escapů taky skutečné zalomení).
  dict[key] = value.replace(/\\n/g, '\n');
  filled += 1;
});

const dir = join(here, '..', 'src', 'translations');
mkdirSync(dir, { recursive: true });
const out = join(dir, `${lang}.json`);
writeFileSync(out, JSON.stringify(dict, null, 2) + '\n', 'utf8');

console.log(`${lang}: ${filled}/${keys.length} přeloženo → src/translations/${lang}.json`);
