/**
 * A company's logo, as the company would set it (Tyler, 2026-09-19).
 *
 * DEMO SEAM in spirit: the identities are invented (lib/brand-hues.json)
 * and a real company brings its own artwork, at which point this renders
 * that image and nothing else.
 *
 * The square mark (components/CompanyMark) is for rows and tables. This is
 * the LOCKUP, for a card's art band and a deal's hero, and it is what
 * stops thirty companies looking like thirty skins of one icon: some are
 * a word alone in a typeface of their own, some a symbol beside a word,
 * some a symbol over small capitals, some only a symbol. The typefaces
 * are system stacks on purpose; a logo is the one thing on the platform
 * that must not be set in the platform's type.
 *
 * The values arrive as custom properties and the stylesheet applies them,
 * so nothing here paints colour or type inline. Decorative: the company's
 * name is always printed beside it as text. No hooks; server or client.
 */
import { LOGO_FONTS, LOGO_PAPER, bandInk, bandIsLight, brandOf } from '@/lib/brand';

import s from './CompanyLogo.module.css';

export default function CompanyLogo({
  slug,
  logoUrl,
  scale = 1,
  className,
}: {
  slug: string;
  logoUrl: string | null | undefined;
  /** 1 is a marketplace card's band. A carousel tile is smaller, a hero larger. */
  scale?: number;
  className?: string;
}) {
  const brand = brandOf(slug);
  const logo = brand?.logo;
  if (!logoUrl && !logo) return null;

  /* Keyed the way every per-instance property on the platform is, which is
     also how tests/theme.test.ts learns the stylesheet may read them. */
  const vars: React.CSSProperties = {
    ['--logo-scale' as string]: scale,
    ...(logo
      ? {
          ['--logo-font' as string]: LOGO_FONTS[logo.font],
          ['--logo-weight' as string]: logo.weight,
          ['--logo-tracking' as string]: `${logo.tracking}em`,
          ['--logo-size' as string]: `${logo.size}px`,
          ['--logo-style' as string]: logo.italic ? 'italic' : 'normal',
          /* On a light or bright band the word is dark, in the company's own hue. */
          ['--logo-ink' as string]: bandIsLight(slug)
            ? bandInk(slug)
            : logo.color === 'tint' && brand
              ? brand.light
              : LOGO_PAPER,
        }
      : {}),
  };

  const kind = logo && (logo.kind === 'word' || logoUrl) ? logo.kind : 'symbol';

  return (
    <span
      className={className ? `${s.logo} ${className}` : s.logo}
      data-kind={kind}
      style={vars}
      aria-hidden="true"
    >
      {kind !== 'word' && logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={s.symbol} src={logoUrl} alt="" />
      ) : null}
      {kind !== 'symbol' && logo ? <span className={s.word}>{logo.text}</span> : null}
    </span>
  );
}
