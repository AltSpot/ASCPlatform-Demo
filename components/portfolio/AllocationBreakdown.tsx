/**
 * Allocation on one axis, as a stacked bar plus a legend.
 *
 * A donut is the reflex here and it is the wrong reflex for this data.
 * A portfolio of two or three positions produces two or three slices,
 * and a donut spends most of its pixels on a hole while making the
 * reader estimate angles. A stacked bar puts the proportions on one
 * line and lets the legend carry the exact figures, which is what an
 * investor actually reads.
 */
import { money } from '@/lib/format';

import s from './AllocationBreakdown.module.css';

export interface AllocationSlice {
  key: string;
  label: string;
  amount: number;
  tint: string;
  /** Positions behind this slice, for the legend's second line. */
  count: number;
}

export default function AllocationBreakdown({
  slices,
  empty,
}: {
  slices: AllocationSlice[];
  /** What to say when there is nothing to break down. */
  empty: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);

  if (total === 0 || slices.length === 0) {
    return <p className={s.empty}>{empty}</p>;
  }

  const ordered = [...slices].sort((a, b) => b.amount - a.amount);

  return (
    <div className={s.wrap}>
      <div
        className={s.bar}
        role="img"
        aria-label={ordered
          .map(
            (slice) =>
              `${slice.label} ${Math.round((slice.amount / total) * 100)} percent`,
          )
          .join(', ')}
      >
        {ordered.map((slice) => (
          <span
            key={slice.key}
            className={s.seg}
            style={{
              width: `${(slice.amount / total) * 100}%`,
              background: slice.tint,
            }}
          />
        ))}
      </div>

      <ul className={s.legend}>
        {ordered.map((slice) => {
          const pct = (slice.amount / total) * 100;
          return (
            <li className={s.item} key={slice.key}>
              <span className={s.swatch} style={{ background: slice.tint }} />
              <span className={s.label}>{slice.label}</span>
              <span className={s.pct}>{pct < 1 ? '<1' : pct.toFixed(0)}%</span>
              <span className={s.amount}>{money(slice.amount)}</span>
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
