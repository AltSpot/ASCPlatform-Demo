'use client';

/**
 * A word a member might stop on, made pressable.
 *
 * "Escrow", "minimum to close", "SPV", "carried interest": each is set in
 * the running text with a fine gold underline and a small mark, and a
 * press opens Spot with the definition already asked. The word stays a
 * word: it reads in the sentence as before, and only invites the
 * question (Tyler, 2026-09-17: make it obvious they can ask).
 *
 * `q` is the question Spot is asked. Use one of the canonical phrasings
 * in lib/spotbot/knowledge.ts so retrieval always lands.
 */
import { openSpot } from '@/lib/spotbot/open';

import s from './Term.module.css';

export default function Term({
  q,
  children,
  quiet = false,
}: {
  q: string;
  children: React.ReactNode;
  /** No mark, underline only: for labels and table cells. */
  quiet?: boolean;
}) {
  return (
    <button
      type="button"
      className={quiet ? `${s.term} ${s.quiet}` : s.term}
      onClick={() => openSpot(q)}
      title={`Ask Spot: ${q}`}
      aria-label={`${typeof children === 'string' ? children : 'This term'}. Ask Spot: ${q}`}
    >
      {children}
      {quiet ? null : (
        <span className={s.mark} aria-hidden="true">
          ?
        </span>
      )}
    </button>
  );
}
