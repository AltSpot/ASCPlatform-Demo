/**
 * The deal page IS the pitch deck.
 *
 * There used to be two destinations: an overview of cards and a separate
 * deck route of slides. Investors had to choose which one to read, and
 * neither told the whole story. This is one scrollable narrative instead:
 * the claim, the numbers, the story, our underwriting, the trend, the
 * risk, the terms, the fees, the materials, the ask.
 *
 * Every section degrades to nothing when its content is missing, because
 * the deals behind the lead carry far thinner editorial than Simphonic.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';

import ClosingCta from '@/components/deal/ClosingCta';
import CommittedBand from '@/components/deal/CommittedBand';
import DealHero from '@/components/deal/DealHero';
import Diligence from '@/components/deal/Diligence';
import FeeModel from '@/components/deal/FeeModel';
import MetricChart from '@/components/deal/MetricChart';
import Narrative from '@/components/deal/Narrative';
import RiskPanel from '@/components/deal/RiskPanel';
import StatBand from '@/components/deal/StatBand';
import TermsTable from '@/components/deal/TermsTable';
import Thesis from '@/components/deal/Thesis';
import s from '@/components/deal/Deal.module.css';
import InvestButton from '@/components/InvestButton';
import { requireUser } from '@/lib/auth';
import { evaluateInvestGate } from '@/lib/domain';
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
  return { title: deal ? `${deal.name} · AltSpot Capital` : 'Deal · AltSpot Capital' };
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

      <DealHero
        deal={deal}
        cta={
          <>
            {cta}
            {/* Only offered when there is a risk section to land on. */}
            {deal.risks.trim() && (
              <a className="btn btn-ghost" href="#risk">
                Read the risks
              </a>
            )}
          </>
        }
      />

      <CommittedBand amount={deal.altspotCommitted} note={deal.committedNote} />

      <StatBand metrics={deal.metrics} />

      <Narrative chapters={deal.deck} />

      <Thesis points={deal.thesis} />

      <MetricChart media={deal.media} dealId={deal.id} />

      <RiskPanel risks={deal.risks} />

      <TermsTable deal={deal} />

      <FeeModel fees={deal.fees} />

      <Diligence docs={deal.docs} spotbot={deal.spotbot} />

      <div className={s.section}>
        <ClosingCta
          minInvestment={deal.minInvestment}
          targetClose={deal.targetClose}
          cta={cta}
        />

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
