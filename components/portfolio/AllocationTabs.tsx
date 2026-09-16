'use client';

/**
 * Allocation, on whichever axis the investor is asking about.
 *
 * Three axes, one bar. They were two side-by-side panels, which forces
 * a reader to compare two charts at half width and offers no way to ask
 * the third question at all. Asset class, industry and vintage are the
 * same money sliced three ways, so they belong in one place with a
 * control, at full width, where the slices are actually legible.
 *
 * Vintage is the one that was missing and the one a private book is
 * most often judged on. Two strong years and one bad one is a different
 * portfolio from three average ones, and only the year the money went
 * in shows that.
 */
import { useState } from 'react';

import AllocationBreakdown, { type AllocationSlice } from './AllocationBreakdown';
import { money } from '@/lib/format';

import s from './AllocationTabs.module.css';

export interface AllocationAxis {
  key: string;
  label: string;
  slices: AllocationSlice[];
  /** 'given' for an axis whose own order carries meaning, like years. */
  order?: 'amount' | 'given';
}

export default function AllocationTabs({
  axes,
  total,
}: {
  axes: AllocationAxis[];
  /** Cost basis, so the header can state what is being divided. */
  total: number;
}) {
  const [axisKey, setAxisKey] = useState(axes[0]?.key ?? '');
  const axis = axes.find((a) => a.key === axisKey) ?? axes[0];

  if (!axis) return null;

  return (
    <div className="card">
      <div className={s.head}>
        <div className={s.tabs} role="group" aria-label="Break allocation down by">
          {axes.map((option) => (
            <button
              key={option.key}
              type="button"
              className={s.tab}
              aria-pressed={option.key === axis.key}
              onClick={() => setAxisKey(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <span className={s.total}>{money(total)} at cost</span>
      </div>

      <AllocationBreakdown
        slices={axis.slices}
        order={axis.order}
        empty="Nothing held yet. Exposure appears here after your first investment funds."
      />
    </div>
  );
}
