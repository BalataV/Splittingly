// Převede snímek obrazovky na rozměr, který přijme App Store Connect.
//
// Apple nemá minimum, ale VÝČET přesných rozměrů. Snímek z Androidu bývá
// 1080×2400, což se od povoleného 1080×2340 liší o šedesát bodů — a nahrání
// skončí hláškou „The dimensions of one or more screenshots are wrong",
// která neřekne, jaký rozměr vlastně chtěla.
//
// Obrázek se NEDEFORMUJE. Zvětší se poměrově tak, aby se celý vešel, a
// zbytek se doplní barvou pozadí appky. Roztažení na jiný poměr by ohnulo
// písmo i kulaté prvky a na kontrole to bije do očí.
//
// Spuštění:
//   node scripts/store-screenshot.mjs vstup.png
//   node scripts/store-screenshot.mjs vstup.png --size 6.9
//   node scripts/store-screenshot.mjs vstup.png --bg 101010
//
// Výstup vedle vstupu, s příponou podle rozměru: vstup-1284x2778.png

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, dirname, extname, join, isAbsolute, resolve } from 'node:path';
import { PNG } from 'pngjs';

/**
 * Cesta k souboru tak, jak ji myslel člověk, ne jak ji vidí npm.
 *
 * `npm run` spouští skript VŽDY z kořene projektu, ať stojíš kdekoli.
 * `npm run shot -- snimek.png` zadané ve `store/` tedy hledá soubor
 * v kořeni a spadne na ENOENT s cestou, kterou nikdo nezadal. npm ale
 * původní adresář předává v `INIT_CWD`, tak se podíváme i tam.
 */
function najdi(cesta) {
  if (isAbsolute(cesta)) return cesta;
  const odkudSpustil = process.env.INIT_CWD;
  if (odkudSpustil) {
    const podleUzivatele = resolve(odkudSpustil, cesta);
    if (existsSync(podleUzivatele)) return podleUzivatele;
  }
  return resolve(process.cwd(), cesta);
}

/** Rozměry, které App Store Connect bere. Klíč = jak se na ně Apple odkazuje. */
const ROZMERY = {
  '6.9': [1320, 2868],   // iPhone 17 Pro Max, 16 Pro Max, Air
  '6.5': [1284, 2778],   // iPhone 14 Plus, 13 Pro Max … nejbezpečnější volba
  '6.3': [1206, 2622],
  '6.1': [1170, 2532],
  '5.5': [1242, 2208],
  '4.7': [750, 1334],
};

const args = process.argv.slice(2);
const vstup = args.find((a) => !a.startsWith('--'));
const size = args.includes('--size') ? args[args.indexOf('--size') + 1] : '6.5';
const bgHex = args.includes('--bg') ? args[args.indexOf('--bg') + 1] : '101010';

if (!vstup) {
  console.error('Použití: node scripts/store-screenshot.mjs <soubor.png> [--size 6.9] [--bg RRGGBB]');
  console.error('Rozměry: ' + Object.entries(ROZMERY).map(([k, v]) => `${k}" = ${v[0]}×${v[1]}`).join(', '));
  process.exit(1);
}
if (!ROZMERY[size]) {
  console.error(`Neznámý rozměr "${size}". Na výběr: ${Object.keys(ROZMERY).join(', ')}`);
  process.exit(1);
}

const [W, H] = ROZMERY[size];
const bg = [
  parseInt(bgHex.slice(0, 2), 16),
  parseInt(bgHex.slice(2, 4), 16),
  parseInt(bgHex.slice(4, 6), 16),
];

const cestaVstup = najdi(vstup);
if (!existsSync(cestaVstup)) {
  console.error(`Soubor nenalezen: ${cestaVstup}`);
  process.exit(1);
}
const src = PNG.sync.read(readFileSync(cestaVstup));

// Poměr, při kterém se obrázek celý vejde. Nikdy se neořezává — na snímku
// nákupu musí zůstat vidět cena i tlačítko, jinak je recenzentovi k ničemu.
const scale = Math.min(W / src.width, H / src.height);
const nW = Math.round(src.width * scale);
const nH = Math.round(src.height * scale);
const offX = Math.floor((W - nW) / 2);
const offY = Math.floor((H - nH) / 2);

const out = new PNG({ width: W, height: H });

// Pozadí. Alfa je všude 255 — Apple průhlednost ani alfa kanál nepřijímá.
for (let i = 0; i < W * H; i += 1) {
  out.data[i * 4] = bg[0];
  out.data[i * 4 + 1] = bg[1];
  out.data[i * 4 + 2] = bg[2];
  out.data[i * 4 + 3] = 255;
}

// Nejbližší soused. Zvětšujeme jen mírně a rozhraní je plné ostrých hran
// a jednolitých ploch — hladká interpolace by je rozmazala víc, než pomohla.
for (let y = 0; y < nH; y += 1) {
  const sy = Math.min(src.height - 1, Math.floor(y / scale));
  for (let x = 0; x < nW; x += 1) {
    const sx = Math.min(src.width - 1, Math.floor(x / scale));
    const s = (sy * src.width + sx) * 4;
    const d = ((offY + y) * W + offX + x) * 4;
    // Případnou průhlednost podložíme pozadím, ať nevznikne alfa kanál.
    const a = src.data[s + 3] / 255;
    out.data[d] = Math.round(src.data[s] * a + bg[0] * (1 - a));
    out.data[d + 1] = Math.round(src.data[s + 1] * a + bg[1] * (1 - a));
    out.data[d + 2] = Math.round(src.data[s + 2] * a + bg[2] * (1 - a));
    out.data[d + 3] = 255;
  }
}

const cil = join(dirname(cestaVstup), `${basename(cestaVstup, extname(cestaVstup))}-${W}x${H}.png`);
writeFileSync(cil, PNG.sync.write(out));

console.log(`vstup   ${src.width}×${src.height}`);
console.log(`výstup  ${W}×${H}  (${size}" displej)`);
if (offX > 0) console.log(`         doplněno po stranách: 2× ${offX} px`);
if (offY > 0) console.log(`         doplněno nahoře a dole: 2× ${offY} px`);
console.log(cil);
