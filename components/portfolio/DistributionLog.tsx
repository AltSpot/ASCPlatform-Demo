/**
 * Every payment back, newest first.
 *
 * Return of capital and gain stay on separate lines, and the split is
 * stated above the log rather than left to be inferred. They are taxed
 * differently and they mean different things: capital coming back is
 * your own money returning, and only the gain is a result. A single
 * "distributions" total hides which of the two happened, which is the
 * one thing this section exists to show.
 *
 * An empty log is not an empty state to apologize for. Nothing has
 * exited is the honest position of most private books most of the time,
 * and saying so plainly is better than a dash.
 */
import { dateStr, money } from '@/lib/format';

import s from './DistributionLog.module.css';

export interface DistributionRow {
  id: string;
  dealName: string;
  amount: number;
  paidAt: string;
  kind: 'return_of_capital' | 'gain';
  note: string | null;
}

export default function DistributionLog({
  items,
  returnOfCapital,
  gain,
}: {
  items: DistributionRow[];
  returnOfCapital: number;
  gain: number;
}) {
  if (items.length === 0) {
    return (
      <div className="card">
        <p className="tiny">
          Nothing has been returned yet. When a position pays out, the capital
          coming back and the gain on it are listed here separately, because
          they are taxed differently and a running total cannot say which was
          which.
        </p>
      </div>
    );
  }

  const total = returnOfCapital + gain;
  const capitalShare = total ? (returnOfCapital / total) * 100 : 0;

  return (
    <div className="card">
      <div className={s.split}>
        <div className={s.bar} role="img" aria-label="Split of capital returned and gain">
          <div className={s.capital} style={{ width: `${capitalShare}%` }} />
        </div>
        <div className={s.keys}>
          <span className={s.key}>
            <span className={`${s.dot} ${s.dotCapital}`} aria-hidden="true" />
            <b>{money(returnOfCapital)}</b> capital returned
          </span>
          <span className={s.key}>
            <span className={`${s.dot} ${s.dotGain}`} aria-hidden="true" />
            <b>{money(gain)}</b> gain
          </span>
        </div>
      </div>

      <ul className={s.log}>
        {items.map((item) => (
          <li key={item.id} className={s.row}>
            <span className={s.when}>{dateStr(item.paidAt)}</span>

            <span className={s.what}>
              <b className={s.deal}>{item.dealName}</b>
              {item.note ? <span className={s.note}>{item.note}</span> : null}
            </span>

            <span className={s.kind} data-gain={item.kind === 'gain'}>
              {item.kind === 'gain' ? 'Gain' : 'Capital'}
            </span>

            <span className={s.amount}>{money(item.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
