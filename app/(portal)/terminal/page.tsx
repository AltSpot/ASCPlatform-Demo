/**
 * Terminal — what is happening outside the portfolio.
 *
 * Three sections, in the order an investor actually reads them: the
 * wire (what happened), the library (what we think about it), the
 * Monitor (the numbers underneath it).
 *
 * The library is hosted in the portal. Every piece opens at
 * /terminal/<slug> and is read in the portal shell, so a member who
 * came to read something is still here when they finish. See
 * lib/terminal/library.ts.
 *
 * Server component. The two remote-shaped sources are fetched in
 * parallel and both degrade to nothing rather than failing:
 * `getMarketNews` and `getMarketMonitor` each resolve to an empty
 * result on any error, and each section renders its own quiet state.
 */
import Link from 'next/link';

import Section from '@/components/deal/Section';
import ForYou, { type ForYouCard } from '@/components/terminal/ForYou';
import LibraryRail from '@/components/terminal/LibraryRail';
import MonitorBoard from '@/components/terminal/MonitorBoard';
import Tape from '@/components/terminal/Tape';
import WireBoard from '@/components/terminal/WireBoard';
import { requireUser } from '@/lib/auth';
import { HELD_STATES, isLivePosition } from '@/lib/domain';
import { dateStr } from '@/lib/format';
import { SLEEVE } from '@/lib/portfolio-plan';
import { getPreferences } from '@/lib/repositories/preferences';
import { getRadarBoard } from '@/lib/repositories/radar';
import { listSubscriptions } from '@/lib/repositories/subscriptions';
import { pickLibrary, pickWire, type ForYouSignals } from '@/lib/terminal/for-you';
import { listLibrary, toCard } from '@/lib/terminal/library';
import { getMarketMonitor } from '@/lib/terminal/monitor';
import { getMarketNews } from '@/lib/terminal/news';

import t from '@/components/terminal/Terminal.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AltSpot Terminal',
};

export default async function TerminalPage() {
  const user = await requireUser();

  const [news, indicators, subscriptions, radar, preferences] = await Promise.all([
    getMarketNews({ limit: 13 }),
    getMarketMonitor(),
    listSubscriptions(user.id),
    getRadarBoard(user.id),
    getPreferences(user.id),
  ]);

  /* Hosted here, not linked to. Only the card fields cross to the
     client; the bodies stay on the server and are read on the piece's
     own page. */
  const library = listLibrary().map(toCard);

  /* What the page leads with for this member (lib/terminal/for-you.ts):
     education chosen from what they voted for, hold and have in flight. */
  /* The same count Portfolio's sleeve shows, so the two pages agree. */
  const held = subscriptions.filter(
    (sub) => HELD_STATES.includes(sub.state) && isLivePosition(sub),
  );
  const signals: ForYouSignals = {
    classes: [
      ...new Set([
        ...radar.filter((c) => c.yourAmount !== null).map((c) => c.assetClass as string),
        ...(preferences?.assetClasses ?? []),
      ]),
    ],
    heldCount: held.length,
    awaitingEscrow: subscriptions.some((sub) => sub.state === 'docs_signed'),
    inEscrow: subscriptions.some((sub) => sub.state === 'funded'),
    newToInvesting: subscriptions.length === 0,
    targetPositions: SLEEVE.targetPositions,
  };
  const bySlug = new Map(library.map((card) => [card.slug, card]));
  const picks: ForYouCard[] = pickLibrary(signals, library.map((c) => c.slug)).flatMap((pick) => {
    const card = bySlug.get(pick.slug);
    return card ? [{ ...card, reason: pick.reason }] : [];
  });
  const wireForYou = pickWire(signals, news, 3);
  const newest = news[0]?.age ?? null;

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">AltSpot Terminal</div>
          <h1 className="display">What is moving in private markets.</h1>
          <p className="sub">
            A live wire, our media and content, and the numbers underneath both. Read it
            before you open a deal, not after.
          </p>
        </div>
        <Link className="btn btn-ghost" href="/marketplace">
          Go to the marketplace
        </Link>
      </div>

      <Tape indicators={indicators} />

      <ForYou name={user.name.split(' ')[0]} picks={picks} wire={wireForYou} />

      <Section
        eyebrow="The wire"
        title="Filed today."
        lede="Private-markets headlines as they file, newest first. Structure, pricing and process, not stock tips."
      >
        {/* Say it is live, and when: a pulsing mark, today's date, how many
            have filed and how long ago the last one landed. */}
        <div className={t.liveBar} role="status">
          <span className="live-pill">
            <span className="live-dot" aria-hidden="true" />
            Live
          </span>
          <span className={t.liveDate}>{dateStr(new Date().toISOString())}</span>
          <span className={t.liveMeta}>
            {news.length} stories filed today{newest ? ` · latest ${newest}` : ''}
          </span>
        </div>
        <WireBoard items={news} />
        <p className="tiny" style={{ marginTop: 18, maxWidth: '80ch' }}>
          Demo environment. This wire is simulated: the desks are invented and
          the stories are written for the demo. No item is a recommendation, and
          no company-specific figure here is real.
        </p>
      </Section>

      <Section
        eyebrow="The library"
        title="Media and content."
        lede="Everything we publish, read here. Explainers on how these structures actually work, quarterly research, and the podcast. No piece is a recommendation and none of it is about a live deal."
      >
        <LibraryRail items={library} />
      </Section>

      <Section
        eyebrow="Private markets monitor"
        title="The numbers underneath."
        lede="Six readings on the conditions every private deal is priced into. The arrow says which way a number moved. It does not say whether that is good."
      >
        <MonitorBoard indicators={indicators} />
        <p className="tiny" style={{ marginTop: 18, maxWidth: '80ch' }}>
          Demo environment. These readings are illustrative and are not market
          data. Nothing here describes AltSpot performance or any investment
          outcome.
        </p>
      </Section>
    </>
  );
}
