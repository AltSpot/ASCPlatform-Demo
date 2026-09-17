/**
 * The member register for one SPV. Internal. Work order screen 12.
 *
 * Who is admitted, how much each put in, their share of the SPV, and when
 * they were admitted. At the admission cut-off the register locks and the
 * percentages freeze: that list is the one the SPV acquires its position
 * for, which is what preserves QSBS for the members on it. Beside it, the
 * two per-SPV limits (screen 13): members against the investor cap, and
 * retirement money against its limit.
 *
 * DEMO SEAM — there is no back office and no staff role yet, so this page
 * is reachable by URL for any signed-in member while DEMO_MODE is on, and
 * is a 404 otherwise. Production puts it behind an operator role. The rows
 * for the seeded raise are drawn by lib/repositories/spv.ts and say so.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireUser } from '@/lib/auth';
import { DEMO_MODE, RETIREMENT_BLOCK_PERCENT, RETIREMENT_WARN_PERCENT } from '@/lib/config';
import { dateStr, money } from '@/lib/format';
import { getDealRecord } from '@/lib/repositories/deals';
import { getMemberRegister, getStanding } from '@/lib/repositories/spv';
import { effectiveCap } from '@/lib/spv-rules';

import s from './Register.module.css';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Member register · AltSpot' };

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  if (!DEMO_MODE) notFound();
  await requireUser();
  const { dealId } = await params;

  const [deal, register, standing] = await Promise.all([
    getDealRecord(dealId),
    getMemberRegister(dealId),
    getStanding(dealId),
  ]);
  if (!deal || !register) notFound();

  const retirement = register.entries
    .filter((e) => e.retirement)
    .reduce((sum, e) => sum + e.amount, 0);
  const retirementPct = register.total > 0 ? (retirement / register.total) * 100 : 0;
  const cap = effectiveCap(deal.investorCap);
  const members = standing?.standing.members ?? register.entries.length;

  return (
    <>
      <div className="crumbs">
        <Link href={`/deals/${deal.id}`}>{deal.name}</Link>
        <span className="sep">/</span>
        <span className="here">Member register</span>
      </div>

      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Internal · Member register</div>
          <h1 className="display">{deal.entity}</h1>
          <p className="sub">
            Everyone admitted by the cut-off, their amount and their share of the SPV.
          </p>
        </div>
      </div>

      <div className={s.status}>
        <div className={s.tile} data-state={register.locked ? 'locked' : 'open'}>
          <span className={s.key}>Register</span>
          <b className={s.value}>{register.locked ? 'Locked' : 'Open'}</b>
          <span className={s.note}>
            {register.cutoffAt
              ? `${register.locked ? 'Locked' : 'Locks'} ${dateStr(register.cutoffAt)}, 24 hours before the wire`
              : 'No closing date set'}
          </span>
        </div>
        <div className={s.tile} data-state={members >= cap ? 'full' : 'open'}>
          <span className={s.key}>Members</span>
          <b className={s.value}>
            {Math.min(members, cap)} of {cap}
          </b>
          <span className={s.note}>
            {members >= cap ? 'At the cap. New members join the waitlist.' : 'Investor cap for this SPV'}
          </span>
        </div>
        <div
          className={s.tile}
          data-state={
            retirementPct >= RETIREMENT_BLOCK_PERCENT
              ? 'full'
              : retirementPct >= RETIREMENT_WARN_PERCENT
                ? 'warn'
                : 'open'
          }
        >
          <span className={s.key}>Retirement money</span>
          <b className={s.value}>{retirementPct.toFixed(1)}%</b>
          <span className={s.note}>
            Warn at {RETIREMENT_WARN_PERCENT}%, refuse at {RETIREMENT_BLOCK_PERCENT}%
          </span>
        </div>
        <div className={s.tile}>
          <span className={s.key}>Admitted</span>
          <b className={s.value}>{money(register.total)}</b>
          <span className={s.note}>In escrow by the cut-off</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>#</th>
              <th>Member</th>
              <th>Account</th>
              <th className="num">Amount</th>
              <th className="num">Share of SPV</th>
              <th className="num">Admitted</th>
            </tr>
          </thead>
          <tbody>
            {register.entries.map((entry, i) => (
              <tr key={entry.subscriptionId}>
                <td className="num">{i + 1}</td>
                <td>{entry.member}</td>
                <td>{entry.retirement ? 'Retirement' : 'Taxable'}</td>
                <td className="num">{money(entry.amount)}</td>
                <td className="num">{entry.percent.toFixed(2)}%</td>
                <td className="num">{dateStr(entry.admittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={s.foot}>
        Demo environment. Rows named &ldquo;Member&rdquo; with a number stand in for the seeded
        raise; real subscriptions appear under the member&rsquo;s name once in escrow.
      </p>
    </>
  );
}
