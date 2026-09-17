/**
 * What needs the member, loaded for the shell.
 *
 * The bell on the rail is on every signed-in page, so it needs the same
 * list the dashboard builds, without the dashboard. This composes the
 * viewer-aware reads the dashboard uses (subscriptions, the deals behind
 * them, the Radar and the shelf) and hands them to lib/needs-you.ts, so
 * the two surfaces cannot disagree. Production would cache this per
 * request; here it is a few indexed reads.
 */
import 'server-only';

import { buildNeedsYou, shortDate, type LiveVote, type NeedsYouItem } from '../needs-you';
import { getDealsByIds, listDealsForViewer } from './deals';
import { getRadarBoard } from './radar';
import { listSubscriptions } from './subscriptions';

export async function listNeedsYou(userId: string): Promise<NeedsYouItem[]> {
  const [subscriptions, radar, shelf] = await Promise.all([
    listSubscriptions(userId),
    getRadarBoard(userId),
    listDealsForViewer(userId),
  ]);
  const deals = await getDealsByIds([...new Set(subscriptions.map((s) => s.dealId))]);
  const shelfById = new Map(shelf.map((deal) => [deal.id, deal]));
  const subscribed = new Set(subscriptions.map((s) => s.dealId));

  const liveVotes: LiveVote[] = radar.flatMap((company) => {
    if (company.yourAmount === null || !company.dealId) return [];
    const deal = shelfById.get(company.dealId);
    if (!deal) return [];
    return [
      {
        dealId: deal.id,
        name: company.name,
        voted: company.yourAmount,
        closes: deal.redacted ? 'soon' : shortDate(deal.targetClose),
        subscribed: subscribed.has(deal.id),
      },
    ];
  });

  return buildNeedsYou(subscriptions, (id) => deals.get(id)?.name ?? id, liveVotes);
}
