/** The ask, repeated at the bottom so the scroll ends somewhere. */
import type { ReactNode } from 'react';

import Term from '@/components/Term';
import { money } from '@/lib/format';
import { explainMinimum } from '@/lib/minimums';

import s from './Deal.module.css';

export default function ClosingCta({
  minInvestment,
  allocationTotal,
  cta,
}: {
  minInvestment: number;
  /** The vehicle's size, which is what sets the minimum (lib/minimums.ts). */
  allocationTotal: number;
  cta: ReactNode;
}) {
  return (
    <div className={s.closing}>
      <div>
        <div className={`eyebrow signal ${s.eyebrow}`}>Next step</div>
        <p className={s.closingTitle}>Ready to participate?</p>
        <p className={s.closingNote}>
          <Term q="Why is the minimum what it is?" quiet>
            Minimum {money(minInvestment)}
          </Term>
          . {explainMinimum(minInvestment, allocationTotal)} Your saved profile pre-fills every
          document, so most members finish in under four minutes.
        </p>
      </div>
      {cta}
    </div>
  );
}
