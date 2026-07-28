/**
 * AltSpot's own money, stated before anything else is claimed.
 * The orb stays gold; the figure carries the orange.
 */
import { money } from '@/lib/format';

import s from './Deal.module.css';

export default function CommittedBand({
  amount,
  note,
}: {
  amount: number;
  note: string;
}) {
  if (amount <= 0) return null;

  return (
    <aside className={s.committed}>
      <div className={`orb ${s.committedOrb}`} aria-hidden="true" />
      <div className={s.committedBody}>
        <div className={s.eyebrow}>Our capital is in this deal</div>
        <p className={s.committedLine}>
          AltSpot has committed{' '}
          <span className={s.committedFigure}>{money(amount)}</span> of its own
          capital.
        </p>
        <p className={s.committedNote}>
          {note}{' '}
          We don&rsquo;t place listings. We take positions.
        </p>
      </div>
    </aside>
  );
}
