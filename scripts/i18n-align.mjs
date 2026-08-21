// Najde, kde se řádkový soubor s překlady rozešel se seznamem klíčů.
//
//   node scripts/i18n-align.mjs [--missing <kód>] <soubor s překlady>
//
// Když soubor nemá přesně tolik řádků kolik je klíčů, `i18n-build.mjs` ho
// odmítne — ale neřekne KDE. Tenhle skript porovná obojí vedle sebe a
// vypíše okolí prvního místa, kde to přestane dávat smysl.
//
// Heuristika: klíč psaný VELKÝMI PÍSMENY má mít velkými i překlad, krátký
// klíč má mít krátký překlad, klíč s {placeholder} ho má mít taky. Když se
// tyhle tři věci u jednoho řádku rozejdou, je to skoro jistě první posun.

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const mi = argv.indexOf('--missing');
const lang = mi >= 0 ? argv[mi + 1] : null;
const file = argv[argv.length - 1];

if (!file) {
  console.error('Použití: node scripts/i18n-align.mjs [--missing <kód>] <soubor>');
  process.exit(1);
}

const here = new URL('./', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const all = JSON.parse(execFileSync(process.execPath, [here + 'i18n-keys.mjs', '--json'], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
}));

let keys = all;
if (lang) {
  const target = join(here, '..', 'src', 'translations', `${lang}.json`);
  const existing = existsSync(target) ? JSON.parse(readFileSync(target, 'utf8')) : {};
  keys = all.filter((k) => !(k in existing));
}

const lines = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');
if (lines.length && lines[lines.length - 1] === '') lines.pop();

console.log(`klíčů: ${keys.length}, řádků: ${lines.length}, rozdíl: ${lines.length - keys.length}\n`);

const ph = (s) => (s.match(/\{[a-zA-Z]+\}/g) || []).sort().join(',');
const shout = (s) => s === s.toUpperCase() && /\p{Lu}/u.test(s);

// Písma bez rozlišení velikosti (CJK, thajština, arabština, hebrejština…)
// nemají VELKÁ písmena, takže test velikosti u nich nic neříká. A CJK
// zapíše totéž na výrazně méně znaků, takže ani poměr délek neplatí.
// Písma BEZ velkých a malých písmen. U nich `v === v.toUpperCase()` platí
// vždycky, takže test velikosti nic neměří — a latinská zkratka uvnitř
// („CSV“, „JPY, KRW“) ho navíc svede na scestí. Proto se u nich přeskočí.
const CASELESS = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Tamil}]/u;
const hasCase = (s) => !CASELESS.test(s) && (s.match(/\p{Ll}|\p{Lu}/gu) || []).length >= 4;
// CJK a thajština zapíšou totéž na výrazně méně znaků než latinka.
const dense = (s) => CASELESS.test(s);

let first = -1;
for (let i = 0; i < Math.min(keys.length, lines.length); i += 1) {
  const k = keys[i];
  // `\n` psané jako dva znaky rozbalit, jinak by to malé „n“ vypadalo
  // jako malé písmeno a shodilo kontrolu velikosti (viz `shout`).
  const v = lines[i].replace(/\\n/g, '\n');
  // Placeholder je nejtvrdší signál — ten se překladem nemění.
  let bad = ph(k) !== ph(v);
  // Velikost písmen porovnávej jen u delších řetězců (u „AD“ nebo „OR“ je
  // to náhoda) a jen když překlad velikost vůbec rozlišuje.
  if (!bad && k.length >= 4 && v.length >= 4 && hasCase(v)) bad = shout(k) !== shout(v);
  // Hrubý poměr délek. Neplatí pro hustá písma — japonština řekne totéž
  // na třetinu znaků a vypadala by jako chyba.
  if (!bad && k.length > 30 && !dense(v)) bad = v.length < k.length * 0.3 || v.length > k.length * 3;
  if (bad) { first = i; break; }
}

if (first < 0) {
  console.log('Podle heuristiky sedí. Pokud počty nesouhlasí, chybí/přebývá na konci.');
} else {
  console.log(`První podezřelý řádek: ${first + 1}\n`);
  for (let j = Math.max(0, first - 3); j < Math.min(keys.length, first + 4); j += 1) {
    const mark = j === first ? '>>' : '  ';
    console.log(`${mark} ${String(j + 1).padStart(4)} | ${keys[j].replace(/\n/g, '\\n').slice(0, 44).padEnd(44)} | ${(lines[j] || '').slice(0, 44)}`);
  }
}
