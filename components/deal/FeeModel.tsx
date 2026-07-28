/**
 * Two numbers. That is the entire fee model, and stating it in two
 * cards rather than a table is the point: there is nothing to hunt for.
 */
import type { DealFees } from '@/lib/domain';

import Section from './Section';
import s from './Deal.module.css';

export default function FeeModel({ fees }: { fees: DealFees }) {
  return (
    <Section
      eyebrow="Fees"
      title="One fee now. One fee at exit."
      lede="Known on day one, all in. No annual fees. No capital calls, ever."
    >
      <div className={s.feeGrid}>
        <div className={s.feeCard}>
          <div className={s.feeV}>{fees.management}%</div>
          <div className={s.feeK}>Management fee</div>
          <p className={s.feeNote}>
            Charged once, at closing, on the amount you invest. It is never charged
            again.
          </p>
        </div>

        <div className={s.feeCard}>
          <div className={s.feeV}>{fees.carry}%</div>
          <div className={s.feeK}>Carried interest</div>
          <p className={s.feeNote}>
            Taken on profits at exit, after your capital comes back. If there is no
            profit, there is no carry.
          </p>
        </div>
      </div>
    </Section>
  );
}
