/**
 * Card — the V18 container.
 *
 * Ported from the design-system handoff (`components/Card.d.ts`).
 * `glass` is the dark-canvas default; `paper` is the white card for
 * the cream band and carries the tri-gradient top bar automatically.
 *
 * Interior order is fixed by the system: mono kicker, Borna H3,
 * then muted body.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export type CardSurface = 'glass' | 'paper';
export type CardAccent = 'neutral' | 'gold' | 'ember' | 'champagne';

const ACCENT_CLASS: Record<CardAccent, string> = {
  neutral: styles.neutral,
  gold: styles.gold,
  ember: styles.ember,
  champagne: styles.champagne,
};

type Props = {
  surface?: CardSurface;
  accent?: CardAccent;
  /** Mono index, joined with eyebrow as "01 · Label". */
  index?: string;
  eyebrow?: string;
  title?: string;
  /** Force the tri-gradient top bar. Defaults on for paper. */
  emberBar?: boolean;
  /** Adds the lift-on-hover treatment. */
  interactive?: boolean;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'>;

export function Card({
  surface = 'glass',
  accent = 'neutral',
  index,
  eyebrow,
  title,
  emberBar,
  interactive,
  children,
  className,
  ...rest
}: Props) {
  const isPaper = surface === 'paper';

  const classes = [
    styles.card,
    isPaper ? styles.paper : styles.glass,
    isPaper ? null : ACCENT_CLASS[accent],
    interactive ? styles.interactive : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const showBar = emberBar === undefined ? isPaper : emberBar;
  const kicker = eyebrow && index ? `${index} · ${eyebrow}` : (eyebrow ?? index);

  return (
    <article {...rest} className={classes}>
      {showBar ? <span className={styles.bar} aria-hidden="true" /> : null}
      {kicker ? <span className={styles.kicker}>{kicker}</span> : null}
      {title ? <h3 className={styles.title}>{title}</h3> : null}
      {children ? <div className={styles.body}>{children}</div> : null}
    </article>
  );
}
