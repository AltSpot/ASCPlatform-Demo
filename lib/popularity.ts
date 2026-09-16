/**
 * Which open deals the membership is paying attention to.
 *
 * The dashboard's "Most popular" strip ranks the shelf by three signals
 * a member can actually leave: money committed, deals saved and votes
 * cast on the Radar name behind the deal. Each is a different strength
 * of intent, and the weights say so.
 *
 *   0.45  subscribed share   allocation taken over allocation offered.
 *                            Money moved. The strongest thing anyone
 *                            can say about a deal.
 *   0.35  watchers           members with the deal on their watchlist,
 *                            as a share of the most-watched deal.
 *                            Attention with no money behind it.
 *   0.20  radar demand       dollars voted for the company on the Radar
 *                            before it was sourced, as a share of the
 *                            loudest deal. Demand from before the deal
 *                            existed, which is the engine paying off.
 *
 * Watchers and radar demand are normalised against the largest value
 * in the candidate set, so each term runs 0 to 1 and a shelf with one
 * saved deal does not rank that deal as if the whole membership saved
 * it. Subscribed share is already 0 to 1.
 *
 * Ties break toward the deal closing soonest, because a member with a
 * choice between two equally wanted deals should see the one with the
 * clock on it first.
 *
 * Pure and isomorphic. The dashboard feeds it; nothing here reads a
 * database or a clock.
 */

export interface PopularityInput {
  id: string;
  /** Allocation taken over allocation offered, 0 to 1. */
  subscribedShare: number;
  /** Members with the deal on their watchlist. */
  watchers: number;
  /** Dollars voted for the linked Radar company, integer dollars. */
  radarDollars: number;
  /** Days until the close. Larger sorts later on a tie. */
  daysToClose: number;
}

export const POPULARITY_WEIGHTS = {
  subscribed: 0.45,
  watchers: 0.35,
  radar: 0.2,
} as const;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** One deal's score, given the largest watcher and radar figures on the shelf. */
export function popularityScore(
  item: PopularityInput,
  maxWatchers: number,
  maxRadarDollars: number,
): number {
  const subscribed = clamp01(item.subscribedShare);
  const watchers = maxWatchers > 0 ? clamp01(item.watchers / maxWatchers) : 0;
  const radar = maxRadarDollars > 0 ? clamp01(item.radarDollars / maxRadarDollars) : 0;
  return (
    POPULARITY_WEIGHTS.subscribed * subscribed +
    POPULARITY_WEIGHTS.watchers * watchers +
    POPULARITY_WEIGHTS.radar * radar
  );
}

/** The candidates, most popular first. Stable: equal scores and closes keep input order. */
export function rankByPopularity<T extends PopularityInput>(items: T[]): T[] {
  const maxWatchers = Math.max(0, ...items.map((i) => i.watchers));
  const maxRadar = Math.max(0, ...items.map((i) => i.radarDollars));
  return items
    .map((item, index) => ({
      item,
      index,
      score: popularityScore(item, maxWatchers, maxRadar),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.daysToClose - b.item.daysToClose ||
        a.index - b.index,
    )
    .map((entry) => entry.item);
}
