'use client';

/**
 * One grouped confirmation.
 *
 * Most panels are a single affirmation covering a run of clauses. Two are
 * selections of fact — accredited investor category and benefit plan
 * investor status — and those render choice cards instead, because you
 * cannot tick a box to say which of five standards you meet.
 *
 * The panel never restates the agreement loosely. Its wording lives in
 * lib/subscription-sections.ts next to the clause references it discharges,
 * so a change to the copy and a change to the mapping happen together.
 */
import type { ReactNode } from 'react';

import styles from '@/components/invest/ConfirmPanel.module.css';
import type { SubscriptionSection } from '@/lib/subscription-sections';

interface ConfirmPanelProps {
  section: SubscriptionSection;
  index: number;
  total: number;
  confirmed: boolean;
  /** Key of the option already recorded for this section, if any. */
  chosenKey: string | null;
  onConfirm: (code: number) => void;
  /** Extra content shown above the source line, e.g. the fee table. */
  children?: ReactNode;
}

export default function ConfirmPanel({
  section,
  index,
  total,
  confirmed,
  chosenKey,
  onConfirm,
  children,
}: ConfirmPanelProps) {
  const choices = section.choices;
  const chosen = choices?.find((c) => c.key === chosenKey) ?? null;

  // A selection panel cannot be confirmed until something is selected, and
  // its own confirm code is whichever option is standing.
  const code = choices ? chosen?.code : section.code;

  return (
    <div className={confirmed ? 'card qcard confirmed' : 'card qcard'}>
      <div className="qhead">
        <h3>{section.panelTitle}</h3>
        <span className="n">
          {index} / {total}
        </span>
      </div>

      <p>{section.panelIntro}</p>

      <ul className={styles.points}>
        {section.points.map((point) => (
          <li
            key={point.lead ?? point.text.slice(0, 40)}
            className={point.lead ? `${styles.point} ${styles.leadPoint}` : styles.point}
          >
            {point.lead && <span className={styles.lead}>{point.lead}</span>}
            {point.text}
          </li>
        ))}
      </ul>

      {children && <div className={styles.extra}>{children}</div>}

      {choices && (
        <>
          <div className={styles.prompt}>{section.choicePrompt}</div>
          <div
            className={styles.choices}
            role="radiogroup"
            aria-label={section.choicePrompt}
          >
            {choices.map((choice) => (
              <div
                key={choice.key}
                className={chosenKey === choice.key ? 'choice sel' : 'choice'}
                role="radio"
                tabIndex={0}
                aria-checked={chosenKey === choice.key}
                onClick={() => onConfirm(choice.code)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onConfirm(choice.code);
                  }
                }}
              >
                <b>{choice.label}</b>
                <span>{choice.detail}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.source}>Covers {section.covers}</div>

      <button
        className="btn btn-ghost btn-block"
        onClick={() => code !== undefined && onConfirm(code)}
        disabled={confirmed || code === undefined}
      >
        {confirmed
          ? `✓ Confirmed · Article ${section.numeral}`
          : choices && !chosen
            ? 'Select one to continue'
            : `I confirm · complete Article ${section.numeral}`}
      </button>
    </div>
  );
}
