/**
 * The deal page IS the pitch deck.
 *
 * One scrollable narrative, in the order an investor actually reads:
 * the claim and the cost, a short summary beside the media, why we like
 * it, the numbers, what the range of outcomes looks like, the risks, and
 * only then the terms and the materials.
 *
 * Fees live in the hero fact strip rather than in a section of their own,
 * because the whole model is two numbers and it belongs next to the ask.
 *
 * Every section degrades to nothing when its content is missing, since
 * the deals behind the lead carry far thinner editorial than Calder.
 *
 * None of it is rendered for a member who is not a verified accredited
 * investor. The repository hands this page a teaser in that case, so the
 * branch below is not hiding anything: there is nothing to hide.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';

import ClosingCta from '@/components/deal/ClosingCta';
import DealGate from '@/components/deal/DealGate';
import DealHero from '@/components/deal/DealHero';
import DealNav from '@/components/deal/DealNav';
import MetricChart from '@/components/deal/MetricChart';
import Outcomes from '@/components/deal/Outcomes';
import RiskPanel from '@/components/deal/RiskPanel';
import KeyIndicators from '@/components/deal/KeyIndicators';
import RoundHistory from '@/components/deal/RoundHistory';
import SummaryMedia from '@/components/deal/SummaryMedia';
import TermsTable from '@/components/deal/TermsTable';
import WatchToggle from '@/components/deal/WatchToggle';
import WhatWeLike from '@/components/deal/WhatWeLike';
import s from '@/components/deal/Deal.module.css';
import InvestButton from '@/components/InvestButton';
import { requireUser } from '@/lib/auth';
import { evaluateInvestGate } from '@/lib/domain';
import { getDealForViewer, getDealRecord } from '@/lib/repositories/deals';
import { getWizardView } from '@/lib/repositories/investor';
import { getResumable } from '@/lib/repositories/subscriptions';
import { listWatchlist } from '@/lib/repositories/watchlist';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // The company name is public to every member, gated or not.
  const deal = await getDealRecord(id);
  return { title: deal ? `${deal.name} · AltSpot Capital` : 'Deal · AltSpot Capital' };
}

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const deal = await getDealForViewer(id, user.id);
  if (!deal) notFound();

  // Saving a deal is not reading one, so the toggle is offered either way.
  const watched = (await listWatchlist(user.id)).includes(deal.id);
  const watch = <WatchToggle dealId={deal.id} initialWatched={watched} />;

  if (deal.redacted) {
    return (
      <>
        <div className="crumbs">
          <Link href="/marketplace">Marketplace</Link>
          <span className="sep">/</span>
          <span className="here">{deal.name}</span>
        </div>

        <DealGate deal={deal} tools={watch} />
      </>
    );
  }

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

      <DealHero deal={deal} cta={cta} tools={watch} />

      <DealNav />

      <SummaryMedia summary={deal.summary} dealName={deal.name} />

      <WhatWeLike points={deal.whatWeLike} />

      <KeyIndicators indicators={deal.indicators} extras={deal.metrics} />

      <MetricChart media={deal.media} dealId={deal.id} />

      <RoundHistory rounds={deal.rounds} />

      <Outcomes outcomes={deal.outcomes} />

      <RiskPanel risks={deal.risks} />

      <TermsTable deal={deal} />


      <div className={s.section}>
        <ClosingCta minInvestment={deal.minInvestment} cta={cta} />

        <p className={s.disclosure}>
          Prepared by AltSpot Capital from company-provided materials and AltSpot
          diligence. Not an offer to sell securities. Any offer is made only through
          definitive documents. Investment is subject to eligibility, documentation,
          and final acceptance. Private investments involve substantial risk,
          including loss of the entire amount invested. Demo environment.
        </p>
      </div>
    </>
  );
}
