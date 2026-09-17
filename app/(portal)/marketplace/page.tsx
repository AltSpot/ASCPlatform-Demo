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
import { parseQuickFilter } from '@/lib/explore';
import { isOpenToEverything, matchesPreferences } from '@/lib/preferences';
import { getPreferences } from '@/lib/repositories/preferences';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();

  const [params, deals, subscriptions, radar, watchlist, relationship] = await Promise.all([
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

  /* A Radar name that is now an open deal on this member's shelf is no
     longer voted on: it leaves the board and shows on the shelf as just
     opened, from the Radar. Before the gate opens dealId is withheld and
     the shelf is empty, so nothing here can reveal a deal. */
  const onShelf = new Set(deals.map((deal) => deal.id));

  /* Deals that fit what the member asked for. Null when they asked for
     everything or have not answered: then there is nothing to single out. */
  const prefs = await getPreferences(user.id);
  const forYou =
    prefs && !isOpenToEverything(prefs)
      ? deals.filter((deal) => !deal.redacted && matchesPreferences(deal, prefs)).map((d) => d.id)
      : null;
  const radarSourced = radar
    .filter((company) => company.dealId && onShelf.has(company.dealId))
    .map((company) => company.dealId as string);
  const stillVoting = radar.filter(
    (company) => !(company.dealId && onShelf.has(company.dealId)),
  );

  return (
    <MarketplaceLanes
      deals={deals}
      resumable={resumable}
      watched={watchlist}
      fromRadar={fromRadar}
      companies={stillVoting}
      radarSourced={radarSourced}
      forYou={forYou}
      locked={canSeeOfferings(relationship) ? null : relationship}
      initialView={params.view === 'radar' ? 'radar' : 'current'}
      initialFilter={parseQuickFilter(params)}
    />
  );
}
