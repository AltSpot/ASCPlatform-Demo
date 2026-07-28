/**
 * The numbers that make the case, in one hairline grid.
 *
 * Thin deals carry three metrics and the lead deal carries eight, so
 * the band auto-fits rather than assuming a column count.
 */
import type { DealMetric } from '@/lib/domain';

import s from './Deal.module.css';

export default function StatBand({ metrics }: { metrics: DealMetric[] }) {
  if (metrics.length === 0) return null;

  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <div className={s.eyebrow}>By the numbers</div>
      </div>

      <div className={s.statBand}>
        {metrics.map((metric) => (
          <div className={s.statCell} key={metric.k}>
            <div className={s.statK}>{metric.k}</div>
            <div className={s.statV}>{metric.v}</div>
            {metric.note && <div className={s.statNote}>{metric.note}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
