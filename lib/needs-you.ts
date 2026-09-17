/**
 * What needs the member, derived once.
 *
 * The dashboard strip and the bell on the rail (components/NotificationBell)
 * both read this list, so a member is never told two different things
 * about what is waiting on them. Four kinds, in the order a member would
 * want to hear them: a commitment to send to escrow (it has a clock), a
 * document to sign, a Radar name that has gone live, and a commitment
 * that lapsed.
 *
 * Pure: takes the subscriptions and the live votes it is handed and reads
 * no clock of its own beyond `daysLeft`. Nothing here may depend on how a
 * member arrived on the platform.
 */
import type { SubscriptionView } from './domain';
import { daysLeft } from './format';

export type NeedsYouItem =
  | {
      kind: 'fund';
      id: string;
      dealName: string;
      amount: number;
      /** Null only if the signature never set a window. Read as due today. */
      deadline: string | null;
      daysLeft: number;
    }
  | { kind: 'sign'; dealId: string; dealName: string; amount: number }
  | { kind: 'live'; dealId: string; dealName: string; voted: number; closes: string }
  | { kind: 'lapsed'; id: string; dealId: string; dealName: string; amount: number };

/** A voted Radar name whose deal is open on the shelf right now. */
export interface LiveVote {
  dealId: string;
  name: string;
  voted: number;
  closes: string;
  /** The member already has a subscription into it, so nothing is owed. */
  subscribed: boolean;
}

/** Inside this many days a funding deadline stops being background. */
export const URGENT_DAYS = 3;

export function buildNeedsYou(
  subscriptions: SubscriptionView[],
  dealName: (dealId: string) => string,
  liveVotes: LiveVote[],
): NeedsYouItem[] {
  const pending = subscriptions.filter((s) => s.state === 'docs_signed');
  const drafts = subscriptions.filter((s) => s.state === 'started');
  const expired = subscriptions.filter((s) => s.state === 'expired');

  return [
    ...pending.map<NeedsYouItem>((s) => ({
      kind: 'fund',
      id: s.id,
      dealName: dealName(s.dealId),
      amount: s.amount,
      deadline: s.fundingDeadline,
      daysLeft: daysLeft(s.fundingDeadline),
    })),
    ...drafts.map<NeedsYouItem>((s) => ({
      kind: 'sign',
      dealId: s.dealId,
      dealName: dealName(s.dealId),
      amount: s.amount,
    })),
    ...liveVotes
      .filter((vote) => !vote.subscribed)
      .map<NeedsYouItem>((vote) => ({
        kind: 'live',
        dealId: vote.dealId,
        dealName: vote.name,
        voted: vote.voted,
        closes: vote.closes,
      })),
    ...expired.map<NeedsYouItem>((s) => ({
      kind: 'lapsed',
      id: s.id,
      dealId: s.dealId,
      dealName: dealName(s.dealId),
      amount: s.amount,
    })),
  ];
}

export function toneOf(item: NeedsYouItem): 'urgent' | 'quiet' | 'live' {
  if (item.kind === 'fund') return item.daysLeft <= URGENT_DAYS ? 'urgent' : 'quiet';
  if (item.kind === 'lapsed') return 'urgent';
  if (item.kind === 'live') return 'live';
  return 'quiet';
}

export function keyOf(item: NeedsYouItem): string {
  switch (item.kind) {
    case 'fund':
    case 'lapsed':
      return `${item.kind}:${item.id}`;
    case 'sign':
    case 'live':
      return `${item.kind}:${item.dealId}`;
  }
}

/** "Sep 18, 2026" becomes "Sep 18". The year is on the deal page. */
export function shortDate(value: string): string {
  return value.split(',')[0].trim();
}
