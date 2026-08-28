/**
 * Your Radar — the names this member has indicated on.
 *
 * Deliberately NOT merged into Your positions, and that is a
 * correctness call rather than a layout preference. A position is money
 * committed and at risk. An indication reserves nothing, commits
 * nothing and moves no money, which the Radar disclosure states in
 * those words. Putting the two in one table would imply an indication
 * is a holding, and that is precisely the impression a securities
 * product must not give.
 *
 * So: its own section, its own language, directly under positions
 * because that is where someone looks for "what am I in on".
 */
import Link from 'next/link';

import CompanyMark from '@/components/CompanyMark';
import { money } from '@/lib/format';
import { ASSET_CLASSES, INDUSTRIES } from '@/lib/taxonomy';
import type { RadarCompanyView } from '@/lib/terminal/radar';

import s from './RadarPositions.module.css';

/** $9.6M, $412K, $9,640. */
function compact(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `$${m >= 100 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 10_000) return `$${Math.round(value / 1000)}K`;
  return money(value);
}

export default function RadarPositions({
  companies,
}: {
  /** The whole board. Filtered here to what this member has spoken on. */
  companies: RadarCompanyView[];
}) {
  const ranked = [...companies].sort((a, b) => b.interestDollars - a.interestDollars);
  const rankOf = new Map(ranked.map((c, i) => [c.slug, i + 1]));
  const mine = ranked.filter((c) => c.yourAmount !== null);

  if (mine.length === 0) {
    return (
      <div className="card">
        <p className="tiny">
          You have not indicated on anything yet. Radar is where members say
          which private companies AltSpot should go after next.{' '}
          <Link href="/marketplace?view=radar">Open Radar</Link> and put a number
          behind one.
        </p>
      </div>
    );
  }

  const yours = mine.reduce((sum, c) => sum + (c.yourAmount ?? 0), 0);

  return (
    <div className="card">
      <div className={s.list}>
        {mine.map((company) => {
          const share = company.interestDollars
            ? ((company.yourAmount ?? 0) / company.interestDollars) * 100
            : 0;

          return (
            <div className={s.row} key={company.slug}>
              <CompanyMark
                name={company.name}
                logoUrl={company.logoUrl}
                size={34}
              />

              <div className={s.who}>
                <b className={s.name}>{company.name}</b>
                <span className={s.meta}>
                  {ASSET_CLASSES[company.assetClass].label} ·{' '}
                  {INDUSTRIES[company.industry]}
                </span>
              </div>

              <div className={s.figure}>
                <span className={s.figureKey}>You indicated</span>
                <span className={s.yours}>{money(company.yourAmount ?? 0)}</span>
              </div>

              <div className={s.figure}>
                <span className={s.figureKey}>Total demand</span>
                <span className={s.figureValue}>
                  {compact(company.interestDollars)}
                </span>
                <span className={s.figureNote}>
                  {company.interestInvestors.toLocaleString('en-US')} members ·
                  you are {share < 1 ? '<1' : share.toFixed(0)}%
                </span>
              </div>

              <div className={s.figure}>
                <span className={s.figureKey}>Board rank</span>
                <span className={s.figureValue}>
                  {String(rankOf.get(company.slug) ?? 1).padStart(2, '0')}
                </span>
              </div>

              <Link
                className="btn btn-quiet btn-sm"
                href="/marketplace?view=radar"
              >
                Change
              </Link>
            </div>
          );
        })}
      </div>

      <p className={s.foot}>
        Indicating is not a commitment. It reserves no allocation, moves no
        money, and none of these companies is being offered. Total indicated{' '}
        <b>{money(yours)}</b> across {mine.length} name
        {mine.length === 1 ? '' : 's'}.
      </p>
    </div>
  );
}
