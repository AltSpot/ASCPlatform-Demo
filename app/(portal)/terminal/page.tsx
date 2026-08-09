/**
 * Terminal — what is happening outside the portfolio.
 *
 * Three sections, in the order an investor actually reads them: the
 * wire (what happened), the Journal (what we think about it), the
 * Monitor (the numbers underneath it).
 *
 * Server component. All three sources are fetched in parallel and all
 * three degrade to nothing rather than failing: `getMarketNews`,
 * `getJournalPosts` and `getMarketMonitor` each resolve to an empty
 * result on any error, and each section renders its own quiet state.
 * The page cannot 500 because a newsletter feed is down.
 */
import Link from 'next/link';

import Section from '@/components/deal/Section';
import JournalRail from '@/components/terminal/JournalRail';
import MonitorBoard from '@/components/terminal/MonitorBoard';
import Tape from '@/components/terminal/Tape';
import WireRail from '@/components/terminal/WireRail';
import { requireUser } from '@/lib/auth';
import { getJournalPosts, JOURNAL_SITE_URL } from '@/lib/terminal/journal';
import { getMarketMonitor } from '@/lib/terminal/monitor';
import { getMarketNews } from '@/lib/terminal/news';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Terminal · AltSpot',
};

export default async function TerminalPage() {
  await requireUser();

  const [news, posts, indicators] = await Promise.all([
    getMarketNews({ limit: 13 }),
    getJournalPosts(6),
    getMarketMonitor(),
  ]);

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
        <WireRail items={news} />
        <p className="tiny" style={{ marginTop: 18, maxWidth: '80ch' }}>
          Demo environment. This wire is simulated: the desks are invented and
          the stories are written for the demo. No item is a recommendation, and
          no company-specific figure here is real.
        </p>
      </Section>

      <Section
        eyebrow="AltSpot Journal"
        title="What we are writing."
        lede="Published to the AltSpot newsletter. Pulled live from the publication, so what you see here is what subscribers received."
      >
        <JournalRail posts={posts} />
        {posts.length > 0 && (
          <p className="tiny" style={{ marginTop: 18 }}>
            Read every issue at{' '}
            <a href={JOURNAL_SITE_URL} target="_blank" rel="noreferrer noopener">
              the publication
            </a>
            .
          </p>
        )}
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
