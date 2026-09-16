/**
 * Presentation helpers. Pure, isomorphic, no locale surprises:
 * everything is explicitly en-US so server and client render identically
 * and React never reports a hydration mismatch.
 */
import { DAY_MS } from './domain';

/**
 * The glyph for "no value here". A typographic mark, not copy: the brand
 * voice bans em dashes in prose, so keep the placeholder distinct from
 * anything a writer would type in a sentence.
 */
export const EMPTY = '–';

export function money(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY;
  return `$${Number(value).toLocaleString('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  })}`;
}

/**
 * The one money compactor. $9,640 · $58K · $1.2M · $120M · $1.4B.
 *
 * Below $10,000 the full figure is shorter to read than an abbreviation
 * would be honest, so it stays whole. Above it the figure is rounded to
 * the unit, with one decimal for millions and billions until the
 * decimal stops mattering. Five components used to carry their own copy
 * of this and one of them compacted at $1,000, so a chart axis and the
 * table beside it disagreed about the same number.
 *
 * Negatives keep their sign as a typographic minus, never a hyphen.
 */
export function compact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY;
  const sign = value < 0 ? MINUS : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${sign}$${trimUnit(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}$${trimUnit(abs / 1_000_000)}M`;
  if (abs >= 10_000) return `${sign}$${Math.round(abs / 1000)}K`;
  return `${sign}${money(abs)}`;
}

/** 1.0 → "1", 1.25 → "1.3", 120.4 → "120". */
function trimUnit(units: number): string {
  return units >= 100 ? String(Math.round(units)) : units.toFixed(1).replace(/\.0$/, '');
}

/** The typographic minus. A hyphen in a figure reads as a dash. */
export const MINUS = '−';

/**
 * A ratio as a percentage: 0.296 → "29.6%". Precision is a parameter
 * here and nowhere else, so two surfaces cannot round the same figure
 * differently. `signed` prefixes a plus on gains, for a change line.
 */
export function percent(
  ratio: number | null | undefined,
  decimals = 1,
  opts: { signed?: boolean } = {},
): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return EMPTY;
  const scaled = ratio * 100;
  const rounded = Number(Math.abs(scaled).toFixed(decimals));
  const negative = scaled < 0 && rounded !== 0;
  const sign = negative ? MINUS : opts.signed && rounded !== 0 ? '+' : '';
  return `${sign}${rounded.toFixed(decimals)}%`;
}

export function dateStr(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined) return EMPTY;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Whole days remaining until a deadline, floored at zero. */
export function daysLeft(deadline: string | number | Date | null | undefined): number {
  if (!deadline) return 0;
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / DAY_MS));
}

/** Two-letter monogram for the sidebar avatar. */
export function initials(name: string | null | undefined): string {
  if (!name) return 'AI';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Turns an email local-part into a plausible display name.
 *
 * The plus-address tag is dropped. Sub-addressing is how people route
 * mail to themselves, not part of what they are called, and greeting
 * someone as "Demo+New" is worse than any name we could have guessed.
 * A local part that is nothing but a tag falls back rather than
 * greeting an empty string.
 */
export function nameFromEmail(email: string): string {
  const local = (email.split('@')[0] ?? '').split('+')[0];

  const name = local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

  return name || 'Investor';
}

/** Taxpayer IDs are only ever shown as a masked tail. */
export function maskTin(last4: string | null | undefined): string {
  if (!last4) return '···-··-····';
  return `···-··-${last4}`;
}
