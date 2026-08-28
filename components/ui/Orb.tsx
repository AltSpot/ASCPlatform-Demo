/**
 * Orb — the AltSpot brand glyph.
 *
 * Ported from the design-system handoff (`components/Orb.d.ts`).
 * Three canonical constructions: metal (the default gold glyph),
 * signal (the hot variant), period (the two-layer wordmark period).
 *
 * Size is the one genuinely dynamic value, so it stays an inline
 * style; everything else is a token in Orb.module.css.
 */
import type { HTMLAttributes } from 'react';
import styles from './Orb.module.css';

export type OrbVariant = 'metal' | 'signal' | 'period';

const VARIANT_CLASS: Record<OrbVariant, string> = {
  metal: styles.metal,
  signal: styles.signal,
  period: styles.period,
};

type Props = {
  /** px number or any CSS length. */
  size?: number | string;
  variant?: OrbVariant;
  /** Warm glow. On by default. */
  glow?: boolean;
  /** Slow opacity breathe loop. Honors prefers-reduced-motion. */
  breathe?: boolean;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;

export function Orb({
  size = 40,
  variant = 'metal',
  glow = true,
  breathe,
  className,
  style,
  ...rest
}: Props) {
  const px = typeof size === 'number' ? `${size}px` : size;

  const classes = [
    styles.orb,
    VARIANT_CLASS[variant] ?? styles.metal,
    glow ? styles.glow : null,
    breathe ? styles.breathe : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      {...rest}
      aria-hidden="true"
      className={classes}
      style={{ width: px, height: px, ...style }}
    />
  );
}
