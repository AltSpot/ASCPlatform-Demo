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
 *
 * WHAT THE DESIGN IS DOING. This was eight flat cells in a hairline
 * grid, and it read like a spreadsheet nobody had finished. Three
 * changes, none of them decoration:
 *
 *   · The disclosure score is drawn rather than stated. Five of eight is
 *     a fact about how much AltSpot was given, it is the same scale on
 *     every deal, and a row of eight marks says it faster than a
 *     sentence at the bottom of the section.
 *   · A disclosed figure and a withheld one no longer look like
 *     neighbours. One is a number on a lit card; the other is a dashed
 *     outline saying what is missing.
 *   · Each card carries its own question. "Whether existing customers
 *     grow or leak" is the reason the line exists, and on a page where
 *     someone is deciding whether to wire money, the reason should not
 *     be a footnote.
 */
import type { IndicatorValue } from '@/lib/domain';
import { disclosureScore, resolveIndicators } from '@/lib/indicators';

import Section from './Section';
import s from './Deal.module.css';

/** "$2.4M", "$2.4m " and "$2.4M ARR" are the same figure. */
function norm(value: string): string {
  return value.toLowerCase().replace(/[^0-9a-z.]/g, '');
}

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

  /* The strip under the eight cards is for what the standard set has
     no line for. A deal's own metrics arrive as one list, and the
     first cut printed all of them, so revenue, growth and margin each
     appeared twice on the same screen a few hundred pixels apart. A
     figure that is already on a card stays on the card. */
  const shown = new Set(
    resolved.filter((indicator) => indicator.disclosed).map((indicator) => norm(indicator.value)),
  );
  const rest = (extras ?? []).filter((extra) => !shown.has(norm(extra.v)));

  if (disclosed === 0 && rest.length === 0) return null;

  return (
    <Section eyebrow="By the numbers" title="The standard read." id="numbers">
      <div className={s.discHead}>
        <p className={s.sectionLede}>
          The same eight indicators on every AltSpot deal, so you can compare like
          for like. Anything we have not been given is marked as such.
        </p>

        {/* The score, drawn. One mark per indicator, lit when the
            company gave us the figure. */}
        <div className={s.disc}>
          <div className={s.discMarks} aria-hidden="true">
            {resolved.map((indicator) => (
              <span
                key={indicator.key}
                className={s.discMark}
                data-on={indicator.disclosed}
              />
            ))}
          </div>
          <span className={s.discLabel}>
            <b>{disclosed}</b> of {total} disclosed
          </span>
        </div>
      </div>

      <div className={s.indicatorGrid}>
        {resolved.map((indicator, i) => (
          <div
            key={indicator.key}
            className={
              indicator.disclosed ? s.indicator : `${s.indicator} ${s.indicatorEmpty}`
            }
            /* Staggered by position, so the set arrives as a set rather
               than eight things appearing at once. */
            style={{ ['--i' as string]: i }}
          >
            <div className={s.indicatorK}>{indicator.label}</div>
            <div className={s.indicatorV}>{indicator.value}</div>
            <div className={s.indicatorWhy}>{indicator.note ?? indicator.why}</div>
          </div>
        ))}
      </div>

      <p className={s.sourceNote}>
        Contracted figures are verified with the company. Pipeline and
        in-negotiation figures are modelled from operator averages and are not
        signed contracts.
      </p>

      {rest.length > 0 && (
        <>
          <div className={s.extrasRule} />
          <div className={s.extrasGrid}>
            {rest.map((extra) => (
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
