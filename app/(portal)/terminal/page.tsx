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
import LibraryRail from '@/components/terminal/LibraryRail';
import MonitorBoard from '@/components/terminal/MonitorBoard';
import Tape from '@/components/terminal/Tape';
import WireBoard from '@/components/terminal/WireBoard';
import { requireUser } from '@/lib/auth';
import { listLibrary, toCard } from '@/lib/terminal/library';
import { getMarketMonitor } from '@/lib/terminal/monitor';
import { getMarketNews } from '@/lib/terminal/news';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Terminal · AltSpot',
};

export default async function TerminalPage() {
  await requireUser();

  const [news, indicators] = await Promise.all([
    getMarketNews({ limit: 13 }),
    getMarketMonitor(),
  ]);

  /* Hosted here, not linked to. Only the card fields cross to the
     client; the bodies stay on the server and are read on the piece's
     own page. */
  const library = listLibrary().map(toCard);

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Terminal</div>
          <h1 className="display">What is moving in private markets.</h1>
          <p className="sub">
            The wire, our own writing, and the numbers underneath both. Read it
            before you open a deal, not after.
          </p>
        </div>
        <Link className="btn btn-ghost" href="/marketplace">
          Go to the marketplace
        </Link>
      </div>

      <Tape indicators={indicators} />

      <Section
        eyebrow="The wire"
        title="Filed today."
        lede="Private-markets headlines, newest first. Structure, pricing and process, not stock tips."
      >
        <WireBoard items={news} />
        <p className="tiny" style={{ marginTop: 18, maxWidth: '80ch' }}>
          Demo environment. This wire is simulated: the desks are invented and
          the stories are written for the demo. No item is a recommendation, and
          no company-specific figure here is real.
        </p>
      </Section>

      <Section
        eyebrow="The library"
        title="What we are writing."
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
