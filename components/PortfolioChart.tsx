'use client';

/**
 * Portfolio value over time, with a range switcher and a readout that
 * follows the pointer.
 *
 * Still dependency-free. A charting library would be several hundred
 * kilobytes for one path, a gradient and a crosshair, and it would
 * bring its own opinions about type and colour that would then have to
 * be fought back to the design system.
 *
 * The readout is pinned above the plot rather than floating beside the
 * cursor. A tooltip that follows the mouse covers the very line you are
 * reading, and on a portfolio the number is the point.
 *
 * Keyboard reaches it too: focus the plot and the arrow keys walk the
 * series, which is the only way this is usable without a pointer.
 */
import { useCallback, useMemo, useRef, useState } from 'react';

import { money } from '@/lib/format';

import s from './PortfolioChart.module.css';

export interface PortfolioPoint {
  /** Period label, e.g. "Q3 2025". */
  label: string;
  value: number;
}

export interface PortfolioRange {
  key: string;
  label: string;
  /** How many trailing points this range shows. */
  points: number;
}

const VIEW_W = 900;
const VIEW_H = 240;
const PAD_X = 8;
const PAD_Y = 22;

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

    const coords = series.map((p, i) => {
      const x =
        PAD_X + (series.length === 1 ? 0.5 : i / (series.length - 1)) * (VIEW_W - PAD_X * 2);
      const y = VIEW_H - PAD_Y - ((p.value - lo) / (hi - lo)) * (VIEW_H - PAD_Y * 2);
      return { x, y };
    });

    const line = coords
      .map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');

    const area =
      coords.length > 0
        ? `${line} L${coords[coords.length - 1].x.toFixed(1)} ${VIEW_H} L${coords[0].x.toFixed(1)} ${VIEW_H} Z`
        : '';

    return { coords, line, area };
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
  const change = active.value - invested;
  const changePct = invested ? (change / invested) * 100 : 0;
  const live = hover !== null;

  return (
    <div className={s.wrap}>
      <div className={s.top}>
        <div className={s.readout}>
          <span className={s.readValue}>{money(active.value)}</span>
          <span className={s.readMeta}>
            <span className={change >= 0 ? s.up : s.down}>
              {change >= 0 ? '+' : '−'}
              {money(Math.abs(change))} ({change >= 0 ? '+' : '−'}
              {Math.abs(changePct).toFixed(1)}%)
            </span>
            <span className={s.readWhen}>
              {live ? active.label : `${active.label} · latest`}
            </span>
          </span>
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
            <stop offset="0" stopColor="#C79A4B" stopOpacity=".26" />
            <stop offset="1" stopColor="#C79A4B" stopOpacity="0" />
          </linearGradient>
        </defs>

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

        {/* The crosshair. Drawn only where the reader is looking. */}
        {live && (
          <line
            x1={activeCoord.x}
            y1={0}
            x2={activeCoord.x}
            y2={VIEW_H}
            stroke="rgba(243,152,7,.45)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}

        <circle
          cx={activeCoord.x}
          cy={activeCoord.y}
          r={live ? 5.5 : 4}
          fill={live ? '#FF9E2C' : '#E6C77A'}
        />
      </svg>

      <div className={s.axis} aria-hidden="true">
        <span>{series[0].label}</span>
        <span>{series[series.length - 1].label}</span>
      </div>
    </div>
  );
}
