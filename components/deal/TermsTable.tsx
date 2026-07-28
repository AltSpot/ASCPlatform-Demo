/**
 * Deal terms. The structural rows (vehicle, minimum, close) come from
 * columns every deal has, so the table still stands up on a deal whose
 * editorial `terms[]` is thin or empty.
 */
import type { DealView } from '@/lib/domain';
import { money } from '@/lib/format';

import Section from './Section';
import s from './Deal.module.css';

export default function TermsTable({ deal }: { deal: DealView }) {
  const rows = [
    ...deal.terms,
    { k: 'Vehicle', v: deal.entity },
    { k: 'Minimum investment', v: money(deal.minInvestment) },
    { k: 'Allocation remaining', v: money(deal.allocationRemaining) },
    { k: 'Target close', v: deal.targetClose },
  ];

  return (
    <Section eyebrow="Terms" title="What you are agreeing to." id="terms">
      <div className={s.tableWrap}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Term</th>
              <th className="num">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.k}>
                <td>{row.k}</td>
                <td>{row.v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
