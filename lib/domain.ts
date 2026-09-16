import type { Backing } from './backers';
import {
  canSeeOfferings,
  questionnaireSubmitted,
  type RelationshipView,
} from './relationship';
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

/**
 * Capital actually at work today: in a held state, and not yet exited.
 *
 * HELD_STATES alone is not enough once a position can exit. `closed` is
 * the healthy end of the subscription lifecycle, not the end of the
 * investment, so a realized position is still in a held state while
 * being worth nothing to mark. Anything totalling current exposure has
 * to use this rather than the state list.
 */
export function isLivePosition(sub: {
  state: string;
  realizedAt: string | null;
}): boolean {
  return HELD_STATES.includes(sub.state as SubscriptionState) && !sub.realizedAt;
}

/** States a user can resume from the marketplace. */
export const RESUMABLE_STATES: readonly SubscriptionState[] = [
  'started',
  'docs_signed',
];

// ---------------- onboarding ----------------

/**
 * The accreditation questionnaire record: a self-certification under
 * Rule 506(b). lib/relationship.ts holds the questions, the evaluation
 * and the stages a member moves through.
 */
export type AccreditationStatus =
  | 'not_started'
  | 'under_review'
  | 'approved'
  | 'declined';

export type KycStatus = 'not_started' | 'pending' | 'cleared' | 'rejected';

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

/** One period on a chart. The label is the axis, not a tooltip. */
export interface DealChartPoint {
  label: string;
  value: number;
}

/**
 * One series from the data room.
 *
 * A financial data room does not hand over a single line. It hands over
 * a revenue schedule, a customer list, a margin bridge and a pipeline
 * report, and an investor reads them against each other: revenue rising
 * while margin falls is a different company from revenue rising while
 * margin holds. So the deal page carries several, drawn to one scale
 * each and captioned with where the numbers came from.
 *
 * `unit` decides how the figures are read, not how they are stored.
 * Money stays in whole units of whatever `unit` names, so nothing here
 * carries a float that has to be un-rounded later.
 */
export interface DealChart {
  key: string;
  label: string;
  /** usd-k is thousands, usd-m is millions. pct is whole percent. */
  unit: 'usd' | 'usd-k' | 'usd-m' | 'pct' | 'count';
  /** A continuous measure reads as an area; a counted one as bars. */
  kind: 'area' | 'bar';
  points: DealChartPoint[];
  /** What the series is, in one line. */
  caption: string;
  /** The data-room artefact it came from. A figure with no source is decoration. */
  source: string;
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
  assetClass: string;
  industry: string | null;
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
  assetClass: string;
  industry: string | null;
  stage: string;
  art: string;
  logoUrl: string | null;
  /** A walkthrough film, when one has been recorded. */
  videoUrl: string | null;
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
  /** Series from the data room. Empty for a deal with no company data. */
  charts: DealChart[];
  /** The other firms on the round. Empty when AltSpot is alone. */
  backing: Backing[];
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

/**
 * An investor's questionnaire record, as the UI reads it. The answers
 * themselves stay server-side; the member sees the basis they chose, the
 * evaluation's reason and where they stand.
 */
export interface AccreditationView {
  status: AccreditationStatus;
  basis: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  reason: string | null;
}

export interface WizardView {
  accreditation: AccreditationView;
  /** Where the member stands on the 506(b) relationship gate. */
  relationship: RelationshipView;
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
  /** ISO date this position exited, or null while it is still held. */
  realizedAt: string | null;
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

/** The wizard step that carries the investor questionnaire. */
export const ACCREDITATION_STEP = 1;

/**
 * May this investor be shown offerings?
 *
 * The 506(b) relationship gate and nothing else: questionnaire approved
 * and the cooling-off period over. The W-9 and the identity check are
 * money-movement requirements, so they gate investing rather than
 * seeing. The rule is canSeeOfferings in lib/relationship.ts; this is the
 * name the deal repository calls before deciding what goes on the wire,
 * so a page that forgot to check has nothing to leak.
 */
export function canViewDealDetail(relationship: RelationshipView): boolean {
  return canSeeOfferings(relationship);
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
    assetClass: deal.assetClass,
    industry: deal.industry,
    art: deal.art,
    logoUrl: deal.logoUrl,
    blurb: deal.blurb,
    status: deal.status,
    redacted: true,
  };
}

/** The gate label for each relationship stage short of eligible. */
const RELATIONSHIP_REQUIREMENT: Record<
  Exclude<RelationshipView['stage'], 'eligible'>,
  string
> = {
  questionnaire: 'Investor questionnaire',
  under_review: 'Questionnaire under review',
  declined: 'Investor questionnaire',
  cooling_off: 'Cooling-off period',
};

/**
 * Required before a subscription may be started: a relationship past its
 * cooling-off period, the W-9 and KYC. An investment profile can be
 * created at checkout and a bank linked later, so neither gates the
 * flow. Whether a specific deal may be subscribed to at all (it must have
 * opened after the relationship) is a per-deal rule on top of this one.
 */
export function evaluateInvestGate(wizard: WizardView): InvestGate {
  const missing: GateRequirement[] = [];

  const { stage } = wizard.relationship;
  if (stage !== 'eligible') {
    missing.push({ step: ACCREDITATION_STEP, label: RELATIONSHIP_REQUIREMENT[stage] });
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
  // Review and cooling off run on their own clock; setup carries on.
  if (!questionnaireSubmitted(wizard.relationship)) return 1;
  if (!wizard.info.complete) return 2;
  if (!wizard.kyc.complete) return 3;
  if (!wizard.profileDone) return 4;
  if (!wizard.bankDone) return 5;
  return 1;
}
