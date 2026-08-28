/**
 * Eyebrow — the V18 mono section label.
 *
 * Ported from the design-system handoff (`components/Eyebrow.d.ts`).
 * Mono 11px / +0.22em / uppercase with a 34px gold-to-signal rule.
 * Card kickers use tone="signal"; quiet labels use "champagne".
 */
import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Eyebrow.module.css';

export type EyebrowTone = 'muted' | 'signal' | 'champagne' | 'ember-soft' | 'gold';

const TONE_CLASS: Record<EyebrowTone, string> = {
  muted: styles.muted,
  signal: styles.signal,
  champagne: styles.champagne,
  'ember-soft': styles.emberSoft,
  gold: styles.gold,
};

type Props = {
  /** Drop the leading 34px rule. */
  plain?: boolean;
  /** Append the glowing live dot. */
  dot?: boolean;
  tone?: EyebrowTone;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLParagraphElement>, 'children'>;

export function Eyebrow({
  plain,
  dot,
  tone = 'muted',
  children,
  className,
  ...rest
}: Props) {
  const classes = [styles.eyebrow, TONE_CLASS[tone] ?? styles.muted, className]
    .filter(Boolean)
    .join(' ');

  return (
    <p {...rest} className={classes}>
      {plain ? null : <span className={styles.rule} aria-hidden="true" />}
      {children}
      {dot ? <span className={styles.dot} aria-hidden="true" /> : null}
    </p>
  );
}
