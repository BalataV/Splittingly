// Přisype další překlady do existujícího slovníku.
//
//   node scripts/i18n-merge.mjs es dalsi.json
//
// Hodí se, když do appky přibudou nové klíče a nemá smysl kvůli nim
// přepisovat celý jazyk. Existující překlady zůstávají, kolize přepíše
// nový soubor. Klíče kontroluje `scripts/check-i18n.mjs`, ne tenhle skript —
// tady jde jen o sloučení.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [lang, extraPath] = process.argv.slice(2);
if (!lang || !extraPath) {
  console.error('Použití: node scripts/i18n-merge.mjs <kód jazyka> <soubor.json>');
  process.exit(1);
}

const here = new URL('./', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const target = join(here, '..', 'src', 'translations', `${lang}.json`);

const base = JSON.parse(readFileSync(target, 'utf8'));
const extra = JSON.parse(readFileSync(extraPath, 'utf8'));

const before = Object.keys(base).length;
Object.assign(base, extra);

// Seřazeno, ať se soubory v gitu porovnávají po řádcích a ne celé.
const sorted = {};
Object.keys(base).sort().forEach((k) => { sorted[k] = base[k]; });

writeFileSync(target, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
console.log(`${lang}: ${before} → ${Object.keys(sorted).length} klíčů`);
