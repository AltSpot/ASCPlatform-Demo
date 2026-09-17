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
 * LAYOUT (Tyler, 2026-09-17: "more balanced, easier to digest"). Four
 * blocks, each under the same small header, each in its own well, in the
 * order a member decides: the raise (the bar, the four figures, the
 * admissions line), the facts as four tiles with a glyph each, three
 * reasons numbered, then who is behind it. The risk line and the door to
 * Spot close it. Nothing is redacted from the earlier edition; it is the
 * same information given a grid.
 *
 * No fee or carry figure: those are on the deal page, behind their
 * switches. Invest goes to /invest, which re-checks every rule (the
 * relationship gate, the per-deal launch date, setup) on the server; a
 * deal this member may only read offers no invest button at all.
 */
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  Eye,
  Layers,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import AskSpot from '@/components/AskSpot';
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

  const facts = [
    {
      icon: CircleDollarSign,
      key: 'Minimum investment',
      value: money(deal.minInvestment),
    },
    { icon: TrendingUp, key: 'Stage', value: deal.stage },
    {
      icon: Layers,
      key: 'Class',
      value: (
        <span className={s.withIcon}>
          <AssetClassIcon assetClass={deal.assetClass} size={11} />
          {klass ?? deal.assetClass}
        </span>
      ),
    },
    {
      icon: Building2,
      key: 'Industry',
      value: deal.industry ? industryLabel(deal.industry) : 'Multi-sector',
    },
  ];

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
            {deal.headline ? <p className={s.headline}>{deal.headline}</p> : null}
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
        {!deal.subscribable && !resume ? (
          <p className={s.viewOnly}>
            <Eye size={15} strokeWidth={1.7} aria-hidden="true" />
            View only. This deal opened before you joined.
          </p>
        ) : null}

        <section className={s.block} aria-labelledby={`${deal.id}-raise`}>
          <h3 className={s.key} id={`${deal.id}-raise`}>
            The raise
          </h3>
          <FundingProgress deal={deal} showAdmissions />
        </section>

        <section className={s.block} aria-labelledby={`${deal.id}-facts`}>
          <h3 className={s.key} id={`${deal.id}-facts`}>
            At a glance
          </h3>
          <dl className={s.facts}>
            {facts.map(({ icon: Icon, key, value }) => (
              <div className={s.fact} key={key}>
                <span className={s.factGlyph} aria-hidden="true">
                  <Icon size={14} strokeWidth={1.6} />
                </span>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {likes.length > 0 ? (
          <section className={s.block} aria-labelledby={`${deal.id}-why`}>
            <h3 className={s.key} id={`${deal.id}-why`}>
              Why we like it
            </h3>
            <ol className={s.likes}>
              {likes.map((point, i) => (
                <li key={point}>
                  <span className={s.num} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span>{firstSentence(point)}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className={s.block} aria-labelledby={`${deal.id}-who`}>
          <h3 className={s.key} id={`${deal.id}-who`}>
            Who is behind it
          </h3>
          <ul className={s.role}>
            <li>
              <ShieldCheck size={14} strokeWidth={1.7} aria-hidden="true" />
              <span>
                <b>Organized and advised by AltSpot.</b> Every deal is its own SPV.
              </span>
            </li>
            {SHOW_SPONSOR_ALIGNMENT ? (
              <li>
                <Users size={14} strokeWidth={1.7} aria-hidden="true" />
                <span>
                  <b>Sponsors invest alongside members.</b>
                </span>
              </li>
            ) : null}
            {deal.backing[0] ? (
              <li className={s.backer}>
                <BackerMark backing={deal.backing[0]} />
              </li>
            ) : null}
          </ul>
        </section>

        <p className={s.risk}>
          Private investments are illiquid and can lose all of their value. Read the full
          deal and its documents before you invest.
        </p>

        <AskSpot
          compact
          lead="Anything unclear about how this works?"
          question="What does the funding bar mean?"
        />
      </div>
    </SidePanel>
  );
}
