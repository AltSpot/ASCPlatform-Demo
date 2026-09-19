/**
 * DEMO SEAM. Draws a mark for every invented company into private/marks/.
 *
 *   node scripts/make-marks.mjs
 *
 * One family, so a board of thirty reads as one product: the same
 * rounded tile, the same stroke weight, the same two-stop gradient and
 * the same inner light. What differs is the hue (lib/brand-hues.json)
 * and the glyph, and those two are enough to tell any two apart at
 * 32px. The output is committed; run this again only when a company or
 * a glyph changes. Real companies bring their own marks and this goes.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const hues = JSON.parse(readFileSync(path.join(root, 'lib', 'brand-hues.json'), 'utf8'));

/* Every glyph is drawn on a 100 unit tile, inside roughly 24..76. `S`
   strokes with the gradient, `F` fills with it. */
const S = 'stroke="url(#g)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"';
const F = 'fill="url(#g)"';
const S5 = S.replace('stroke-width="7"', 'stroke-width="5"');

const GLYPHS = {
  // Grid lines meeting at nodes.
  calder: `<path d="M28 70 L44 70 L44 46 L62 46" ${S}/><path d="M38 30 L56 30 L56 54 L72 54" ${S} opacity=".55"/><circle cx="72" cy="54" r="5.5" ${F}/><circle cx="28" cy="70" r="5.5" ${F}/>`,
  // A double helix, drawn as two crossing strands and their rungs.
  meridel: `<path d="M36 24 C64 38 36 62 64 76" ${S}/><path d="M64 24 C36 38 64 62 36 76" ${S} opacity=".6"/><path d="M42 36 L58 36 M42 64 L58 64" ${S5} opacity=".5"/>`,
  // Three stacked layers: many deals in one.
  'growth-fund': `<path d="M50 26 L76 39 L50 52 L24 39 Z" ${S}/><path d="M24 52 L50 65 L76 52" ${S} opacity=".75"/><path d="M24 64 L50 77 L76 64" ${S} opacity=".45"/>`,
  // An aura: a core and its rays.
  aurelia: `<circle cx="50" cy="50" r="11" ${F}/>${[0, 45, 90, 135, 180, 225, 270, 315]
    .map((a) => `<path d="M50 30 L50 23" ${S} transform="rotate(${a} 50 50)"/>`)
    .join('')}`,
  // Tiles that fit together.
  tessellate: `<path d="M26 70 L40 46 L54 70 Z" ${F}/><path d="M46 46 L60 70 L74 46 Z" ${F} opacity=".6"/><path d="M36 40 L50 24 L64 40 Z" ${F} opacity=".85"/>`,
  // A machined collar.
  ferrule: `<path d="M50 24 L72 37 L72 63 L50 76 L28 63 L28 37 Z" ${S}/><circle cx="50" cy="50" r="10" ${F}/>`,
  // A heartbeat inside a loop.
  loomline: `<circle cx="50" cy="50" r="25" ${S} opacity=".45"/><path d="M28 52 L40 52 L45 40 L53 62 L58 50 L72 50" ${S}/>`,
  // Columns of stone.
  basalt: `<rect x="27" y="40" width="12" height="34" rx="3" ${F} opacity=".65"/><rect x="44" y="26" width="12" height="48" rx="3" ${F}/><rect x="61" y="34" width="12" height="40" rx="3" ${F} opacity=".8"/>`,
  // A wing in a stoop.
  kestrel: `<path d="M24 36 L50 62 L76 36" ${S}/><path d="M36 36 L50 50 L64 36" ${S} opacity=".5"/>`,
  // The four-point star.
  northstar: `<path d="M50 22 L56 44 L78 50 L56 56 L50 78 L44 56 L22 50 L44 44 Z" ${F}/>`,
  // A sail on its line.
  halyard: `<path d="M44 24 L44 70 L72 70 Z" ${F}/><path d="M36 76 L74 76" ${S} opacity=".55"/><path d="M36 34 L36 70" ${S} opacity=".55"/>`,
  // A warehouse roofline.
  // A pulse line: a heartbeat across the tile.
  solenne: `<path d="M24 52 L38 52 L45 34 L55 68 L62 46 L66 52 L76 52" ${S}/>`,
  // Two tide lines under a rising mark.
  tidewater: `<path d="M26 58 C34 50 42 66 50 58 C58 50 66 66 74 58" ${S}/><path d="M26 72 C34 64 42 80 50 72 C58 64 66 80 74 72" ${S} opacity=".55"/><path d="M50 26 L50 46 M42 34 L50 26 L58 34" ${S5}/>`,
  harborline: `<path d="M24 46 L50 28 L76 46" ${S}/><path d="M30 50 L30 74 L70 74 L70 50" ${S} opacity=".6"/><rect x="43" y="56" width="14" height="18" rx="2" ${F}/>`,
  // A payment arrow through a card.
  vantage: `<rect x="24" y="32" width="52" height="36" rx="7" ${S} opacity=".5"/><path d="M34 50 L66 50 M56 40 L66 50 L56 60" ${S}/>`,
  // Wind over a line.
  northwind: `<path d="M24 40 Q40 30 56 40 T76 40" ${S}/><path d="M24 56 Q40 46 56 56 T76 56" ${S} opacity=".6"/><path d="M24 70 L76 70" ${S} opacity=".35"/>`,
  // A chip with a hot core.
  cinder: `<rect x="32" y="32" width="36" height="36" rx="6" ${S}/><circle cx="50" cy="50" r="7" ${F}/><path d="M42 24 L42 32 M58 24 L58 32 M42 68 L42 76 M58 68 L58 76 M24 42 L32 42 M24 58 L32 58 M68 42 L76 42 M68 58 L76 58" ${S5} opacity=".6"/>`,
  // An orbit and its bodies.
  orrery: `<ellipse cx="50" cy="50" rx="27" ry="13" ${S} transform="rotate(-24 50 50)" opacity=".6"/><circle cx="50" cy="50" r="9" ${F}/><circle cx="73" cy="39" r="5" ${F}/>`,
  // A shield.
  quillon: `<path d="M50 24 L72 32 L72 50 C72 63 62 72 50 77 C38 72 28 63 28 50 L28 32 Z" ${S}/><path d="M50 36 L50 62" ${S} opacity=".6"/>`,
  // Cells, charged.
  bramble: `<rect x="30" y="26" width="40" height="12" rx="6" ${F} opacity=".45"/><rect x="30" y="44" width="40" height="12" rx="6" ${F} opacity=".75"/><rect x="30" y="62" width="40" height="12" rx="6" ${F}/>`,
  // A lens with its focus.
  pellucid: `<circle cx="50" cy="50" r="24" ${S}/><circle cx="57" cy="43" r="8" ${F}/>`,
  // The W as a signal.
  wexley: `<path d="M24 34 L36 68 L50 44 L64 68 L76 34" ${S}/>`,
  // Water over marsh.
  saltmarsh: `<path d="M24 42 Q37 32 50 42 T76 42" ${S}/><path d="M24 58 Q37 48 50 58 T76 58" ${S} opacity=".55"/><circle cx="50" cy="72" r="4" ${F}/>`,
  // An anvil.
  atlasforge: `<path d="M26 36 L74 36 L66 48 L58 48 L58 60 L68 72 L32 72 L42 60 L42 48 L34 48 Z" ${F}/>`,
  // Furrows in a field.
  harrow: `<path d="M32 26 L32 74 M50 26 L50 74 M68 26 L68 74" ${S} opacity=".55"/><path d="M24 64 L76 36" ${S}/>`,
  // A lantern with its flame.
  lantern: `<path d="M40 30 Q50 20 60 30" ${S} opacity=".6"/><rect x="33" y="32" width="34" height="42" rx="9" ${S}/><circle cx="50" cy="53" r="7" ${F}/>`,
  // Depth, sounded.
  fathom: `<path d="M26 34 Q50 52 74 34" ${S}/><path d="M32 50 Q50 64 68 50" ${S} opacity=".65"/><path d="M40 64 Q50 72 60 64" ${S} opacity=".4"/>`,
  // A bowl and its seed.
  marrow: `<path d="M26 46 L74 46 C74 62 64 72 50 72 C36 72 26 62 26 46 Z" ${F}/><circle cx="50" cy="32" r="6" ${F} opacity=".7"/>`,
  // A ledger, line by line.
  ledgerline: `<path d="M28 32 L72 32" ${S}/><path d="M28 46 L62 46" ${S} opacity=".75"/><path d="M28 60 L54 60" ${S} opacity=".55"/><path d="M28 74 L44 74" ${S} opacity=".35"/>`,
  // A lock over still water.
  greyloch: `<path d="M38 44 L38 36 C38 29 43 24 50 24 C57 24 62 29 62 36 L62 44" ${S}/><rect x="30" y="44" width="40" height="32" rx="7" ${F}/>`,
  // Stones, stacked.
  cairn: `<ellipse cx="50" cy="68" rx="24" ry="8" ${F}/><ellipse cx="50" cy="51" rx="17" ry="7" ${F} opacity=".8"/><ellipse cx="50" cy="36" rx="10" ry="6" ${F} opacity=".6"/>`,
  // A drop that is also a leaf.
  vireo: `<path d="M50 22 C62 38 70 48 70 58 C70 69 61 77 50 77 C39 77 30 69 30 58 C30 48 38 38 50 22 Z" ${S}/><path d="M50 44 L50 70" ${S} opacity=".55"/>`,
  // A rising sun with a wing.
  solenne: `<path d="M28 64 A22 22 0 0 1 72 64" ${S}/><path d="M22 74 L78 74" ${S} opacity=".55"/><circle cx="50" cy="64" r="7" ${F}/>`,
};

let written = 0;
for (const [slug, glyph] of Object.entries(GLYPHS)) {
  const hue = hues[slug];
  if (!hue) throw new Error(`No hue for ${slug} in lib/brand-hues.json`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="22" y1="22" x2="78" y2="78">
      <stop offset="0" stop-color="${hue.light}"/>
      <stop offset="1" stop-color="${hue.hue}"/>
    </linearGradient>
    <radialGradient id="glow" cx=".3" cy=".2" r=".9">
      <stop offset="0" stop-color="${hue.hue}" stop-opacity=".28"/>
      <stop offset="1" stop-color="${hue.hue}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="${hue.tile}"/>
  <rect width="100" height="100" rx="22" fill="url(#glow)"/>
  <rect x=".75" y=".75" width="98.5" height="98.5" rx="21.25" fill="none" stroke="#FFFFFF" stroke-opacity=".08" stroke-width="1.5"/>
  ${glyph}
</svg>
`;
  writeFileSync(path.join(root, 'private', 'marks', `${slug}.svg`), svg);
  written += 1;
}
console.log(`wrote ${written} marks to private/marks/`);
