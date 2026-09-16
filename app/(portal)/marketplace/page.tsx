/**
 * Marketplace — two lanes on one page.
 *
 * Open now is the shelf: sourced, underwritten, open for subscription
 * today. The Radar beneath it is the other half of the same
 * conversation, where members say which private companies they want
 * us to go after next. One page and one filter row, because they are
 * one pipeline; two lanes told apart by verb, because they are
 * opposite promises. See components/marketplace/MarketplaceLanes.
 *
 * Everything is read here, on the server, so every number is correct
 * on first paint.
 */
import MarketplaceLanes from '@/components/marketplace/MarketplaceLanes';
import { requireUser } from '@/lib/auth';
import { RESUMABLE_STATES } from '@/lib/domain';
import { listDealsForViewer } from '@/lib/repositories/deals';
import { getRelationshipView } from '@/lib/repositories/investor';
import { canSeeOfferings } from '@/lib/relationship';
import { getRadarBoard } from '@/lib/repositories/radar';
import { listSubscriptions } from '@/lib/repositories/subscriptions';
import { listWatchlist } from '@/lib/repositories/watchlist';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await requireUser();

  const [{ view }, deals, subscriptions, radar, watchlist, relationship] = await Promise.all([
    searchParams,
    listDealsForViewer(user.id),
    listSubscriptions(user.id),
    getRadarBoard(user.id),
    listWatchlist(user.id),
    getRelationshipView(user.id),
  ]);

  /* Plain arrays rather than a Map and a Set: the shelf is a client
     island now, so everything handed to it crosses the serialization
     boundary. It rebuilds both on the other side. */
  const resumable = subscriptions.filter((s) => RESUMABLE_STATES.includes(s.state));

  /* A deal the member voted for on the Radar and that AltSpot then
     opened. Set on the company by hand (lib/terminal/radar.ts), so the
     card can prove the mechanic rather than claim it. */
  const fromRadar = radar
    .filter((company) => company.dealId && company.yourAmount !== null)
    .map((company) => company.dealId as string);

  return (
    <MarketplaceLanes
      deals={deals}
      resumable={resumable}
      watched={watchlist}
      fromRadar={fromRadar}
      companies={radar}
      locked={canSeeOfferings(relationship) ? null : relationship}
      initialView={view === 'radar' ? 'radar' : 'current'}
    />
  );
}
