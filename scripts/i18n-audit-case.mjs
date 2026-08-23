// Najde překlady, které ztratily VERZÁLKY.
//
//   node scripts/i18n-audit-case.mjs
//
// Nadpisy psané velkými písmeny jsou v tomhle návrhu ZÁMĚR, ne náhoda —
// „Hard Split“ jimi odděluje sekce. Když překladatel napíše nadpis běžně,
// nic se nerozbije, ale obrazovka přestane vypadat jako zbytek appky.
// `check-i18n.mjs` to nehlídá (překlad je platný), takže je to zvlášť.
//
// Placeholdery se z porovnání vyřazují: `{n}` je malými písmeny vždycky.
// Písma bez velikosti (CJK, thajština, arabština…) se přeskakují.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const here = new URL('./', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const dir = join(here, '..', 'src', 'translations');

const noPh = (s) => s.replace(/\{[a-zA-Z]+\}/g, '');
const shout = (s) => {
  const t = noPh(s);
  return t === t.toUpperCase() && /\p{Lu}/u.test(t);
};
const hasCase = (s) => /\p{Ll}|\p{Lu}/u.test(noPh(s));

let total = 0;
for (const name of readdirSync(dir)) {
  if (!name.endsWith('.json')) continue;
  const dict = JSON.parse(readFileSync(join(dir, name), 'utf8'));
  const bad = [];
  for (const [key, value] of Object.entries(dict)) {
    if (!shout(key)) continue;          // klíč není nadpis
    if (!hasCase(value)) continue;      // písmo velikost nerozlišuje
    if (shout(value)) continue;         // v pořádku
    bad.push([key, value]);
  }
  if (!bad.length) continue;
  total += bad.length;
  console.log(`\n${name}: ${bad.length}`);
  bad.forEach(([k, v]) => console.log(`  ${JSON.stringify(k)}\n    → ${JSON.stringify(v)}`));
}

console.log(total ? `\nCelkem ${total} nadpisů bez verzálek.` : 'Všechny nadpisy drží verzálky.');
