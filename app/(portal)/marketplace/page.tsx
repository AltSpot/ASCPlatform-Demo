/**
 * Marketplace — two views behind one switcher.
 *
 * Current opportunities is the shelf: sourced, underwritten, open for
 * subscription today. AltSpot Radar is the other half of the same
 * conversation, where members say which private companies they want us
 * to go after next. Keeping them on one page and one control is the
 * point; keeping them visibly separate is the rule.
 *
 * Both panels are rendered here, on the server, and handed to the
 * client switcher as children, so every number is correct on first
 * paint and toggling costs nothing.
 */
import DealShelf from '@/components/marketplace/DealShelf';
import MarketplaceTabs, {
  type MarketplaceView,
} from '@/components/marketplace/MarketplaceTabs';
import RadarBoard from '@/components/radar/RadarBoard';
import { requireUser } from '@/lib/auth';
import { RESUMABLE_STATES } from '@/lib/domain';
import { listDeals } from '@/lib/repositories/deals';
import { getRadarBoard } from '@/lib/repositories/radar';
import { listSubscriptions } from '@/lib/repositories/subscriptions';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await requireUser();

  const [{ view }, deals, subscriptions, radar] = await Promise.all([
    searchParams,
    listDeals(user.id),
    listSubscriptions(user.id),
    getRadarBoard(user.id),
  ]);

  const resumable = new Map(
    subscriptions
      .filter((s) => RESUMABLE_STATES.includes(s.state))
      .map((s) => [s.dealId, s]),
  );

  const initial: MarketplaceView = view === 'radar' ? 'radar' : 'current';

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Marketplace</div>
          <h1 className="display">The private room.</h1>
          <p className="sub">
            What is open today, and what we are watching.
          </p>
        </div>
      </div>

      <MarketplaceTabs
        initial={initial}
        dealCount={deals.length}
        radarCount={radar.length}
        current={<DealShelf deals={deals} resumable={resumable} />}
        radar={<RadarBoard companies={radar} />}
      />
    </>
  );
}
