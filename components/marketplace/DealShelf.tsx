/**
 * The shelf: every deal open for subscription right now.
 *
 * Lifted out of the marketplace page unchanged when Radar arrived, so
 * the two views could sit behind one switcher. Each card shows
 * AltSpot's own committed capital, because that is the product's
 * central claim: we never merely place someone else's listing.
 *
 * A card for a member who is not yet a verified accredited investor
 * carries no figures at all. Not blurred figures: the server never sent
 * them (see lib/repositories/deals.ts). What is left is the company, the
 * sector and the one line, which is enough to know the deal exists.
 */
import Link from 'next/link';

import AllocBar from '@/components/AllocBar';
import type { DealShelfItem, SubscriptionView } from '@/lib/domain';
import { ACCREDITATION_STEP } from '@/lib/domain';
import { money } from '@/lib/format';

import s from './Marketplace.module.css';

export default function DealShelf({
  deals,
  resumable,
}: {
  deals: DealShelfItem[];
  /** Live subscriptions keyed by deal, so a card can offer the way back in. */
  resumable: Map<string, SubscriptionView>;
}) {
  return (
    <>
      <div className="deal-grid">
        {deals.map((deal) => {
          const resume = resumable.get(deal.id);

          const primary = deal.redacted ? (
            <Link
              className="btn btn-ghost btn-sm"
              style={{ flex: 1 }}
              href={`/wizard?step=${ACCREDITATION_STEP}&then=${deal.id}`}
            >
              Finish accreditation to view
            </Link>
          ) : resume ? (
            resume.state === 'docs_signed' ? (
              <Link
                className="btn btn-gold btn-sm"
                style={{ flex: 1 }}
                href={`/payment/${resume.id}`}
              >
                Fund commitment
              </Link>
            ) : (
              <Link
                className="btn btn-gold btn-sm"
                style={{ flex: 1 }}
                href={`/invest/${deal.id}`}
              >
                Resume investment
              </Link>
            )
          ) : (
            <Link
              className="btn btn-gold btn-sm"
              style={{ flex: 1 }}
              href={`/deals/${deal.id}`}
            >
              View deal
            </Link>
          );

          return (
            <div className="card deal-card" key={deal.id}>
              <div className="thumb" style={{ background: deal.art }}>
                <span className="chip">{deal.tag}</span>
                {deal.logoUrl && (
                  // The mark IS the artwork: large and centered, not a
                  // corner tile.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="deal-logo-hero" src={deal.logoUrl} alt="" aria-hidden="true" />
                )}
                <span className="tiny sector">{deal.sector}</span>
              </div>

              <div className="deal-body">
                <h3>{deal.name}</h3>
                <p className="small">{deal.blurb}</p>

                {deal.redacted ? (
                  <LockedFigures />
                ) : (
                  <>
                    <div className="deal-meta">
                      <div className="m">
                        Minimum<b>{money(deal.minInvestment)}</b>
                      </div>
                      <div className="m">
                        Management fee<b>{deal.fees.management}% one time</b>
                      </div>
                      <div className="m">
                        Carry<b>{deal.fees.carry}%</b>
                      </div>
                    </div>

                    <AllocBar
                      allocationTotal={deal.allocationTotal}
                      allocationRemaining={deal.allocationRemaining}
                    />
                  </>
                )}

                <div className="deal-actions">
                  {primary}
                  {/* The deal page is the pitch, so a member mid-subscription
                      still gets a way back to it. Otherwise the primary
                      button already goes there and a second one is noise. */}
                  {!deal.redacted && resume && (
                    <Link
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1 }}
                      href={`/deals/${deal.id}`}
                    >
                      View deal
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="tiny" style={{ marginTop: 30, maxWidth: '80ch' }}>
        Private investments involve substantial risk, including possible loss of the
        entire amount invested, and are available only to verified accredited
        investors. Participation is subject to eligibility, documentation, and final
        acceptance. Demo environment. Deal terms, prices and allocations are
        illustrative and do not represent actual offerings.
      </p>
    </>
  );
}

/**
 * Where the minimum, the fees and the allocation bar sit on an open
 * card. Quiet rules rather than fake numbers: there is no value here to
 * approximate, because none was sent.
 */
function LockedFigures() {
  return (
    <div className={s.locked}>
      <div className={s.lockedRows} aria-hidden="true">
        <span style={{ width: '58%' }} />
        <span style={{ width: '76%' }} />
        <span style={{ width: '41%' }} />
      </div>
      <p className={s.lockedNote}>Terms and allocation open once you are verified.</p>
    </div>
  );
}
