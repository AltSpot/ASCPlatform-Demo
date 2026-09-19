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

export interface Brand {
  /** The company's colour. */
  hue: string;
  /** Its light tint. */
  light: string;
  /** The ground its square mark sits on. */
  tile: string;
  /** The deep, flat brand colour a card's art band wears. */
  band?: string;
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

/**
 * The art band behind a company's logo: its deep colour, nearly flat. One
 * soft fall of light from the top and a slightly darker foot, so the band
 * has a surface without having a glow.
 */
export function brandArt(slug: string): string | null {
  const b = brandOf(slug);
  if (!b) return null;
  const ground = b.band ?? b.tile;
  return `linear-gradient(180deg,rgba(255,255,255,.055) 0%,rgba(255,255,255,0) 46%,rgba(0,0,0,.20) 100%),${ground}`;
}
