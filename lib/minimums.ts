/**
 * The minimum investment on an offering, stated once (Tyler, 2026-09-17,
 * after the deck): $10,000 as the standard, a $5,000 floor on vehicles
 * under $250,000, and $25,000 on vehicles over $1,000,000. Set per
 * offering: a lead may override a deal's minimum by hand, and the rule
 * only fills it in when nobody has. The platform's headline is "from
 * $5,000", which is the floor and never less.
 *
 * Enforced where money moves (the subscription routes compare the amount
 * to Deal.minInvestment) and explained where it is read (the deal page,
 * checkout, Spot) with the same function. Nothing here may depend on how
 * a member arrived on the platform. Pure and isomorphic.
 */
import {
  MIN_INVESTMENT_FLOOR,
  MIN_INVESTMENT_LARGE,
  MIN_INVESTMENT_LARGE_VEHICLE,
  MIN_INVESTMENT_SMALL_VEHICLE,
  MIN_INVESTMENT_STANDARD,
} from './config';

export type MinimumBand = 'floor' | 'standard' | 'large';

/** Which band a vehicle of this size falls in. */
export function minimumBand(allocationTotal: number): MinimumBand {
  if (allocationTotal < MIN_INVESTMENT_SMALL_VEHICLE) return 'floor';
  if (allocationTotal > MIN_INVESTMENT_LARGE_VEHICLE) return 'large';
  return 'standard';
}

/** The minimum a deal gets when its lead has not set one. */
export function defaultMinInvestment(allocationTotal: number): number {
  switch (minimumBand(allocationTotal)) {
    case 'floor':
      return MIN_INVESTMENT_FLOOR;
    case 'large':
      return MIN_INVESTMENT_LARGE;
    default:
      return MIN_INVESTMENT_STANDARD;
  }
}

/** The lowest minimum any offering can carry. What "from" means. */
export const MINIMUM_FROM = MIN_INVESTMENT_FLOOR;

/**
 * One sentence on why this deal's minimum is what it is, for the deal
 * page and checkout. Says when a lead set it by hand.
 */
export function explainMinimum(minInvestment: number, allocationTotal: number): string {
  const byRule = defaultMinInvestment(allocationTotal);
  if (minInvestment !== byRule) {
    return 'Set by the lead for this offering.';
  }
  switch (minimumBand(allocationTotal)) {
    case 'floor':
      return 'The platform floor, for a vehicle under $250,000.';
    case 'large':
      return 'The minimum on a vehicle over $1,000,000.';
    default:
      return 'The standard minimum on the platform.';
  }
}
