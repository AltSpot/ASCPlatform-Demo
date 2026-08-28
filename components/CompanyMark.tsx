/**
 * A company's own mark, on the warm plate.
 *
 * Marks arrive in the company's own colours and some of them are solid
 * black, so a plate is what makes any of them legible on the ember
 * canvas without touching the mark itself. A company with no mark falls
 * back to a monogram on the same plate, so a part-collected list still
 * reads as one list.
 *
 * Third place this was needed, so it lives here rather than a fourth
 * copy of the same twenty lines.
 */
import s from './CompanyMark.module.css';

export default function CompanyMark({
  name,
  logoUrl,
  size = 34,
}: {
  name: string;
  logoUrl?: string | null;
  /** Plate edge in px. The mark scales inside it. */
  size?: number;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <span
      className={s.plate}
      style={{
        width: size,
        height: size,
        padding: Math.max(3, Math.round(size * 0.18)),
        fontSize: Math.round(size * 0.38),
      }}
      aria-hidden="true"
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={s.logo} src={logoUrl} alt="" />
      ) : (
        <span className={s.mono}>{initial}</span>
      )}
    </span>
  );
}
