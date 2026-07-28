/** Pitch deck — the deal's slides, rendered as a scrollable stack. */
import Link from 'next/link';
import { notFound } from 'next/navigation';

import InvestButton from '@/components/InvestButton';
import { requireUser } from '@/lib/auth';
import { evaluateInvestGate } from '@/lib/domain';
import { money } from '@/lib/format';
import { getDeal } from '@/lib/repositories/deals';
import { getWizardView } from '@/lib/repositories/investor';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await getDeal(id);
  return { title: deal ? `${deal.name} — Pitch Deck` : 'Pitch Deck' };
}

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const deal = await getDeal(id);
  if (!deal) notFound();

  const gate = evaluateInvestGate(await getWizardView(user.id));

  return (
    <>
      <div className="crumbs" style={{ justifyContent: 'space-between', display: 'flex' }}>
        <span>
          <Link href="/marketplace">Marketplace</Link>
          <span className="sep"> / </span>
          <Link href={`/deals/${deal.id}`}>{deal.name}</Link>
          <span className="sep"> / </span>
          <span className="here">Pitch deck</span>
        </span>
        <span style={{ display: 'flex', gap: 16 }}>
          <a href={`/deals/${deal.id}/deck`} target="_blank" rel="noopener noreferrer">
            Open in new tab ↗
          </a>
          <Link href={`/deals/${deal.id}`}>← Back to deal</Link>
        </span>
      </div>

      {deal.deck.map((slide, i) => (
        <section
          className="card slide"
          key={i}
          style={
            i === 0
              ? { background: 'linear-gradient(160deg,rgba(201,161,74,.10),var(--panel))' }
              : undefined
          }
        >
          <div className="eyebrow k">
            {slide.kicker} · {i + 1} / {deal.deck.length}
          </div>
          <h2>{slide.title}</h2>
          {slide.body.map((paragraph, j) => (
            <p key={j}>{paragraph}</p>
          ))}

          {slide.stats && slide.stats.length > 0 && (
            <div className="statrow">
              {slide.stats.map((stat) => (
                <div className="stat" key={stat.k}>
                  <div className="k">{stat.k}</div>
                  <div className="v num" style={{ fontSize: 26 }}>
                    {stat.v}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

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
          <h3>{deal.name}</h3>
          <p className="small" style={{ marginTop: 4 }}>
            Minimum {money(deal.minInvestment)} · AltSpot committed{' '}
            {money(deal.altspotCommitted)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <InvestButton dealId={deal.id} gate={gate} />
          <Link className="btn btn-ghost" href={`/deals/${deal.id}`}>
            Deal overview
          </Link>
        </div>
      </div>

      <p className="tiny" style={{ marginTop: 18 }}>
        Prepared by AltSpot Capital from company-provided materials and AltSpot
        diligence. Not an offer except through definitive documents. Demo — fictional
        company.
      </p>
    </>
  );
}
