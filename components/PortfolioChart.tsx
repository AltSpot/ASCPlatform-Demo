'use client';

/**
 * The dashboard hero: what the member's investments are worth, and the
 * curve that got there.
 *
 * ONE FIGURE AND ONE SENTENCE. The figure is total value, which is the
 * number a member actually wants; the sentence says what it is up or
 * down and against what. Both follow the pointer across the plot, so
 * hovering a quarter rewrites the sentence for that quarter rather than
 * floating a tooltip over the line. The words are the member's, not an
 * administrator's: "you put in", not "cost basis". The vocabulary lives
 * on Portfolio, where it is the point.
 *
 * Still dependency-free. A charting library would be several hundred
 * kilobytes for one path, a gradient and a crosshair, and it would
 * bring its own opinions about type and color that would then have to
 * be fought back to the design system.
 *
 * The readout is pinned above the plot rather than floating beside the
 * cursor. A tooltip that follows the mouse covers the very line you are
 * reading, and on a portfolio the number is the point.
 *
 * Keyboard reaches it too: focus the plot and the arrow keys walk the
 * series, which is the only way this is usable without a pointer.
 *
 * TWO THINGS THE MARKER GETS RIGHT THAT AN SVG CIRCLE CANNOT HERE.
 * The plot is drawn with `preserveAspectRatio="none"`, which is what
 * lets one 900x240 viewBox stretch to any card width without
 * recomputing the geometry. It also stretches everything inside it, so
 * a `<circle>` on this plot was drawn as an ellipse, wider on a wide
 * card, and it changed shape as the window resized. The marker and the
 * crosshair are therefore HTML positioned in percentages over the plot:
 * a circle stays a circle, and because they are elements rather than
 * SVG attributes they can be transitioned, so the marker glides
 * between quarters instead of teleporting.
 */
import { useCallback, useMemo, useRef, useState } from 'react';

import { compact, money, percent } from '@/lib/format';

import s from './PortfolioChart.module.css';

export interface PortfolioPoint {
  /** Period label, e.g. "Q3 2025". */
  label: string;
  value: number;
  /**
   * Cumulative contributions as of this period. The change readout is
   * measured against this rather than against today's cost basis: the
   * series reaches back to quarters when less had been paid in, and
   * comparing an old value to a current basis reports a loss for every
   * quarter before the most recent commitment.
   */
  paidIn?: number;
}

export interface PortfolioRange {
  key: string;
  label: string;
  /** How many trailing points this range shows. */
  points: number;
}

const VIEW_W = 900;
const VIEW_H = 240;
/* Enough room at both ends that the end marker and its halo sit inside
   the plot rather than half off it. */
const PAD_X = 18;
const PAD_Y = 22;

/**
 * How much the curve is allowed to round off its corners.
 *
 * Catmull-Rom through the points, converted to cubics. Zero is the old
 * polyline. One overshoots on a sharp reversal and invents a quarter
 * that never happened, which on a portfolio is not a cosmetic problem.
 * Three quarters is round to the eye and stays inside the data.
 */
const TENSION = 0.75;

interface Coord {
  x: number;
  y: number;
}

/** A smooth path through every point, without passing outside them. */
function curve(coords: Coord[]): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M${coords[0].x} ${coords[0].y}`;

  let d = `M${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;

  for (let i = 0; i < coords.length - 1; i += 1) {
    const before = coords[i - 1] ?? coords[i];
    const from = coords[i];
    const to = coords[i + 1];
    const after = coords[i + 2] ?? to;

    const c1x = from.x + ((to.x - before.x) / 6) * TENSION;
    const c1y = from.y + ((to.y - before.y) / 6) * TENSION;
    const c2x = to.x - ((after.x - from.x) / 6) * TENSION;
    const c2y = to.y - ((after.y - from.y) / 6) * TENSION;

    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
  }

  return d;
}

/**
 * Round values for the horizontal gridlines: two to four of them, on
 * the kind of numbers a person would pick. The chart used to carry no
 * scale at all beyond a "top of scale" note, and a curve with no scale
 * is a shape, not a figure.
 */
function ticks(lo: number, hi: number): number[] {
  const span = hi - lo;
  if (span <= 0) return [];
  const magnitude = 10 ** Math.floor(Math.log10(span / 3));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((st) => span / st <= 4) ??
    magnitude * 10;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(v);
  return out;
}

export default function PortfolioChart({
  points,
  ranges,
  invested,
}: {
  points: PortfolioPoint[];
  ranges: PortfolioRange[];
  /** Cost basis, so the readout can state the change rather than only the level. */
  invested: number;
}) {
  const [rangeKey, setRangeKey] = useState(ranges[ranges.length - 1]?.key ?? '');
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const range = ranges.find((r) => r.key === rangeKey) ?? ranges[ranges.length - 1];

  const series = useMemo(
    () => points.slice(Math.max(0, points.length - (range?.points ?? points.length))),
    [points, range],
  );

  const geometry = useMemo(() => {
    const values = series.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    /* Pad the band so a flat series does not draw along the floor and a
       peak does not touch the ceiling. */
    const span = max - min || Math.max(1, max * 0.1);
    const lo = min - span * 0.12;
    const hi = max + span * 0.12;

    const coords: Coord[] = series.map((p, i) => {
      const x =
        PAD_X + (series.length === 1 ? 0.5 : i / (series.length - 1)) * (VIEW_W - PAD_X * 2);
      const y = VIEW_H - PAD_Y - ((p.value - lo) / (hi - lo)) * (VIEW_H - PAD_Y * 2);
      return { x, y };
    });

    const line = curve(coords);
    const grid = ticks(lo, hi).map((value) => ({
      value,
      y: VIEW_H - PAD_Y - ((value - lo) / (hi - lo)) * (VIEW_H - PAD_Y * 2),
    }));

    const area =
      coords.length > 0
        ? `${line} L${coords[coords.length - 1].x.toFixed(1)} ${VIEW_H} L${coords[0].x.toFixed(1)} ${VIEW_H} Z`
        : '';

    return { coords, line, area, grid };
  }, [series]);

  /** Nearest point to a client x position. */
  const pick = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg || series.length === 0) return;

      const box = svg.getBoundingClientRect();
      if (box.width === 0) return;

      const ratio = (clientX - box.left) / box.width;
      const index = Math.round(ratio * (series.length - 1));
      setHover(Math.min(series.length - 1, Math.max(0, index)));
    },
    [series.length],
  );

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setHover((current) => {
      const from = current ?? series.length - 1;
      const next = event.key === 'ArrowLeft' ? from - 1 : from + 1;
      return Math.min(series.length - 1, Math.max(0, next));
    });
  }

  if (series.length < 2) return null;

  const activeIndex = hover ?? series.length - 1;
  const active = series[activeIndex];
  const activeCoord = geometry.coords[activeIndex];
  const basis = active.paidIn ?? invested;
  const change = active.value - basis;
  const changeRatio = basis ? change / basis : 0;
  const live = hover !== null;

  /* Percentages, because the viewBox maps linearly onto the box: the
     same fraction of the viewBox is the same fraction of the card. */
  const markerLeft = `${(activeCoord.x / VIEW_W) * 100}%`;
  const markerTop = `${(activeCoord.y / VIEW_H) * 100}%`;

  return (
    <div className={s.wrap}>
      <div className={s.top}>
        <div className={s.readout}>
          <span className="eyebrow">
            {live ? `Worth in ${active.label}` : 'Your investments are worth'}
          </span>
          <span className={s.readValue}>{money(active.value)}</span>
          <p className={s.readLine}>
            {change === 0 ? (
              <>level with the {money(basis)} you put in</>
            ) : (
              <>
                <span className={change > 0 ? s.up : s.down}>
                  {change > 0 ? 'up' : 'down'} {money(Math.abs(change))} (
                  {percent(changeRatio, 1, { signed: true })})
                </span>{' '}
                on {money(basis)} you {live ? 'had put in by then' : 'put in'}
              </>
            )}
          </p>
        </div>

        <div className={s.ranges} role="group" aria-label="Chart range">
          {ranges.map((r) => (
            <button
              key={r.key}
              type="button"
              className={r.key === range?.key ? `${s.range} ${s.rangeOn}` : s.range}
              aria-pressed={r.key === range?.key}
              onClick={() => {
                setRangeKey(r.key);
                setHover(null);
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className={s.plotWrap}>
        {/* The scale, in a gutter beside the plot. HTML rather than SVG
            text so the aspect override cannot stretch the digits. */}
        <div className={s.scale} aria-hidden="true">
          {geometry.grid.map((g) => (
            <span
              key={g.value}
              className={s.scaleLabel}
              style={{ top: `${(g.y / VIEW_H) * 100}%` }}
            >
              {compact(g.value)}
            </span>
          ))}
        </div>

        <div className={s.plotArea}>
          <svg
            ref={svgRef}
            className={s.plot}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            role="img"
            tabIndex={0}
            aria-label={`Portfolio value, ${range?.label ?? ''}. ${active.label}: ${money(active.value)}. Use the arrow keys to step through the series.`}
            onPointerMove={(e) => pick(e.clientX)}
            onPointerDown={(e) => pick(e.clientX)}
            onPointerLeave={() => setHover(null)}
            onKeyDown={onKeyDown}
            onBlur={() => setHover(null)}
          >
            <defs>
              <linearGradient id="asc-portfolio-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#C79A4B" stopOpacity=".24" />
                <stop offset="1" stopColor="#C79A4B" stopOpacity="0" />
              </linearGradient>
            </defs>

            {geometry.grid.map((g) => (
              <line
                key={g.value}
                className={s.gridline}
                x1={0}
                x2={VIEW_W}
                y1={g.y.toFixed(1)}
                y2={g.y.toFixed(1)}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Keyed on the range so switching redraws rather than
                cross-fading two different shapes on top of each other.
                The wipe lives here rather than on the <svg> so that
                remounting replays it, without blurring a plot a keyboard
                user is stepping through. */}
            <g className={s.reveal} key={range?.key ?? 'all'}>
              <path d={geometry.area} fill="url(#asc-portfolio-fill)" />
              <path
                d={geometry.line}
                fill="none"
                stroke="#C79A4B"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </svg>

          {/* Both of these glide, because both are elements with a
              transition rather than attributes on a redrawn shape. */}
          <span
            className={s.cross}
            data-live={live}
            style={{ left: markerLeft }}
            aria-hidden="true"
          />
          <span
            className={s.marker}
            data-live={live}
            style={{ left: markerLeft, top: markerTop }}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className={s.axis} aria-hidden="true">
        <span>{series[0].label}</span>
        <span>{series[series.length - 1].label}</span>
      </div>
    </div>
  );
}
