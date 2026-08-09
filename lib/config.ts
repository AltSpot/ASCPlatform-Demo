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

/**
 * Ephemeral demo. Nothing is meant to survive: visitors sign in with any
 * email, walk the flow, and their account is swept shortly afterwards so
 * the next person starts from zero.
 *
 * This is what makes the demo safe to hand out as a link without a real
 * database behind it. Turn it off and accounts persist normally.
 */
export const EPHEMERAL_DEMO = process.env.ASC_EPHEMERAL !== 'false';

/** How long a demo account survives after its last session was issued. */
export const DEMO_TTL_HOURS = Number(process.env.ASC_DEMO_TTL_HOURS ?? 6);

/**
 * Show each visitor the deal's allocation reduced only by THEIR OWN
 * commitments, rather than by everyone's.
 *
 * Without this, a link sent to twenty prospects visibly drains: the
 * subscription bar walks toward 100% and the shelf looks picked over by
 * the time the tenth person opens it. Production wants the real global
 * number, so this is a demo concern and lives behind a flag.
 */
export const ISOLATED_ALLOCATION = EPHEMERAL_DEMO;

export const SESSION_COOKIE = 'asc_session';

/**
 * Sessions last 30 days from issue. They are NOT extended on use: the
 * expiry is fixed at `createSession` and checked on every read, so a
 * session dies 30 days after sign-in no matter how active it was. Sliding
 * expiry is a deliberate omission, not an oversight. Add it in the IdP
 * that replaces lib/auth.ts rather than here.
 */
export const SESSION_TTL_DAYS = 30;

/**
 * Named third parties the product surface references.
 *
 * Accreditation is deliberately absent: AltSpot reviews certification
 * letters itself (automated read, confirmed by a reviewer) rather than
 * handing the investor off to a verification vendor.
 */
export const PARTNERS = {
  banking: 'Plaid',
  payments: 'Modern Treasury',
  custody: 'J.P. Morgan',
  esign: 'Anvil',
  email: 'Postmark',
} as const;
