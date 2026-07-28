/**
 * The cover. Logo, name, tag, the one-sentence claim, and the ask.
 *
 * The deal's gradient is blurred back behind the type rather than run
 * as a banner: the headline is the hero here, not the artwork.
 */
import type { ReactNode } from 'react';

import AllocBar from '@/components/AllocBar';
import type { DealView } from '@/lib/domain';
import { money } from '@/lib/format';

import s from './Deal.module.css';

export default function DealHero({
  deal,
  cta,
}: {
  deal: DealView;
  cta: ReactNode;
}) {
  return (
    <header className={s.hero}>
      <div className={s.heroWash} style={{ background: deal.art }} aria-hidden="true" />

      <div className={s.heroInner}>
        <div className={s.identity}>
          {deal.logoUrl && (
            <img className={s.logo} src={deal.logoUrl} alt="" aria-hidden="true" />
          )}
          <span className={s.name}>{deal.name}</span>
          <span className="chip">{deal.tag}</span>
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
          <Fact k="Target close" v={deal.targetClose} />
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

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className={s.fact}>
      <div className={s.factK}>{k}</div>
      <div className={s.factV}>{v}</div>
    </div>
  );
}
