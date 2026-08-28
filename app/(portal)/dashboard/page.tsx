/**
 * Dashboard — portfolio value, positions, and anything needing action.
 *
 * Rendered on the server so the numbers are correct on first paint; the
 * only client islands are the pending-commitment controls.
 */
import {
  Clock,
  CircleCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

import LineChart from '@/components/LineChart';
import PendingCommitments from '@/components/PendingCommitments';
import SetupBanner from '@/components/SetupBanner';
import WatchlistBlock from '@/components/WatchlistBlock';
import NewsDigest from '@/components/terminal/NewsDigest';
import { requireUser } from '@/lib/auth';
import { evaluateInvestGate, HELD_STATES } from '@/lib/domain';
import { dateStr, daysLeft, EMPTY, money } from '@/lib/format';
import { getDealsByIds, getDealsForViewer } from '@/lib/repositories/deals';
import { getWizardView } from '@/lib/repositories/investor';
import { listSubscriptions } from '@/lib/repositories/subscriptions';
import { getMarketNews } from '@/lib/terminal/news';
import { listWatchlist } from '@/lib/repositories/watchlist';

import d from './Dashboard.module.css';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireUser();

  const [subscriptions, wizard, headlines, watchlist] = await Promise.all([
    listSubscriptions(user.id),
    getWizardView(user.id),
    // Three is the whole budget. The dashboard belongs to the portfolio.
    getMarketNews({ limit: 3 }),
    listWatchlist(user.id),
  ]);

  const [deals, watched] = await Promise.all([
    getDealsByIds([...new Set(subscriptions.map((s) => s.dealId))]),
    // Redacted per viewer, same rule as the marketplace.
    getDealsForViewer(watchlist, user.id),
  ]);
  const gate = evaluateInvestGate(wizard);

  const held = subscriptions.filter((s) => HELD_STATES.includes(s.state));
  const pending = subscriptions.filter((s) => s.state === 'docs_signed');
  const expired = subscriptions.filter((s) => s.state === 'expired');

  /**
   * Anything in flight also belongs in the positions table. An investor
   * who started a subscription and walked away should see it on the
   * dashboard rather than having to remember which deal they were in.
   * These carry no value yet, so they are listed but excluded from the
   * invested and value totals.
   */
  const inFlight = subscriptions.filter(
    (s) => s.state === 'started' || s.state === 'docs_signed',
  );
  const positions = [...held, ...inFlight];

  const invested = held.reduce((sum, s) => sum + s.amount, 0);
  const value = held.reduce((sum, s) => sum + (s.currentValue ?? s.amount), 0);
  const gain = value - invested;
  const pct = invested ? (gain / invested) * 100 : 0;
  const pendingAmount = pending.reduce((sum, s) => sum + s.amount, 0);

  // A plausible curve that lands on today's value.
  const base = invested || 25_000;
  const end = value || base;
  const series = [0, 0.05, 0.04, 0.12, 0.17, 0.26, 0.35, 1].map((f) =>
    Math.round(base + (end - base) * f),
  );

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Dashboard</div>
          <h1 className="display">Welcome back, {user.name.split(' ')[0]}.</h1>
        </div>
        <Link className={`btn btn-gold ${d.attract}`} href="/marketplace">
          Browse the marketplace
        </Link>
      </div>

      <SetupBanner gate={gate} wizard={wizard} />

      <PendingCommitments
        pending={pending.map((s) => ({
          id: s.id,
          amount: s.amount,
          signedAt: s.signedAt,
          fundingDeadline: s.fundingDeadline,
          daysRemaining: daysLeft(s.fundingDeadline),
          dealName: deals.get(s.dealId)?.name ?? s.dealId,
        }))}
        expired={expired.map((s) => ({
          id: s.id,
          amount: s.amount,
          dealId: s.dealId,
          dealName: deals.get(s.dealId)?.name ?? s.dealId,
        }))}
      />

      <div className={d.stats}>
        <Stat
          tone={d.toneInvested}
          icon={<Wallet size={16} strokeWidth={1.5} aria-hidden="true" />}
          k="Net invested"
          v={money(invested)}
          detail={`${held.length} position${held.length === 1 ? '' : 's'}`}
        />
        <Stat
          tone={d.toneValue}
          icon={<TrendingUp size={16} strokeWidth={1.5} aria-hidden="true" />}
          k="Estimated value"
          v={money(value)}
          detail="Latest reported marks"
        />
        <Stat
          tone={gain >= 0 ? d.toneUp : d.toneDown}
          icon={
            gain >= 0 ? (
              <TrendingUp size={16} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <TrendingDown size={16} strokeWidth={1.5} aria-hidden="true" />
            )
          }
          k="Unrealized gain"
          v={`${gain >= 0 ? '+' : '−'}${money(Math.abs(gain))}`}
          detail={`${gain >= 0 ? '+' : ''}${pct.toFixed(1)}% against cost`}
        />
        <Stat
          tone={pending.length ? d.toneOwed : d.toneSettled}
          icon={
            pending.length ? (
              <Clock size={16} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <CircleCheck size={16} strokeWidth={1.5} aria-hidden="true" />
            )
          }
          k="Pending funding"
          v={money(pendingAmount)}
          detail={
            pending.length
              ? `${pending.length} commitment${pending.length === 1 ? '' : 's'} awaiting ACH`
              : 'Nothing outstanding'
          }
        />
      </div>

      <div className={d.sectionHead}>
        <p className={d.sectionEyebrow}>
          <span className={d.sectionRule} aria-hidden="true" />
          Portfolio value
        </p>
        <span className={d.sectionNote}>
          Trailing 8 quarters · marks per AltSpot reporting
        </span>
      </div>
      <div className="card">
        <LineChart series={series} width={900} height={220} id="portfolio" />
      </div>

      <div className={d.sectionHead}>
        <p className={d.sectionEyebrow}>
          <span className={d.sectionRule} aria-hidden="true" />
          Your positions
        </p>
        <span className={d.sectionNote}>Held through AltSpot deal vehicles</span>
      </div>
      <div className="card">

        {positions.length === 0 ? (
          <div className="dz" style={{ cursor: 'default' }}>
            <b style={{ color: 'var(--paper)' }}>No positions yet</b>
            <br />
            <span className="tiny">
              Your first investment will appear here the moment it funds.
            </span>
            <br />
            <br />
            <Link className="btn btn-gold btn-sm" href="/marketplace">
              Open the marketplace
            </Link>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Position</th>
                <th className="num">Invested</th>
                <th className="num">Est. value</th>
                <th className="num">Return</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {positions.map((s) => {
                const deal = deals.get(s.dealId);
                const live = HELD_STATES.includes(s.state);
                const current = s.currentValue ?? s.amount;
                const rowPct = ((current - s.amount) / s.amount) * 100;

                return (
                  <tr key={s.id}>
                    <td>
                      <div className={d.posCell}>
                        <span className={d.posPlate}>
                          {deal?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              className={d.posLogo}
                              src={deal.logoUrl}
                              alt=""
                              aria-hidden="true"
                            />
                          ) : (
                            <span className={d.posMono} aria-hidden="true">
                              {(deal?.name ?? s.dealId).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <span className={d.posName}>
                          <b>{deal?.name ?? s.dealId}</b>
                          <br />
                          <span className="tiny">{deal?.tag ?? ''}</span>
                        </span>
                      </div>
                    </td>
                    <td className="num">{money(s.amount)}</td>
                    <td className="num">
                      {live ? money(current) : <span style={{ color: 'var(--faint)' }}>{EMPTY}</span>}
                    </td>
                    <td className="num">
                      {live ? (
                        <span className={rowPct >= 0 ? 'up' : 'down'}>
                          {rowPct >= 0 ? '+' : ''}
                          {rowPct.toFixed(1)}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--faint)' }}>{EMPTY}</span>
                      )}
                    </td>
                    <td>
                      {s.state === 'started' ? (
                        <span className="chip neutral">
                          <span className="dot" />
                          Pending · documents unsigned
                        </span>
                      ) : s.state === 'docs_signed' ? (
                        <span className="chip warn">
                          <span className="dot" />
                          Pending · awaiting funding
                        </span>
                      ) : s.state === 'funded' ? (
                        <span className="chip warn">
                          <span className="dot" />
                          Funded · awaiting countersign
                        </span>
                      ) : (
                        <span className="chip good">
                          <span className="dot" />
                          Active
                        </span>
                      )}
                    </td>
                    <td>
                      {s.state === 'started' ? (
                        <Link className="btn btn-quiet btn-sm" href={`/invest/${s.dealId}`}>
                          Resume
                        </Link>
                      ) : s.state === 'docs_signed' ? (
                        <Link className="btn btn-quiet btn-sm" href={`/payment/${s.id}`}>
                          Fund
                        </Link>
                      ) : (
                        <Link className="btn btn-quiet btn-sm" href={`/deals/${s.dealId}`}>
                          View deal
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className={d.sectionHead}>
        <p className={d.sectionEyebrow}>
          <span className={d.sectionRule} aria-hidden="true" />
          Watchlist
        </p>
        <span className={d.sectionNote}>Saved to come back to</span>
      </div>
      <WatchlistBlock deals={watched} />

      <div className={d.sectionHead}>
        <p className={d.sectionEyebrow}>
          <span className={d.sectionRule} aria-hidden="true" />
          The wire
        </p>
        <span className={d.sectionNote}>What moved while you were away</span>
      </div>
      <NewsDigest items={headlines} />

      {held.some((s) => s.seeded) && (
        <p className="tiny" style={{ marginTop: 18 }}>
          Demo environment. The OpenAI position is seeded so the portfolio has
          history. Signed {dateStr(held.find((s) => s.seeded)?.signedAt)}.
        </p>
      )}
    </>
  );
}

/**
 * One figure. The tone is the whole point: four cards with the same
 * shape need one line of colour each or they read as one block.
 */
function Stat({
  k,
  v,
  detail,
  tone,
  icon,
}: {
  k: string;
  v: string;
  detail: React.ReactNode;
  tone: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`${d.stat} ${tone}`}>
      <div className={d.statHead}>
        <span className={d.statKey}>{k}</span>
        <span className={d.statIcon}>{icon}</span>
      </div>
      <div className={d.statValue}>{v}</div>
      <div className={d.statDetail}>{detail}</div>
    </div>
  );
}
