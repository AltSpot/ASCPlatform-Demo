/**
 * How the Radar board is ordered (Tyler, 2026-09-19: "I worry about the
 * ones with the least votes getting stuck at the bottom").
 *
 * THE PROBLEM WITH MOST-VOTED-FIRST. A board sorted by dollars is a
 * rich-get-richer loop: the names at the top are the ones people see,
 * the ones people see are the ones people vote for, and a name that
 * starts at the bottom stays there whatever its merit. That is a bad
 * sourcing signal as well as a bad experience, because demand nobody was
 * shown is demand nobody measured.
 *
 * FEATURED, the default, deals every name a fair hand. Three pools:
 *
 *   LEADERS   by dollars voted: the proven demand, which members expect
 *             to find first.
 *   RISING    by momentum: dollars voted in the last RECENT_DAYS as a
 *             share of the name's total, so a small name that is moving
 *             outranks a large one that has stalled.
 *   DISCOVER  the lower half by dollars, newest listings first, ROTATED
 *             by the day: each day a different set of quiet names takes
 *             the discover seats, so over a cycle every name on the
 *             board spends time in the first rows.
 *
 * The board deals them one from each pool in turn (leader, rising,
 * discover, leader, ...), skipping a name already placed, until every
 * name is down. A row of three therefore always carries one proven name,
 * one moving name and one that would otherwise never be seen.
 *
 * The other three sorts are the pools by themselves, for a member who
 * wants one: Most voted, Rising, New. The order is the same for every
 * member on a given day (no personalisation here), which keeps the board
 * something that can be walked through on a call.
 *
 * Pure. `daySeed` is passed in, so it is testable without a clock.
 */

export type RadarSort = 'featured' | 'top' | 'rising' | 'new';

export const RADAR_SORT_LABEL: Record<RadarSort, string> = {
  featured: 'Featured',
  top: 'Most voted',
  rising: 'Rising',
  new: 'New',
};

/** The window momentum is measured over. */
export const RECENT_DAYS = 14;

export interface Rankable {
  slug: string;
  interestDollars: number;
  /** Dollars voted in the last RECENT_DAYS. */
  recentDollars: number;
  /** Days since the name was listed on the Radar. */
  listedDaysAgo: number;
}

/** Recent dollars as a share of the total, 0 to 1. */
export function momentum(item: Rankable): number {
  return item.interestDollars > 0 ? Math.min(1, item.recentDollars / item.interestDollars) : 0;
}

function byDollars<T extends Rankable>(items: T[]): T[] {
  return [...items].sort((a, b) => b.interestDollars - a.interestDollars || a.slug.localeCompare(b.slug));
}

function byMomentum<T extends Rankable>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => momentum(b) - momentum(a) || b.recentDollars - a.recentDollars || a.slug.localeCompare(b.slug),
  );
}

function byNewest<T extends Rankable>(items: T[]): T[] {
  return [...items].sort((a, b) => a.listedDaysAgo - b.listedDaysAgo || a.slug.localeCompare(b.slug));
}

/** Rotate a list left by `n`, so a different name leads each day. */
function rotate<T>(items: T[], n: number): T[] {
  if (items.length === 0) return items;
  const k = ((n % items.length) + items.length) % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}

export function rankRadar<T extends Rankable>(items: T[], sort: RadarSort, daySeed: number): T[] {
  if (sort === 'top') return byDollars(items);
  if (sort === 'rising') return byMomentum(items);
  if (sort === 'new') return byNewest(items);

  const leaders = byDollars(items);
  const rising = byMomentum(items);
  /* The quiet half, newest first, then turned by the day. */
  const quiet = byNewest(leaders.slice(Math.floor(leaders.length / 2)));
  const discover = rotate(quiet, daySeed);

  const pools = [leaders, rising, discover];
  const cursors = [0, 0, 0];
  const placed = new Set<string>();
  const out: T[] = [];

  while (out.length < items.length) {
    let progressed = false;
    for (let p = 0; p < pools.length && out.length < items.length; p += 1) {
      const pool = pools[p];
      while (cursors[p] < pool.length && placed.has(pool[cursors[p]].slug)) cursors[p] += 1;
      if (cursors[p] < pool.length) {
        const next = pool[cursors[p]];
        placed.add(next.slug);
        out.push(next);
        cursors[p] += 1;
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  return out;
}
