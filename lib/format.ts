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

/** Turns an email local-part into a plausible display name. */
export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'Investor';
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Taxpayer IDs are only ever shown as a masked tail. */
export function maskTin(last4: string | null | undefined): string {
  if (!last4) return '···-··-····';
  return `···-··-${last4}`;
}
