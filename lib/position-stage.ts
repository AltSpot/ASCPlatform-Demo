/**
 * Where a member stands in a deal they have started, in the words the
 * member reads (Tyler, 2026-09-19).
 *
 * "You invested" was printed the moment a subscription existed, which is
 * false for most of a subscription's life: a member who has signed has
 * reserved a spot and sent nothing. Saying they invested is misleading
 * about money, so the stage is decided here, once, from the subscription's
 * state, and every surface that names a member's position in a deal (the
 * dashboard's watchlist, the Watchlist page, the shelf) reads it. The
 * word "invested" is used only once money is in escrow or the deal has
 * closed. Same vocabulary as the rest of the product: copy says escrow,
 * code keeps `funded`.
 *
 * Pure: `stagesByDeal` takes `now` rather than reading a clock.
 */
import type { SubscriptionState } from './domain';
import { dateStr, money } from './format';

export type PositionStage = 'started' | 'signed' | 'escrow' | 'closed';

export interface PositionStageView {
  stage: PositionStage;
  /** The chip. Two or three words. */
  label: string;
  /** The sentence beside it. */
  detail: string;
  /** Something is owed by the member, so the row asks for it. */
  actionNeeded: boolean;
  /** What the row's button says and where it goes. */
  action: { label: string; href: string };
  /**
   * The chip on a compact row (the dashboard's watchlist): the stage, or
   * for a signed subscription the one fact that matters, the date.
   */
  short: string;
  /** Has money actually moved? Only then may a surface say "invested". */
  moneyIn: boolean;
}

/** States that mean the member has at least signed: the spot is theirs. */
export const JOINED_STATES: SubscriptionState[] = ['docs_signed', 'funded', 'accepted', 'closed'];

export function hasJoined(state: SubscriptionState): boolean {
  return JOINED_STATES.includes(state);
}

/**
 * A position's own row on Portfolio. "Your position" lands on the row and
 * the row lights (the :target rule in Holdings.module.css), rather than at
 * the top of a long page.
 */
export function positionHref(dealId: string): string {
  return `/portfolio#position-${dealId}`;
}

export function positionStage(sub: {
  id: string;
  dealId: string;
  state: SubscriptionState;
  /** Already formatted: "$50,000". */
  amountLabel: string;
  /** Already formatted: "Sep 22, 2026", when there is a deadline. */
  dueLabel?: string | null;
  daysLeft?: number;
}): PositionStageView | null {
  switch (sub.state) {
    case 'started':
      return {
        stage: 'started',
        label: 'Started',
        detail: `You began a ${sub.amountLabel} investment. Nothing is signed yet.`,
        actionNeeded: true,
        short: 'Started · not signed',
        action: { label: 'Finish signing', href: `/invest/${sub.dealId}` },
        moneyIn: false,
      };
    case 'docs_signed':
      return {
        stage: 'signed',
        label: 'Signed · not yet sent',
        detail: sub.dueLabel
          ? `Send ${sub.amountLabel} to escrow by ${sub.dueLabel}${
              sub.daysLeft === undefined ? '' : `, ${sub.daysLeft} day${sub.daysLeft === 1 ? '' : 's'} left`
            }.`
          : `Send ${sub.amountLabel} to escrow to keep your spot.`,
        actionNeeded: true,
        short: sub.dueLabel ? `Send by ${sub.dueLabel}` : 'Signed · not yet sent',
        action: { label: 'Complete investment', href: `/payment/${sub.id}` },
        moneyIn: false,
      };
    case 'funded':
      return {
        stage: 'escrow',
        label: 'In escrow',
        detail: `${sub.amountLabel} is in escrow until the deal closes.`,
        actionNeeded: false,
        short: 'In escrow',
        action: { label: 'Your position', href: positionHref(sub.dealId) },
        moneyIn: true,
      };
    case 'accepted':
    case 'closed':
      return {
        stage: 'closed',
        label: 'Invested',
        detail: `You invested ${sub.amountLabel}. The deal has closed.`,
        actionNeeded: false,
        short: 'Invested',
        action: { label: 'Your position', href: positionHref(sub.dealId) },
        moneyIn: true,
      };
    default:
      return null;
  }
}

const DAY_MS = 86_400_000;
const LIVE: SubscriptionState[] = ['started', ...JOINED_STATES];

/**
 * The member's stage in each deal, keyed by deal id. When a deal has more
 * than one subscription, the one that needs something from the member
 * wins, because that is the one the row should be about.
 */
export function stagesByDeal(
  subscriptions: {
    id: string;
    dealId: string;
    state: SubscriptionState;
    amount: number;
    fundingDeadline: string | null;
  }[],
  now: number,
): Record<string, PositionStageView> {
  const out: Record<string, PositionStageView> = {};
  for (const sub of subscriptions) {
    if (!LIVE.includes(sub.state)) continue;
    const due = sub.fundingDeadline ? new Date(sub.fundingDeadline).getTime() : null;
    const view = positionStage({
      id: sub.id,
      dealId: sub.dealId,
      state: sub.state,
      amountLabel: money(sub.amount),
      dueLabel: due === null ? null : dateStr(sub.fundingDeadline),
      daysLeft: due === null ? undefined : Math.max(0, Math.ceil((due - now) / DAY_MS)),
    });
    if (!view) continue;
    const held = out[sub.dealId];
    if (!held || (view.actionNeeded && !held.actionNeeded)) out[sub.dealId] = view;
  }
  return out;
}

/** Deal ids the member has at least signed into. */
export function joinedDealIds(
  subscriptions: { dealId: string; state: SubscriptionState }[],
): string[] {
  return [...new Set(subscriptions.filter((s) => hasJoined(s.state)).map((s) => s.dealId))];
}
