/**
 * The deal page for a member who is not a verified accredited investor.
 *
 * Not a 404 and not a redirect: someone who followed a link should land
 * on the deal, see which company it is, and be told plainly what stands
 * between them and the rest. Everything below the gate is a placeholder
 * shape, blurred. There is nothing behind the blur to reveal, because
 * the server sent a teaser and nothing else.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';

import { ACCREDITATION_STEP, type DealTeaser } from '@/lib/domain';

import s from './Deal.module.css';

export default function DealGate({
  deal,
  tools,
}: {
  deal: DealTeaser;
  /** Header controls that stay available while gated, e.g. the watchlist. */
  tools?: ReactNode;
}) {
  return (
    <>
      <header className={s.hero}>
        <div className={s.heroWash} style={{ background: deal.art }} aria-hidden="true" />

        <div className={s.heroInner}>
          <div className={s.heroTop}>
            <div className={s.identity}>
              {deal.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={s.logo} src={deal.logoUrl} alt="" aria-hidden="true" />
              )}
              <span className={s.name}>{deal.name}</span>
              <span className="chip">{deal.tag}</span>
            </div>
            {tools}
          </div>

          <h1 className={s.headline}>{deal.blurb}</h1>

          <p className={s.heroMeta}>
            <span>{deal.sector}</span>
          </p>

          <div className={s.gate}>
            <div className={s.gateBody}>
              <div className={s.gateEyebrow}>Accreditation required</div>
              <p className={s.gateText}>
                This offering is made under Rule 506(c), so the terms, the numbers
                and the data room are available only to investors who have verified
                their accredited status.
              </p>
            </div>
            <Link
              className="btn btn-gold"
              href={`/wizard?step=${ACCREDITATION_STEP}&then=${deal.id}`}
            >
              Finish accreditation
            </Link>
          </div>
        </div>
      </header>

      <Veil />

      <p className={s.disclosure}>
        Prepared by AltSpot Capital from company-provided materials and AltSpot
        diligence. Not an offer to sell securities. Any offer is made only through
        definitive documents. Investment is subject to eligibility, documentation,
        and final acceptance. Private investments involve substantial risk,
        including loss of the entire amount invested. Demo environment.
      </p>
    </>
  );
}

/**
 * The shape of the page that is waiting: section headings an investor
 * will get, drawn as rules. Deliberately generic, because these bars
 * stand in for content this viewer was never sent.
 */
function Veil() {
  const sections = ['Overview', 'Key indicators', 'Terms', 'Risk', 'Data room'];

  return (
    <div className={s.veil} aria-hidden="true">
      {sections.map((label) => (
        <div className={s.veilSection} key={label}>
          <div className={s.veilLabel}>{label}</div>
          <div className={s.veilRows}>
            <span style={{ width: '72%' }} />
            <span style={{ width: '88%' }} />
            <span style={{ width: '54%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
