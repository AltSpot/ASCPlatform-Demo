'use client';

/**
 * "Still want to know more? Ask Spot." The line at the foot of a How it
 * works panel, a quick look, or any card that has said its piece. One
 * press opens Spot with the question already asked, on the page the
 * member is standing on. Spot answers from the platform guide and
 * explains, never advises, whatever it is handed.
 */
import { openSpot } from '@/lib/spotbot/open';

import s from './AskSpot.module.css';

export default function AskSpot({
  question,
  lead = 'Still want to know more?',
  label = 'Ask Spot',
  compact = false,
}: {
  /** What Spot is asked on opening. Omit to open it with nothing typed. */
  question?: string;
  lead?: string;
  label?: string;
  /** The one-line edition, for a footer or a row. */
  compact?: boolean;
}) {
  return (
    <div className={compact ? `${s.ask} ${s.compact}` : s.ask}>
      <span className={`orb ${s.orb}`} aria-hidden="true" />
      <span className={s.lead}>{lead}</span>
      <button type="button" className={s.button} onClick={() => openSpot(question)}>
        {label}
        <span className={s.arrow} aria-hidden="true">
          →
        </span>
      </button>
    </div>
  );
}
