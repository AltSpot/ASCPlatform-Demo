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
 *
 * Range and layers (Tyler, 2026-09-19). A member can read the last
 * year, the last two, or the whole book, and switch the two supporting
 * layers on and off: the invested line, and the cash already paid back
 * drawn as its own band at the foot of the area, so "how much of this
 * is money I have actually received" is a shape and not a footnote.
 * Under the plot, three figures state what happened over the chosen
 * range in the member's words. The range is a window on the same
 * series: nothing is rescaled to flatter it, and the floor stays zero.
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

type Range = '1y' | '2y' | 'all';

/** Quarters shown for a range, the opening quarter included. */
const RANGE_QUARTERS: Record<Exclude<Range, 'all'>, number> = { '1y': 5, '2y': 9 };
const RANGE_LABEL: Record<Range, string> = { '1y': '1Y', '2y': '2Y', all: 'All' };
const GUIDES = [0.25, 0.5, 0.75, 1];

export default function ValueCurve({ points: all }: { points: CurvePoint[] }) {
  const [at, setAt] = useState<number | null>(null);
  const [range, setRange] = useState<Range>('all');
  const [showInvested, setShowInvested] = useState(true);
  const [showPaidBack, setShowPaidBack] = useState(true);

  if (all.length < 2) return null;

  /* A range is offered only when it would show less than everything. */
  const ranges = (['1y', '2y', 'all'] as Range[]).filter(
    (key) => key === 'all' || all.length > RANGE_QUARTERS[key],
  );
  const points = range === 'all' ? all : all.slice(-RANGE_QUARTERS[range]);
  const anyPaidBack = all.some((point) => point.distributed > 0);

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
  const floor = y(0).toFixed(1);
  const paidBackArea = `${line(points.map((p) => p.distributed))} L${W} ${floor} L0 ${floor} Z`;

  /* What happened across the window, first quarter shown to last. */
  const first = points[0];
  const last = points[points.length - 1];
  const putIn = last.paidIn - first.paidIn;
  const cameBack = last.distributed - first.distributed;
  const change = last.value + last.distributed - (first.value + first.distributed) - putIn;

  const active = at === null || at > points.length - 1 ? points.length - 1 : at;
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

        <div className={s.controls}>
          {ranges.length > 1 ? (
            <div className={s.ranges} role="group" aria-label="Range">
              {ranges.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={s.range}
                  aria-pressed={range === key}
                  onClick={() => {
                    setRange(key);
                    setAt(null);
                  }}
                >
                  {RANGE_LABEL[key]}
                </button>
              ))}
            </div>
          ) : null}

          <div className={s.keys}>
            <span className={s.key}>
              <span className={`${s.swatch} ${s.swatchValue}`} aria-hidden="true" />
              Total value
            </span>
            <button
              type="button"
              className={s.keyToggle}
              aria-pressed={showInvested}
              onClick={() => setShowInvested((on) => !on)}
            >
              <span className={`${s.swatch} ${s.swatchPaid}`} aria-hidden="true" />
              Invested
            </button>
            {anyPaidBack ? (
              <button
                type="button"
                className={s.keyToggle}
                aria-pressed={showPaidBack}
                onClick={() => setShowPaidBack((on) => !on)}
              >
                <span className={`${s.swatch} ${s.swatchBack}`} aria-hidden="true" />
                Paid back
              </button>
            ) : null}
          </div>
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

          {GUIDES.map((g) => (
            <line key={g} className={s.guide} x1="0" x2={W} y1={y(span * g)} y2={y(span * g)} />
          ))}
          <path className={s.fill} d={area} fill="url(#curve-fill)" />
          {/* Cash already received, as the foot of the area it is part of. */}
          {anyPaidBack && showPaidBack ? <path className={s.back} d={paidBackArea} /> : null}
          <path className={s.value} d={line(totals)} />
          {/* What went in. Stepped and dashed, because a contribution
              is an event on a date and not a trend. */}
          {showInvested ? <path className={s.paid} d={line(points.map((p) => p.paidIn))} /> : null}
        </svg>

        {GUIDES.map((g) => (
          <span
            key={g}
            className={s.guideLabel}
            style={{ top: `${(y(span * g) / H) * 100}%` }}
            aria-hidden="true"
          >
            {compact(span * g)}
          </span>
        ))}

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
        <span>{first.label}</span>
        {points.length > 4 ? <span>{points[Math.floor((points.length - 1) / 2)].label}</span> : null}
        <span>{last.label}</span>
      </div>

      <dl className={s.over}>
        <div className={s.overItem}>
          <dt>Change in value</dt>
          <dd data-tone={change >= 0 ? 'up' : 'down'}>
            {change >= 0 ? '+' : '−'}
            {money(Math.abs(change))}
          </dd>
        </div>
        <div className={s.overItem}>
          <dt>You put in</dt>
          <dd>{money(putIn)}</dd>
        </div>
        <div className={s.overItem}>
          <dt>Paid back to you</dt>
          <dd>{money(cameBack)}</dd>
        </div>
      </dl>
      <p className={s.overNote}>
        {first.label} to {last.label}. Change in value leaves out money you added, so a new
        position never reads as a gain.
      </p>
    </div>
  );
}
