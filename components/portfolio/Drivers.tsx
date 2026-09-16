/**
 * What is actually driving the number.
 *
 * The summary says the portfolio is up. This says which positions did
 * it, in dollars, on one scale, around a zero line. Sorted by size of
 * effect rather than by size of position, because a large position that
 * has not moved is not what a reader is looking for here.
 *
 * DOLLARS, NOT MULTIPLES. A 3x on five thousand dollars and a 1.1x on a
 * hundred thousand are not comparable, and a chart of multiples ranks
 * the small position first every time. The ledger above already gives
 * the multiple per position; this gives the thing the multiple hides.
 *
 * Losses point left in ember and are never omitted or rounded away. A
 * performance chart that only draws the winners is a brochure, and the
 * first thing an investor looks for on this page is what went wrong.
 */
import CompanyMark from '@/components/CompanyMark';
import { money } from '@/lib/format';

import s from './Drivers.module.css';

export interface Driver {
  id: string;
  name: string;
  logoUrl: string | null;
  /** Total value minus cost. Positive or negative. */
  effect: number;
  /** Realized positions are stated as settled rather than as marks. */
  exited: boolean;
}

export default function Drivers({ rows }: { rows: Driver[] }) {
  if (rows.length === 0) return null;

  const ordered = [...rows].sort((a, b) => b.effect - a.effect);
  const widest = Math.max(...ordered.map((row) => Math.abs(row.effect)), 1);

  const up = ordered.filter((row) => row.effect > 0);
  const down = ordered.filter((row) => row.effect < 0);
  const net = ordered.reduce((sum, row) => sum + row.effect, 0);

  return (
    <div className="card">
      <div className={s.head}>
        <span className={s.net} data-up={net >= 0}>
          {net >= 0 ? '+' : '−'}
          {money(Math.abs(net))}
        </span>
        <span className={s.split}>
          {up.length} position{up.length === 1 ? '' : 's'} up
          {down.length > 0
            ? `, ${down.length} down`
            : ', none down'}
        </span>
      </div>

      <ul className={s.rows}>
        {ordered.map((row) => {
          const width = (Math.abs(row.effect) / widest) * 50;
          const up = row.effect >= 0;

          return (
            <li className={s.row} key={row.id}>
              <span className={s.who}>
                <CompanyMark name={row.name} logoUrl={row.logoUrl} size={26} />
                <span className={s.name}>{row.name}</span>
              </span>

              <span className={s.plot}>
                <span className={s.axis} aria-hidden="true" />
                <span
                  className={up ? s.barUp : s.barDown}
                  style={{ width: `${width}%` }}
                />
              </span>

              <span className={s.effect} data-up={up}>
                {up ? '+' : '−'}
                {money(Math.abs(row.effect))}
                {row.exited ? <b className={s.settled}>Settled</b> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
