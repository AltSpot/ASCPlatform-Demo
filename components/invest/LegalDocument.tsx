'use client';

/**
 * The offering binder, rendered as documents rather than a PDF viewer.
 *
 * These are counsel's exact words, clause numbering and emphasis,
 * imported from the .docx. What the portal adds is typography an investor
 * can read and their own details merged into the right clauses.
 *
 * Three instruments share one reading surface with a tab per document,
 * because they are read together but executed differently. As each panel
 * on the right is confirmed, the clauses it discharges light up here: the
 * plain-language question and the operative text are visibly the same
 * agreement, not two different documents.
 */
import { useEffect, useRef, useState } from 'react';

import { BINDER } from '@/lib/documents/registry';
import { panelForClause } from '@/lib/documents/panel-map';
import { mergeRuns, type MergeValues, type TextRun } from '@/lib/documents/types';

import s from './LegalDocument.module.css';

const ROLE_LABEL: Record<string, string> = {
  disclosure: 'Delivered, not signed',
  executed: 'You sign this',
  counterpart: 'Joined by counterpart',
};

export default function LegalDocument({
  values,
  confirmedPanels,
  focusPanel,
}: {
  values: Partial<MergeValues>;
  confirmedPanels: number[];
  focusPanel?: number | null;
}) {
  /**
   * Open on the memorandum, which is the document counsel expects read
   * first. Confirming a panel switches to the subscription agreement,
   * since that is the instrument being executed.
   */
  const [activeSlug, setActiveSlug] = useState('ppm');
  const paneRef = useRef<HTMLDivElement | null>(null);
  const confirmed = new Set(confirmedPanels);

  const entry = BINDER.find((b) => b.slug === activeSlug) ?? BINDER[0];

  /**
   * Confirming a panel is always about the subscription agreement, so
   * switch to it before scrolling. Otherwise the document appears not to
   * react to what the investor just did.
   *
   * Adjusted during render rather than in an effect: React re-renders
   * immediately without committing the intermediate output, so the tab
   * never flashes the wrong document.
   */
  const [seenFocus, setSeenFocus] = useState(focusPanel);
  if (focusPanel !== seenFocus) {
    setSeenFocus(focusPanel);
    if (focusPanel) setActiveSlug('subscription-agreement');
  }

  useEffect(() => {
    const pane = paneRef.current;
    if (!focusPanel || !pane) return;
    if (activeSlug !== 'subscription-agreement') return;

    const target = pane.querySelector<HTMLElement>(`[data-panel="${focusPanel}"]`);
    if (!target) return;

    /**
     * Scroll the pane, not the page.
     *
     * scrollIntoView walks every scrollable ancestor including the window,
     * so it was yanking the whole page up to the document each time a
     * panel was confirmed. Setting scrollTop on the pane keeps the
     * movement where it belongs and leaves the investor's place alone.
     */
    const offset =
      target.offsetTop - pane.clientHeight / 2 + target.clientHeight / 2;

    pane.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
  }, [focusPanel, activeSlug]);

  function renderRuns(runs: TextRun[] | undefined) {
    if (!runs) return null;

    return runs.flatMap((run, runIndex) =>
      mergeRuns(run.text, values).map((piece, pieceIndex) => {
        const key = `${runIndex}-${pieceIndex}`;

        if (piece.merged) {
          return (
            <span
              key={key}
              className={piece.filled ? `${s.merge} ${s.mergeFilled}` : s.merge}
            >
              {piece.text}
            </span>
          );
        }

        // Counsel's emphasis is preserved: bold marks defined terms.
        const className = [run.b ? s.bold : '', run.i ? s.italic : '']
          .filter(Boolean)
          .join(' ');

        return (
          <span key={key} className={className || undefined}>
            {piece.text}
          </span>
        );
      }),
    );
  }

  return (
    <div className={s.wrap}>
      <nav className={s.tabs} aria-label="Offering documents">
        {BINDER.map((b) => (
          <button
            key={b.slug}
            className={b.slug === activeSlug ? `${s.tab} ${s.tabOn}` : s.tab}
            onClick={() => setActiveSlug(b.slug)}
            aria-current={b.slug === activeSlug}
          >
            {b.shortTitle}
          </button>
        ))}
      </nav>

      <div className={s.pane} ref={paneRef} key={activeSlug}>
        <header className={s.head}>
          <h4 className={s.docTitle}>{entry.document.title ?? entry.title}</h4>
          <div className={s.docSub}>
            ASC Synthera II, LLC · Managed by AltSpot Capital, LLC
          </div>
          <div className={s.roleTag}>{ROLE_LABEL[entry.role]}</div>
          <p className={s.purpose}>{entry.purpose}</p>
        </header>

        {entry.document.articles.map((article, articleIndex) => {
          const isExhibit = /^(EXHIBIT|SCHEDULE)/.test(article.numeral ?? '');
          const isPreamble = article.numeral === null;

          return (
            <section key={`${article.numeral ?? 'pre'}-${articleIndex}`} className={s.article}>
              {!isPreamble && (
                <h5 className={isExhibit ? s.exhibitHead : s.articleHead}>
                  {isExhibit ? article.title : `${article.numeral}. ${article.title}`}
                </h5>
              )}

              {article.blocks.map((block, blockIndex) => {
                const panel = panelForClause(entry.slug, block.n, article.numeral);
                const isDone = panel !== null && confirmed.has(panel);

                if (block.type === 'table') {
                  return (
                    <div className={s.tableWrap} key={blockIndex}>
                      <table className={s.table}>
                        <tbody>
                          {(block.rows ?? []).map((row, r) => (
                            <tr key={r}>
                              {row.map((cell, c) => (
                                <td key={c}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                if (block.type === 'marker') {
                  return (
                    <p key={blockIndex} className={s.marker}>
                      {renderRuns(block.runs)}
                    </p>
                  );
                }

                if (block.type === 'section') {
                  return (
                    <div
                      key={blockIndex}
                      data-panel={panel ?? undefined}
                      className={isDone ? `${s.clause} ${s.clauseDone}` : s.clause}
                    >
                      <div className={s.clauseHead}>
                        <span className={s.clauseN}>{block.n}</span>
                        <span className={s.clauseTitle}>{block.title}</span>
                        {isDone && <span className={s.tick}>✓ Confirmed</span>}
                      </div>
                      {block.runs && block.runs.length > 0 && (
                        <p className={s.body}>{renderRuns(block.runs)}</p>
                      )}
                    </div>
                  );
                }

                if (block.mergeValue) {
                  return (
                    <div key={blockIndex} className={s.summaryRow}>
                      <span className={s.summaryK}>{renderRuns(block.runs)}</span>
                      <span className={s.summaryV}>
                        {mergeRuns(block.mergeValue, values).map((piece, i) => (
                          <span
                            key={i}
                            className={
                              piece.filled ? `${s.merge} ${s.mergeFilled}` : s.merge
                            }
                          >
                            {piece.text}
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
                    {renderRuns(block.runs)}
                  </p>
                );
              })}
            </section>
          );
        })}

        <p className={s.foot}>
          Rendered from the executed form of the {entry.title} for ASC Synthera II,
          LLC. Wording, clause numbering and emphasis are counsel&rsquo;s. Version{' '}
          {entry.document.contentHash}. Demo environment.
        </p>
      </div>
    </div>
  );
}
