/**
 * The Private Markets Monitor.
 *
 * Six readings, each with the shape of the last eight periods beside
 * it. The arrow says which way the number moved. It does not say
 * whether that is good, and the copy never implies it does.
 */
import type { MarketIndicator } from '@/lib/terminal/monitor';

import Sparkline from './Sparkline';
import s from './Terminal.module.css';

const ARROW: Record<MarketIndicator['direction'], string> = {
  up: '▲',
  down: '▼',
  flat: '▪',
};

export default function MonitorBoard({
  indicators,
}: {
  indicators: MarketIndicator[];
}) {
  if (indicators.length === 0) return null;

  return (
    <div className={s.monitorGrid}>
      {indicators.map((indicator) => (
        <div className={s.indicator} key={indicator.id}>
          <div className={s.indicatorLabel}>{indicator.label}</div>

          <div className={s.indicatorRow}>
            <div className={s.indicatorValue}>{indicator.value}</div>
            <div className={s.indicatorDelta} data-direction={indicator.direction}>
              {ARROW[indicator.direction]} {indicator.delta}
            </div>
          </div>

          <Sparkline series={indicator.series} className={s.spark} />

          <p className={s.indicatorNote}>{indicator.note}</p>
          <div className={s.indicatorPeriod}>{indicator.period}</div>
        </div>
      ))}
    </div>
  );
}
