/**
 * Minimal SVG line chart — deliberately dependency-free.
 *
 * A charting library would be several hundred kilobytes for what is one
 * path and a gradient. The gradient id is scoped per-instance so two
 * charts on one page cannot collide.
 */
interface LineChartProps {
  series: number[];
  width?: number;
  height?: number;
  /** Unique per page; used to scope the gradient definition. */
  id?: string;
}

export default function LineChart({
  series,
  width = 640,
  height = 200,
  id = 'chart',
}: LineChartProps) {
  if (series.length < 2) return null;

  const pad = 16;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;

  const points = series.map((value, i) => {
    const x = pad + (i / (series.length - 1)) * (width - pad * 2);
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');

  const first = points[0];
  const last = points[points.length - 1];
  const area = `${line} L${last[0].toFixed(1)} ${height - pad} L${first[0].toFixed(1)} ${height - pad} Z`;

  const gradientId = `asc-chart-fill-${id}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="Trend chart"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C9A14A" stopOpacity=".28" />
          <stop offset="1" stopColor="#C9A14A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="#C9A14A"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="4" fill="#E8C97E" />
    </svg>
  );
}
