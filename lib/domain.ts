/**
 * Domain vocabulary — the types and invariants the whole platform agrees on.
 *
 * SQLite cannot express enums, so these unions are the contract instead.
 * Anything that writes a status column must go through the helpers here.
 */

// ---------------- subscription state machine ----------------

export const SUBSCRIPTION_STATES = {
  STARTED: 'started',
  SIGNED: 'docs_signed',
  FUNDED: 'funded',
  ACCEPTED: 'accepted',
  CLOSED: 'closed',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
  CUT_BACK: 'cut_back',
} as const;

export type SubscriptionState =
  (typeof SUBSCRIPTION_STATES)[keyof typeof SUBSCRIPTION_STATES];

/**
 * Legal transitions. Anything not listed is rejected by
 * `assertTransition`, so an invalid state can never reach the database.
 *
 *   started -> docs_signed -> funded -> accepted -> closed
 *   exits:  expired (funding window lapsed) | refunded | cut_back
 */
const TRANSITIONS: Record<SubscriptionState, readonly SubscriptionState[]> = {
  started: ['docs_signed'],
  docs_signed: ['funded', 'expired'],
  funded: ['accepted', 'refunded'],
  accepted: ['closed', 'cut_back'],
  closed: [],
  expired: [],
  refunded: [],
  cut_back: ['closed'],
};

export function canTransition(
  from: SubscriptionState,
  to: SubscriptionState,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export class InvalidTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Illegal subscription transition: ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export function assertTransition(from: string, to: SubscriptionState): void {
  if (!canTransition(from as SubscriptionState, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

/** States that represent capital actually held in a deal. */
export const HELD_STATES: readonly SubscriptionState[] = [
  'funded',
  'accepted',
  'closed',
];

/** States a user can resume from the marketplace. */
export const RESUMABLE_STATES: readonly SubscriptionState[] = [
  'started',
  'docs_signed',
];

// ---------------- verification ----------------

export type AccreditationStatus =
  | 'not_started'
  | 'downloaded'
  | 'pending'
  | 'verified'
  | 'expired';

export type KycStatus = 'not_started' | 'pending' | 'cleared' | 'rejected';

/** Rule 506(c) verification is good for five years. */
export const ACCREDITATION_VALIDITY_DAYS = 5 * 365;

/** A signed commitment must be funded inside this window or it lapses. */
export const FUNDING_WINDOW_DAYS = 10;

export const DAY_MS = 86_400_000;

// ---------------- editorial blobs (JSON columns) ----------------

/**
 * The entire fee model. One number charged once, one number at exit.
 * Deliberately not extensible — see lib/fees.ts.
 */
export interface DealFees {
  /** One-time management fee, percent of subscription, collected at closing. */
  management: number;
  /** Carried interest on profits at exit, percent. 10 on every deal. */
  carry: number;
}

export interface DealMedia {
  type: string;
  label: string;
  series: number[];
  caption: string;
}

export interface SpotbotEntry {
  q: string;
  a: string;
}

export interface DeckStat {
  k: string;
  v: string;
}

export interface DeckSlide {
  kicker: string;
  title: string;
  body: string[];
  stats?: DeckStat[];
}

/** A deal with its JSON columns parsed. This is what the UI consumes. */
/** A headline figure in the deal page stat band. */
export interface DealMetric {
  k: string;
  v: string;
  note?: string;
}

/** A row in a deal terms table. */
export interface DealTerm {
  k: string;
  v: string;
}

/** A comparable company used to frame the exit landscape. */
export interface Comparable {
  company: string;
  context: string;
  valuation: string;
  multiple: string;
}

/** A value supplied for one of the standard indicators. */
export interface IndicatorValue {
  value: string;
  note?: string;
}

/**
 * One priced round in the company's history.
 *
 * Private valuations move in steps, not curves. Each entry is a real
 * priced event, so the page can show progression without implying a
 * continuously traded price.
 */
export interface FundingRound {
  round: string;
  date: string;
  preMoney: string;
  pricePerShare?: string;
  note?: string;
  /** The round being offered here. Rendered as the current step. */
  current?: boolean;
}

/**
 * Illustrative outcomes. Presented with the same caveat the deal package
 * carries: these depend on exit timing, dilution and valuation, and are
 * not a projection of returns.
 */
export interface DealOutcomes {
  intro?: string;
  scenarios?: DealMetric[];
  comparables?: Comparable[];
  note?: string;
}

/**
 * The part of a deal every signed-in member may see, accredited or not:
 * that it exists, who it is, roughly what they do, and what it looks
 * like. Nothing here is a figure, a term or a document.
 *
 * `DealView` extends this, so the redaction in `redactDeal` is a
 * whitelist rather than a delete list. A new column added to `Deal`
 * lands on `DealView` and stays withheld until someone puts it here on
 * purpose, which is the failure direction we want.
 */
export interface DealTeaser {
  id: string;
  name: string;
  tag: string;
  kind: string;
  sector: string;
  art: string;
  logoUrl: string | null;
  blurb: string;
  status: string;
  /** Discriminant. True means the substantive package was withheld. */
  redacted: true;
}

export interface DealView {
  id: string;
  name: string;
  entity: string;
  tag: string;
  kind: string;
  sector: string;
  stage: string;
  art: string;
  logoUrl: string | null;
  headline: string | null;
  summary: string | null;
  pricePerShare: string | null;
  metrics: DealMetric[];
  terms: DealTerm[];
  preferredTerms: DealTerm[];
  whatWeLike: string[];
  outcomes: DealOutcomes;
  indicators: Record<string, IndicatorValue>;
  rounds: FundingRound[];
  blurb: string;
  risks: string;
  minInvestment: number;
  allocationTotal: number;
  allocationRemaining: number;
  targetClose: string;
  altspotCommitted: number;
  committedNote: string;
  status: string;
  thesis: string[];
  fees: DealFees;
  media: DealMedia;
  docs: string[];
  spotbot: SpotbotEntry[];
  deck: DeckSlide[];
  /** Discriminant. False means nothing was withheld from this viewer. */
  redacted: false;
}

/**
 * What a browse surface receives for one deal: the whole package, or the
 * teaser, depending on the viewer. Consumers narrow on `redacted`.
 */
export type DealShelfItem = DealView | DealTeaser;

// ---------------- investor-facing view models ----------------

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/** An investor's 506(c) verification record, as the UI reads it. */
export interface AccreditationView {
  status: AccreditationStatus;
  method: string | null;
  verifiedAt: string | null;
  expiresAt: string | null;
}

export interface WizardView {
  accreditation: AccreditationView;
  info: { complete: boolean };
  kyc: { idUploaded: boolean; selfieCaptured: boolean; complete: boolean };
  profileDone: boolean;
  bankDone: boolean;
  complete: boolean;
}

export interface GateRequirement {
  step: number;
  label: string;
}

export interface InvestGate {
  ok: boolean;
  missing: GateRequirement[];
}

export interface SubscriptionView {
  id: string;
  dealId: string;
  profileId: string | null;
  amount: number;
  state: SubscriptionState;
  answers: Record<string, boolean>;
  signature: string | null;
  signedAt: string | null;
  fundingDeadline: string | null;
  fundedAt: string | null;
  fundingMethod: string | null;
  acceptedAt: string | null;
  currentValue: number | null;
  seeded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileView {
  id: string;
  type: string;
  name: string;
  taxClass: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface BankView {
  id: string;
  institution: string;
  mask: string;
  type: string;
  linkedAt: string;
}

export interface VaultView {
  first: string | null;
  last: string | null;
  taxClass: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  tinLast4: string | null;
}

export interface DocumentView {
  id: string;
  dealId: string | null;
  subscriptionId: string | null;
  name: string;
  type: string;
  note: string | null;
  savedAt: string;
}

// ---------------- gating ----------------

/** The wizard step that carries accreditation. */
export const ACCREDITATION_STEP = 1;

/**
 * Verified once, but past the five year window. The boundary that
 * matters: the status column still says verified and only the date says
 * otherwise. One expression, so the invest gate and the view gate can
 * never disagree about when an approval goes stale.
 */
function accreditationExpired(
  accreditation: AccreditationView,
  now: number,
): boolean {
  return Boolean(
    accreditation.expiresAt &&
      new Date(accreditation.expiresAt).getTime() < now,
  );
}

/** Verified, and still inside its window. */
export function isAccreditationCurrent(
  accreditation: AccreditationView,
  now: number = Date.now(),
): boolean {
  return (
    accreditation.status === 'verified' &&
    !accreditationExpired(accreditation, now)
  );
}

/**
 * May this investor be shown a deal's substantive package?
 *
 * Accreditation alone, deliberately. Rule 506(c) restricts who may be
 * shown the offering, and that turns on accredited status; the W-9 and
 * the identity check are money-movement requirements, so they gate
 * investing rather than reading. An investor part-way through setup can
 * therefore still read a deal once accreditation clears.
 *
 * Pure, and the only definition of the rule. `lib/repositories/deals.ts`
 * calls it before deciding what to put on the wire, so a UI that forgot
 * to check would have nothing to leak.
 */
export function canViewDealDetail(
  accreditation: AccreditationView,
  now: number = Date.now(),
): boolean {
  return isAccreditationCurrent(accreditation, now);
}

/**
 * Strip a deal down to its teaser. Whitelist, not delete list: see the
 * note on `DealTeaser`.
 */
export function redactDeal(deal: DealView): DealTeaser {
  return {
    id: deal.id,
    name: deal.name,
    tag: deal.tag,
    kind: deal.kind,
    sector: deal.sector,
    art: deal.art,
    logoUrl: deal.logoUrl,
    blurb: deal.blurb,
    status: deal.status,
    redacted: true,
  };
}

/**
 * Required before a subscription may be started: accreditation, W-9 and
 * KYC. An investment profile can be created at checkout and a bank linked
 * at funding, so neither gates the flow.
 */
export function evaluateInvestGate(wizard: WizardView): InvestGate {
  const missing: GateRequirement[] = [];

  if (wizard.accreditation.status !== 'verified') {
    missing.push({ step: ACCREDITATION_STEP, label: 'Accreditation verification' });
  } else if (accreditationExpired(wizard.accreditation, Date.now())) {
    missing.push({
      step: ACCREDITATION_STEP,
      label: 'Accreditation re-verification (expired)',
    });
  }

  if (!wizard.info.complete) {
    missing.push({ step: 2, label: 'Your information (W-9)' });
  }
  if (!wizard.kyc.complete) {
    missing.push({ step: 3, label: 'Identity verification' });
  }

  return { ok: missing.length === 0, missing };
}

/** First wizard step the investor still has to complete. */
export function firstIncompleteStep(wizard: WizardView): number {
  if (wizard.accreditation.status !== 'verified') return 1;
  if (!wizard.info.complete) return 2;
  if (!wizard.kyc.complete) return 3;
  if (!wizard.profileDone) return 4;
  if (!wizard.bankDone) return 5;
  return 1;
}
