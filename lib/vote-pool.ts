/**
 * The member's votes read as one pool (Tyler, 2026-09-19).
 *
 * A member looking at their votes is asking "what have I said I would
 * back, and how is it spread?". So the dashboard states the total first
 * and lets each vote be nudged up or down in place. This module is the
 * arithmetic: one step along the vote ladder, and each name's share of
 * the whole. It is the same ladder the Radar's own slider uses
 * (lib/terminal/radar.ts), so a vote edited here can only land on a value
 * the Radar would also offer, and the API re-checks the bounds.
 *
 * A vote is not money and this is not a budget: there is no cap to spend
 * down, and raising one vote takes nothing from another. Shares describe
 * the spread; they do not allocate anything. Pure.
 */
import { VOTE_LADDER, voteIndexOf } from './terminal/radar';

/** The next stop on the ladder, or the same amount at either end. */
export function stepVote(amount: number, direction: 1 | -1): number {
  const at = voteIndexOf(amount);
  /* An amount between stops (an older vote) steps to the neighbour in the
     direction pressed, never past it. */
  const onStop = VOTE_LADDER[at] === amount;
  if (!onStop) {
    if (direction === 1) return VOTE_LADDER[at] > amount ? VOTE_LADDER[at] : (VOTE_LADDER[at + 1] ?? amount);
    return VOTE_LADDER[at] < amount ? VOTE_LADDER[at] : (VOTE_LADDER[at - 1] ?? amount);
  }
  return VOTE_LADDER[at + direction] ?? amount;
}

export function canStep(amount: number, direction: 1 | -1): boolean {
  return stepVote(amount, direction) !== amount;
}

export interface PoolShare {
  slug: string;
  amount: number;
  /** 0 to 100, one decimal. The shares of a pool sum to 100 within rounding. */
  percent: number;
}

/** Each name's share of everything the member has voted. */
export function poolShares(votes: { slug: string; amount: number }[]): PoolShare[] {
  let total = 0;
  for (const vote of votes) total += Math.max(0, vote.amount);
  return votes.map((vote) => ({
    slug: vote.slug,
    amount: vote.amount,
    percent: total > 0 ? Math.round((Math.max(0, vote.amount) / total) * 1000) / 10 : 0,
  }));
}

export function poolTotal(votes: { amount: number }[]): number {
  let total = 0;
  for (const vote of votes) total += Math.max(0, vote.amount);
  return total;
}
