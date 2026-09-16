/**
 * The two themes, as rules rather than as screenshots.
 *
 * Daylight is not a stylesheet sitting beside the ember one. It is a
 * redefinition of the token layer, which only works while every surface
 * in the product actually reads from that layer. The moment a component
 * writes rgba(255,255,255,.04) into a background, or paints type with
 * --as-gold, it has pinned itself to one canvas and the other theme is
 * quietly wrong there. That failure is invisible in the theme you happen
 * to be looking at, which is exactly why it belongs in a test and not in
 * a review.
 *
 * These read the stylesheets as text. No DOM, no browser, no snapshot to
 * re-bless: each one is a rule the design system already states in
 * words, checked against the files.
 *
 * WHAT IS DELIBERATELY NOT HERE. Nothing measures contrast. The ratios
 * in app/globals.css were computed against the canvas when the values
 * were chosen and they are written beside each one, but a real check
 * needs the composited result of a translucent pane over a gradient,
 * which is a rendering question and not a parsing one.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const GLOBALS = readFileSync(join(ROOT, 'app/globals.css'), 'utf8');

/** Every CSS module in the product, as [path, source]. */
function modules(): [string, string][] {
  const found: [string, string][] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === '.next' || entry === '.git') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.module.css')) {
        found.push([full.slice(ROOT.length + 1).replace(/\\/g, '/'), readFileSync(full, 'utf8')]);
      }
    }
  };
  walk(join(ROOT, 'components'));
  walk(join(ROOT, 'app'));
  return found;
}

const MODULES = modules();

/* The subscription document is the one surface that is paper in BOTH
   themes: white ground, dark ink, gold accents, because a legal
   instrument should look like one. Its black hairlines are correct
   there and must not be dragged onto the token ladder. */
const PAPER = 'components/invest/LegalDocument.module.css';

/** The block of declarations inside a selector, by exact selector text. */
function block(css: string, selector: string): string {
  const at = css.indexOf(selector + '{');
  assert.notEqual(at, -1, `${selector} is missing from app/globals.css`);
  const open = at + selector.length;
  return css.slice(open + 1, css.indexOf('}', open));
}

const DARK = block(GLOBALS, ':root');
const LIGHT = block(GLOBALS, "html[data-theme='light']");

/** Custom properties a block defines, as a set of names. */
function defined(css: string): Set<string> {
  return new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
}

describe('the ember canvas is still the default', () => {
  test(':root carries no theme attribute, so dark needs no opt in', () => {
    // Daylight is a preference a member expresses. Nothing should make
    // the product open in a different skin depending on the machine.
    assert.ok(!GLOBALS.includes('prefers-color-scheme'));
  });

  test('the light theme is scoped to the attribute and nothing else', () => {
    const scoped = [...GLOBALS.matchAll(/html\[data-theme='(\w+)'\]/g)].map((m) => m[1]);
    assert.ok(scoped.length > 0, 'the light theme block is missing');
    assert.deepEqual([...new Set(scoped)], ['light']);
  });
});

describe('the light theme restates every token that depends on the canvas', () => {
  /* Each of these is a value that means something different on cream
     than it does on ember. Miss one and that surface keeps its dark
     value while everything around it turns over, which reads as a bug
     in the component rather than a hole in the theme. */
  const MUST_RESTATE = [
    // the canvas and the text ladder
    '--as-ink', '--as-text', '--as-text-body', '--as-text-muted', '--as-text-faint',
    // accents as TYPE, which is where the brand golds fail on cream
    '--accent', '--accent-hot', '--accent-quiet', '--accent-soft', '--focus-ring',
    // status
    '--good', '--good-paint', '--bad', '--warn', '--figure-hot', '--vote-gradient',
    // the depth ladder, which inverts
    '--fill-card', '--surface-1', '--surface-2', '--surface-3',
    '--surface-well', '--surface-sunk', '--edge-top', '--track', '--card-edge',
    // hairlines, glass and lift
    '--hair-neutral', '--hair-soft', '--hair-strong',
    '--glass-blur', '--glass-sat', '--card-lift', '--card-sheen', '--btn-fill',
    // plot colours, which are fills on whatever card they land on
    '--as-cat-venture', '--as-cat-growth', '--as-cat-fund',
    '--as-cat-secondary', '--as-cat-realasset',
  ];

  const light = defined(LIGHT);
  const dark = defined(DARK);

  for (const token of MUST_RESTATE) {
    test(`${token}`, () => {
      assert.ok(dark.has(token), `${token} is not defined in :root`);
      assert.ok(light.has(token), `${token} is not restated for Daylight`);
    });
  }
});

describe('what must NOT invert', () => {
  test('dark type on a gold CTA stays dark type on a gold CTA', () => {
    /* --fg-on-gold is var(--as-ink) on the ember canvas, where the
       canvas happens to be the right ink for a gold button. On cream
       --as-ink becomes the page colour, so inheriting it would put
       cream type on a gold gradient. The light theme has to pin its own
       value, and specifically must not alias the canvas. */
    const value = /--fg-on-gold:\s*([^;]+);/.exec(LIGHT)?.[1]?.trim();
    assert.ok(value, '--fg-on-gold is not pinned in the light theme');
    assert.ok(
      !value.includes('--as-ink'),
      `--fg-on-gold must not follow the canvas, got ${value}`,
    );
  });

  test('the orb is gold in both themes', () => {
    // Rule three of the identity. The orb gradients are paint and the
    // light theme has no business restating them.
    for (const token of ['--as-orb-metal', '--as-orb-period', '--as-orb-signal']) {
      assert.ok(defined(DARK).has(token), `${token} is missing from :root`);
      assert.ok(!defined(LIGHT).has(token), `${token} must not be re-themed`);
    }
  });

  test('the brand paint keeps its values', () => {
    /* Gold is #C79A4B on every surface AltSpot ships. The light theme
       darkens the SEMANTIC accents used for type, never the paint the
       gradients and the orb are built from. */
    for (const token of ['--as-gold', '--as-orange', '--as-ember', '--as-amber', '--as-champagne']) {
      assert.ok(!defined(LIGHT).has(token), `${token} is paint and must not be re-themed`);
    }
  });

  test('anything sitting on deal artwork keeps its dark scrim', () => {
    // Banners are supplied images and no theme knows what is in them.
    for (const token of ['--scrim-media', '--scrim-media-soft', '--scrim-media-strong', '--on-media']) {
      assert.ok(defined(DARK).has(token), `${token} is missing from :root`);
      assert.ok(!defined(LIGHT).has(token), `${token} must stay dark in both themes`);
    }
  });
});

describe('components read the token layer rather than the canvas', () => {
  test('no module hardcodes a white or black surface', () => {
    /* rgba(255,255,255,.04) is a correct card fill on ember and means
       nothing anywhere else. The depth ladder exists so a component can
       say which STEP it wants and let the theme say what that is. */
    const offenders: string[] = [];
    for (const [path, css] of MODULES) {
      if (path === PAPER) continue;
      css.split('\n').forEach((line, i) => {
        if (!/^\s*(background|background-color)\s*:/.test(line)) return;
        if (/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,|rgba\(\s*0\s*,\s*0\s*,\s*0\s*,/.test(line)) {
          offenders.push(`${path}:${i + 1} ${line.trim()}`);
        }
      });
    }
    assert.deepEqual(offenders, [], `use the --surface-* ladder:\n${offenders.join('\n')}`);
  });

  test('no module paints type with a paint token', () => {
    /* The brand golds are 6:1 on ember and 2.3:1 on cream. Type reads
       from --accent / --accent-hot / --accent-quiet / --accent-soft,
       which carry a contrast guarantee on both canvases; --as-gold and
       friends are for gradients, bar fills and glyph strokes. */
    const paint = [
      'as-gold', 'as-orange', 'as-amber', 'as-champagne', 'as-ember', 'as-ember-soft',
      'gold', 'gold-l', 'gold-bright', 'orange', 'orange-b', 'ember',
    ].join('|');
    const re = new RegExp(`color:\\s*var\\(--(${paint})\\)`);
    const offenders: string[] = [];
    for (const [path, css] of [...MODULES, ['app/globals.css', GLOBALS] as [string, string]]) {
      css.split('\n').forEach((line, i) => {
        if (re.test(line)) offenders.push(`${path}:${i + 1} ${line.trim()}`);
      });
    }
    assert.deepEqual(offenders, [], `use the semantic accents:\n${offenders.join('\n')}`);
  });

  test('no module paints type with the canvas', () => {
    /* color: var(--as-ink) was how every gold button in the product
       said "dark ink". It is correct by accident on ember and inverts
       into cream-on-gold the moment the canvas changes. */
    const offenders: string[] = [];
    for (const [path, css] of MODULES) {
      css.split('\n').forEach((line, i) => {
        if (/color:\s*var\(--(as-ink|bg)\)/.test(line)) {
          offenders.push(`${path}:${i + 1} ${line.trim()}`);
        }
      });
    }
    assert.deepEqual(offenders, [], `use --fg-on-gold:\n${offenders.join('\n')}`);
  });

  test('the taxonomy names tokens, not hex', () => {
    /* A tint in lib/taxonomy.ts is handed to React as an inline style,
       and inline styles do not cascade, so a hex there is a colour no
       theme can reach. The allocation bars and legend swatches were the
       one part of the product that stayed dark when the rest turned. */
    const taxonomy = readFileSync(join(ROOT, 'lib/taxonomy.ts'), 'utf8');
    const hex = [...taxonomy.matchAll(/tint:\s*'(#[0-9A-Fa-f]{3,8})'/g)].map((m) => m[1]);
    assert.deepEqual(hex, [], `asset class tints must be var(--as-cat-*), got ${hex.join(', ')}`);
    assert.ok(
      !/INDUSTRY_TINTS[^=]*=\s*\[\s*'#/.test(taxonomy),
      'INDUSTRY_TINTS must name --as-ind-* tokens rather than hex',
    );
  });
});

describe('glass survives the build', () => {
  test('no stylesheet writes -webkit-backdrop-filter', () => {
    /* The CSS pipeline merges the prefixed and unprefixed declarations,
       and when the value holds a var() it drops BOTH. Every pane on the
       platform shipped with no blur at all for as long as each rule
       carried the pair: translucent paint, not glass. Write the standard
       property alone; the compiler adds a prefix where a target needs
       one. */
    const offenders: string[] = [];
    for (const [path, css] of [['app/globals.css', GLOBALS] as [string, string], ...MODULES]) {
      css.split('\n').forEach((line, i) => {
        if (/-webkit-backdrop-filter\s*:/.test(line)) offenders.push(`${path}:${i + 1}`);
      });
    }
    assert.deepEqual(offenders, [], `write backdrop-filter alone:\n${offenders.join('\n')}`);
  });
});

describe('every token a stylesheet reads is a token something defines', () => {
  test('no dangling var() references', () => {
    /* A misspelled custom property is silently transparent: the
       declaration is simply dropped and the element renders with
       nothing. That is survivable on one theme and invisible on the
       other, so it is worth catching here. */
    const declared = new Set<string>();
    const sources: [string, string][] = [['app/globals.css', GLOBALS], ...MODULES];

    for (const [, css] of sources) {
      for (const m of css.matchAll(/(--[\w-]+)\s*:/g)) declared.add(m[1]);
    }
    /* Some properties are set on elements rather than in a stylesheet.
       next/font writes the face variables onto <html>, and the
       rail width is written by the blocking script in app/layout.tsx.
       The rest are per-instance values a component passes in as an
       inline style, so they are collected from the components rather
       than listed here: a new one should not have to be registered in a
       test before it is allowed to exist. */
    for (const external of [
      '--font-display',
      '--font-sans',
      '--font-mono-jetbrains',
      '--font-mono-figtree',
      '--font-mono-manrope',
      '--font-mono-onest',
      '--rail',
    ]) {
      declared.add(external);
    }
    const walkTsx = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        if (entry === 'node_modules' || entry === '.next') continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walkTsx(full);
        else if (entry.endsWith('.tsx')) {
          const src = readFileSync(full, 'utf8');
          for (const m of src.matchAll(/\[\s*'(--[\w-]+)'\s+as\s+string\s*\]/g)) {
            declared.add(m[1]);
          }
        }
      }
    };
    walkTsx(join(ROOT, 'components'));
    walkTsx(join(ROOT, 'app'));

    const dangling = new Set<string>();
    for (const [path, css] of sources) {
      for (const m of css.matchAll(/var\(\s*(--[\w-]+)/g)) {
        if (!declared.has(m[1])) dangling.add(`${m[1]} (${path})`);
      }
    }
    assert.deepEqual([...dangling], []);
  });
});
