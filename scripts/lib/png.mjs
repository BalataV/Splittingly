// Minimální PNG enkodér (RGBA, bez filtrů) — sdílený mezi generátory ikon
// (`make-icons.mjs`, `make-alt-icons.mjs`), aby CRC/chunk/IHDR logika žila
// na jednom místě. Žádné externí nástroje, jen `node:zlib`.
//
// `encodePng(w, h, pixels)` — `pixels` je RGBA buffer o velikosti w*h*4.

import { deflateSync } from 'node:zlib';

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

/** `pixels` je RGBA Uint8Array/Buffer o velikosti w*h*4. */
export function encodePng(w, h, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
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
