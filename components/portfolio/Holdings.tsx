/**
 * Every position, held and realized, in one ledger.
 *
 * The dashboard shows what needs attention. This shows everything, and
 * the difference matters: a realized position disappears from a
 * "current holdings" view exactly when an investor most wants to see
 * it, because it is the only evidence of what the process actually
 * produced. So an exited line stays, marked as exited, with what it
 * returned in the column where its mark used to be.
 *
 * The multiple counts cash already returned. A position that has
 * distributed its cost back and is still marked at something is not a
 * 1.0x, and any figure that says so is lying by omission.
 *
 * The bar is invested against total value on one scale across every
 * row, so the eye can compare positions without reading a number.
 *
 * The column names are an LP statement's, not a brokerage's: invested,
 * fair value, realized, total value, MOIC, IRR. Every one of them is
 * computed in lib/portfolio-metrics.ts.
 */
import Link from 'next/link';

import CompanyMark from '@/components/CompanyMark';
import { EMPTY, compact, percent } from '@/lib/format';

import PositionTarget from './PositionTarget';
import s from './Holdings.module.css';

export interface Holding {
  id: string;
  dealId: string;
  name: string;
  tag: string;
  logoUrl: string | null;
  assetClass: string;
  vintage: number | null;
  cost: number;
  value: number;
  returned: number;
  multiple: number;
  /** Annualized money-weighted return. Null when there is too little
      history for the figure to mean anything. */
  irr: number | null;
  exited: boolean;
}

export default function Holdings({ rows }: { rows: Holding[] }) {
  if (rows.length === 0) return null;

  /** The widest bar on the table. Every other bar is read against it. */
  const largest = Math.max(...rows.map((row) => Math.max(row.cost, row.value + row.returned)), 1);

  return (
    <div className="card">
      <PositionTarget />
      <div className={s.scroll}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Position</th>
              <th className={s.num}>Vintage</th>
              <th className={s.num}>Invested</th>
              <th className={s.num}>Fair value</th>
              <th className={s.num}>Realized</th>
              <th className={s.num}>Total value</th>
              <th className={s.num}>MOIC</th>
              <th className={s.num}>IRR</th>
              <th className={s.shapeHead}>Invested vs. total value</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const totalValue = row.value + row.returned;
              const up = totalValue >= row.cost;

              return (
                <tr
                  key={row.id}
                  id={`position-${row.dealId}`}
                  className={s.row}
                  data-exited={row.exited}
                >
                  <td>
                    <Link className={s.who} href={`/deals/${row.dealId}`}>
                      <CompanyMark name={row.name} logoUrl={row.logoUrl} size={32} />
                      <span className={s.whoText}>
                        <b className={s.name}>{row.name}</b>
                        <span className={s.tag}>
                          {row.exited ? 'Exited' : row.tag}
                        </span>
                      </span>
                    </Link>
                  </td>

                  <td className={s.num}>{row.vintage ?? EMPTY}</td>
                  <td className={s.num}>{compact(row.cost)}</td>

                  {/* Zero once a position exits: there is nothing left
                      to mark, and the result is in Realized. */}
                  <td className={s.num}>
                    {row.exited ? (
                      <span className={s.empty}>Exited</span>
                    ) : (
                      compact(row.value)
                    )}
                  </td>

                  <td className={s.num}>
                    {row.returned > 0 ? (
                      compact(row.returned)
                    ) : (
                      <span className={s.empty}>{EMPTY}</span>
                    )}
                  </td>

                  <td className={s.num}>{compact(totalValue)}</td>

                  <td className={`${s.num} ${s.lead}`}>
                    <span className={up ? s.up : s.down}>
                      {row.multiple.toFixed(2)}×
                    </span>
                  </td>

                  {/* Money-weighted and annualized, with the current
                      mark as the terminal flow. Null on anything too
                      young to say anything with. */}
                  <td className={s.num}>
                    {row.irr === null ? (
                      <span className={s.empty}>{EMPTY}</span>
                    ) : (
                      <span className={row.irr >= 0 ? s.up : s.down}>
                        {percent(row.irr, 1, { signed: true })}
                      </span>
                    )}
                  </td>

                  <td className={s.shape}>
                    {/* Cost is the champagne floor; anything past it is
                        gain, anything short of it is the shortfall. */}
                    <span
                      className={s.bar}
                      style={{
                        width: `${(Math.max(row.cost, totalValue) / largest) * 100}%`,
                        /* A gradient stop, not a child element, so the
                           two colours cannot bleed into each other. */
                        ['--cost' as string]: `${(Math.min(row.cost, totalValue) / Math.max(row.cost, totalValue)) * 100}%`,
                      }}
                      data-down={!up}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* The bar is the only thing on this table a reader has to be
          taught, and one line teaches it. */}
      <div className={s.key}>
        <span className={s.keyItem}>
          <span className={`${s.keySwatch} ${s.keyBase}`} aria-hidden="true" />
          Invested
        </span>
        <span className={s.keyItem}>
          <span className={`${s.keySwatch} ${s.keyGain}`} aria-hidden="true" />
          Gain above invested
        </span>
        <span className={s.keyItem}>
          <span className={`${s.keySwatch} ${s.keyLoss}`} aria-hidden="true" />
          Marked below invested
        </span>
      </div>
    </div>
  );
}
