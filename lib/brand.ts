/**
 * DEMO SEAM. The invented companies' identities, for cards.
 *
 * REAL COMPANIES DO NOT SHARE A DESIGNER (Tyler, 2026-09-19). Thirty marks
 * drawn in one style, each glowing on a gradient of its own neon, read as
 * a game's inventory rather than a market. So every company in
 * lib/brand-hues.json now has an identity of its own: a colour from a
 * palette a brand would actually ship (deep, a little grey in it), a mark
 * that is a circle or a square or a soft tile, on a light ground or a dark
 * one or the brand colour itself, drawn heavy or fine, sometimes a letter
 * rather than a picture; and a LOGO, which for many companies is a word
 * set in a typeface and not a symbol at all.
 *
 * A card uses the identity in two places and no more: the art band, which
 * is the company's deep colour laid nearly flat (no glow, no bloom) under
 * its logo, and a breath of the hue on a Radar card. Everything else on a
 * card stays in the platform's own tokens, which is what keeps thirty
 * companies reading as one marketplace.
 *
 * Logo typefaces are system stacks, deliberately: they are the one place
 * on the platform that must NOT look like the platform. The marks are
 * drawn from the same file by scripts/make-marks.mjs.
 *
 * Pure and isomorphic. Real companies bring their own marks and colours
 * and this file goes with the JSON.
 */
import BRAND_HUES from './brand-hues.json';

export type LogoKind = 'symbol' | 'word' | 'symbol-word' | 'stacked';

export type LogoFont =
  | 'grotesk'
  | 'geo'
  | 'humanist'
  | 'condensed'
  | 'black'
  | 'serif'
  | 'didone'
  | 'slab'
  | 'mono'
  | 'display';

export interface BrandLogo {
  kind: LogoKind;
  /** The word as the company sets it: its own case, its own punctuation. */
  text: string;
  font: LogoFont;
  weight: number;
  /** Letter spacing in em. */
  tracking: number;
  /** Px on a card's art band. */
  size: number;
  italic?: boolean;
  /** `tint` sets the word in the brand's light tint instead of paper white. */
  color?: 'tint';
}

/**
 * How a card's band wears the company's colour (Tyler, 2026-09-21: "the
 * colours do not have to be so dull"). A shelf where every band is the
 * same deep, flat tone reads as one company thirty times. Real brands
 * differ: some are quiet, some are loud, some are a pattern. Each style is
 * pure CSS, no images, and every one is drawn from the company's own hue.
 */
export type BandStyle = 'deep' | 'vivid' | 'light' | 'stripes' | 'grid' | 'dots' | 'columns' | 'rings';

export interface Brand {
  /** The company's colour. */
  hue: string;
  /** Its light tint. */
  light: string;
  /** The ground its square mark sits on. */
  tile: string;
  /** The deep, flat brand colour a card's art band wears. */
  band?: string;
  bandStyle?: BandStyle;
  logo?: BrandLogo;
}

/** System stacks: a logo is the one thing here that is not set in our type. */
export const LOGO_FONTS: Record<LogoFont, string> = {
  grotesk: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  geo: "'Century Gothic', Futura, 'Avenir Next', 'Trebuchet MS', sans-serif",
  humanist: "'Gill Sans', 'Gill Sans MT', 'Segoe UI', Verdana, sans-serif",
  condensed: "'Arial Narrow', 'Franklin Gothic Medium', 'Helvetica Neue', Arial, sans-serif",
  black: "'Arial Black', 'Segoe UI Black', 'Helvetica Neue', Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  didone: "'Bodoni MT', Didot, 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
  slab: "Rockwell, 'Courier New', Georgia, serif",
  mono: "Consolas, 'SF Mono', 'Courier New', monospace",
  display: 'var(--font-display)',
};

const TABLE = BRAND_HUES as unknown as Record<string, Brand | string | undefined>;

export function brandOf(slug: string): Brand | null {
  const entry = TABLE[slug];
  return entry && typeof entry === 'object' ? entry : null;
}

/** The colour a logo's word is set in, on its band. */
export const LOGO_PAPER = '#F4EFE6';

/* ---- colour arithmetic, on #RRGGBB ---- */
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
}
/** Mix a toward b by t (0 to 1). */
function mix(a: string, b: string, t: number): string {
  const [x, y] = [rgb(a), rgb(b)];
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}
function alpha(hex: string, a: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
/** Relative luminance, 0 (black) to 1 (white). */
function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The colour a band is mostly made of, for choosing the ink on it. */
function bandBase(b: Brand): string {
  const style = b.bandStyle ?? 'deep';
  if (style === 'light') return mix(b.light, '#FFFFFF', 0.2);
  if (style === 'vivid') return b.hue;
  return b.band ?? b.tile;
}

/**
 * Whether a company's band is light enough that type on it must be dark.
 * A light band always is; a vivid one is when its hue is (a warm amber,
 * a yellow). The logo, the label on the deal hero and the overlays all
 * read this, so nothing is ever white on pale.
 */
export function bandIsLight(slug: string): boolean {
  const b = brandOf(slug);
  if (!b) return false;
  return luminance(bandBase(b)) > 0.34;
}

/** The ink for a word set on a light band: the company's own hue, deepened. */
export function bandInk(slug: string): string {
  const b = brandOf(slug);
  if (!b) return '#15110A';
  return (b.bandStyle ?? 'deep') === 'light' ? mix(b.hue, '#000000', 0.45) : '#17120A';
}

/**
 * The art band behind a company's logo, in its own style. The quiet ones
 * are the company's deep colour nearly flat; a vivid band is the hue at
 * full strength with one soft light; a light band is the tint; a pattern
 * is a fine figure in the tint over the deep colour, always faint, never a
 * texture that competes with the logo.
 */
export function brandArt(slug: string): string | null {
  const b = brandOf(slug);
  if (!b) return null;
  const band = b.band ?? b.tile;
  const deep = `linear-gradient(180deg,rgba(255,255,255,.055) 0%,rgba(255,255,255,0) 46%,rgba(0,0,0,.20) 100%),${band}`;
  switch (b.bandStyle ?? 'deep') {
    case 'vivid':
      return `radial-gradient(90% 130% at 16% -10%,${alpha(mix(b.hue, '#FFFFFF', 0.28), 0.75)} 0%,transparent 58%),linear-gradient(135deg,${mix(b.hue, '#FFFFFF', 0.04)} 0%,${b.hue} 45%,${mix(b.hue, '#000000', 0.36)} 100%)`;
    case 'light':
      return `radial-gradient(80% 120% at 85% 0%,${alpha('#FFFFFF', 0.55)} 0%,transparent 60%),linear-gradient(180deg,${mix(b.light, '#FFFFFF', 0.45)} 0%,${mix(b.light, '#FFFFFF', 0.08)} 100%)`;
    case 'stripes':
      return `repeating-linear-gradient(135deg,${alpha(b.light, 0.1)} 0 1px,transparent 1px 11px),${deep}`;
    case 'grid':
      return `linear-gradient(${alpha(b.light, 0.09)} 1px,transparent 1px) 0 0/24px 24px,linear-gradient(90deg,${alpha(b.light, 0.09)} 1px,transparent 1px) 0 0/24px 24px,${deep}`;
    case 'dots':
      return `radial-gradient(${alpha(b.light, 0.26)} 1px,transparent 1.6px) 0 0/16px 16px,${deep}`;
    case 'columns':
      return `repeating-linear-gradient(90deg,rgba(0,0,0,.26) 0 2px,transparent 2px 30px),linear-gradient(180deg,${mix(band, '#FFFFFF', 0.1)} 0%,${band} 100%)`;
    case 'rings':
      return `repeating-radial-gradient(circle at 82% 24%,${alpha(b.light, 0.1)} 0 1px,transparent 1px 16px),${deep}`;
    default:
      return deep;
  }
}
