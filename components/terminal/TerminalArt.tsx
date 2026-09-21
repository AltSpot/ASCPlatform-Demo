/**
 * A thumbnail for a Terminal piece, drawn rather than photographed.
 *
 * The library's tiles were flat gradients, which read as placeholders. No
 * stock photography and no new dependency: each piece gets an illustration
 * generated from its slug, so the same piece always wears the same image
 * and no two look alike. Three motifs, by what the piece is:
 *
 *   article   stacked sheets and a drawn underline: something written
 *   report    a chart: bars, a rising line, an axis
 *   podcast   a waveform round a play mark
 *
 * All in the editorial palette (bronze, ember, warm grey over the piece's
 * own gradient), with a soft light top left and a grain, so a grid of
 * them reads as one art direction. DEMO SEAM in spirit: real pieces bring
 * real art, and `art` on the item is where a real image URL would go.
 * Pure SVG, server or client.
 */
import type { LibraryKind } from '@/lib/terminal/library';

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

/** A small deterministic generator, so one slug always draws one picture. */
function rng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* Champagne, gold and bronze, and one signal orange for a headline bar.
   The second orange went (2026-09-21): two hot inks in a small picture
   read as a sticker. */
const INKS = ['#F3E8BC', '#E6C77A', '#C79A4B', '#D9B56A', '#F39807'];

export default function TerminalArt({
  slug,
  kind,
  art,
  className,
  children,
}: {
  slug: string;
  kind: LibraryKind | 'wire';
  /** The piece's own gradient, kept as the ground. */
  art?: string;
  className?: string;
  /** Anything laid over the picture: a kicker, a label. */
  children?: React.ReactNode;
}) {
  const next = rng(hash(slug));
  const ink = INKS[Math.floor(next() * INKS.length)];
  const ink2 = INKS[Math.floor(next() * INKS.length)];
  const id = `ta-${hash(slug).toString(36)}`;

  let motif: React.ReactNode;

  if (kind === 'report') {
    const bars = Array.from({ length: 9 }, (_, i) => 22 + next() * 58 + i * 5);
    const line = bars.map((b, i) => `${28 + i * 30},${150 - b * 0.9 - next() * 14}`).join(' ');
    motif = (
      <>
        <line x1="20" y1="156" x2="300" y2="156" stroke={ink} strokeOpacity=".35" strokeWidth="1" />
        {bars.map((b, i) => (
          <rect key={i} x={18 + i * 30} y={156 - b} width="18" height={b} rx="3" fill={`url(#${id}-bar)`} opacity={0.35 + i * 0.06} />
        ))}
        <polyline points={line} fill="none" stroke={ink2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {line.split(' ').slice(-1).map((pt) => {
          const [x, y] = pt.split(',').map(Number);
          return <circle key={pt} cx={x} cy={y} r="5" fill={ink2} />;
        })}
      </>
    );
  } else if (kind === 'podcast') {
    const waves = Array.from({ length: 34 }, () => 8 + next() * 62);
    motif = (
      <>
        {waves.map((h, i) => (
          <rect key={i} x={20 + i * 8.3} y={90 - h / 2} width="4" height={h} rx="2" fill={i % 5 === 0 ? ink2 : ink} opacity={0.3 + (i / waves.length) * 0.6} />
        ))}
        <circle cx="160" cy="90" r="27" fill="rgba(10,8,6,.62)" stroke={ink} strokeOpacity=".7" strokeWidth="1.5" />
        <path d="M152 77 L175 90 L152 103 Z" fill={ink} />
      </>
    );
  } else if (kind === 'wire') {
    const rows = Array.from({ length: 5 }, () => 80 + next() * 170);
    motif = (
      <>
        {rows.map((w, i) => (
          <rect key={i} x="24" y={40 + i * 24} width={w} height={i === 0 ? 10 : 6} rx="3" fill={i === 0 ? ink2 : ink} opacity={i === 0 ? 0.85 : 0.32} />
        ))}
        <circle cx="286" cy="38" r="6" fill="#3DEB8A" />
      </>
    );
  } else {
    const tilt = -8 + next() * 16;
    const lines = Array.from({ length: 6 }, () => 70 + next() * 110);
    motif = (
      <g transform={`rotate(${tilt.toFixed(1)} 160 90)`}>
        <rect x="92" y="22" width="150" height="138" rx="10" fill="rgba(10,8,6,.34)" transform="translate(14 10)" />
        <rect x="92" y="22" width="150" height="138" rx="10" fill="rgba(246,242,233,.10)" stroke={ink} strokeOpacity=".5" strokeWidth="1.2" />
        <rect x="108" y="42" width="78" height="9" rx="4.5" fill={ink2} opacity=".9" />
        {lines.map((w, i) => (
          <rect key={i} x="108" y={64 + i * 14} width={Math.min(118, w)} height="4.5" rx="2.25" fill={ink} opacity=".38" />
        ))}
        <path d={`M108 ${150} q 20 -10 40 0 t 40 0`} fill="none" stroke={ink2} strokeWidth="2.2" strokeLinecap="round" />
      </g>
    );
  }

  return (
    <span className={className} style={{ position: 'relative', display: 'block', background: art, overflow: 'hidden' }}>
      <svg
        viewBox="0 0 320 180"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, display: 'block' }}
      >
        <defs>
          <radialGradient id={`${id}-light`} cx="18%" cy="8%" r="80%">
            <stop offset="0" stopColor="#FFF3D6" stopOpacity=".26" />
            <stop offset="1" stopColor="#FFF3D6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-bar`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={ink2} />
            <stop offset="1" stopColor={ink} stopOpacity=".5" />
          </linearGradient>
          <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset=".55" stopColor="#0A0806" stopOpacity="0" />
            <stop offset="1" stopColor="#0A0806" stopOpacity=".55" />
          </linearGradient>
        </defs>
        <rect width="320" height="180" fill={`url(#${id}-light)`} />
        {/* Drawn at three quarters, with air round it: an illustration that
            fills its frame edge to edge reads as clip art. */}
        <g transform="translate(160 90) scale(0.74) translate(-160 -90)" opacity="0.9">
          {motif}
        </g>
        <rect width="320" height="180" fill={`url(#${id}-shade)`} />
      </svg>
      {children}
    </span>
  );
}
