/**
 * The relationship gate: how a member comes to see offerings.
 *
 * Every AltSpot SPV is offered under Rule 506(b), which permits no
 * general solicitation. What keeps an offering inside that condition is
 * a pre-existing, substantive relationship with each investor, formed
 * before they are shown the offering. Counsel's sequence (Sept 16, 2026,
 * docs/structure-decisions-sept-2026.md section 15):
 *
 *   1. The prospect registers.
 *   2. They complete an accreditation and sophistication questionnaire.
 *   3. The platform substantively evaluates it. The date it is approved
 *      is the date the relationship is established.
 *   4. A cooling-off period runs.
 *   5. Only then do they see offerings, and they may subscribe only to
 *      deals that opened after the relationship was established.
 *
 * Accreditation is a self-certification. There is no letter, no
 * reviewer of documents and no verification vendor: the answers and the
 * timestamp below are the record that supports a reasonable belief.
 *
 * Pure and isomorphic. The questionnaire renders from QUESTIONNAIRE in
 * the browser, and the server validates and evaluates with the same
 * definitions, so the two cannot describe different questions.
 */

/* Local rather than imported from lib/domain.ts, which imports this
   module: a value import in both directions is a load-order hazard. */
const DAY_MS = 86_400_000;

// ---------------- the questionnaire ----------------

export interface QuestionOption<K extends string = string> {
  key: K;
  label: string;
  detail: string;
}

export const BASIS_OPTIONS = [
  {
    key: 'income',
    label: 'Income over $200,000',
    detail:
      'In each of the last two years, or over $300,000 with a spouse or spousal equivalent, and expecting the same this year.',
  },
  {
    key: 'net_worth',
    label: 'Net worth over $1,000,000',
    detail:
      'Alone or with a spouse or spousal equivalent, not counting your primary residence.',
  },
  {
    key: 'license',
    label: 'Series 7, 65 or 82 license',
    detail: 'A securities license held in good standing.',
  },
  {
    key: 'entity',
    label: 'Entity with over $5,000,000 in assets',
    detail: 'Investing through an entity that was not formed to make this investment.',
  },
  {
    key: 'all_owners',
    label: 'Entity owned entirely by accredited investors',
    detail: 'Every equity owner of the investing entity is accredited in their own right.',
  },
  {
    key: 'none',
    label: 'None of these',
    detail: 'You do not currently meet an accredited investor standard.',
  },
] as const satisfies readonly QuestionOption[];

export const PRIVATE_DEAL_OPTIONS = [
  { key: 'none', label: 'None yet', detail: 'No private company investments so far.' },
  { key: 'some', label: '1 to 4', detail: 'Angel checks, SPVs or private funds.' },
  { key: 'many', label: '5 or more', detail: 'A track record in private companies.' },
] as const satisfies readonly QuestionOption[];

export const YEARS_OPTIONS = [
  { key: 'under_3', label: 'Under 3 years', detail: 'Public or private markets.' },
  { key: '3_to_10', label: '3 to 10 years', detail: 'Public or private markets.' },
  { key: 'over_10', label: 'Over 10 years', detail: 'Public or private markets.' },
] as const satisfies readonly QuestionOption[];

export const EVALUATION_OPTIONS = [
  {
    key: 'self',
    label: 'I evaluate private deals myself',
    detail: 'You read the terms and the financials and form your own view.',
  },
  {
    key: 'adviser',
    label: 'I work with a professional',
    detail: 'An adviser, attorney or CPA reviews private investments with you.',
  },
  {
    key: 'learning',
    label: 'I am new to this',
    detail: 'You are still learning how private deals are structured.',
  },
] as const satisfies readonly QuestionOption[];

export const ACKNOWLEDGEMENTS = [
  {
    key: 'loss',
    label: 'I can bear the loss of my entire investment.',
  },
  {
    key: 'illiquid',
    label:
      'I understand these positions are illiquid, with no market to sell into and no set exit date.',
  },
  {
    key: 'no_advice',
    label: 'I understand AltSpot does not give personal investment advice.',
  },
] as const;

export type BasisKey = (typeof BASIS_OPTIONS)[number]['key'];
export type PrivateDealsKey = (typeof PRIVATE_DEAL_OPTIONS)[number]['key'];
export type YearsKey = (typeof YEARS_OPTIONS)[number]['key'];
export type EvaluationKey = (typeof EVALUATION_OPTIONS)[number]['key'];
export type AcknowledgementKey = (typeof ACKNOWLEDGEMENTS)[number]['key'];

export interface QuestionnaireAnswers {
  basis: BasisKey;
  privateDeals: PrivateDealsKey;
  yearsInvesting: YearsKey;
  evaluates: EvaluationKey;
  acknowledgements: Record<AcknowledgementKey, boolean>;
}

/** The three sections, in the order the screen asks them. */
export const QUESTIONNAIRE_SECTIONS = [
  { key: 'basis', title: 'Accreditation basis' },
  { key: 'experience', title: 'Investment experience' },
  { key: 'sophistication', title: 'Financial sophistication' },
] as const;

function isKeyOf<T extends readonly { key: string }[]>(
  options: T,
  value: unknown,
): value is T[number]['key'] {
  return typeof value === 'string' && options.some((option) => option.key === value);
}

export type ParseResult =
  | { ok: true; answers: QuestionnaireAnswers }
  | { ok: false; error: string };

/**
 * Validate an untrusted submission. Every question is required and every
 * acknowledgement must be affirmed: a partial questionnaire is not a
 * record anyone can form a belief on.
 */
export function parseQuestionnaire(input: unknown): ParseResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Answer every question to continue.' };
  }
  const body = input as Record<string, unknown>;

  if (!isKeyOf(BASIS_OPTIONS, body.basis)) {
    return { ok: false, error: 'Choose how you meet the accredited investor standard.' };
  }
  if (!isKeyOf(PRIVATE_DEAL_OPTIONS, body.privateDeals)) {
    return { ok: false, error: 'Tell us how many private investments you have made.' };
  }
  if (!isKeyOf(YEARS_OPTIONS, body.yearsInvesting)) {
    return { ok: false, error: 'Tell us how long you have been investing.' };
  }
  if (!isKeyOf(EVALUATION_OPTIONS, body.evaluates)) {
    return { ok: false, error: 'Tell us how you evaluate private deals.' };
  }

  const raw = body.acknowledgements;
  const acks = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const acknowledgements = {} as Record<AcknowledgementKey, boolean>;
  for (const ack of ACKNOWLEDGEMENTS) {
    if (acks[ack.key] !== true) {
      return { ok: false, error: 'Confirm each statement to continue.' };
    }
    acknowledgements[ack.key] = true;
  }

  return {
    ok: true,
    answers: {
      basis: body.basis,
      privateDeals: body.privateDeals,
      yearsInvesting: body.yearsInvesting,
      evaluates: body.evaluates,
      acknowledgements,
    },
  };
}

// ---------------- evaluation ----------------

export type QuestionnaireOutcome = 'approved' | 'under_review' | 'declined';

export interface Evaluation {
  outcome: QuestionnaireOutcome;
  /** Plain-language reason, stored with the record and shown to the member. */
  reason: string;
}

/**
 * The platform's substantive evaluation of a questionnaire.
 *
 * Three outcomes, not two. A member who selects no accredited basis is
 * declined: the offerings are for accredited investors. A member whose
 * answers show no private-market experience, no professional help and
 * little time investing is referred to a person rather than approved by
 * a rule, because that is the profile where a reasonable belief in
 * sophistication needs a conversation. Everyone else is approved.
 *
 * A referred record stays under review until AltSpot records a decision.
 * Nothing here approves it automatically, in demo mode or otherwise.
 */
export function evaluateQuestionnaire(answers: QuestionnaireAnswers): Evaluation {
  if (answers.basis === 'none') {
    return {
      outcome: 'declined',
      reason:
        'Offerings on AltSpot are available to accredited investors. You can update your answers if your circumstances change.',
    };
  }

  const inexperienced =
    answers.privateDeals === 'none' &&
    answers.evaluates === 'learning' &&
    answers.yearsInvesting === 'under_3';

  if (inexperienced) {
    return {
      outcome: 'under_review',
      reason:
        'An AltSpot team member will reach out to talk through your experience before offerings open to you.',
    };
  }

  return {
    outcome: 'approved',
    reason: 'Your answers support accredited investor status and the experience to evaluate private offerings.',
  };
}

// ---------------- stage ----------------

export type RelationshipStage =
  | 'questionnaire'
  | 'under_review'
  | 'declined'
  | 'cooling_off'
  | 'eligible';

/** Mono chip labels. Uppercase is applied by the chip style, not typed. */
export const STAGE_LABEL: Record<RelationshipStage, string> = {
  questionnaire: 'Questionnaire',
  under_review: 'Under review',
  declined: 'Not eligible',
  cooling_off: 'Cooling off',
  eligible: 'Eligible',
};

export interface RelationshipView {
  stage: RelationshipStage;
  /** When AltSpot approved the questionnaire. The 506(b) relationship date. */
  establishedAt: string | null;
  /** When offerings open to this member. Null until the relationship exists. */
  unlocksAt: string | null;
}

/**
 * Where a member stands, derived rather than stored.
 *
 * The cooling-off length is a parameter, not a constant, because it is a
 * compliance setting (lib/config.ts COOLING_OFF_DAYS). The stored fact
 * is only when the relationship was established; the unlock date follows
 * from it.
 */
export function relationshipStage(
  record: { status: string; establishedAt: string | null },
  coolingOffDays: number,
  now: number = Date.now(),
): RelationshipView {
  if (record.status === 'under_review') {
    return { stage: 'under_review', establishedAt: null, unlocksAt: null };
  }
  if (record.status === 'declined') {
    return { stage: 'declined', establishedAt: null, unlocksAt: null };
  }
  if (record.status !== 'approved' || !record.establishedAt) {
    return { stage: 'questionnaire', establishedAt: null, unlocksAt: null };
  }

  const established = new Date(record.establishedAt).getTime();
  const unlocks = established + Math.max(0, coolingOffDays) * DAY_MS;

  return {
    stage: now >= unlocks ? 'eligible' : 'cooling_off',
    establishedAt: new Date(established).toISOString(),
    unlocksAt: new Date(unlocks).toISOString(),
  };
}

/** Has the member submitted a questionnaire AltSpot has not declined? */
export function questionnaireSubmitted(view: RelationshipView): boolean {
  return (
    view.stage === 'under_review' ||
    view.stage === 'cooling_off' ||
    view.stage === 'eligible'
  );
}

export interface GateCopy {
  title: string;
  body: string;
  /** Where to go next, or null when the member is waiting on AltSpot or the clock. */
  action: { href: string; label: string } | null;
}

/**
 * What to tell a member who cannot see offerings yet. One definition, so
 * a deal link, the marketplace and anything else that meets the gate
 * say the same thing. `formatDate` is passed in to keep this module free
 * of display helpers.
 */
export function gateCopy(
  view: RelationshipView,
  formatDate: (iso: string | null) => string,
  questionnaireHref: string,
): GateCopy {
  switch (view.stage) {
    case 'cooling_off':
      return {
        title: `Offerings open to you on ${formatDate(view.unlocksAt)}.`,
        body: 'Your investor questionnaire is approved. Offerings open once a short cooling-off period has passed, and you can finish the rest of your setup in the meantime.',
        action: null,
      };
    case 'under_review':
      return {
        title: 'Your questionnaire is under review.',
        body: 'An AltSpot team member will reach out to talk through your experience. Offerings open once your questionnaire is approved and a cooling-off period has passed.',
        action: null,
      };
    case 'declined':
      return {
        title: 'Offerings are for accredited investors.',
        body: 'Your answers did not show an accredited investor basis. If your circumstances have changed, you can answer again.',
        action: { href: questionnaireHref, label: 'Review your answers' },
      };
    default:
      return {
        title: 'Offerings are for members.',
        body: 'Every offering on AltSpot is private. Offerings open to you once your investor questionnaire is approved and a short cooling-off period has passed.',
        action: { href: questionnaireHref, label: 'Start your questionnaire' },
      };
  }
}

/**
 * May this member subscribe to a deal that opened at `launchedAt`?
 *
 * Rule 506(b): only to offerings that began after the relationship was
 * established. Seeing a deal (once eligible) and subscribing to it are
 * different permissions: a deal that opened before the member joined is
 * shown to them view-only. Strictly after, so a deal launched the same
 * instant the relationship was recorded does not count as later.
 */
export function canSubscribeToDeal(view: RelationshipView, launchedAt: string): boolean {
  if (view.stage !== 'eligible' || !view.establishedAt) return false;
  const launched = Date.parse(launchedAt);
  const established = Date.parse(view.establishedAt);
  if (!Number.isFinite(launched) || !Number.isFinite(established)) return false;
  return launched > established;
}

/** The view-only line, word for word from the work order. */
export function viewOnlyCopy(
  view: RelationshipView,
  formatDate: (iso: string | null) => string,
): string {
  return `Opened before you joined. You are eligible for deals that open after ${formatDate(view.establishedAt)}.`;
}

/**
 * May this member be shown offerings at all?
 *
 * Eligible only. Before that there is nothing to redact, because no deal
 * name, sector or line is sent: under 506(b) the existence of a specific
 * offering is what may not be shown before the relationship exists.
 */
export function canSeeOfferings(view: RelationshipView): boolean {
  return view.stage === 'eligible';
}
