/**
 * One series from the data room, drawn small.
 *
 * Dependency-free, like every other chart in the product. What it adds
 * over components/LineChart is a baseline that means something: these
 * sit four to a section and are read against each other, so a series
 * that starts near zero has to look like it starts near zero. A chart
 * scaled to its own minimum flatters every series equally and tells an
 * investor nothing about which one is actually moving.
 *
 *   · Counted things draw as bars. You can count the bars.
 *   · Continuous things draw as an area under a smooth line.
 *   · Percentages keep their own floor, because a margin moving from
 *     61 to 79 against a zero baseline is a flat line, and the movement
 *     is the entire point of showing it.
 *
 * No hover readout. Four of these on one section, each with its latest
 * figure already stated above it in large type, and the interaction
 * would cost more attention than it returns.
 */
import type { DealChart } from '@/lib/domain';

import s from './Deal.module.css';

const W = 320;
const H = 96;
const PAD = 4;

/** Smooth through the points without overshooting them. */
function curve(coords: { x: number; y: number }[]): string {
  if (coords.length < 2) return '';
  let d = `M${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;

  for (let i = 0; i < coords.length - 1; i += 1) {
    const before = coords[i - 1] ?? coords[i];
    const from = coords[i];
    const to = coords[i + 1];
    const after = coords[i + 2] ?? to;

    const c1x = from.x + ((to.x - before.x) / 6) * 0.7;
    const c1y = from.y + ((to.y - before.y) / 6) * 0.7;
    const c2x = to.x - ((after.x - from.x) / 6) * 0.7;
    const c2y = to.y - ((after.y - from.y) / 6) * 0.7;

    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
  }
  return d;
}

export default function MiniChart({ chart }: { chart: DealChart }) {
  const values = chart.points.map((p) => p.value);
  if (values.length < 2) return null;

  const max = Math.max(...values);
  /* A percentage keeps a floor under it; everything else is measured
     from zero, because "how much" is the question those series answer. */
  const floor = chart.unit === 'pct' ? Math.max(0, Math.min(...values) - 8) : 0;
  const span = max - floor || 1;

  const y = (value: number) => H - PAD - ((value - floor) / span) * (H - PAD * 2);

  if (chart.kind === 'bar') {
    const slot = W / values.length;
    const width = Math.min(26, slot * 0.56);

    return (
      <svg
        className={s.mini}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${chart.label}, ${chart.points[0].label} to ${chart.points[values.length - 1].label}`}
      >
        {values.map((value, i) => {
          const top = y(value);
          return (
            <rect
              key={chart.points[i].label}
              className={s.miniBar}
              x={i * slot + (slot - width) / 2}
              y={top}
              width={width}
              height={Math.max(2, H - PAD - top)}
              rx="2"
              style={{ ['--i' as string]: i }}
            />
          );
        })}
      </svg>
    );
  }

  const coords = values.map((value, i) => ({
    x: PAD + (i / (values.length - 1)) * (W - PAD * 2),
    y: y(value),
  }));

  const line = curve(coords);
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)} ${H} L${coords[0].x.toFixed(1)} ${H} Z`;
  const gradient = `asc-mini-${chart.key}`;

  return (
    <svg
      className={s.mini}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`${chart.label}, ${chart.points[0].label} to ${chart.points[values.length - 1].label}`}
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C79A4B" stopOpacity=".3" />
          <stop offset="1" stopColor="#C79A4B" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grouped so one wipe reveals the fill and its line together.
          `pathLength` used to be here for a stroke-dash draw; that
          technique is what cut the dashboard's curve short, and nothing
          reads the attribute now. */}
      <g className={s.miniReveal}>
        <path d={area} fill={`url(#${gradient})`} />
        <path
          d={line}
          fill="none"
          stroke="#C79A4B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </svg>
  );
}
