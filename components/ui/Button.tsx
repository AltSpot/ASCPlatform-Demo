'use client';

/**
 * Button — the V18 pill action primitive.
 *
 * Ported from the AltSpot Capital design-system handoff
 * (`components/Button.d.ts`). The API contract is the handoff's;
 * the implementation is this repo's (CSS modules, not inline styles).
 *
 * Variants: primary (the one gradient, ink text) · ghost (hairline pill)
 * · quiet (mono champagne link) · ghost-light (paper surface).
 * Renders an <a> when given href. Legacy V17 variant names alias on.
 */
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'ghost' | 'quiet' | 'ghost-light';
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Legacy V17 names the handoff still expects to resolve. */
const ALIASES: Record<string, ButtonVariant> = {
  'gold-grad': 'primary',
  ember: 'primary',
  gold: 'primary',
  orange: 'primary',
  ink: 'primary',
  'ghost-dark': 'ghost',
  'outline-gold': 'ghost',
  'outline-orange': 'ghost',
  'outline-ink': 'ghost-light',
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.primary,
  ghost: styles.ghost,
  quiet: styles.quiet,
  'ghost-light': styles.ghostLight,
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

type Common = {
  variant?: ButtonVariant | string;
  size?: ButtonSize;
  /** Trailing arrow. Defaults on for primary and quiet. */
  arrow?: boolean;
  /** Full-width, for form submits. */
  block?: boolean;
  children?: ReactNode;
};

type Props = Common &
  (({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) |
    ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>));

export function Button({
  variant = 'primary',
  size = 'md',
  arrow,
  block,
  children,
  ...rest
}: Props) {
  const resolved: ButtonVariant =
    variant in VARIANT_CLASS
      ? (variant as ButtonVariant)
      : (ALIASES[variant as string] ?? 'primary');

  const isQuiet = resolved === 'quiet';
  const showArrow = arrow === undefined ? isQuiet || resolved === 'primary' : arrow;

  const className = [
    styles.btn,
    VARIANT_CLASS[resolved],
    isQuiet ? null : SIZE_CLASS[size],
    block ? styles.block : null,
    (rest as { className?: string }).className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {children}
      {showArrow ? <span className={styles.arrow}>&rarr;</span> : null}
    </>
  );

  if ('href' in rest && rest.href !== undefined) {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a {...anchorProps} className={className}>
        {content}
      </a>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button {...buttonProps} className={className}>
      {content}
    </button>
  );
}
