/**
 * The trend section: every series the data room gave us.
 *
 * It was one chart, contracted ARR, which is the figure a company most
 * wants shown and the least useful one on its own. Revenue rising while
 * margin holds is a different company from revenue rising while margin
 * slips, and revenue rising with a flat customer count is a different
 * one again. Four series let a reader do that comparison in one glance
 * instead of taking the company's word for the shape of the business.
 *
 * Each card states the latest figure, the change across the window, the
 * period it covers and the artefact it came from. The last of those is
 * the one that matters most: a chart with no source is decoration, and
 * on a page where someone is deciding whether to wire money it is worse
 * than decoration.
 *
 * A deal with no charts renders nothing. That is the honest state for
 * every secondary on the shelf: AltSpot is buying existing shares from
 * a holder, there is no company data room behind it, and a drawn line
 * would be an invention.
 */
import type { DealChart } from '@/lib/domain';

import MiniChart from './MiniChart';
import Section from './Section';
import s from './Deal.module.css';

/** The figure as an investor would say it out loud. */
function format(value: number, unit: DealChart['unit']): string {
  switch (unit) {
    case 'usd':
      return `$${value.toLocaleString('en-US')}`;
    case 'usd-k':
      return value >= 1000
        ? `$${(value / 1000).toFixed(1).replace(/\.0$/, '')}M`
        : `$${value}K`;
    case 'usd-m':
      return `$${value}M`;
    case 'pct':
      return `${value}%`;
    default:
      return String(value);
  }
}

/**
 * How far it moved across the window.
 *
 * A multiple for anything counted from zero, because that is how these
 * are discussed: revenue went up sixteen times, not up 1,500 percent.
 * Percentages move in points, since a margin going from 61 to 79 has
 * gained 18 points and multiplying it would be nonsense.
 */
function change(chart: DealChart): string | null {
  const first = chart.points[0]?.value;
  const last = chart.points[chart.points.length - 1]?.value;
  if (first === undefined || last === undefined || first === 0) return null;

  if (chart.unit === 'pct') {
    const delta = Math.round(last - first);
    return delta === 0 ? null : `${delta > 0 ? '+' : '−'}${Math.abs(delta)} pts`;
  }

  const multiple = last / first;
  if (multiple < 1.05) return null;
  return `${multiple >= 10 ? Math.round(multiple) : multiple.toFixed(1).replace(/\.0$/, '')}×`;
}

export default function DealCharts({ charts }: { charts: DealChart[] }) {
  const drawable = charts.filter((chart) => chart.points.length > 1);
  if (drawable.length === 0) return null;

  return (
    <Section
      eyebrow="The trend"
      title="What the data room shows."
      lede="Four series from the same eight quarters, so they can be read against each other. Every figure ties to the schedule it came from."
      id="trend"
    >
      {/* The count drives the columns. auto-fit alone put four series
          three across and left the fourth alone beside an empty half of
          the section, which reads as a missing chart rather than as a
          layout. Four is the common case and it wants two by two. */}
      <div className={s.chartGrid} data-count={drawable.length}>
        {drawable.map((chart, i) => {
          const last = chart.points[chart.points.length - 1];
          const moved = change(chart);

          return (
            <figure key={chart.key} className={s.chartCard} style={{ ['--i' as string]: i }}>
              <figcaption className={s.chartHead}>
                <span className={s.chartLabel}>{chart.label}</span>
                <span className={s.chartNow}>
                  <b>{format(last.value, chart.unit)}</b>
                  {moved ? <span className={s.chartMove}>{moved}</span> : null}
                </span>
              </figcaption>

              <MiniChart chart={chart} />

              <div className={s.chartAxis} aria-hidden="true">
                <span>{chart.points[0].label}</span>
                <span>{last.label}</span>
              </div>

              <p className={s.chartCaption}>{chart.caption}</p>
              <p className={s.chartSource}>{chart.source}</p>
            </figure>
          );
        })}
      </div>
    </Section>
  );
}
