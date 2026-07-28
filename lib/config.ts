/**
 * Runtime configuration. Every switch that separates "demo" from
 * "production" is declared here, so the blast radius of going live is
 * visible in one file rather than scattered through the codebase.
 */

/**
 * Demo mode:
 *   · any email + password authenticates, minting the investor on first sight
 *   · accreditation, KYC/AML/OFAC, Plaid, ACH and e-sign are all simulated
 *   · all money is fake
 *
 * Production flips this to false, at which point lib/integrations/ must
 * provide real adapters. Nothing else in the app reads NODE_ENV to make
 * this decision.
 */
export const DEMO_MODE = process.env.ASC_DEMO_MODE !== 'false';

export const SESSION_COOKIE = 'asc_session';

/** Sessions last 30 days; refreshed on use. */
export const SESSION_TTL_DAYS = 30;

/** Named third parties the product surface references. */
export const PARTNERS = {
  accreditation: 'Parallel Markets',
  banking: 'Plaid',
  payments: 'Modern Treasury',
  custody: 'J.P. Morgan',
  esign: 'Anvil',
  email: 'Postmark',
} as const;
