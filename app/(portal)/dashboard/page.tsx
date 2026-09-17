/**
 * Dashboard.
 *
 * A first-time investor asks three things, in this order: what is my
 * money worth, is anything waiting on me, and what can I do next. The
 * page answers them in that order and nothing on it comes before the
 * answer to the first. One figure and one sentence in the hero, the
 * strip of things that need the member above it, and only then the
 * watchlist, the open deals, the votes, the positions and Learn.
 *
 * THE ORDER IS THE SAME FOR EVERY MEMBER. Sections fold, and a fold is
 * remembered per device, but nothing reorders: a dashboard whose first
 * screen differs for every member cannot be walked through on a call.
 *
 * Every total on this page comes from `ledgerBook`, which is the same
 * function Portfolio reads. The dashboard once summed held positions
 * itself and reported $125,000 invested against Portfolio's $143,000,
 * because one of them counted a realized position and the other did
 * not. tests/portfolio-metrics.test.ts now fails if either page grows
 * its own total again.
 *
 * Rendered on the server so the numbers are correct on first paint. The
 * client islands are the chart, the table's fold, the watchlist and the
 * section folds.
 */
import Link from 'next/link';

import CollapsibleSection from '@/components/CollapsibleSection';
import NeedsYou, { type NeedsYouItem } from '@/components/NeedsYou';
import PortfolioChart, {
  type PortfolioPoint,
  type PortfolioRange,
} from '@/components/PortfolioChart';
import { type OpenPosition } from '@/components/PositionTimeline';
import PositionsTable, { type PositionRow } from '@/components/PositionsTable';
import RadarRows, { type RadarRow } from '@/components/RadarRows';
import SetupBanner from '@/components/SetupBanner';
import WatchlistBlock from '@/components/WatchlistBlock';
import PopularCarousel, { type PopularItem } from '@/components/PopularCarousel';
import NewsDigest from '@/components/terminal/NewsDigest';
import { requireUser } from '@/lib/auth';
import {
  type DealShelfItem,
  evaluateInvestGate,
  HELD_STATES,
  isLivePosition,
} from '@/lib/domain';
import { compact, daysLeft, EMPTY, money } from '@/lib/format';
import { ledgerBook } from '@/lib/portfolio-metrics';
import { buildPortfolioSeries } from '@/lib/portfolio-series';
import { rankByPopularity } from '@/lib/popularity';
import { ASSET_CLASSES } from '@/lib/taxonomy';
import { getDealsByIds, getDealsForViewer, listDealsForViewer } from '@/lib/repositories/deals';
import { getDistributions } from '@/lib/repositories/distributions';
import { getWizardView } from '@/lib/repositories/investor';
import { getMarks } from '@/lib/repositories/marks';
import { getRadarBoard } from '@/lib/repositories/radar';
import { listSubscriptions } from '@/lib/repositories/subscriptions';
import { countWatchers, listWatchlist } from '@/lib/repositories/watchlist';
import { brandArt } from '@/lib/brand';
import { fundingView } from '@/lib/funding';
import { getMarketNews } from '@/lib/terminal/news';

import d from './Dashboard.module.css';

export const dynamic = 'force-dynamic';

/** How many deals and how many Radar names the Most popular row holds. */
const POPULAR_DEALS = 6;
const POPULAR_RADAR = 6;

export default async function DashboardPage() {
  const user = await requireUser();

  const [subscriptions, wizard, headlines, watchlist, radar, distributions, marks, shelf, watchers] =
    await Promise.all([
      listSubscriptions(user.id),
      getWizardView(user.id),
      // Three is the whole budget. The dashboard belongs to the portfolio.
      getMarketNews({ limit: 3 }),
      listWatchlist(user.id),
      getRadarBoard(user.id),
      getDistributions(user.id),
      getMarks(user.id),
      // Redacted per viewer, same rule as the marketplace.
      listDealsForViewer(user.id),
      countWatchers(),
    ]);

  const [deals, watched] = await Promise.all([
    getDealsByIds([...new Set(subscriptions.map((s) => s.dealId))]),
    getDealsForViewer(watchlist, user.id),
  ]);
  const gate = evaluateInvestGate(wizard);

  /**
   * "Welcome back" to someone who created their account ninety seconds
   * ago is the sort of line that tells a first-time member the product
   * is not paying attention. There is no visit counter to consult, so
   * the test is whether they have left any trace at all: a
   * subscription, or any step of setup begun. Either one means they
   * have been here before, and the first greeting is the only one that
   * ever reads differently.
   */
  const untouched =
    subscriptions.length === 0 &&
    wizard.accreditation.status === 'not_started' &&
    !wizard.info.complete &&
    !wizard.kyc.idUploaded &&
    !wizard.kyc.selfieCaptured &&
    !wizard.profileDone &&
    !wizard.bankDone;

  const firstName = user.name.split(' ')[0];

  /* The book: every held position, live or exited, totalled once. */
  const book = ledgerBook(subscriptions, distributions.items);

  const pending = subscriptions.filter((s) => s.state === 'docs_signed');
  const drafts = subscriptions.filter((s) => s.state === 'started');
  const expired = subscriptions.filter((s) => s.state === 'expired');
  const pendingAmount = pending.reduce((sum, s) => sum + s.amount, 0);

  /**
   * The table lists what is at work today plus anything in flight. A
   * realized position is on the Portfolio ledger, not here: the
   * dashboard is about capital at work, and an exit reads as a total
   * loss in a column headed "worth today".
   */
  const held = subscriptions.filter(isLivePosition);
  const inFlight = [...drafts, ...pending];
  const positions = [...held, ...inFlight];

  /**
   * Everything with a step still ahead of it. `funded` is held, so it
   * is already in `positions`, but it is not finished: AltSpot still
   * has to countersign, and the member is entitled to see that it is
   * ours to do rather than theirs.
   */
  const openById = new Map<string, OpenPosition>(
    [...inFlight, ...subscriptions.filter((s) => s.state === 'funded')].map((sub) => [
      sub.id,
      {
        id: sub.id,
        dealId: sub.dealId,
        dealName: deals.get(sub.dealId)?.name ?? sub.dealId,
        amount: sub.amount,
        state: sub.state as OpenPosition['state'],
        signedAt: sub.signedAt,
        fundedAt: sub.fundedAt,
        fundingDeadline: sub.fundingDeadline,
        daysRemaining: daysLeft(sub.fundingDeadline),
      },
    ]),
  );

  /** Cash returned per position, so a row can state what it has paid. */
  const realizedBySub = new Map<string, number>();
  for (const item of distributions.items) {
    realizedBySub.set(
      item.subscriptionId,
      (realizedBySub.get(item.subscriptionId) ?? 0) + item.amount,
    );
  }

  /** What the table renders. Serializable, because the table is a client island. */
  const positionRows: PositionRow[] = positions.map((sub) => {
    const deal = deals.get(sub.dealId);
    const live = isLivePosition(sub);

    return {
      id: sub.id,
      dealId: sub.dealId,
      name: deal?.name ?? sub.dealId,
      tag: deal?.tag ?? '',
      entity: deal?.entity ?? EMPTY,
      logoUrl: deal?.logoUrl ?? null,
      invested: sub.amount,
      value: live ? (sub.currentValue ?? sub.amount) : null,
      realized: realizedBySub.get(sub.id) ?? 0,
      live,
      state: sub.state as PositionRow['state'],
      signedAt: sub.signedAt,
      fundedAt: sub.fundedAt,
      open: openById.get(sub.id) ?? null,
    };
  });

  /**
   * The Radar, closed into a loop. A voted name whose deal is on the
   * shelf right now is live, and the row says so; the same fact is the
   * one thing from the Radar that also earns a line in the strip at the
   * top, because it is the moment the engine pays off. `dealId` is set
   * by hand on the company (lib/terminal/radar.ts), never inferred from
   * a slug that happens to match.
   */
  const shelfById = new Map(shelf.map((deal) => [deal.id, deal]));
  const subscribedDeals = new Set(subscriptions.map((s) => s.dealId));


  const radarRows: RadarRow[] = radar
    .filter((company) => company.yourAmount !== null)
    .sort((a, b) => (a.yourRank ?? Infinity) - (b.yourRank ?? Infinity))
    .map((company) => {
      const deal = company.dealId ? shelfById.get(company.dealId) : undefined;
      return {
        slug: company.slug,
        name: company.name,
        logoUrl: company.logoUrl,
        assetClass: company.assetClass,
        voted: company.yourAmount ?? 0,
        live: deal
          ? {
              dealId: deal.id,
              closes: deal.redacted ? 'soon' : shortDate(deal.targetClose),
              subscribed: subscribedDeals.has(deal.id),
            }
          : undefined,
      };
    });

  /**
   * What needs the member, in the order they would want to hear it: a
   * commitment with a clock on it, a document to sign, a Radar name
   * that arrived, a commitment that lapsed.
   */
  const needsYou: NeedsYouItem[] = [
    ...pending.map<NeedsYouItem>((s) => ({
      kind: 'fund',
      id: s.id,
      dealName: deals.get(s.dealId)?.name ?? s.dealId,
      amount: s.amount,
      deadline: s.fundingDeadline,
      daysLeft: daysLeft(s.fundingDeadline),
    })),
    ...drafts.map<NeedsYouItem>((s) => ({
      kind: 'sign',
      dealId: s.dealId,
      dealName: deals.get(s.dealId)?.name ?? s.dealId,
      amount: s.amount,
    })),
    ...radarRows.flatMap<NeedsYouItem>((row) =>
      row.live && !row.live.subscribed
        ? [
            {
              kind: 'live',
              dealId: row.live.dealId,
              dealName: row.name,
              voted: row.voted,
              closes: row.live.closes,
            },
          ]
        : [],
    ),
    ...expired.map<NeedsYouItem>((s) => ({
      kind: 'lapsed',
      id: s.id,
      dealId: s.dealId,
      dealName: deals.get(s.dealId)?.name ?? s.dealId,
      amount: s.amount,
    })),
  ];

  /**
   * Most popular: the open deals the membership is paying attention to,
   * that this member is not already in. Ranked by lib/popularity.ts on
   * money committed, members watching and Radar votes for the company
   * behind the deal. A teaser (unverified member) has no allocation
   * figures, so it ranks on attention alone.
   */
  const radarDollarsByDeal = new Map(
    radar.filter((c) => c.dealId).map((c) => [c.dealId as string, c.interestDollars]),
  );
  const popular = rankByPopularity(
    shelf
      /* Only deals this member can actually join. A deal that opened before
         their relationship date is view-only under Rule 506(b), and a row
         that invites them to it would send them to a page that says no. */
      .filter((deal) => !subscribedDeals.has(deal.id) && !deal.redacted && deal.subscribable)
      .map((deal) => ({
        deal,
        id: deal.id,
        /* Against the minimum to close, the same measure as every bar. */
        subscribedShare: deal.redacted ? 0 : fundingView(deal).toMinimumPct / 100,
        watchers: watchers.get(deal.id) ?? 0,
        radarDollars: radarDollarsByDeal.get(deal.id) ?? 0,
        daysToClose: closeRank(deal),
      })),
  )
    .slice(0, POPULAR_DEALS)
    .map((entry) => entry.deal);

  /* Radar names by demand, leaving out any that already sit on the shelf
     (those are in the list above as deals). Interleaved two deals to one
     name, so the row reads as one market rather than two lists. */
  const popularRadar = [...radar]
    .filter((c) => !(c.dealId && shelfById.has(c.dealId)))
    .sort((a, b) => b.interestDollars - a.interestDollars)
    .slice(0, POPULAR_RADAR);
  const popularItems: PopularItem[] = [];
  {
    const dealItems: PopularItem[] = popular.map((deal) => ({
      kind: 'deal',
      id: deal.id,
      name: deal.name,
      art: deal.art,
      logoUrl: deal.logoUrl,
      figure: deal.redacted
        ? 'Open now'
        : fundingView(deal).minimumMet
          ? 'Minimum met'
          : `${fundingView(deal).toMinimumPct}% of minimum`,
      line: deal.redacted ? 'Verify to see terms' : `Closes ${shortDate(deal.targetClose)}`,
      href: `/deals/${deal.id}`,
      hot: !deal.redacted && daysLeft(deal.targetClose) <= 14,
    }));
    const radarItems: PopularItem[] = popularRadar.map((c) => ({
      kind: 'radar',
      id: c.slug,
      name: c.name,
      art: brandArt(c.slug) ?? `linear-gradient(135deg, var(--surface-sunk), ${ASSET_CLASSES[c.assetClass].tint})`,
      logoUrl: c.logoUrl ?? null,
      figure: `${compact(c.interestDollars)} voted`,
      line: `${c.interestInvestors.toLocaleString('en-US')} members`,
      href: '/marketplace?view=radar',
    }));
    while (dealItems.length || radarItems.length) {
      popularItems.push(...dealItems.splice(0, 2), ...radarItems.splice(0, 1));
    }
  }

  /**
   * The real history, from reported marks. Both this and the Portfolio
   * page read `buildPortfolioSeries`, so the two cannot disagree about
   * what the portfolio was worth in a given quarter.
   *
   * Total value, not marks alone: a realized position stops being
   * marked the quarter it exits, and a chart of marks alone draws that
   * exit as a collapse. The cash it returned is in the series.
   */
  const chartPoints: PortfolioPoint[] = buildPortfolioSeries(
    subscriptions
      .filter((s) => HELD_STATES.includes(s.state))
      .map((s) => ({
        id: s.id,
        amount: s.amount,
        fundedAt: s.fundedAt,
        realizedAt: s.realizedAt,
        currentValue: s.currentValue,
      })),
    marks,
    distributions.items.map((item) => ({
      subscriptionId: item.subscriptionId,
      paidAt: item.paidAt,
      amount: item.amount,
      kind: item.kind,
    })),
    new Date(),
  ).map((period) => ({
    label: period.label,
    value: period.value + period.distributed,
    paidIn: period.paidIn,
  }));

  const chartRanges: PortfolioRange[] = [
    { key: '1y', label: '1Y', points: 4 },
    { key: '2y', label: '2Y', points: 8 },
    { key: '3y', label: '3Y', points: 12 },
  ];

  const seededCount = subscriptions.filter((s) => s.seeded).length;

  return (
    <>
      <div className={d.head}>
        <h1 className={d.greeting}>
          {untouched ? `Welcome, ${firstName}.` : `Welcome back, ${firstName}.`}
        </h1>
        <Link className="btn btn-ghost btn-sm" href="/marketplace">
          Browse deals →
        </Link>
      </div>

      <SetupBanner gate={gate} wizard={wizard} />

      <NeedsYou items={needsYou} />

      {popularItems.length > 0 ? (
        <CollapsibleSection
          id="popular"
          title="Most popular right now"
          action={
            <Link className={d.sectionLink} href="/marketplace">
              All deals →
            </Link>
          }
        >
          <PopularCarousel items={popularItems} />
        </CollapsibleSection>
      ) : null}

      {/* Saved and voted, side by side: the two lists a member reads
          together when deciding where to act. */}
      <div className={d.pair}>
      <CollapsibleSection
        id="watchlist"
        title="Watchlist"
        action={
          <Link className={d.sectionLinkInline} href="/watchlist">
            Open watchlist →
          </Link>
        }
      >
        <WatchlistBlock deals={watched} />
      </CollapsibleSection>

      <CollapsibleSection id="radar" title="Your votes">
        <RadarRows rows={radarRows} />
      </CollapsibleSection>
      </div>

      {/* Your investments: one figure, one sentence, the curve, two quiet
          figures, and the positions that make them up, all on one card.
          Nothing here is said twice: the hero totals the book and the
          table itemises it. The chart owns the readout because hovering
          the curve rewrites it. */}
      <CollapsibleSection id="investments" title="Your investments">
      {chartPoints.length >= 2 ? (
        <section className={`card ${d.hero}`} aria-label="Your investments">
          <PortfolioChart points={chartPoints} ranges={chartRanges} invested={book.invested} />
          <div className={d.heroFoot}>
            <span className={d.heroFig}>
              <span className={d.heroKey}>Cash paid back to you</span>
              <span className={d.heroValue}>{money(book.realized)}</span>
            </span>
            <span className={d.heroFig}>
              <span className={d.heroKey}>Waiting on you</span>
              <span className={d.heroValue}>{money(pendingAmount)}</span>
            </span>
          </div>
          <div className={d.heroPositions}>
            <PositionsTable rows={positionRows} compact bare />
          </div>
        </section>
      ) : (
        <section className={`card ${d.hero} ${d.heroEmpty}`} aria-label="Your investments">
          <span className="eyebrow">Your investments are worth</span>
          <span className={d.emptyValue}>Nothing invested yet</span>
          <p className={d.emptyLine}>
            {gate.ok
              ? 'Your first investment will appear here the moment it lands in escrow.'
              : 'Finish setup, then your first investment will appear here the moment it lands in escrow.'}
          </p>
        </section>
      )}
      </CollapsibleSection>

      <CollapsibleSection id="wire" title="Learn">
        <NewsDigest items={headlines} />
      </CollapsibleSection>

      {/* One line, counting what is actually seeded rather than naming
          one position. It named OpenAI alone for as long as OpenAI was
          the only seeded row, and went stale the moment a second one
          was added. */}
      {seededCount > 0 && (
        <p className={d.disclosure}>
          Demo environment. {seededCount} position
          {seededCount === 1 ? ' is' : 's are'} seeded, with reported marks and
          distributions, so the portfolio has history to show. No money moved
          and nothing here was signed. Your votes and watchlist are seeded too.
        </p>
      )}
    </>
  );
}

/** "Sep 18, 2026" becomes "Sep 18". The year is on the deal page. */
function shortDate(value: string): string {
  return value.split(',')[0].trim();
}

/** Days to close, or last for a teaser, which carries no date. */
function closeRank(deal: DealShelfItem): number {
  return deal.redacted ? Number.MAX_SAFE_INTEGER : daysLeft(deal.targetClose);
}
