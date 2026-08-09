/**
 * The cover. Logo, name, tag, the one-sentence claim, and the ask.
 *
 * The deal's gradient is blurred back behind the type rather than run
 * as a banner: the headline is the hero here, not the artwork.
 *
 * The fact strip carries what an investor actually decides on: cheque
 * size, the round, what is left, and the entire cost of participating.
 * There is no target close, because these are back-raises. The SPV
 * already holds the shares, so a close date is not a real deadline.
 */
import type { ReactNode } from 'react';

import AllocBar from '@/components/AllocBar';
import type { DealView } from '@/lib/domain';
import { money } from '@/lib/format';

import s from './Deal.module.css';

export default function DealHero({
  deal,
  cta,
  tools,
}: {
  deal: DealView;
  cta: ReactNode;
  /** Header controls, set hard right: the watchlist toggle today. */
  tools?: ReactNode;
}) {
  return (
    <header className={s.hero}>
      <div className={s.heroWash} style={{ background: deal.art }} aria-hidden="true" />

      <div className={s.heroInner}>
        <div className={s.heroTop}>
          <div className={s.identity}>
            {deal.logoUrl && (
              <img className={s.logo} src={deal.logoUrl} alt="" aria-hidden="true" />
            )}
            <span className={s.name}>{deal.name}</span>
            <span className="chip">{deal.tag}</span>
          </div>
          {tools}
        </div>

        <h1 className={s.headline}>{deal.headline ?? deal.blurb}</h1>

        {deal.headline && <p className={s.heroLede}>{deal.blurb}</p>}

        <p className={s.heroMeta}>
          <span>{deal.sector}</span>
          <i>/</i>
          <span>{deal.stage}</span>
          <i>/</i>
          <span>{deal.entity}</span>
        </p>

        <div className={s.actions}>{cta}</div>

        <div className={s.heroFacts}>
          <Fact k="Minimum" v={money(deal.minInvestment)} />
          <Fact k="Round size" v={money(deal.allocationTotal)} />
          <Fact k="Remaining" v={money(deal.allocationRemaining)} />
          <Fact k="Management fee" v={`${deal.fees.management}%`} note="one time" />
          <Fact k="Carry" v={`${deal.fees.carry}%`} note="at exit" />
        </div>

        <div className={s.heroAlloc}>
          <AllocBar
            allocationTotal={deal.allocationTotal}
            allocationRemaining={deal.allocationRemaining}
          />
        </div>
      </div>
    </header>
  );
}

function Fact({ k, v, note }: { k: string; v: string; note?: string }) {
  return (
    <div className={s.fact}>
      <div className={s.factK}>{k}</div>
      <div className={s.factV}>{v}</div>
      {note && <div className={s.factNote}>{note}</div>}
    </div>
  );
}
