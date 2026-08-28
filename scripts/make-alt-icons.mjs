// Vygeneruje alternativní ikony aplikace (Pro featura) ze STEJNÉ geometrie
// jako `make-icons.mjs`, jen s jinou paletou. Žádné externí nástroje.
// Spuštění:  node scripts/make-alt-icons.mjs
//
// Výstup: assets/alt-icons/{mint,neon,dusk}.png  1024×1024
//
// Palety odpovídají barevným tématům v src/theme.ts (THEMES). „dusk" je
// zároveň Pro téma — hezká vazba na to, že celá featura je Pro.
//
// STAV: placeholder. Když design později dodá ručně laděné alt ikony,
// přepíše vygenerované soubory. Viz PLAN-pro-batch-2.md §2.

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'alt-icons');
mkdirSync(OUT, { recursive: true });

// ---- palety: [plocha/žlutá, trojúhelník/modrá, linka+rám/inkoust] ----
const PALETTES = {
  mint: { fill: [0x00, 0xe5, 0xc0], wedge: [0x10, 0x10, 0x10], ink: [0x10, 0x10, 0x10] },
  neon: { fill: [0x2b, 0x0a, 0x5e], wedge: [0xff, 0x4f, 0xd8], ink: [0xff, 0xe5, 0x00] },
  dusk: { fill: [0x4a, 0x2e, 0x8a], wedge: [0xc8, 0xa0, 0xff], ink: [0xff, 0xd9, 0xb0] },
};

// --------------------------------------------------------------- PNG zápis
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(w, h, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y += 1) {
    raw[y * (w * 4 + 1)] = 0;
    pixels.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --------------------------------------------------------------- kreslení
// Shodné s drawIcon() v make-icons.mjs, jen barvy jsou parametr.
// `inset` = podíl plochy ponechaný jako okraj (Android adaptivní popředí se
// ořezává do různých tvarů). `transparent` = mimo motiv průhledno (popředí),
// jinak plná výplň (iOS ikona bez alfa vrstvy).
function drawIcon(size, pal, { inset = 0, transparent = false } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const pad = Math.round(size * inset);
  const box = size - pad * 2;
  const angle = (-38 * Math.PI) / 180;
  const nx = Math.sin(angle);
  const ny = -Math.cos(angle);
  const half = box * 0.045;
  const borderW = box * 0.038;

  const put = (i, rgb, a = 255) => {
    px[i] = rgb[0]; px[i + 1] = rgb[1]; px[i + 2] = rgb[2]; px[i + 3] = a;
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const lx = x - pad;
      const ly = y - pad;

      if (lx < 0 || ly < 0 || lx >= box || ly >= box) {
        if (transparent) put(i, [0, 0, 0], 0);
        else put(i, pal.fill);
        continue;
      }

      const onBorder = lx < borderW || ly < borderW || lx >= box - borderW || ly >= box - borderW;
      if (onBorder) { put(i, pal.ink); continue; }
      const dist = Math.abs((lx - box / 2) * nx + (ly - box / 2) * ny);
      if (dist < half) { put(i, pal.ink); continue; }
      const upperLeft = lx + ly < box;
      put(i, upperLeft ? pal.wedge : pal.fill);
    }
  }
  return px;
}

console.log('assets/alt-icons/');
for (const [name, pal] of Object.entries(PALETTES)) {
  // iOS: plná 1024² ikona bez alfa vrstvy.
  const ios = encodePng(1024, 1024, drawIcon(1024, pal));
  writeFileSync(join(OUT, name + '.png'), ios);
  console.log('  ' + name + '.png  1024×1024  ' + (ios.length / 1024).toFixed(1) + ' kB');

  // Android: průhledné popředí s 25% bezpečným okrajem (pozadí je plná
  // barva z app.json → backgroundColor). Hustoty dogeneruje prebuild.
  const fg = encodePng(1024, 1024, drawIcon(1024, pal, { inset: 0.25, transparent: true }));
  writeFileSync(join(OUT, name + '-foreground.png'), fg);
  console.log('  ' + name + '-foreground.png  1024×1024  ' + (fg.length / 1024).toFixed(1) + ' kB');
}
console.log('Hotovo.');
