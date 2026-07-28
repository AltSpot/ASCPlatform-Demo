/**
 * Marketplace — a focused shelf, not a listing board.
 *
 * Each card shows AltSpot's own committed capital, because that is the
 * product's central claim: we never merely place someone else's listing.
 */
import Link from 'next/link';

import AllocBar from '@/components/AllocBar';
import { requireUser } from '@/lib/auth';
import { RESUMABLE_STATES } from '@/lib/domain';
import { money } from '@/lib/format';
import { listDeals } from '@/lib/repositories/deals';
import { listSubscriptions } from '@/lib/repositories/subscriptions';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage() {
  const user = await requireUser();

  const [deals, subscriptions] = await Promise.all([
    listDeals(),
    listSubscriptions(user.id),
  ]);

  const resumable = new Map(
    subscriptions
      .filter((s) => RESUMABLE_STATES.includes(s.state))
      .map((s) => [s.dealId, s]),
  );

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Marketplace</div>
          <h1 className="display">Current opportunities.</h1>
          <p className="sub">
            A focused shelf, not a listing board. Every deal here was sourced by
            AltSpot, underwritten through our diligence process, and carries our own
            committed capital.
          </p>
        </div>
      </div>

      <div className="deal-grid">
        {deals.map((deal) => {
          const resume = resumable.get(deal.id);

          const primary = resume ? (
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
                  <img className="deal-logo" src={deal.logoUrl} alt="" aria-hidden="true" />
                )}
                <span
                  className="tiny"
                  style={{
                    color: 'rgba(255,255,255,.82)',
                    textShadow: '0 1px 6px rgba(0,0,0,.5)',
                  }}
                >
                  {deal.sector}
                </span>
              </div>

              <div className="deal-body">
                <h3>{deal.name}</h3>
                <p className="small">{deal.blurb}</p>

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

                <div className="deal-actions">
                  {primary}
                  {/* The deal page is the pitch, so a member mid-subscription
                      still gets a way back to it. Otherwise the primary
                      button already goes there and a second one is noise. */}
                  {resume && (
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
        acceptance. Demo environment. Companies shown are fictional.
      </p>
    </>
  );
}
