/**
 * A sparkline. Shape only, no axes, no labels, no tooltip.
 *
 * Deliberately not LineChart: that one is a portfolio chart with a
 * filled area and an end marker sized for a full-width card. This is
 * 42 pixels tall and lives inside a stat. Same dependency-free bet.
 *
 * The stroke is orange in both directions. Direction is stated in
 * words beside the number; colouring it green or red would turn a
 * reading into a verdict, which is not what this section does.
 */
interface SparklineProps {
  /** Oldest to newest. Two points minimum. */
  series: number[];
  className?: string;
}

const W = 120;
const H = 34;
const PAD = 3;

export default function Sparkline({ series, className }: SparklineProps) {
  if (series.length < 2) return null;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;

  const points = series.map((value, i) => {
    const x = PAD + (i / (series.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((value - min) / span) * (H - PAD * 2);
    return [x, y] as const;
  });

  const line = points
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');

  const last = points[points.length - 1];

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={line}
        fill="none"
        stroke="var(--orange)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill="var(--orange-b)" />
    </svg>
  );
}
