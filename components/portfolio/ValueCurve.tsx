'use client';

/**
 * The value curve. Total value against invested capital, by quarter.
 *
 * THIS IS THE CHART A PRIVATE BOOK IS READ ON. Two series, and the
 * relationship between them is the whole message: the filled area is
 * total value, meaning fair value plus everything already distributed,
 * and the stepped line is invested capital. Above the line is money
 * made. Below it is the J-curve, which is where a private portfolio
 * spends its first years and which no member should be surprised by.
 *
 * Marks are steps, not slopes. A private position is remarked once a
 * period and does not move between periods, so the line is drawn with
 * straight segments rather than smoothed. A curve through quarterly
 * marks invents daily prices that nobody reported, and on a page whose
 * whole job is to be honest about what is known, that is the wrong
 * flourish.
 *
 * The readout follows the pointer rather than sitting in a tooltip
 * beside it: at these sizes a floating box covers the very quarter
 * being inspected. Marker and crosshair are HTML positioned in percent
 * over the SVG, because the SVG scales with preserveAspectRatio="none"
 * and anything drawn inside it would be stretched into an ellipse.
 */
import { useState } from 'react';

import { compact, money } from '@/lib/format';

import s from './ValueCurve.module.css';

export interface CurvePoint {
  label: string;
  paidIn: number;
  value: number;
  distributed: number;
}

const W = 1000;
const H = 300;
const PAD_TOP = 16;
const PAD_BOTTOM = 10;

export default function ValueCurve({ points }: { points: CurvePoint[] }) {
  const [at, setAt] = useState<number | null>(null);

  if (points.length < 2) return null;

  const totals = points.map((point) => point.value + point.distributed);
  const top = Math.max(...totals, ...points.map((point) => point.paidIn));
  /* Zero floor. "How much" is the question this answers, and a chart
     scaled to its own minimum makes any book look like a rocket. */
  const span = top || 1;

  const x = (index: number) => (index / (points.length - 1)) * W;
  const y = (value: number) =>
    H - PAD_BOTTOM - (value / span) * (H - PAD_TOP - PAD_BOTTOM);

  const line = (values: number[]) =>
    values.map((value, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`).join(' ');

  const area = `${line(totals)} L${W} ${H} L0 ${H} Z`;

  const active = at === null ? points.length - 1 : at;
  const point = points[active];
  const total = point.value + point.distributed;
  const over = total - point.paidIn;

  return (
    <div className="card">
      <div className={s.head}>
        <div className={s.readout}>
          <span className={s.when}>{point.label}</span>
          <span className={s.total}>{money(total)}</span>
          <span className={s.against} data-up={over >= 0}>
            {over >= 0 ? '+' : '−'}
            {money(Math.abs(over))} against {money(point.paidIn)} invested
          </span>
        </div>

        <div className={s.keys}>
          <span className={s.key}>
            <span className={`${s.swatch} ${s.swatchValue}`} aria-hidden="true" />
            Total value
          </span>
          <span className={s.key}>
            <span className={`${s.swatch} ${s.swatchPaid}`} aria-hidden="true" />
            Invested
          </span>
        </div>
      </div>

      <div
        className={s.plot}
        onPointerLeave={() => setAt(null)}
        onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          if (box.width === 0) return;
          const ratio = (event.clientX - box.left) / box.width;
          setAt(
            Math.min(
              points.length - 1,
              Math.max(0, Math.round(ratio * (points.length - 1))),
            ),
          );
        }}
      >
        <svg
          className={s.svg}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Portfolio value by quarter, ${points[0].label} to ${points[points.length - 1].label}`}
        >
          <defs>
            <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--as-gold)" stopOpacity="0.34" />
              <stop offset="100%" stopColor="var(--as-gold)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <path className={s.fill} d={area} fill="url(#curve-fill)" />
          <path className={s.value} d={line(totals)} />
          {/* What went in. Stepped and dashed, because a contribution
              is an event on a date and not a trend. */}
          <path className={s.paid} d={line(points.map((p) => p.paidIn))} />
        </svg>

        <span
          className={s.cross}
          style={{ left: `${(active / (points.length - 1)) * 100}%` }}
          aria-hidden="true"
        />
        <span
          className={s.marker}
          style={{
            left: `${(active / (points.length - 1)) * 100}%`,
            top: `${(y(total) / H) * 100}%`,
          }}
          aria-hidden="true"
        />
      </div>

      <div className={s.axis}>
        <span>{points[0].label}</span>
        <span className={s.scale}>{compact(top)} top of scale</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}
