// Vygeneruje ikony aplikace přímo z geometrie loga — žádné externí nástroje.
// Spuštění:  node scripts/make-icons.mjs
//
// Logo: čtverec rozťatý jednou úhlopříčkou. Žlutá plocha, modrý trojúhelník
// v horní levé polovině, inkoustová linka napříč středem otočená o −38°.
// Žlutá ho udrží k nalezení na přeplněné ploše telefonu.
//
// Výstup do assets/:
//   icon.png                      1024×1024  (iOS + obecná ikona)
//   android-icon-foreground.png   1024×1024  (adaptivní, s bezpečným okrajem)
//   android-icon-monochrome.png   1024×1024  (jednobarevná pro Material You)
//   splash-icon.png                512×512
//   favicon.png                    196×196

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(OUT, { recursive: true });

const YELLOW = [0xff, 0xe5, 0x00];
const BLUE = [0x1f, 0x49, 0xff];
const INK = [0x10, 0x10, 0x10];
const BONE = [0xfa, 0xf7, 0xf0];

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

/** `pixels` je RGBA Uint8Array o velikosti w*h*4. */
function encodePng(w, h, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 6;    // colour type RGBA
  // 10–12 = compression / filter / interlace = 0

  // Každý řádek předchází bajt filtru (0 = žádný filtr).
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y += 1) {
    raw[y * (w * 4 + 1)] = 0;
    pixels.copy
      ? pixels.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
      : Buffer.from(pixels.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --------------------------------------------------------------- kreslení

/**
 * Nakreslí ikonu. `inset` je podíl plochy ponechaný jako okraj — adaptivní
 * ikona na Androidu se ořezává do různých tvarů, takže motiv musí být menší.
 */
function drawIcon({ size, inset = 0, mono = false, transparent = false }) {
  const px = Buffer.alloc(size * size * 4);
  const pad = Math.round(size * inset);
  const box = size - pad * 2;

  // Linka přes střed, otočená o −38°: bod leží na lince, když je jeho
  // kolmá vzdálenost od osy menší než polovina tloušťky.
  const angle = (-38 * Math.PI) / 180;
  const nx = Math.sin(angle);   // normála přímky
  const ny = -Math.cos(angle);
  const half = box * 0.045;     // ~5 px na 110 px z návrhu
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
        else put(i, mono ? INK : YELLOW);
        continue;
      }

      const onBorder = lx < borderW || ly < borderW || lx >= box - borderW || ly >= box - borderW;
      if (onBorder) { put(i, mono ? BONE : INK); continue; }

      // vzdálenost od osy vedoucí středem
      const dist = Math.abs((lx - box / 2) * nx + (ly - box / 2) * ny);
      if (dist < half) { put(i, mono ? BONE : INK); continue; }

      // horní levá polovina (nad hlavní úhlopříčkou) je modrá
      const upperLeft = lx + ly < box;
      if (mono) put(i, upperLeft ? BONE : INK);
      else put(i, upperLeft ? BLUE : YELLOW);
    }
  }
  return px;
}

function write(name, size, opts) {
  const png = encodePng(size, size, drawIcon({ size, ...opts }));
  writeFileSync(join(OUT, name), png);
  console.log('  ' + name + '  ' + size + '×' + size + '  ' + (png.length / 1024).toFixed(1) + ' kB');
}

console.log('assets/');
write('icon.png', 1024, {});
// Adaptivní popředí má 25% bezpečný okraj — Android ikonu ořízne do kruhu,
// squircle nebo čehokoli, co si výrobce vymyslí.
write('android-icon-foreground.png', 1024, { inset: 0.25, transparent: true });
write('android-icon-monochrome.png', 1024, { inset: 0.25, mono: true, transparent: true });
write('splash-icon.png', 512, {});
write('favicon.png', 196, {});

// Play Console chce ikonu 512×512 zvlášť (1024 nepřijme).
mkdirSync(join(OUT, '..', 'store'), { recursive: true });
{
  const png = encodePng(512, 512, drawIcon({ size: 512 }));
  writeFileSync(join(OUT, '..', 'store', 'play-icon-512.png'), png);
  console.log('store/play-icon-512.png  512×512  ' + (png.length / 1024).toFixed(1) + ' kB');
}
console.log('Hotovo.');
