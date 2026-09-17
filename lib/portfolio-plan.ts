/**
 * Portfolio construction, the arithmetic the platform teaches (Tyler,
 * 2026-09-17). Not advice about any member's money: a description of how
 * a diversified early-stage sleeve is built, with the numbers that make
 * it work, and the count the Portfolio page measures a book against.
 *
 *   THE SLEEVE      5% to 10% of investable assets, deployed over three
 *                   years, into about twenty positions at equal weight,
 *                   with 20% to 30% kept back for follow-ons in the ones
 *                   that break out.
 *   WHY TWENTY      Outcomes in early-stage investing are skewed: a few
 *                   positions carry a portfolio. If any one deal has a
 *                   one-in-twenty chance of a very large outcome, twenty
 *                   bets give about a 64% chance of holding one, ten give
 *                   40%, five give 23%. That arithmetic, not optimism, is
 *                   the case for the count.
 *   THE CHECK       For $2M investable the sleeve is $200K and a deal is
 *                   $10K; for $5M it is $25K a deal. That is the $10K to
 *                   $25K band the platform's minimums sit in.
 *
 * Every figure Spot, the Terminal and the Portfolio page say about this
 * comes from here. Pure and isomorphic.
 */

export const SLEEVE = {
  /** Share of investable assets, percent. */
  minPercent: 5,
  maxPercent: 10,
  deployYears: 3,
  targetPositions: 20,
  /** Kept back for follow-ons, percent of the sleeve. */
  reserveMinPercent: 20,
  reserveMaxPercent: 30,
  /** The illustrative hit rate and outcome behind "why twenty". */
  outlierHitRate: 0.05,
  outlierMultiple: 50,
} as const;

/** Chance of at least one hit in `bets` independent tries. */
export function chanceOfAtLeastOne(bets: number, hitRate: number = SLEEVE.outlierHitRate): number {
  if (bets <= 0) return 0;
  return 1 - Math.pow(1 - hitRate, bets);
}

export interface SleevePlan {
  investable: number;
  sleeveLow: number;
  sleeveHigh: number;
  /** Per position at the low and high end of the sleeve, equal weight. */
  perDealLow: number;
  perDealHigh: number;
  /** Positions a year across the deployment period. */
  dealsPerYear: number;
}

/** The plan for a given amount of investable assets. Illustrative. */
export function sleevePlan(investable: number): SleevePlan {
  const safe = Math.max(0, investable);
  const sleeveLow = Math.round((safe * SLEEVE.minPercent) / 100);
  const sleeveHigh = Math.round((safe * SLEEVE.maxPercent) / 100);
  return {
    investable: safe,
    sleeveLow,
    sleeveHigh,
    perDealLow: Math.round(sleeveLow / SLEEVE.targetPositions),
    perDealHigh: Math.round(sleeveHigh / SLEEVE.targetPositions),
    dealsPerYear: Math.round((SLEEVE.targetPositions / SLEEVE.deployYears) * 10) / 10,
  };
}

export interface SleeveProgress {
  count: number;
  target: number;
  /** Count over target, 0 to 100. */
  percent: number;
  /** The largest position as a share of everything invested, percent. */
  largestSharePercent: number;
  /** What equal weight across the target would be, percent. */
  equalWeightPercent: number;
}

/** Where a book stands against the construction, from what is invested. */
export function sleeveProgress(invested: number[], target: number = SLEEVE.targetPositions): SleeveProgress {
  const positions = invested.filter((x) => x > 0);
  const total = positions.reduce((sum, x) => sum + x, 0);
  const largest = positions.reduce((max, x) => Math.max(max, x), 0);
  return {
    count: positions.length,
    target,
    percent: Math.min(100, Math.round((positions.length / target) * 100)),
    largestSharePercent: total > 0 ? Math.round((largest / total) * 100) : 0,
    equalWeightPercent: Math.round(100 / target),
  };
}
