// Vyhodí ze slovníků překlady klíčů, které v appce už neexistují.
//
//   node scripts/i18n-prune.mjs           → jen vypíše, co by zmizelo
//   node scripts/i18n-prune.mjs --write   → opravdu zapíše
//
// Mrtvý překlad nic nerozbije, ale mate: v pokrytí se počítá jako hotová
// práce, přitom ho `t()` nikdy nepoužije. Po přejmenování textu na obrazovce
// takových vzniká víc naráz.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const here = new URL('./', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const write = process.argv.includes('--write');

const keys = JSON.parse(execFileSync(process.execPath, [here + 'i18n-keys.mjs', '--json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
}));
const known = new Set(keys);

const dir = join(here, '..', 'src', 'translations');
let total = 0;

for (const name of readdirSync(dir)) {
  if (!name.endsWith('.json')) continue;
  const path = join(dir, name);
  const dict = JSON.parse(readFileSync(path, 'utf8'));
  const dead = Object.keys(dict).filter((k) => !known.has(k.replace(/#(one|few|many|other)$/, '')));
  if (!dead.length) continue;

  total += dead.length;
  console.log(`${name}: ${dead.length} mrtvých`);
  dead.forEach((k) => console.log(`    ${JSON.stringify(k)}`));

  if (write) {
    dead.forEach((k) => { delete dict[k]; });
    const sorted = {};
    Object.keys(dict).sort().forEach((k) => { sorted[k] = dict[k]; });
    writeFileSync(path, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
  }
}

if (!total) console.log('Žádné mrtvé překlady.');
else if (!write) console.log(`\nCelkem ${total}. Spusť s --write, ať se opravdu smažou.`);
else console.log(`\nSmazáno ${total}.`);
