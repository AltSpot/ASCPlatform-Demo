/**
 * Deal page — thesis, metric, risk, itemized fees, data room, SpotBot,
 * and AltSpot's committed position.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';

import AllocBar from '@/components/AllocBar';
import DataRoom from '@/components/DataRoom';
import InvestButton from '@/components/InvestButton';
import LineChart from '@/components/LineChart';
import SpotBot from '@/components/SpotBot';
import { requireUser } from '@/lib/auth';
import { evaluateInvestGate } from '@/lib/domain';
import { money } from '@/lib/format';
import { getDeal } from '@/lib/repositories/deals';
import { getWizardView } from '@/lib/repositories/investor';
import { getResumable } from '@/lib/repositories/subscriptions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await getDeal(id);
  return { title: deal ? `${deal.name} — AltSpot Capital` : 'Deal — AltSpot Capital' };
}

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const deal = await getDeal(id);
  if (!deal) notFound();

  const [wizard, resume] = await Promise.all([
    getWizardView(user.id),
    getResumable(user.id, deal.id),
  ]);
  const gate = evaluateInvestGate(wizard);

  const cta = resume ? (
    resume.state === 'docs_signed' ? (
      <Link className="btn btn-gold" href={`/payment/${resume.id}`}>
        Fund your commitment
      </Link>
    ) : (
      <Link className="btn btn-gold" href={`/invest/${deal.id}`}>
        Resume your investment
      </Link>
    )
  ) : (
    <InvestButton dealId={deal.id} gate={gate} />
  );

  return (
    <>
      <div className="crumbs">
        <Link href="/marketplace">Marketplace</Link>
        <span className="sep">/</span>
        <span className="here">{deal.name}</span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 22 }}>
        <div className="thumb" style={{ background: deal.art, height: 190 }}>
          <span className="chip">{deal.tag}</span>
        </div>
        <div style={{ padding: 28 }}>
          <div className="page-head" style={{ marginBottom: 14 }}>
            <div className="titles">
              <h1 className="display">{deal.name}</h1>
              <p className="small">
                {deal.sector} · {deal.stage} · Offered through {deal.entity}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {cta}
              <Link className="btn btn-ghost" href={`/deals/${deal.id}/deck`}>
                Open pitch deck
              </Link>
            </div>
          </div>
          <p className="sub" style={{ maxWidth: 'none' }}>
            {deal.blurb}
          </p>
        </div>
      </div>

      <div
        className="card gold"
        style={{
          marginBottom: 22,
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div className="orb" style={{ width: 44, height: 44, flex: 'none' }} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="eyebrow" style={{ marginBottom: 5 }}>
            Our capital is in this deal
          </div>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 21 }}>
            AltSpot has committed{' '}
            <span className="num" style={{ color: 'var(--gold-bright)' }}>
              {money(deal.altspotCommitted)}
            </span>{' '}
            of its own capital
          </h3>
          <p className="small" style={{ marginTop: 4 }}>
            {deal.committedNote} We never merely collect a fee to place someone
            else&rsquo;s listing.
          </p>
        </div>
      </div>

      <div className="grid c2" style={{ marginBottom: 22, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Why we underwrote it</h3>
            {deal.thesis.map((paragraph, i) => (
              <p
                className="small"
                style={{ marginBottom: 12, fontSize: 14 }}
                key={i}
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <h3>{deal.media.label}</h3>
            </div>
            <div style={{ margin: '14px 0 8px' }}>
              <LineChart
                series={deal.media.series}
                width={760}
                height={190}
                id={`deal-${deal.id}`}
              />
            </div>
            <p className="tiny">{deal.media.caption}</p>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Risk, plainly</h3>
            <p className="small" style={{ fontSize: 14 }}>
              {deal.risks}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Terms</h3>
            <FeeRow label="Minimum investment" value={money(deal.minInvestment)} />
            <FeeRow label="Vehicle" value={deal.entity} />
            <FeeRow
              label="Allocation remaining"
              value={money(deal.allocationRemaining)}
            />
            <FeeRow label="Target close" value={deal.targetClose} />
            <AllocBar
              allocationTotal={deal.allocationTotal}
              allocationRemaining={deal.allocationRemaining}
            />
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Fees — all-in, known on day one</h3>
            <p className="tiny" style={{ marginBottom: 10 }}>
              Collected once at closing. No annual fees. No capital calls, ever.
            </p>
            <FeeRow label="Platform fee" value={`${deal.fees.platform}%`} />
            <FeeRow
              label="Admin reserve (itemized at checkout)"
              value={`up to ${deal.fees.adminMax}%`}
            />
            <div className="fee-sub">
              Unused admin reserve is returned to investors at close.
            </div>
            <FeeRow
              label={`Carried interest — ${deal.fees.carryNote.toLowerCase()}`}
              value={`${deal.fees.carry}% of profits`}
            />
          </div>

          <DataRoom documents={deal.docs} />

          <SpotBot entries={deal.spotbot} />
        </div>
      </div>

      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3>Ready to participate?</h3>
          <p className="small" style={{ marginTop: 4 }}>
            Your saved profile pre-fills every document. Most members complete a
            subscription in under four minutes.
          </p>
        </div>
        {cta}
      </div>

      <p className="tiny" style={{ marginTop: 18 }}>
        Investment subject to eligibility, documentation, and final acceptance. Demo
        environment — this company is fictional.
      </p>
    </>
  );
}

function FeeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="fee-row">
      <span className="l">{label}</span>
      <span className="r">{value}</span>
    </div>
  );
}
