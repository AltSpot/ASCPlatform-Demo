/**
 * The tape. The Monitor's numbers, running once across the top of the
 * Terminal so the page opens with movement.
 *
 * Rendered twice into one track: the animation translates the track by
 * half its width, which is exactly one set, so the loop has no seam.
 * Marked aria-hidden because every figure on it is stated properly, in
 * reading order, in the Monitor section further down the page.
 */
import type { MarketIndicator } from '@/lib/terminal/monitor';

import s from './Terminal.module.css';

export default function Tape({ indicators }: { indicators: MarketIndicator[] }) {
  if (indicators.length === 0) return null;

  const track = [...indicators, ...indicators];

  return (
    <div className={s.tape} aria-hidden="true">
      <div className={s.tapeTrack}>
        {track.map((indicator, i) => (
          <span className={s.tapeItem} key={`${indicator.id}-${i}`}>
            <span className={s.tapeLabel}>{indicator.label}</span>
            <span className={s.tapeValue}>{indicator.value}</span>
            <span className={s.tapeDelta} data-direction={indicator.direction}>
              {indicator.direction === 'down' ? '▼' : '▲'} {indicator.delta}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
