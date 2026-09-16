/**
 * Your Radar, on the dashboard: one row per name the member has voted
 * for, and whether it has arrived.
 *
 * The Radar is the engine that tells AltSpot which deals members want,
 * so it stays near the top of the dashboard. What it does not need up
 * here is the research: the market average, the target range and the
 * vote control all live on Marketplace › Radar where the vote is made.
 * The dashboard's job is to close the loop. Each row is three cells,
 * the name, what the member said, and the answer: still tracking, or
 * open now with the way in.
 *
 * Every figure here is a vote, and a vote reserves nothing and moves no
 * money. The line under the rows says so, in words, because a member
 * reading "$175,000" beside "$185,300" a screen above is entitled to be
 * told which one is theirs.
 *
 * Server component. No drag, no reorder, no animation: the rows are in
 * the member's own ranked order and nothing at rest moves.
 */
import Link from 'next/link';

import { money } from '@/lib/format';
import { ASSET_CLASSES, isAssetClass } from '@/lib/taxonomy';

import s from './RadarRows.module.css';

export interface RadarRow {
  slug: string;
  name: string;
  logoUrl?: string;
  assetClass: string;
  /** What the member voted, in integer dollars. */
  voted: number;
  /** Set when the deal sourcing this name is on the shelf right now. */
  live?: {
    dealId: string;
    /** Display date the allocation closes. */
    closes: string;
    /** True once the member has a subscription into it, in any state. */
    subscribed: boolean;
  };
}

/** Initials for the monogram: "Anduril Industries" becomes AI. */
function monogram(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function classLabel(key: string): string {
  return isAssetClass(key) ? ASSET_CLASSES[key].label : key;
}

export default function RadarRows({ rows }: { rows: RadarRow[] }) {
  if (rows.length === 0) {
    return (
      <div className={`card ${s.empty}`}>
        <p className={s.emptyLead}>Tell us what you want to invest in next.</p>
        <p className={s.emptyNote}>
          Vote for the private companies you would back. Enough votes and AltSpot goes and
          sources the deal.
        </p>
        <Link className="btn btn-ghost btn-sm" href="/marketplace?view=radar">
          Vote on what is next →
        </Link>
      </div>
    );
  }

  const total = rows.reduce((sum, row) => sum + row.voted, 0);

  return (
    <div className={`card ${s.card}`}>
      <ul className={s.rows}>
        {rows.map((row) => (
          <li className={s.row} key={row.slug} data-live={row.live ? 'true' : undefined}>
            <span className={s.plate} aria-hidden="true">
              {row.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={s.logo} src={row.logoUrl} alt="" />
              ) : (
                <span className={s.monogram}>{monogram(row.name)}</span>
              )}
            </span>

            <span className={s.who}>
              <span className={s.name}>{row.name}</span>
              <span className={s.kind}>{classLabel(row.assetClass)}</span>
            </span>

            <span className={s.vote}>
              <span className={s.voteKey}>You voted</span>
              <span className={s.voteValue}>{money(row.voted)}</span>
            </span>

            <span className={s.status}>
              {row.live ? (
                <>
                  <span className={s.liveDot} aria-hidden="true" />
                  <span className={s.liveText}>
                    Open now · closes {row.live.closes}
                  </span>
                  {row.live.subscribed ? (
                    <span className={s.inIt}>You are in</span>
                  ) : (
                    <Link className="btn btn-gold btn-sm" href={`/deals/${row.live.dealId}`}>
                      Invest
                    </Link>
                  )}
                </>
              ) : (
                <span className={s.tracking}>Tracking</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className={s.foot}>
        <Link className={s.more} href="/marketplace?view=radar">
          Vote on more names →
        </Link>
        <span className={s.legal}>
          {money(total)} across {rows.length === 1 ? '1 name' : `${rows.length} names`}. A vote
          reserves nothing and moves no money.
        </span>
      </div>
    </div>
  );
}
