'use client';

/**
 * A deal, at a glance, in the side panel.
 *
 * WHY IT EXISTS. A member comparing ten deals had two choices: judge a
 * card with a name and a bar on it, or open ten pages. The quick look
 * is the middle: everything needed to decide whether this is the one,
 * without leaving the shelf, and the two doors out, the full deal and
 * the invest flow. It adds no step to investing; the card's own button
 * still goes straight to the deal.
 *
 * WHAT IT SHOWS, figures first: the funding picture (raised, minimum to
 * close, closing date, escrow, admissions), four facts, three reasons we
 * like it cut to one sentence each, AltSpot's role, and the risk line.
 * No fee or carry figure: those are on the deal page, behind their
 * switches. Invest goes to /invest, which re-checks every rule (the
 * relationship gate, the per-deal launch date, setup) on the server; a
 * deal this member may only read offers no invest button at all.
 */
import { ArrowRight, Check, Eye, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';

import AssetClassIcon from '@/components/AssetClassIcon';
import BackerMark from '@/components/BackerMark';
import FundingProgress from '@/components/FundingProgress';
import SidePanel from '@/components/SidePanel';
import WaitlistButton from '@/components/WaitlistButton';
import { SHOW_SPONSOR_ALIGNMENT } from '@/lib/config';
import type { DealView, SubscriptionView } from '@/lib/domain';
import { money } from '@/lib/format';
import { dealChip } from '@/lib/funding';
import { ASSET_CLASSES, industryLabel, isAssetClass } from '@/lib/taxonomy';

import s from './DealPeek.module.css';

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : text).trim();
}

export default function DealPeek({
  deal,
  resume,
  open,
  onClose,
}: {
  deal: DealView;
  resume?: SubscriptionView;
  open: boolean;
  onClose: () => void;
}) {
  const likes = (deal.whatWeLike.length > 0 ? deal.whatWeLike : deal.thesis).slice(0, 3);
  const klass = isAssetClass(deal.assetClass) ? ASSET_CLASSES[deal.assetClass].label : null;

  const invest = resume ? (
    resume.state === 'docs_signed' ? (
      <Link className="btn btn-action" href={`/payment/${resume.id}`}>
        Complete investment
      </Link>
    ) : (
      <Link className="btn btn-action" href={`/invest/${deal.id}`}>
        Finish signing
      </Link>
    )
  ) : deal.subscribable && !deal.youAreIn && deal.members > 0 && deal.members >= deal.investorCap ? (
    <WaitlistButton dealId={deal.id} />
  ) : deal.subscribable ? (
    <Link className="btn btn-gold" href={`/invest/${deal.id}`}>
      Invest
      <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
    </Link>
  ) : null;

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      label={`${deal.name}: quick look`}
      width="wide"
      header={
        <div className={s.head}>
          <span className={s.mark} style={{ background: deal.art }}>
            {deal.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={deal.logoUrl} alt="" aria-hidden="true" />
            ) : null}
          </span>
          <div className={s.who}>
            <span className="chip">{dealChip(deal)}</span>
            <h2 className={s.name}>{deal.name}</h2>
          </div>
        </div>
      }
      footer={
        <>
          <Link className="btn btn-ghost" href={`/deals/${deal.id}`}>
            Full deal
          </Link>
          {invest}
        </>
      }
    >
      <div className={s.body}>
        {deal.headline ? <p className={s.headline}>{deal.headline}</p> : null}

        {!deal.subscribable && !resume ? (
          <p className={s.viewOnly}>
            <Eye size={15} strokeWidth={1.7} aria-hidden="true" />
            View only. This deal opened before you joined.
          </p>
        ) : null}

        <section className={s.block}>
          <FundingProgress deal={deal} showAdmissions />
        </section>

        <dl className={s.facts}>
          <div>
            <dt>Minimum investment</dt>
            <dd>{money(deal.minInvestment)}</dd>
          </div>
          <div>
            <dt>Stage</dt>
            <dd>{deal.stage}</dd>
          </div>
          <div>
            <dt>Class</dt>
            <dd className={s.withIcon}>
              <AssetClassIcon assetClass={deal.assetClass} size={11} />
              {klass ?? deal.assetClass}
            </dd>
          </div>
          <div>
            <dt>Industry</dt>
            <dd>{deal.industry ? industryLabel(deal.industry) : 'Multi-sector'}</dd>
          </div>
        </dl>

        {likes.length > 0 ? (
          <section className={s.block}>
            <div className={s.key}>Why we like it</div>
            <ul className={s.likes}>
              {likes.map((point) => (
                <li key={point}>
                  <Check size={14} strokeWidth={2} aria-hidden="true" />
                  {firstSentence(point)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className={s.role}>
          <span>
            <ShieldCheck size={13} strokeWidth={1.7} aria-hidden="true" />
            Organized and advised by AltSpot
          </span>
          {SHOW_SPONSOR_ALIGNMENT ? (
            <span>
              <Users size={13} strokeWidth={1.7} aria-hidden="true" />
              Sponsors invest alongside members
            </span>
          ) : null}
          {deal.backing[0] ? <BackerMark backing={deal.backing[0]} /> : null}
        </div>

        <p className={s.risk}>
          Private investments are illiquid and can lose all of their value. Read the full
          deal and its documents before you invest.
        </p>
      </div>
    </SidePanel>
  );
}
