/**
 * The rest of the shelf, at the end of a deal page.
 *
 * Someone who has read to the bottom has decided one of two things:
 * they are in, or this one is not for them. The first has a button
 * directly above this. The second used to have nothing but the browser
 * back button and a trip through the marketplace to reach the next
 * deal, which is a strange thing to make an investor do at the exact
 * moment they are still willing to look at something else.
 *
 * Compact by design: the mark, the name, the one line and how much is
 * left. Enough to choose, not enough to compete with the deal the
 * reader is still standing in.
 *
 * Rows arrive redacted per viewer, the same as the shelf, so a teaser
 * carries no figures here either.
 */
import Link from 'next/link';

import CompanyMark from '@/components/CompanyMark';
import type { DealShelfItem } from '@/lib/domain';
import { fundingView } from '@/lib/funding';

import s from './Deal.module.css';

export default function MoreDeals({ deals }: { deals: DealShelfItem[] }) {
  if (deals.length === 0) return null;

  return (
    <section className={s.more} aria-label="Other deals open now">
      <div className={s.moreHead}>
        <span className={s.moreEyebrow}>Also open now</span>
        <Link className={s.moreAll} href="/marketplace">
          All deals →
        </Link>
      </div>

      <div className={s.moreGrid}>
        {deals.map((deal, i) => (
          <Link
            key={deal.id}
            href={`/deals/${deal.id}`}
            className={s.moreCard}
            style={{ ['--i' as string]: i }}
          >
            <CompanyMark name={deal.name} logoUrl={deal.logoUrl} size={34} />

            <span className={s.moreBody}>
              <b className={s.moreName}>{deal.name}</b>
              <span className={s.moreLine}>
                {deal.redacted ? deal.sector : (deal.headline ?? deal.blurb)}
              </span>
            </span>

            <span className={s.moreFig}>
              {deal.redacted ? 'Verify' : fundingLine(deal)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Where the raise stands, in a word or a figure. */
function fundingLine(deal: Parameters<typeof fundingView>[0]): string {
  const f = fundingView(deal);
  return f.minimumMet ? 'Minimum met' : `${f.toMinimumPct}% of min`;
}
