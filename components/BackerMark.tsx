/**
 * A firm's mark and name, as one line.
 *
 * Drawn inline so it takes currentColor: on the artwork band of a shelf
 * card it is the on-media white, on glass it is the page ink. The
 * firms are invented (lib/backers.ts), and when real ones are named
 * the glyph becomes their supplied mark without the callers changing.
 *
 * No 'use client': nothing here holds state.
 */
import { BACKERS, backingLabel, type Backing, type BackerGlyph } from '@/lib/backers';

import s from './BackerMark.module.css';

const GLYPH: Record<BackerGlyph, string> = {
  triangle: 'M6 1.5 11 10.5H1Z',
  diamond: 'M6 1 11 6 6 11 1 6Z',
  chevron: 'M1.5 8.5 6 3l4.5 5.5-1.6 1.3L6 5.8 3.1 9.8Z',
  ring: 'M6 1.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Zm0 2a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8Z',
  peak: 'M1 10.5 4.6 3l2 3.4L8 4.5l3 6Z',
  square: 'M2 2h8v8H2Z',
};

export default function BackerMark({
  backing,
  /** Print the role before the name ("Led by"). Off for a bare mark. */
  withLabel = true,
  className,
}: {
  backing: Backing;
  withLabel?: boolean;
  className?: string;
}) {
  const firm = BACKERS[backing.firm];
  return (
    <span className={className ? `${s.mark} ${className}` : s.mark}>
      {withLabel ? <span className={s.label}>{backingLabel(backing.role)}</span> : null}
      <svg
        className={s.glyph}
        viewBox="0 0 12 12"
        width="11"
        height="11"
        aria-hidden="true"
        focusable="false"
      >
        <path d={GLYPH[firm.glyph]} fill="currentColor" />
      </svg>
      <span className={s.name}>{firm.name}</span>
    </span>
  );
}
