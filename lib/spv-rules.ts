/**
 * Who an SPV may still admit, and on what terms. Work order screens 12
 * and 13; docs/structure-decisions-sept-2026.md sections 4 and 6.
 *
 *   ADMISSION CUT-OFF   Admissions close ADMISSION_CUTOFF_HOURS before the
 *                       scheduled wire. From then the member register is
 *                       locked and every percentage is frozen, which is
 *                       what preserves QSBS for the members admitted.
 *   INVESTOR CAP        Deal.investorCap members per SPV, 100 by default,
 *                       250 at most. A new member past the cap joins the
 *                       waitlist instead. A member already in stays in.
 *   RETIREMENT MONEY    IRA and retirement-account subscriptions stay under
 *                       RETIREMENT_BLOCK_PERCENT of the SPV. A subscription
 *                       that would take them to RETIREMENT_WARN_PERCENT is
 *                       allowed with a warning; one that would reach the
 *                       block is refused.
 *
 * Nothing here may depend on how a member arrived on the platform.
 *
 * Pure and isomorphic: the invest page uses these to explain, the route
 * handlers use the same functions to refuse.
 */
import {
  INVESTOR_CAP_DEFAULT,
  INVESTOR_CAP_MAX,
  RETIREMENT_BLOCK_PERCENT,
  RETIREMENT_WARN_PERCENT,
} from './config';
import { admissionCutoff } from './funding';

/** Profile types that hold retirement money. Matches the invest flow's options. */
export function isRetirementProfile(type: string | null | undefined): boolean {
  return typeof type === 'string' && /\b(ira|401\s*\(?k\)?|retirement)\b/i.test(type);
}

/** A cap setting, clamped to what the rules allow. */
export function effectiveCap(cap: number | null | undefined): number {
  if (!Number.isFinite(cap) || !cap || cap < 1) return INVESTOR_CAP_DEFAULT;
  return Math.min(Math.round(cap), INVESTOR_CAP_MAX);
}

export interface SpvStanding {
  /** Members holding a spot: signed, in escrow, or admitted. */
  members: number;
  /** Most members the SPV may admit. */
  cap: number;
  /** Dollars subscribed by those members, including this one's current. */
  committed: number;
  /** Of which through retirement accounts. */
  retirement: number;
}

export interface AdmissionRequest {
  targetClose: string;
  status: string;
  standing: SpvStanding;
  /** Does this member already hold a spot in the SPV? */
  alreadyMember: boolean;
  amount: number;
  retirement: boolean;
  now?: number;
}

export type AdmissionCode = 'admissions_closed' | 'investor_cap' | 'retirement_cap';

export type AdmissionDecision =
  | { ok: true; warning: string | null; retirementPercent: number }
  | { ok: false; code: AdmissionCode; message: string; retirementPercent: number };

/** Retirement money as a percent of the SPV after this subscription. */
export function retirementPercentAfter(
  standing: SpvStanding,
  amount: number,
  retirement: boolean,
): number {
  const total = standing.committed + Math.max(0, amount);
  const retire = standing.retirement + (retirement ? Math.max(0, amount) : 0);
  return total > 0 ? (retire / total) * 100 : 0;
}

export function admissionsOpen(targetClose: string, status: string, now = Date.now()): boolean {
  const cutoff = admissionCutoff(targetClose);
  return status !== 'closed' && cutoff !== null && now < cutoff;
}

export function isFull(standing: SpvStanding): boolean {
  return standing.members >= effectiveCap(standing.cap);
}

export function decideAdmission(req: AdmissionRequest): AdmissionDecision {
  const now = req.now ?? Date.now();
  const retirementPercent = retirementPercentAfter(req.standing, req.amount, req.retirement);

  if (!admissionsOpen(req.targetClose, req.status, now)) {
    return {
      ok: false,
      code: 'admissions_closed',
      message: 'Admissions for this SPV have closed. The member register is locked.',
      retirementPercent,
    };
  }

  if (!req.alreadyMember && isFull(req.standing)) {
    return {
      ok: false,
      code: 'investor_cap',
      message: `This SPV has reached its limit of ${effectiveCap(req.standing.cap)} members. You can join the waitlist.`,
      retirementPercent,
    };
  }

  if (req.retirement && retirementPercent >= RETIREMENT_BLOCK_PERCENT) {
    return {
      ok: false,
      code: 'retirement_cap',
      message: `Retirement accounts must stay under ${RETIREMENT_BLOCK_PERCENT}% of this SPV. Choose a different profile or a smaller amount.`,
      retirementPercent,
    };
  }

  const warning =
    req.retirement && retirementPercent >= RETIREMENT_WARN_PERCENT
      ? `Retirement accounts would be ${Math.round(retirementPercent)}% of this SPV. The limit is under ${RETIREMENT_BLOCK_PERCENT}%, so a spot for retirement money may not be available later.`
      : null;

  return { ok: true, warning, retirementPercent };
}

// ---------------- the member register ----------------

export interface RegisterRow {
  subscriptionId: string;
  member: string;
  amount: number;
  /** ISO. When the subscription reached escrow. */
  admittedAt: string;
  retirement: boolean;
}

export interface RegisterEntry extends RegisterRow {
  /** Share of the SPV, percent, to two places. */
  percent: number;
}

export interface MemberRegister {
  entries: RegisterEntry[];
  total: number;
  locked: boolean;
  /** ISO, or null when the closing date cannot be read. */
  cutoffAt: string | null;
}

/**
 * The register: every member admitted by the cut-off, with their share.
 * Once the cut-off passes, anyone admitted after it is left out and the
 * percentages are those of the members inside it, so they cannot move.
 */
export function buildRegister(
  rows: RegisterRow[],
  targetClose: string,
  now: number = Date.now(),
): MemberRegister {
  const cutoff = admissionCutoff(targetClose);
  const locked = cutoff !== null && now >= cutoff;
  const inside = rows
    .filter((row) => cutoff === null || Date.parse(row.admittedAt) < cutoff)
    .sort((a, b) => Date.parse(a.admittedAt) - Date.parse(b.admittedAt));
  const total = inside.reduce((sum, row) => sum + row.amount, 0);

  return {
    entries: inside.map((row) => ({
      ...row,
      percent: total > 0 ? Math.round((row.amount / total) * 10_000) / 100 : 0,
    })),
    total,
    locked,
    cutoffAt: cutoff === null ? null : new Date(cutoff).toISOString(),
  };
}
