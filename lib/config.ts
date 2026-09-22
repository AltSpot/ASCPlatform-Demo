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

/**
 * Days between AltSpot approving a member's questionnaire and offerings
 * opening to them. ZERO (counsel, 2026-09-17, item 11): under the SEC's
 * Citizen VC letter what matters is the quality of the relationship, a
 * genuine, substantive evaluation, and the sequence, relationship before
 * offer, not its duration. So offerings open the moment the evaluation
 * approves a member, and the member may join only deals that open after
 * that date (counsel's option (a), the cleanest). The setting survives so
 * a seasoning period (option (b), five business days) is one line if it
 * is ever wanted. See lib/relationship.ts.
 */
export const COOLING_OFF_DAYS = Number(process.env.ASC_COOLING_OFF_DAYS ?? 0);

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
 * Accreditation is deliberately absent: under Rule 506(b) it is a
 * self-certification questionnaire AltSpot evaluates itself, so there is
 * no verification vendor.
 */
/**
 * The integration vendors, for code and comments. NEVER RENDERED (Tyler,
 * 2026-09-21): a member-facing screen names no real company, vendor or
 * bank, the same rule as the shelf. Copy says "a secure bank link", "an
 * escrow account in the SPV's name at a U.S. bank", "an e-signature
 * provider". tests/public-surfaces.test.ts fails if a component renders
 * one of these names.
 */
export const PARTNERS = {
  banking: 'Plaid',
  payments: 'Modern Treasury',
  custody: 'J.P. Morgan',
  esign: 'Anvil',
  email: 'Postmark',
} as const;

// ---------------- deal terms (docs/structure-decisions-sept-2026.md) ----------------

/**
 * Whether fee numbers appear anywhere in the product. ON since counsel
 * confirmed the fee (2026-09-17: the 1% for five years prefunded, the flat
 * $10,000 formation and administration fee per SPV, pass-throughs at cost,
 * escrow interest to investors). Off, every fee line reads as a disclosure
 * with no figure; the math in lib/fees.ts runs either way, so the switch
 * changes words, not money.
 */
export const SHOW_FEE_TERMS = process.env.ASC_SHOW_FEE_TERMS !== 'false';

/** Whether a carry number appears anywhere. OFF: no carry line at all. */
export const SHOW_CARRY_TERMS = process.env.ASC_SHOW_CARRY_TERMS === 'true';

/**
 * The alignment chip, SPONSORS INVEST ALONGSIDE MEMBERS. No figure, no
 * entity, no mechanism, ever. On by default because the narrative line is
 * the plan; turn it off if it is not literally true on a deal's day one.
 * Also decides whether the risk section says "sponsors included".
 */
export const SHOW_SPONSOR_ALIGNMENT = process.env.ASC_SHOW_SPONSOR_ALIGNMENT !== 'false';

/**
 * The fee (section 15, decided Sept 16): a flat fee per SPV, plus an
 * annualized management fee on committed capital for an assumed term,
 * funded at closing as a reserve, drawn down as earned, with anything
 * unearned refunded. Integer dollars and whole percents.
 */
export const FEE_TERMS = {
  /** Charged to the SPV once. Disclosed in the memorandum, not per member. */
  flatPerSpv: 10_000,
  /** Percent of committed capital per year. */
  annualPercent: 1,
  /** Years the reserve is sized for. */
  termYears: 5,
} as const;

/** Carried interest on profits at exit, percent. Behind SHOW_CARRY_TERMS. */
export const CARRY_PERCENT = 20;

/**
 * Illustrative return scenarios on a deal page (lib/scenarios.ts,
 * components/deal/ReturnScenarios.tsx). OFF until counsel approves. On,
 * a deal renders them only if it carries a complete scenario set: at
 * least three cases with a total loss first, neutral labels, every input
 * shown, net beside gross, sources and dates on every external input, a
 * methodology, and the disclaimer beside it. The set each member saw is
 * recorded (ScenarioView). Never on a share card, in an email, or on a
 * public page: the component exists on the deal page and nowhere else.
 */
export const SHOW_RETURN_SCENARIOS = process.env.ASC_SHOW_RETURN_SCENARIOS === 'true';

/**
 * Admissions close this many hours before the scheduled wire. At the
 * cut-off the member register locks and every percentage freezes.
 */
export const ADMISSION_CUTOFF_HOURS = Number(process.env.ASC_ADMISSION_CUTOFF_HOURS ?? 24);

/**
 * Days a member has to send a signed subscription to escrow (Tyler,
 * 2026-09-19). Signing reserves the spot, and a spot reserved until the
 * admission cut-off lets a whole SPV sit signed and unfunded until its last
 * day: across every deal at once, that is a platform that cannot tell
 * whether its raises are real. So the reservation is ten days, or until
 * admissions close, whichever comes first; after that the subscription
 * lapses and the spot goes back to the deal for the next member.
 */
export const ESCROW_WINDOW_DAYS = Number(process.env.ASC_ESCROW_WINDOW_DAYS ?? 10);

/**
 * Per-SPV investor cap. NOT a Rule 506(b) limit: 506(b) admits any number
 * of accredited investors. The cap comes from the Investment Company Act.
 * An SPV relies on section 3(c)(1), which allows at most 100 beneficial
 * owners; a "qualifying venture capital fund" (equity in private operating
 * companies, aggregate capital of $12M or less after the SEC's 2024
 * inflation adjustment) may have up to 250. See lib/spv-rules.ts.
 */
export const INVESTOR_CAP_DEFAULT = 100;
export const INVESTOR_CAP_MAX = 250;
export const QUALIFYING_VC_FUND_MAX_CAPITAL = 12_000_000;

/**
 * Minimum to close, when a deal does not set its own: half of the
 * allocation, never below the floor at which an SPV's fixed costs (the
 * flat fee, the administrator, filings) stop being a large share of the
 * raise, rounded up to a clean $50,000. A lead can always set a deal's
 * minimum by hand, for instance to the smallest check a company will take.
 */
export const MINIMUM_TO_CLOSE_SHARE = 0.5;
export const MINIMUM_TO_CLOSE_FLOOR = 250_000;

/**
 * The minimum investment on an offering (Tyler, 2026-09-17, after the
 * deck): $10,000 as the standard, a $5,000 floor on vehicles under
 * $250,000, and $25,000 on vehicles over $1,000,000. Set per offering by
 * the lead; the rule in lib/minimums.ts fills it in otherwise. The
 * platform's headline is "from $5,000", the floor.
 */
export const MIN_INVESTMENT_STANDARD = 10_000;
export const MIN_INVESTMENT_FLOOR = 5_000;
export const MIN_INVESTMENT_LARGE = 25_000;
export const MIN_INVESTMENT_SMALL_VEHICLE = 250_000;
export const MIN_INVESTMENT_LARGE_VEHICLE = 1_000_000;

/**
 * Retirement money (IRA and similar) as a share of one SPV's raise, in
 * percent. Warn at the first, refuse a subscription that would reach the
 * second.
 */
export const RETIREMENT_WARN_PERCENT = 20;
export const RETIREMENT_BLOCK_PERCENT = 25;
