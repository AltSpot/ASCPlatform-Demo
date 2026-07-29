/** The ask, repeated at the bottom so the scroll ends somewhere. */
import type { ReactNode } from 'react';

import { money } from '@/lib/format';

import s from './Deal.module.css';

export default function ClosingCta({
  minInvestment,
  cta,
}: {
  minInvestment: number;
  cta: ReactNode;
}) {
  return (
    <div className={s.closing}>
      <div>
        <div className={s.eyebrow}>Next step</div>
        <p className={s.closingTitle}>Ready to participate?</p>
        <p className={s.closingNote}>
          Minimum {money(minInvestment)}. Your saved profile pre-fills every
          document, so most members finish in under four minutes.
        </p>
      </div>
      {cta}
    </div>
  );
}
