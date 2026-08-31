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
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePng } from './lib/png.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(OUT, { recursive: true });

const YELLOW = [0xff, 0xe5, 0x00];
const BLUE = [0x1f, 0x49, 0xff];
const INK = [0x10, 0x10, 0x10];
const BONE = [0xfa, 0xf7, 0xf0];

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
// ---------------------------------------------------------- web (docs/img)
//
// `og:image` v docs/index.html ukazovalo na `img/og.png`, který v repozitáři
// NIKDY nebyl. Každé sdílení splittingly.com na Facebooku, LinkedInu nebo
// ve WhatsAppu tak vyšlo bez náhledu — a 404 se u meta značky nikde
// neohlásí, takže se na to nedá přijít jinak než pohledem.
//
// Kreslí se ze stejné geometrie jako ikona, takže se logo na webu nemůže
// rozejít s tím v appce.

/** Otevřený graf chce 1200×630. Logo doprostřed, zbytek inkoust. */
function drawOg(w, h) {
  const px = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i += 1) {
    px[i * 4] = INK[0]; px[i * 4 + 1] = INK[1]; px[i * 4 + 2] = INK[2]; px[i * 4 + 3] = 255;
  }
  const size = Math.round(h * 0.62);
  const logo = drawIcon({ size });
  const ox = Math.round((w - size) / 2);
  const oy = Math.round((h - size) / 2);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const src = (y * size + x) * 4;
      const dst = ((oy + y) * w + ox + x) * 4;
      px[dst] = logo[src]; px[dst + 1] = logo[src + 1];
      px[dst + 2] = logo[src + 2]; px[dst + 3] = 255;
    }
  }
  return px;
}

{
  const dir = join(OUT, '..', 'docs', 'img');
  mkdirSync(dir, { recursive: true });
  const og = encodePng(1200, 630, drawOg(1200, 630));
  writeFileSync(join(dir, 'og.png'), og);
  console.log('docs/img/og.png  1200×630  ' + (og.length / 1024).toFixed(1) + ' kB');

  // Web kreslí logo vektorem, aby bylo ostré v každé velikosti. Čísla jsou
  // TÁŽ jako výš v `drawIcon`, jen přepsaná do SVG: rám 3,8 %, pás 2×4,5 %
  // pod −38°, modrá nad ANTI-úhlopříčkou. Ten sedmistupňový rozdíl mezi
  // pásem a barevným předělem je záměr — dělá žlutý klín vpravo nahoře
  // a modrý vlevo dole.
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">',
    '  <rect width="100" height="100" fill="#FFE500"/>',
    '  <polygon points="0,0 100,0 0,100" fill="#1F49FF"/>',
    '  <line x1="-13" y1="99.3" x2="113" y2="0.7" stroke="#101010" stroke-width="9"/>',
    '  <rect x="1.9" y="1.9" width="96.2" height="96.2" fill="none" stroke="#101010" stroke-width="3.8"/>',
    '</svg>',
    '',
  ].join(String.fromCharCode(10));
  for (const name of ['app-icon.svg', 'favicon.svg']) {
    writeFileSync(join(dir, name), svg, 'utf8');
    console.log('docs/img/' + name);
  }
}

console.log('Hotovo.');
