'use client';

/**
 * Your positions.
 *
 * The brief was Robinhood, so it is worth saying what was taken and
 * what was not. Taken: one figure per row that is unmistakably the
 * point, direction stated in color and sign, numbers right-aligned in
 * tabular figures so a column can be read down rather than across, a
 * shape beside each row so the list can be scanned without reading a
 * single number, and controls that change what the table shows instead
 * of a wider table.
 *
 * Not taken: the day's move. A public brokerage can lead with it
 * because there is a price every second. A private position is marked
 * quarterly at best, so "today" is a number that does not exist, and
 * inventing a line for it would be the most misleading thing on the
 * page. What replaces it is the shape of the position itself: how much
 * was put in, what it is marked at now, and how far apart those are.
 *
 * The bar is that comparison, drawn. Its full width is the largest
 * position on the table, so the rows are comparable to each other; the
 * champagne part is cost and the gold part is gain. A position marked
 * below cost draws in ember and stops at the mark. No invented
 * history, and nothing on it that is not already in the two columns
 * beside it.
 *
 * Three views rather than eleven columns. Value answers "what is it
 * worth", Return answers "how is it doing", Detail answers "what
 * exactly do I hold and when did it happen". Most people never leave
 * the first.
 *
 * THE COLUMNS ARE NAMED THE WAY AN LP STATEMENT NAMES THEM. Invested,
 * fair value, realized, unrealized, total value, MOIC. Not "gain" and
 * "return", which are brokerage words for an asset with a daily price
 * and say nothing about which half of a multiple is cash in hand. The
 * arithmetic lives in lib/portfolio-metrics.ts so this table and the
 * Portfolio page cannot report different figures for one position, as
 * they did while the multiple here ignored distributions entirely.
 *
 * THE DASHBOARD GETS THE COMPACT TABLE. Four columns in the member's
 * own words: what you put in, what it is worth today, the change, and
 * the status. No view switcher and no sort, because a first-time
 * investor reading their first dashboard should not have to choose a
 * view before they can read a row. The LP vocabulary, the three views
 * and the sort live on Portfolio, and the compact table's footer says
 * so. The rows, the status chip and the timeline fold are the same
 * code in both, so the two tables cannot disagree about a position.
 *
 * An open position's timeline folds. It arrives open, because a
 * commitment with a clock on it is the one thing here that needs
 * something from the reader, but a member who has already read it and
 * knows the date can put it away and get their table back.
 */
import {
  ArrowDownUp,
  ChevronDown,
  CircleCheck,
  Clock,
  FileSignature,
  Hourglass,
} from 'lucide-react';
import Link from 'next/link';
import { Fragment, useState } from 'react';

import CompanyMark from '@/components/CompanyMark';
import PositionTimeline, { type OpenPosition } from '@/components/PositionTimeline';
import { dateStr, EMPTY, money } from '@/lib/format';
import { moic, totalValue, unrealized } from '@/lib/portfolio-metrics';

import s from './PositionsTable.module.css';

export interface PositionRow {
  id: string;
  dealId: string;
  name: string;
  tag: string;
  /** The legal vehicle. What the member actually holds. */
  entity: string;
  logoUrl: string | null;
  invested: number;
  /** Latest reported mark on what is still held. Null until held. */
  value: number | null;
  /** Cash distributed back on this position, operating and exit. */
  realized: number;
  /** Held, so the value and the return mean something. */
  live: boolean;
  state: 'started' | 'docs_signed' | 'funded' | 'accepted' | 'closed';
  signedAt: string | null;
  fundedAt: string | null;
  /** Present while the position still has a step ahead of it. */
  open: OpenPosition | null;
}

type View = 'value' | 'return' | 'detail';
type Sort = 'value' | 'return' | 'name';

const VIEWS: { key: View; label: string }[] = [
  { key: 'value', label: 'Value' },
  { key: 'return', label: 'Performance' },
  { key: 'detail', label: 'Holding' },
];

const SORTS: { key: Sort; label: string }[] = [
  { key: 'value', label: 'Largest first' },
  { key: 'return', label: 'Highest MOIC' },
  { key: 'name', label: 'Name' },
];

/**
 * The three figures every metric is built from, or null when the
 * position is not held yet and none of them mean anything.
 */
function economicsOf(row: PositionRow) {
  if (!row.live || row.value === null) return null;
  return { invested: row.invested, fairValue: row.value, realized: row.realized };
}

/** MOIC, or null when there is nothing to compute it against. */
function moicOf(row: PositionRow): number | null {
  const economics = economicsOf(row);
  return economics === null ? null : moic(economics);
}

export default function PositionsTable({
  rows,
  compact = false,
  bare = false,
}: {
  rows: PositionRow[];
  /** The dashboard's four-column table. See the header comment. */
  compact?: boolean;
  /**
   * No card of its own. The dashboard sets the table inside the hero
   * card, under the figure it itemises, and a card inside a card is
   * glass on glass.
   */
  bare?: boolean;
}) {
  const [view, setView] = useState<View>('value');
  const [sort, setSort] = useState<Sort>('value');

  /* On Portfolio, timelines are open on arrival: an open position is the
     one thing on this table that needs the reader to do something, and
     a step they have to go looking for is a step that gets missed. On
     the dashboard the strip above the table already carries the ask,
     so they start folded. The set holds the rows the reader has
     TOGGLED away from that default, so a new position appearing needs
     nothing seeded. */
  const [toggled, setToggled] = useState<Set<string>>(new Set());

  function timelineOpen(id: string): boolean {
    const openByDefault = !compact;
    return toggled.has(id) ? !openByDefault : openByDefault;
  }

  function toggleTimeline(id: string) {
    setToggled((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (rows.length === 0) {
    return (
      <div className={bare ? undefined : 'card'}>
        <div className="dz" style={{ cursor: 'default' }}>
          <b style={{ color: 'var(--paper)' }}>No positions yet</b>
          <br />
          <span className="tiny">
            Your first investment will appear here the moment it lands in escrow.
          </span>
          <br />
          <br />
          <Link className="btn btn-gold btn-sm" href="/marketplace">
            Open the marketplace
          </Link>
        </div>
      </div>
    );
  }

  const sorted = [...rows].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'return') {
      const ma = moicOf(a);
      const mb = moicOf(b);
      /* A position with no mark has no multiple, so it sorts last
         rather than counting as zero, which would rank it above a
         position that is merely down. */
      if (ma === null && mb === null) return 0;
      if (ma === null) return 1;
      if (mb === null) return -1;
      return mb - ma;
    }
    return (b.value ?? b.invested) - (a.value ?? a.invested);
  });

  /** The widest bar on the table. Every other bar is read against it. */
  const largest = Math.max(...rows.map((r) => Math.max(r.invested, r.value ?? 0)), 1);

  return (
    <div className={bare ? undefined : 'card'}>
      {compact ? null : (
        <div className={s.controls}>
          <div className={s.views} role="group" aria-label="What the table shows">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                type="button"
                className={s.view}
                aria-pressed={view === v.key}
                onClick={() => setView(v.key)}
              >
                {v.label}
              </button>
            ))}
          </div>

          <label className={s.sort}>
            <ArrowDownUp size={12} strokeWidth={1.6} aria-hidden="true" />
            <span className={s.srOnly}>Sort positions</span>
            <select
              className={s.sortSelect}
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
            >
              {SORTS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className={s.scroll}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Position</th>
              {compact ? (
                <>
                  <th className={s.num}>You put in</th>
                  <th className={s.num}>Worth today</th>
                  <th className={s.num}>Change</th>
                </>
              ) : view === 'value' ? (
                <>
                  <th className={s.num}>Invested</th>
                  <th className={s.num}>Fair value</th>
                  <th className={s.shapeHead}>Invested vs. total value</th>
                </>
              ) : view === 'return' ? (
                <>
                  <th className={s.num}>Realized</th>
                  <th className={s.num}>Unrealized</th>
                  <th className={s.num}>Total value</th>
                  <th className={s.num}>MOIC</th>
                </>
              ) : (
                <>
                  <th>Vehicle</th>
                  <th className={s.num}>Signed</th>
                  <th className={s.num}>In escrow</th>
                </>
              )}
              <th>Status</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {sorted.map((row) => {
              const economics = economicsOf(row);
              const unrealizedGain = economics && unrealized(economics);
              const total = economics && totalValue(economics);
              const multiple = economics && moic(economics);

              return (
                <Fragment key={row.id}>
                  <tr
                    className={s.row}
                    data-open={row.open !== null && timelineOpen(row.id)}
                    data-attention={row.open !== null}
                  >
                    <td>
                      <div className={s.who}>
                        <CompanyMark name={row.name} logoUrl={row.logoUrl} size={34} />
                        <span className={s.whoText}>
                          <b className={s.name}>{row.name}</b>
                          <span className={s.tag}>{row.tag}</span>
                        </span>
                      </div>
                    </td>

                    {compact ? (
                      <>
                        <td className={s.num}>{money(row.invested)}</td>
                        <td className={`${s.num} ${s.lead}`}>
                          {row.live && row.value !== null ? (
                            money(row.value)
                          ) : (
                            <span className={s.empty}>{EMPTY}</span>
                          )}
                        </td>
                        {/* Total value less cost, so a distribution
                            counts. The same figure Portfolio's Value
                            view draws as the bar. */}
                        <td className={s.num}>
                          {total === null ? (
                            <span className={s.empty}>{EMPTY}</span>
                          ) : (
                            <Change amount={total - row.invested} />
                          )}
                        </td>
                      </>
                    ) : view === 'value' ? (
                      <>
                        <td className={s.num}>{money(row.invested)}</td>
                        <td className={`${s.num} ${s.lead}`}>
                          {row.live && row.value !== null ? (
                            money(row.value)
                          ) : (
                            <span className={s.empty}>{EMPTY}</span>
                          )}
                        </td>
                        <td className={s.shape}>
                          <Bar row={row} largest={largest} />
                        </td>
                      </>
                    ) : view === 'return' ? (
                      <>
                        {/* Cash in hand. A dash rather than a zero: no
                            distribution yet is a different fact from a
                            distribution of nothing. */}
                        <td className={s.num}>
                          {row.realized > 0 ? (
                            money(row.realized)
                          ) : (
                            <span className={s.empty}>{EMPTY}</span>
                          )}
                        </td>
                        <td className={s.num}>
                          {unrealizedGain === null ? (
                            <span className={s.empty}>{EMPTY}</span>
                          ) : (
                            <span className={unrealizedGain >= 0 ? s.up : s.down}>
                              {unrealizedGain >= 0 ? '+' : '−'}
                              {money(Math.abs(unrealizedGain))}
                            </span>
                          )}
                        </td>
                        <td className={s.num}>
                          {total === null ? (
                            <span className={s.empty}>{EMPTY}</span>
                          ) : (
                            money(total)
                          )}
                        </td>
                        <td className={`${s.num} ${s.lead}`}>
                          {multiple === null ? (
                            <span className={s.empty}>{EMPTY}</span>
                          ) : (
                            <span className={multiple >= 1 ? s.up : s.down}>
                              {multiple.toFixed(2)}×
                            </span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={s.vehicle}>{row.entity}</td>
                        <td className={s.num}>
                          {row.signedAt ? (
                            dateStr(row.signedAt)
                          ) : (
                            <span className={s.empty}>{EMPTY}</span>
                          )}
                        </td>
                        <td className={s.num}>
                          {row.fundedAt ? (
                            dateStr(row.fundedAt)
                          ) : (
                            <span className={s.empty}>{EMPTY}</span>
                          )}
                        </td>
                      </>
                    )}

                    <td>
                      <Status state={row.state} />
                    </td>

                    <td className={s.action}>
                      {/* An open position gets its actions from the
                          timeline below it, so the row offers the fold
                          instead of a second button saying the same. */}
                      {row.open ? (
                        <button
                          type="button"
                          className={s.fold}
                          aria-expanded={timelineOpen(row.id)}
                          aria-controls={`timeline-${row.id}`}
                          onClick={() => toggleTimeline(row.id)}
                        >
                          {timelineOpen(row.id) ? 'Hide' : 'Steps'}
                          <ChevronDown
                            className={s.foldChev}
                            size={13}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        </button>
                      ) : (
                        <Link className="btn btn-quiet btn-sm" href={`/deals/${row.dealId}`}>
                          View deal
                        </Link>
                      )}
                    </td>
                  </tr>

                  {row.open && timelineOpen(row.id) ? (
                    <tr className={s.timelineRow} id={`timeline-${row.id}`}>
                      <td colSpan={6}>
                        <PositionTimeline position={row.open} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {compact ? (
        <div className={s.foot}>
          <Link className={s.more} href="/portfolio">
            Full ledger, performance and holdings → Portfolio
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/** A signed difference, coloured by direction and nothing else. */
function Change({ amount }: { amount: number }) {
  if (amount === 0) return <span className={s.empty}>{EMPTY}</span>;
  return (
    <span className={amount > 0 ? s.up : s.down}>
      {amount > 0 ? '+' : '−'}
      {money(Math.abs(amount))}
    </span>
  );
}

/**
 * Cost and gain, drawn to the same scale across every row.
 *
 * Not a sparkline. A sparkline needs a history, and a private position
 * marked once a quarter does not have one worth drawing.
 */
function Bar({ row, largest }: { row: PositionRow; largest: number }) {
  if (!row.live || row.value === null) {
    return <span className={s.barEmpty}>Not marked yet</span>;
  }

  const down = row.value < row.invested;
  const total = (Math.max(row.invested, row.value) / largest) * 100;
  const cost = (Math.min(row.invested, row.value) / Math.max(row.invested, row.value)) * 100;

  /* The split is a gradient stop rather than a child element, so there
     is no second shape to bleed around. See `.bar`. */
  return (
    <span
      className={s.bar}
      data-down={down}
      style={{ width: `${total}%`, ['--cost' as string]: `${cost}%` }}
    />
  );
}

/** The state, said once, the same way everywhere on the dashboard. */
function Status({ state }: { state: PositionRow['state'] }) {
  if (state === 'started') {
    return (
      <span className={`chip ${s.action_}`}>
        <FileSignature size={12} strokeWidth={1.6} aria-hidden="true" />
        Sign the documents
      </span>
    );
  }
  if (state === 'docs_signed') {
    return (
      <span className={`chip ${s.action_}`}>
        <Clock size={12} strokeWidth={1.6} aria-hidden="true" />
        Send to escrow
      </span>
    );
  }
  if (state === 'funded') {
    return (
      <span className={`chip ${s.progress}`}>
        <Hourglass size={12} strokeWidth={1.6} aria-hidden="true" />
        In escrow · awaiting close
      </span>
    );
  }
  return (
    <span className={`chip ${s.active}`}>
      <CircleCheck size={12} strokeWidth={1.6} aria-hidden="true" />
      Active
    </span>
  );
}
