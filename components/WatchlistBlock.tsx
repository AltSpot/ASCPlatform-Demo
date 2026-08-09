/**
 * The investor's own saved deals, on the dashboard.
 *
 * Secondary to the portfolio on purpose: a compact list, same restraint
 * as the news card beside it. Each row carries only what is useful at a
 * glance, and the allocation line appears only for a viewer entitled to
 * see it. Items arrive already redacted from the repository, so this
 * component has no withheld figure to accidentally print.
 *
 * Server component: it renders links.
 */
import Link from 'next/link';

import { ACCREDITATION_STEP, type DealShelfItem } from '@/lib/domain';
import { money } from '@/lib/format';

export default function WatchlistBlock({ deals }: { deals: DealShelfItem[] }) {
  return (
    <div className="card" style={{ marginBottom: 22 }}>
      <h3 style={{ marginBottom: 4 }}>Watchlist</h3>
      <p className="small" style={{ marginBottom: 14 }}>
        Deals you have saved to come back to.
      </p>

      {deals.length === 0 ? (
        <p className="tiny">
          Nothing saved yet. Use Add to watchlist on any deal page and it shows up
          here.
        </p>
      ) : (
        <table className="tbl">
          <tbody>
            {deals.map((deal) => (
              <tr key={deal.id}>
                <td>
                  <b>{deal.name}</b>
                  <br />
                  <span className="tiny">{deal.sector}</span>
                </td>
                <td className="num">
                  {deal.redacted ? (
                    <span className="tiny">Verify to see terms</span>
                  ) : (
                    <span className="tiny">
                      {money(deal.allocationRemaining)} remaining
                    </span>
                  )}
                </td>
                <td>
                  {deal.redacted ? (
                    <Link
                      className="btn btn-quiet btn-sm"
                      href={`/wizard?step=${ACCREDITATION_STEP}&then=${deal.id}`}
                    >
                      Finish accreditation
                    </Link>
                  ) : (
                    <Link className="btn btn-quiet btn-sm" href={`/deals/${deal.id}`}>
                      View deal
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
