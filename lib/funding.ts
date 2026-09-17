/**
 * Where a deal's raise stands: the funding-progress rules, stated once.
 *
 * Every deal raises into escrow and closes when the minimum is met. So
 * the number that matters is raised against the MINIMUM TO CLOSE, not
 * against the allocation: the allocation is only how far the round may
 * go ("up to"), and a bar against it made a deal that had already
 * cleared its minimum look a third empty. The allocation is still drawn,
 * as a fainter second cap.
 *
 * Admissions close ADMISSION_CUTOFF_HOURS before the wire, which is the
 * closing date. At that moment the member register locks.
 *
 * Pure and isomorphic. Every function takes `now` so it can be tested
 * without a clock.
 */
import {
  ADMISSION_CUTOFF_HOURS,
  MINIMUM_TO_CLOSE_FLOOR,
  MINIMUM_TO_CLOSE_SHARE,
} from './config';

export type LeadType = 'altspot' | 'partner';

/**
 * Where a deal's escrow stands. Deal level; a member's own subscription
 * has its own states (signed, in escrow, admitted).
 *
 *   raising            open, money arriving, below the minimum
 *   minimum_met        open, the minimum is in escrow, the deal will close
 *   admissions_closed  past the cut-off: register locked, awaiting the wire
 *   closed             released at close to the SPV, which bought its position
 *   returned           did not reach its minimum by the closing date, so
 *                      escrow returned every subscription
 */
export type EscrowStatus = 'raising' | 'minimum_met' | 'admissions_closed' | 'closed' | 'returned';

/** The minimum to close a deal would have if it did not set its own. */
export function defaultMinimumToClose(allocationTotal: number): number {
  const half = Math.max(MINIMUM_TO_CLOSE_FLOOR, allocationTotal * MINIMUM_TO_CLOSE_SHARE);
  return Math.min(allocationTotal, Math.ceil(half / 50_000) * 50_000);
}

export interface FundingInput {
  allocationTotal: number;
  allocationRemaining: number;
  minimumToClose: number;
  /** Display date of the scheduled close and wire, e.g. "Oct 6, 2026". */
  targetClose: string;
  status: string;
  /** Members holding a spot, when a viewer-aware read filled it. */
  members?: number;
  investorCap?: number;
}

export interface FundingView {
  raised: number;
  minimum: number;
  allocation: number;
  /** Raised as a percent of the minimum, 0 to 100 (capped for the bar). */
  toMinimumPct: number;
  /** Raised as a percent of the allocation, 0 to 100. */
  ofAllocationPct: number;
  /** The minimum as a percent of the allocation: where its tick sits. */
  minimumAtPct: number;
  minimumMet: boolean;
  escrow: EscrowStatus;
  /** ISO, or null when the closing date cannot be read. */
  closesAt: string | null;
  /** ISO. When admissions close and the register locks. */
  admissionsCloseAt: string | null;
  admissionsOpen: boolean;
}

const HOUR_MS = 3_600_000;

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** The closing date as a timestamp: end of that day, UTC. */
export function closingTime(targetClose: string): number | null {
  const at = Date.parse(`${targetClose} 23:59:59 UTC`);
  if (Number.isFinite(at)) return at;
  const plain = Date.parse(targetClose);
  return Number.isFinite(plain) ? plain : null;
}

/** When admissions close for a deal closing at `targetClose`. */
export function admissionCutoff(
  targetClose: string,
  hours: number = ADMISSION_CUTOFF_HOURS,
): number | null {
  const close = closingTime(targetClose);
  return close === null ? null : close - hours * HOUR_MS;
}

export function fundingView(deal: FundingInput, now: number = Date.now()): FundingView {
  const allocation = Math.max(0, deal.allocationTotal);
  const raised = Math.max(0, allocation - Math.max(0, deal.allocationRemaining));
  const minimum = Math.max(0, deal.minimumToClose) || allocation;

  const close = closingTime(deal.targetClose);
  const cutoff = admissionCutoff(deal.targetClose);
  const minimumMet = raised >= minimum && minimum > 0;
  const escrow: EscrowStatus =
    deal.status === 'closed'
      ? 'closed'
      : deal.status === 'returned' || (close !== null && now > close && !minimumMet)
        ? 'returned'
        : cutoff !== null && now >= cutoff
          ? 'admissions_closed'
          : minimumMet
            ? 'minimum_met'
            : 'raising';
  const open = escrow === 'raising' || escrow === 'minimum_met';

  return {
    raised,
    minimum,
    allocation,
    toMinimumPct: clampPct(minimum > 0 ? (raised / minimum) * 100 : 0),
    ofAllocationPct: clampPct(allocation > 0 ? (raised / allocation) * 100 : 0),
    minimumAtPct: clampPct(allocation > 0 ? (minimum / allocation) * 100 : 100),
    minimumMet,
    escrow,
    closesAt: close === null ? null : new Date(close).toISOString(),
    admissionsCloseAt: cutoff === null ? null : new Date(cutoff).toISOString(),
    admissionsOpen: open && cutoff !== null && now < cutoff,
  };
}

/**
 * A deal is "just opened" for this many days after it launched. Long
 * enough to be seen by a member who checks weekly, short enough that the
 * word still means something on a shelf of ten.
 */
export const JUST_OPENED_DAYS = 21;

export function isJustOpened(launchedAt: string, now: number = Date.now()): boolean {
  const at = Date.parse(launchedAt);
  return Number.isFinite(at) && now - at >= 0 && now - at < JUST_OPENED_DAYS * 86_400_000;
}

/** The deal type chip. */
export const LEAD_LABEL: Record<LeadType, string> = {
  altspot: 'AltSpot-led',
  partner: 'Partner-led',
};

export function isLeadType(value: string): value is LeadType {
  return value === 'altspot' || value === 'partner';
}

export const ESCROW_LABEL: Record<EscrowStatus, string> = {
  raising: 'Held in escrow',
  minimum_met: 'In escrow · will close',
  admissions_closed: 'Admissions closed',
  closed: 'Released at close',
  returned: 'Returned to members',
};

/** Lead prefixes older tags carried, now said by the deal type chip. */
const LEAD_PREFIX = /^(AltSpot-led|Partner-led|Co-invest|AltSpot fund)\s*·\s*/i;

/**
 * The one chip a card or hero wears: the deal type, then what the round
 * is. "AltSpot-led · Series A", "Partner-led · Series C".
 */
export function dealChip(deal: { leadType: string; tag: string }): string {
  const lead = isLeadType(deal.leadType) ? LEAD_LABEL[deal.leadType] : LEAD_LABEL.altspot;
  const round = deal.tag
    .replace(LEAD_PREFIX, '')
    .replace(/^late-stage secondary$/i, 'Secondary')
    .trim();
  return round ? `${lead} · ${round}` : lead;
}
