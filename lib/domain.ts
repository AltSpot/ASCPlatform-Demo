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

export interface DealFees {
  platform: number;
  adminMax: number;
  carry: number;
  carryNote: string;
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
export interface DealView {
  id: string;
  name: string;
  entity: string;
  tag: string;
  kind: string;
  sector: string;
  stage: string;
  art: string;
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
}

// ---------------- investor-facing view models ----------------

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export interface WizardView {
  accreditation: {
    status: AccreditationStatus;
    method: string | null;
    verifiedAt: string | null;
    expiresAt: string | null;
  };
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

/**
 * Required before a subscription may be started: accreditation, W-9 and
 * KYC. An investment profile can be created at checkout and a bank linked
 * at funding, so neither gates the flow.
 */
export function evaluateInvestGate(wizard: WizardView): InvestGate {
  const missing: GateRequirement[] = [];

  if (wizard.accreditation.status !== 'verified') {
    missing.push({ step: 1, label: 'Accreditation verification' });
  } else if (
    wizard.accreditation.expiresAt &&
    new Date(wizard.accreditation.expiresAt).getTime() < Date.now()
  ) {
    missing.push({ step: 1, label: 'Accreditation re-verification (expired)' });
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
