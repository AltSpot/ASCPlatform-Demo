/**
 * Watchlist — what a member is following, in one place.
 *
 * Two lists and nothing else: the deals they saved and the Radar names
 * they voted for. The marketplace is where things are found; this page
 * is where the member's own short list lives, so it carries no filters,
 * no engine strip and no board. A row says what it is, where it stands
 * and the one thing to do next.
 *
 * Building the list happens here too, through one search box that
 * reaches both halves of the marketplace. Saving a deal and voting on a
 * name are the same writes the marketplace makes (api.watchDeal and
 * api.indicateRadarInterest), so the two pages cannot disagree.
 *
 * Read on the server, like every portal page, through the same
 * viewer-aware repositories as the marketplace: before the 506(b)
 * relationship gate opens there are no deals to list or to add, and the
 * Radar withholds which name became a deal.
 */
import WatchlistBoard, {
  type WatchCompany,
} from '@/components/watchlist/WatchlistBoard';
import { requireUser } from '@/lib/auth';
import type { DealView } from '@/lib/domain';
import { exploreGroups } from '@/lib/explore';
import { canSeeOfferings } from '@/lib/relationship';
import { listDealsForViewer } from '@/lib/repositories/deals';
import { getRelationshipView } from '@/lib/repositories/investor';
import { getRadarBoard } from '@/lib/repositories/radar';
import { listSubscriptions } from '@/lib/repositories/subscriptions';
import { listWatchlist } from '@/lib/repositories/watchlist';

export const dynamic = 'force-dynamic';

export default async function WatchlistPage() {
  const user = await requireUser();

  const [shelf, watchlist, radar, subscriptions, relationship] = await Promise.all([
    listDealsForViewer(user.id),
    listWatchlist(user.id),
    getRadarBoard(user.id),
    listSubscriptions(user.id),
    getRelationshipView(user.id),
  ]);

  const deals = shelf.filter((deal): deal is DealView => !deal.redacted);

  /* Only what a row and the search need. The research, the prices and
     the news stay on the marketplace's detail dialog. */
  const companies: WatchCompany[] = [...radar]
    .sort((a, b) => b.interestDollars - a.interestDollars)
    .map((company) => ({
      slug: company.slug,
      name: company.name,
      logoUrl: company.logoUrl ?? null,
      assetClass: company.assetClass,
      yourAmount: company.yourAmount,
      yourRank: company.yourRank,
      dealId: company.dealId ?? null,
      minIndication: company.minIndication,
    }));

  return (
    <WatchlistBoard
      deals={deals}
      watched={watchlist}
      companies={companies}
      subscribed={[...new Set(subscriptions.map((s) => s.dealId))]}
      locked={!canSeeOfferings(relationship)}
      /* Explore, as on the dashboard (Tyler, 2026-09-17): the ways into
         the shelf, under the two lists, so an empty page has somewhere
         to go and a full one has a next step. */
      explore={exploreGroups(deals)}
    />
  );
}
