'use client';

/**
 * The marketplace: the engine, then its two lanes.
 *
 * WHAT THIS PAGE IS FOR. AltSpot's engine is a loop. Members vote on
 * the Radar for the companies they want; AltSpot sources what the
 * votes point at; the deal lands on the shelf; and because the demand
 * was counted before the deal existed, it fills in days rather than
 * weeks. The shelf is what is open right now and money moves there,
 * so it is front and centre. But the shelf only stays full if members
 * keep voting, so the page has to send them to the Radar as a matter
 * of course, not as an afterthought at the bottom of a scroll.
 *
 * So the page opens with the loop itself, in figures: how many deals
 * are open, how many names are on the Radar, and how many of the open
 * deals came off it. That last number is the proof of the mechanic and
 * it is real, counted from the deals that carry a Radar link. Under it
 * a sticky bar carries two jump pills, Open now and Radar, lit by
 * whichever lane is on screen, so the Radar is one press away from
 * anywhere on the page and is never off the page. Then the two lanes,
 * told apart by their verb: Invest, and Vote.
 *
 * One filter row serves both lanes, on the same bar. Two rows of the
 * same control on one page is chrome the platform is trying to lose.
 * The class chips are the union of what either lane holds.
 *
 * YOURS. One more pill on the bar filters both lanes to what the member
 * saved or voted for, and those cards wear a gold rim whether or not the
 * filter is on. Its count moves the moment a star or a vote does.
 *
 * `?view=radar` still lands on the Radar by scrolling to it: the
 * dashboard links there and Spot reads the query to know which room
 * it is in.
 */
import { Clock, Radar, Sparkles, Star, Store, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import TaxonomyFilters, {
  type TaxonomyFilterState,
} from '@/components/filters/TaxonomyFilters';
import DealShelf from '@/components/marketplace/DealShelf';
import OfferingsGate from '@/components/OfferingsGate';
import RadarBoard from '@/components/radar/RadarBoard';
import HowItWorks from '@/components/HowItWorks';
import type { DealShelfItem, SubscriptionView } from '@/lib/domain';
import {
  LEAD_FILTER_LABEL,
  NO_QUICK_FILTER,
  STAGE_LABEL,
  type QuickFilter,
} from '@/lib/explore';
import { daysLeft, EMPTY } from '@/lib/format';
import type { RelationshipView } from '@/lib/relationship';
import { ASSET_CLASS_KEYS, INDUSTRY_KEYS, isAssetClass, type AssetClass } from '@/lib/taxonomy';
import type { RadarCompanyView } from '@/lib/terminal/radar';

import s from './Marketplace.module.css';

type Lane = 'invest' | 'radar';

export default function MarketplaceLanes({
  deals,
  resumable,
  watched,
  fromRadar,
  votedAmounts = {},
  daySeed = 0,
  companies,
  radarSourced = [],
  forYou = null,
  initialView,
  initialFilter = NO_QUICK_FILTER,
  locked,
}: {
  deals: DealShelfItem[];
  resumable: SubscriptionView[];
  watched: string[];
  /** Deal ids the member voted for on the Radar before they opened. */
  fromRadar: string[];
  /** What the member voted for each of those deals, by deal id. */
  votedAmounts?: Record<string, number>;
  /** Days since the epoch, from the server: rotates the Radar's Featured order. */
  daySeed?: number;
  companies: RadarCompanyView[];
  /** Deals that fit the member's preferences, or null when there are none to apply. */
  forYou?: string[] | null;
  /** Open deals that came off the Radar. Shown as just opened, from the Radar. */
  radarSourced?: string[];
  initialView: 'current' | 'radar';
  /** Where the dashboard's Explore tiles send a member: already filtered. */
  initialFilter?: QuickFilter;
  /**
   * Where the member stands when offerings are not open to them yet. Null
   * once they are. The shelf is empty in that case because the server
   * sent nothing, and the lane says why instead of showing an empty grid.
   */
  locked: RelationshipView | null;
}) {
  const [filter, setFilter] = useState<TaxonomyFilterState>({
    assetClass: initialFilter.assetClass,
    industry: initialFilter.industry,
  });
  /* Who leads and the stage apply to the shelf only, and show as pills a
     member can clear, beside the class and industry row. */
  const [shelfOnly, setShelfOnly] = useState({
    lead: initialFilter.lead,
    stage: initialFilter.stage,
  });
  const [lane, setLane] = useState<Lane>(initialView === 'radar' ? 'radar' : 'invest');
  const [mineOnly, setMineOnly] = useState(false);
  const [forYouOnly, setForYouOnly] = useState(false);
  const [savedIds, setSavedIds] = useState(watched);
  const [votedSlugs, setVotedSlugs] = useState(() =>
    companies.filter((c) => c.yourAmount !== null).map((c) => c.slug),
  );
  const fromRadarSet = useMemo(() => new Set(fromRadar), [fromRadar]);
  const yoursCount =
    deals.filter((d) => savedIds.includes(d.id) || fromRadarSet.has(d.id)).length +
    votedSlugs.length;
  const investRef = useRef<HTMLElement>(null);
  const radarRef = useRef<HTMLElement>(null);

  /* The union of both lanes, so the row describes the page and not one
     half of it. A class present only on the Radar still shows, and
     choosing it leaves the shelf empty and the board filtered, which
     is the honest answer. */
  const counts = useMemo(() => {
    const tally = Object.fromEntries(ASSET_CLASS_KEYS.map((k) => [k, 0])) as Record<AssetClass, number>;
    for (const deal of deals) if (isAssetClass(deal.assetClass)) tally[deal.assetClass] += 1;
    for (const company of companies) tally[company.assetClass] += 1;
    return tally;
  }, [deals, companies]);

  /* Open deals per class, for the quiet count on each chip. */
  const dealCounts = useMemo(() => {
    const tally: Partial<Record<AssetClass, number>> = {};
    for (const deal of deals) {
      if (isAssetClass(deal.assetClass)) tally[deal.assetClass] = (tally[deal.assetClass] ?? 0) + 1;
    }
    return tally;
  }, [deals]);

  const industryCounts = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const deal of deals) if (deal.industry) tally[deal.industry] = (tally[deal.industry] ?? 0) + 1;
    for (const company of companies) tally[company.industry] = (tally[company.industry] ?? 0) + 1;
    return tally;
  }, [deals, companies]);

  const industries = useMemo(
    () => INDUSTRY_KEYS.filter((key) => (industryCounts[key] ?? 0) > 0),
    [industryCounts],
  );

  /* The engine, in four figures a member can act on: what is open, what
     is about to close, what is next, and how many people are shaping
     it. All counted, none claimed. */
  const closingSoon = useMemo(
    () =>
      deals.filter((d) => {
        if (d.redacted) return false;
        const days = daysLeft(d.targetClose);
        return days >= 0 && days <= 14;
      }).length,
    [deals],
  );
  const voters = useMemo(
    () => companies.reduce((sum, c) => sum + c.interestInvestors, 0),
    [companies],
  );

  useEffect(() => {
    if (initialView === 'radar') {
      document.getElementById('radar')?.scrollIntoView({ block: 'start' });
      return;
    }
    const f = initialFilter;
    if (f.assetClass || f.industry || f.lead || f.stage) {
      document.getElementById('open-now')?.scrollIntoView({ block: 'start' });
    }
  }, [initialView, initialFilter]);

  /* Light the pill for whichever lane is under the bar. */
  useEffect(() => {
    const invest = investRef.current;
    const radar = radarRef.current;
    if (!invest || !radar) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setLane(entry.target === radar ? 'radar' : 'invest');
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    observer.observe(invest);
    observer.observe(radar);
    return () => observer.disconnect();
  }, []);

  const jump = (target: Lane) => {
    const el = target === 'radar' ? radarRef.current : investRef.current;
    el?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  return (
    <>
      {/* The loop, stated once, in figures that are true today. */}
      <section className={`card ${s.engine}`} aria-label="How the marketplace works">
        <div className={s.engineCopy}>
          <p className="eyebrow">The engine</p>
          <h1 className={s.engineTitle}>Vote for it. We source it. It fills.</h1>
        </div>
        <div className={s.engineFigures}>
          <button type="button" className={`${s.engineFigure} ${s.engineLive}`} onClick={() => jump('invest')}>
            <span className={s.engineKey}>
              <Store size={14} strokeWidth={1.6} aria-hidden="true" />
              Open now
            </span>
            {/* Before the gate opens the server sends no deals, so a
                count would read "0 open" when the truth is "not shown to
                you yet". A dash says the second thing. */}
            <span className={s.engineValue}>{locked ? EMPTY : deals.length}</span>
          </button>
          <button type="button" className={`${s.engineFigure} ${s.engineHot}`} onClick={() => jump('invest')}>
            <span className={s.engineKey} title="Closing inside 14 days">
              <Clock size={14} strokeWidth={1.6} aria-hidden="true" />
              Closing soon
            </span>
            <span className={s.engineValue}>{locked ? EMPTY : closingSoon}</span>
          </button>
          <button type="button" className={s.engineFigure} onClick={() => jump('radar')}>
            <span className={s.engineKey}>
              <Radar size={14} strokeWidth={1.6} aria-hidden="true" />
              On the Radar
            </span>
            <span className={s.engineValue}>{companies.length}</span>
          </button>
          <button type="button" className={s.engineFigure} onClick={() => jump('radar')}>
            <span className={s.engineKey}>
              <Users size={14} strokeWidth={1.6} aria-hidden="true" />
              Members voting
            </span>
            <span className={s.engineValue}>{voters.toLocaleString('en-US')}</span>
          </button>
        </div>
      </section>

      {/* The bar. Two jump pills and the one filter row, sticky, so the
          Radar is one press away from anywhere on the page. */}
      <div className={s.bar}>
        <div className={s.barStart}>
        <div className={s.lanes} role="group" aria-label="Jump to">
          <button
            type="button"
            className={s.lanePill}
            data-on={lane === 'invest'}
            onClick={() => jump('invest')}
          >
            Open now{locked ? null : <span className={s.laneCount}>{deals.length}</span>}
          </button>
          <button
            type="button"
            className={s.lanePill}
            data-on={lane === 'radar'}
            onClick={() => jump('radar')}
          >
            Radar <span className={s.laneCount}>{companies.length}</span>
          </button>
        </div>
        <button
          type="button"
          className={s.yours}
          aria-pressed={mineOnly}
          onClick={() => setMineOnly((on) => !on)}
          title="Only what you saved or voted for"
        >
          <Star size={13} strokeWidth={1.7} aria-hidden="true" />
          Yours <span className={s.laneCount}>{yoursCount}</span>
        </button>
        {forYou ? (
          <button
            type="button"
            className={s.yours}
            aria-pressed={forYouOnly}
            onClick={() => setForYouOnly((on) => !on)}
            title="Deals that match your preferences"
          >
            <Sparkles size={13} strokeWidth={1.7} aria-hidden="true" />
            For you <span className={s.laneCount}>{forYou.length}</span>
          </button>
        ) : null}
        </div>
        <TaxonomyFilters
          counts={counts}
          industries={industries}
          industryCounts={industryCounts}
          value={filter}
          onChange={setFilter}
          badges={dealCounts}
          inline
        />
        {shelfOnly.lead || shelfOnly.stage ? (
          <div className={s.quickPills}>
            {shelfOnly.lead ? (
              <button
                type="button"
                className={s.quickPill}
                onClick={() => setShelfOnly((f) => ({ ...f, lead: null }))}
                aria-label={`Clear ${LEAD_FILTER_LABEL[shelfOnly.lead]}`}
              >
                {LEAD_FILTER_LABEL[shelfOnly.lead]}
                <X size={12} strokeWidth={1.8} aria-hidden="true" />
              </button>
            ) : null}
            {shelfOnly.stage ? (
              <button
                type="button"
                className={s.quickPill}
                onClick={() => setShelfOnly((f) => ({ ...f, stage: null }))}
                aria-label={`Clear ${STAGE_LABEL[shelfOnly.stage]}`}
              >
                {STAGE_LABEL[shelfOnly.stage]}
                <X size={12} strokeWidth={1.8} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <section className={s.lane} id="open-now" ref={investRef} aria-labelledby="lane-invest">
        <header className={s.laneHead}>
          {!locked && (
            <span className="live-pill">
              <span className="live-dot" aria-hidden="true" />
              Live now
            </span>
          )}
          <h2 className={s.laneTitle} id="lane-invest">
            Invest.
          </h2>
          {locked ? null : <HowItWorks edition="invest" />}
        </header>
        {locked ? (
          <OfferingsGate relationship={locked} />
        ) : (
          <DealShelf
            deals={deals}
            resumable={resumable}
            watched={watched}
            fromRadar={fromRadar}
            votedAmounts={votedAmounts}
            filter={filter}
            bridgeHref="#radar"
            radarSourced={radarSourced}
            onlyIds={forYouOnly && forYou ? forYou : null}
            lead={shelfOnly.lead}
            stage={shelfOnly.stage}
            mineOnly={mineOnly}
            onWatchChange={(id, on) =>
              setSavedIds((ids) => (on ? [...ids.filter((x) => x !== id), id] : ids.filter((x) => x !== id)))
            }
          />
        )}
      </section>

      <section className={s.lane} id="radar" ref={radarRef} aria-labelledby="lane-vote">
        <header className={s.laneHead}>
          <span className={s.votePill}>Vote</span>
          <h2 className={s.laneTitle} id="lane-vote">
            On the Radar.
          </h2>
          <HowItWorks edition="radar" />
          <p className={s.laneLede}>A vote reserves nothing and moves no money.</p>
        </header>
        <RadarBoard
          companies={companies}
          filter={filter}
          mineOnly={mineOnly}
          voted={votedSlugs}
          daySeed={daySeed}
          onVoted={(slug) =>
            setVotedSlugs((slugs) => (slugs.includes(slug) ? slugs : [...slugs, slug]))
          }
        />
      </section>
    </>
  );
}
