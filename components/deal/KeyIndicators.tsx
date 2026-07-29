/**
 * The standard indicator set, identical on every deal.
 *
 * The point is comparability. An investor looking at two deals reads the
 * same eight lines in the same order, so the decision is about the
 * company rather than about whose memo was better written.
 *
 * Undisclosed indicators are shown, greyed, rather than dropped. Hiding
 * a blank would let a deal look complete when it is not, and the gaps are
 * exactly what an investor should be asking us about.
 */
import type { IndicatorValue } from '@/lib/domain';
import { disclosureScore, resolveIndicators } from '@/lib/indicators';

import Section from './Section';
import s from './Deal.module.css';

export default function KeyIndicators({
  indicators,
  extras,
}: {
  indicators: Record<string, IndicatorValue>;
  /** Deal-specific figures that sit outside the standard set. */
  extras?: { k: string; v: string; note?: string }[];
}) {
  const resolved = resolveIndicators(indicators);
  const { disclosed, total } = disclosureScore(resolved);

  if (disclosed === 0 && (!extras || extras.length === 0)) return null;

  return (
    <Section eyebrow="By the numbers" title="The standard read." id="numbers">
      <p className={s.sectionLede}>
        The same eight indicators on every AltSpot deal, so you can compare like
        for like. Anything we have not been given is marked as such.
      </p>

      <div className={s.indicatorGrid}>
        {resolved.map((indicator) => (
          <div
            key={indicator.key}
            className={
              indicator.disclosed ? s.indicator : `${s.indicator} ${s.indicatorEmpty}`
            }
          >
            <div className={s.indicatorK}>{indicator.label}</div>
            <div className={s.indicatorV}>{indicator.value}</div>
            <div className={s.indicatorWhy}>{indicator.note ?? indicator.why}</div>
          </div>
        ))}
      </div>

      <p className={s.sourceNote}>
        {disclosed} of {total} standard indicators disclosed. Contracted figures are
        verified with the company. Pipeline and in-negotiation figures are modelled
        from operator averages and are not signed contracts.
      </p>

      {extras && extras.length > 0 && (
        <>
          <div className={s.extrasRule} />
          <div className={s.extrasGrid}>
            {extras.map((extra) => (
              <div key={extra.k} className={s.extra}>
                <div className={s.indicatorK}>{extra.k}</div>
                <div className={s.extraV}>{extra.v}</div>
                {extra.note && <div className={s.indicatorWhy}>{extra.note}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}
