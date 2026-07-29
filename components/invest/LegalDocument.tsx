'use client';

/**
 * The subscription agreement, rendered as a document rather than a PDF.
 *
 * These are counsel's exact words and clause numbering, imported from the
 * .docx. What the portal adds is typography an investor can actually read
 * and the investor's own details merged into the right clauses.
 *
 * As each panel on the right is confirmed, the clauses it discharges
 * light up here. That is the whole point of the split screen: the
 * plain-language question and the operative text are visibly the same
 * agreement, not two different documents.
 */
import { useEffect, useRef } from 'react';

import { SUBSCRIPTION_AGREEMENT } from '@/lib/documents/subscription-agreement';
import { mergeRuns, type MergeValues } from '@/lib/documents/types';

import s from './LegalDocument.module.css';

export default function LegalDocument({
  values,
  confirmedPanels,
  focusPanel,
}: {
  values: Partial<MergeValues>;
  /** Panel ids the investor has confirmed. */
  confirmedPanels: number[];
  /** Scroll the matching clauses into view when this changes. */
  focusPanel?: number | null;
}) {
  const paneRef = useRef<HTMLDivElement | null>(null);
  const confirmed = new Set(confirmedPanels);

  // Bring the newly confirmed clauses into view, so the investor sees the
  // document react to what they just agreed to.
  useEffect(() => {
    if (!focusPanel || !paneRef.current) return;

    const target = paneRef.current.querySelector(`[data-panel="${focusPanel}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusPanel]);

  return (
    <div className={s.pane} ref={paneRef}>
      <header className={s.head}>
        <h4 className={s.docTitle}>{SUBSCRIPTION_AGREEMENT.title}</h4>
        <div className={s.docSub}>
          ASC Simphonic II, LLC · Class B Common Units · Managed by AltSpot Capital,
          LLC
        </div>
      </header>

      {SUBSCRIPTION_AGREEMENT.articles.map((article, articleIndex) => {
        const isExhibit = article.numeral?.startsWith('EXHIBIT');
        const isPreamble = article.numeral === null;

        return (
          <section key={`${article.numeral ?? 'pre'}-${articleIndex}`} className={s.article}>
            {!isPreamble && (
              <h5 className={isExhibit ? s.exhibitHead : s.articleHead}>
                {isExhibit ? article.title : `${article.numeral}. ${article.title}`}
              </h5>
            )}

            {article.blocks.map((block, blockIndex) => {
              const panel = block.panel ?? article.panel ?? null;
              const isDone = panel !== null && confirmed.has(panel);

              const runs = mergeRuns(block.text, values);
              const body = runs.map((run, i) =>
                run.merged ? (
                  <span
                    key={i}
                    className={run.filled ? `${s.merge} ${s.mergeFilled}` : s.merge}
                  >
                    {run.text}
                  </span>
                ) : (
                  <span key={i}>{run.text}</span>
                ),
              );

              if (block.type === 'section') {
                return (
                  <div
                    key={blockIndex}
                    data-panel={panel ?? undefined}
                    className={isDone ? `${s.clause} ${s.clauseDone}` : s.clause}
                  >
                    <span className={s.clauseN}>{block.n}</span>
                    <span className={s.clauseTitle}>{block.title}</span>
                    {isDone && <span className={s.tick}>✓ Confirmed</span>}
                  </div>
                );
              }

              if (block.mergeValue) {
                const valueRuns = mergeRuns(block.mergeValue, values);
                return (
                  <div key={blockIndex} className={s.summaryRow}>
                    <span className={s.summaryK}>{block.text}</span>
                    <span className={s.summaryV}>
                      {valueRuns.map((run, i) => (
                        <span
                          key={i}
                          className={run.filled ? `${s.merge} ${s.mergeFilled}` : s.merge}
                        >
                          {run.text}
                        </span>
                      ))}
                    </span>
                  </div>
                );
              }

              return (
                <p
                  key={blockIndex}
                  data-panel={panel ?? undefined}
                  className={
                    block.type === 'item'
                      ? isDone
                        ? `${s.item} ${s.bodyDone}`
                        : s.item
                      : isDone
                        ? `${s.body} ${s.bodyDone}`
                        : s.body
                  }
                >
                  {body}
                </p>
              );
            })}
          </section>
        );
      })}

      <p className={s.foot}>
        Rendered from the executed form of the ASC Simphonic II, LLC subscription
        agreement. Wording and clause numbering are counsel&rsquo;s. Demo environment.
      </p>
    </div>
  );
}
