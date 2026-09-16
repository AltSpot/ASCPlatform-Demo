/**
 * Allocation on one axis, as a stacked bar plus a legend.
 *
 * A donut is the reflex here and it is the wrong reflex for this data.
 * A portfolio of two or three positions produces two or three slices,
 * and a donut spends most of its pixels on a hole while making the
 * reader estimate angles. A stacked bar puts the proportions on one
 * line and lets the legend carry the exact figures, which is what an
 * investor actually reads.
 *
 * TWO BARS, NOT ONE. The first is the allocation at cost: the decision
 * that was made. The second is the same slices at what they are worth
 * today, drawn on the same scale, so a slice that grew is visibly wider
 * than the one it started beside. One bar answers "where did I put it";
 * two answer "and what happened there", which is the question a reader
 * would otherwise have to reconstruct from the legend.
 */
import { EMPTY, money, percent } from '@/lib/format';

import s from './AllocationBreakdown.module.css';

export interface AllocationSlice {
  key: string;
  label: string;
  amount: number;
  tint: string;
  /** Positions behind this slice, for the legend's second line. */
  count: number;
  /** Marks plus cash returned for this slice, today. */
  value: number;
}

export default function AllocationBreakdown({
  slices,
  empty,
  order = 'amount',
}: {
  slices: AllocationSlice[];
  /** What to say when there is nothing to break down. */
  empty: string;
  /**
   * Biggest first is right for a categorical axis, where the question
   * is which one dominates. It is wrong for an ordered one: a run of
   * years read out of sequence stops being a timeline. 'given' keeps
   * the caller's order.
   */
  order?: 'amount' | 'given';
}) {
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);

  if (total === 0 || slices.length === 0) {
    return <p className={s.empty}>{empty}</p>;
  }

  const ordered =
    order === 'given' ? slices : [...slices].sort((a, b) => b.amount - a.amount);

  /* Both bars are measured against the larger of the two totals, so the
     "today" bar is shorter than the cost bar when the book is down and
     longer when it is up. Normalizing each to its own width would draw
     a loss and a gain identically. */
  const worth = ordered.reduce((sum, slice) => sum + slice.value, 0);
  const scale = Math.max(total, worth) || 1;

  return (
    <div className={s.wrap}>
      <div className={s.tracks}>
        <div className={s.track}>
          <span className={s.trackKey}>At cost</span>
          <div
            className={s.bar}
            role="img"
            aria-label={ordered
              .map(
                (slice) =>
                  `${slice.label} ${Math.round((slice.amount / total) * 100)} percent at cost`,
              )
              .join(', ')}
          >
            {ordered.map((slice) => (
              <span
                key={slice.key}
                className={s.seg}
                style={{
                  width: `${(slice.amount / scale) * 100}%`,
                  background: slice.tint,
                }}
              />
            ))}
          </div>
        </div>

        <div className={s.track}>
          <span className={s.trackKey}>Today</span>
          <div
            className={s.bar}
            role="img"
            aria-label={ordered
              .map((slice) => `${slice.label} worth ${money(slice.value)} today`)
              .join(', ')}
          >
            {ordered.map((slice) => (
              <span
                key={slice.key}
                className={`${s.seg} ${s.segToday}`}
                style={{
                  width: `${(slice.value / scale) * 100}%`,
                  background: slice.tint,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <ul className={s.legend}>
        {ordered.map((slice) => {
          const share = slice.amount / total;
          return (
            <li className={s.item} key={slice.key}>
              <span className={s.swatch} style={{ background: slice.tint }} />
              <span className={s.label}>{slice.label}</span>
              <span className={s.pct}>{share < 0.01 ? '<1%' : percent(share, 0)}</span>
              <span className={s.amount}>{money(slice.amount)}</span>
              <span
                className={s.multiple}
                data-up={slice.value >= slice.amount}
              >
                {slice.amount
                  ? `${(slice.value / slice.amount).toFixed(2)}×`
                  : EMPTY}
              </span>
              <span className={s.count}>
                {slice.count} position{slice.count === 1 ? '' : 's'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
