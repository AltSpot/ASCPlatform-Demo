/**
 * What the platform has actually charged this investor.
 *
 * Every other surface states the fee model as a promise: 5% once at
 * closing, 10% of profits at exit, nothing else. This is the only place
 * that states it as a number against their own money, which is the
 * form an investor actually wants it in and the form a platform is
 * least often willing to print.
 *
 * The three lines are deliberately different in kind. Management fees
 * are money already gone. Carry at exit is money already deducted,
 * before the proceeds reached the bank. Carry on a live position is
 * neither: it is what would be owed if today's mark were the exit, and
 * it is owed on nothing until something is sold. Collapsing the three
 * into one "fees" figure would misstate two of them.
 */
import { money } from '@/lib/format';

import s from './FeesPaid.module.css';

export interface FeeLine {
  key: string;
  label: string;
  amount: number;
  note: string;
  /** Owed only if a mark becomes an exit. Rendered quieter. */
  contingent?: boolean;
}

export default function FeesPaid({ lines }: { lines: FeeLine[] }) {
  if (lines.length === 0) return null;

  return (
    <div className="card">
      <div className={s.rows}>
        {lines.map((line) => (
          <div key={line.key} className={s.row} data-contingent={line.contingent}>
            <span className={s.label}>{line.label}</span>
            <span className={s.amount}>{money(line.amount)}</span>
            <span className={s.note}>{line.note}</span>
          </div>
        ))}
      </div>

      <p className={s.model}>
        That is the whole model. One management fee, charged once at closing.
        Ten percent of profits at exit. No annual fee, no administration
        reserve, and no capital calls, ever.
      </p>
    </div>
  );
}
