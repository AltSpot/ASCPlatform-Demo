'use client';

/**
 * The Watchlist page: one search to add, then two short lists.
 *
 * NOT A SECOND MARKETPLACE. The marketplace is a grid built for finding;
 * this is a list built for keeping. So there are no cards, no filters
 * and no demand figures here, and nothing appears that the member did
 * not put here themselves. A saved deal is a row with its bar and its
 * close. A vote is a row with the member's own amount and whether the
 * name has become a deal.
 *
 * ADDING IS ONE BOX. Type a name and the matches from both lanes come
 * up: a deal saves with one press, a Radar name takes a vote with one
 * press on an amount. Focused and empty, it suggests what is loudest
 * and not already on the list, so a member with an empty page has
 * something to press before they have thought of a name.
 *
 * Every write is the marketplace's own (api.watchDeal, api.unwatchDeal,
 * api.indicateRadarInterest) and the server re-checks all of it. Rows
 * change optimistically and put themselves back if a write fails.
 */
import {
  ArrowRight,
  CircleCheck,
  Pencil,
  Plus,
  Radar,
  Search,
  Star,
  Store,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import AssetClassIcon from '@/components/AssetClassIcon';
import CollapsibleSection from '@/components/CollapsibleSection';
import CompanyMark from '@/components/CompanyMark';
import ExploreTiles from '@/components/ExploreTiles';
import DealPeek from '@/components/marketplace/DealPeek';
import { useToast } from '@/components/Toast';
import { api, ApiError } from '@/lib/client/api';
import type { DealView } from '@/lib/domain';
import type { ExploreGroup } from '@/lib/explore';
import { dateStr, daysLeft, money } from '@/lib/format';
import { fundingView } from '@/lib/funding';

import s from './Watchlist.module.css';

/** What a row and the search need from a Radar company. */
export interface WatchCompany {
  slug: string;
  name: string;
  logoUrl: string | null;
  assetClass: string;
  yourAmount: number | null;
  yourRank: number | null;
  dealId: string | null;
  minIndication: number;
}

/** Three amounts, not the whole ladder. The marketplace has the scale. */
const QUICK_VOTES = [25_000, 100_000, 500_000] as const;

/** Inside this many days the close stops being background. */
const CLOSING_SOON_DAYS = 14;

/** How many suggestions an empty, focused search offers from each lane. */
const SUGGEST_EACH = 3;

function short(amount: number): string {
  return amount >= 1_000_000 ? `$${amount / 1_000_000}M` : `$${amount / 1_000}K`;
}

export default function WatchlistBoard({
  deals,
  watched: initialWatched,
  companies,
  subscribed,
  locked,
  explore,
}: {
  /** Open deals this member may see. Empty before the gate opens. */
  deals: DealView[];
  /** Saved deal ids, in the member's own order. */
  watched: string[];
  /** The whole Radar, loudest first. */
  companies: WatchCompany[];
  /** Deal ids the member already has a subscription into. */
  subscribed: string[];
  /** True until offerings open to this member. */
  locked: boolean;
  /** The Explore slices of the shelf (lib/explore.ts), for the foot of the page. */
  explore?: ExploreGroup[];
}) {
  const toast = useToast();

  const [watched, setWatched] = useState(initialWatched);
  /* View opens the deal's quick look here rather than leaving the page
     (Tyler, 2026-09-17); the full deal is one press further inside it. */
  const [peek, setPeek] = useState<DealView | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      companies
        .filter((c) => c.yourAmount !== null)
        .map((c) => [c.slug, c.yourAmount as number]),
    ),
  );

  const dealById = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals]);
  const inIt = useMemo(() => new Set(subscribed), [subscribed]);

  const savedDeals = watched
    .map((id) => dealById.get(id))
    .filter((deal): deal is DealView => deal !== undefined);

  /* The member's own ranked order first, then newest votes last. */
  const votedCompanies = companies
    .filter((c) => votes[c.slug] !== undefined)
    .sort((a, b) => (a.yourRank ?? Infinity) - (b.yourRank ?? Infinity));

  async function save(deal: DealView) {
    if (watched.includes(deal.id)) return;
    setWatched((list) => [...list, deal.id]);
    try {
      await api.watchDeal(deal.id);
      toast(
        <>
          <b>{deal.name}</b> is on your watchlist.
        </>,
      );
    } catch {
      setWatched((list) => list.filter((id) => id !== deal.id));
      toast('That did not save. Try again.');
    }
  }

  async function unsave(deal: DealView) {
    const before = watched;
    setWatched((list) => list.filter((id) => id !== deal.id));
    try {
      await api.unwatchDeal(deal.id);
    } catch {
      setWatched(before);
      toast('That did not save. Try again.');
    }
  }

  /** Resolves true when the vote is stored. */
  async function vote(company: WatchCompany, amount: number): Promise<boolean> {
    const before = votes[company.slug];
    setVotes((all) => ({ ...all, [company.slug]: amount }));
    try {
      await api.indicateRadarInterest(company.slug, amount);
      toast(
        <>
          Vote counted. <b>{company.name}</b> is on your watchlist.
        </>,
      );
      return true;
    } catch (caught) {
      setVotes((all) => {
        const next = { ...all };
        if (before === undefined) delete next[company.slug];
        else next[company.slug] = before;
        return next;
      });
      toast(caught instanceof ApiError ? caught.message : 'That did not save. Try again.');
      return false;
    }
  }

  const empty = savedDeals.length === 0 && votedCompanies.length === 0;

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Watchlist</div>
          <h1 className="display">What you are following.</h1>
          <p className="sub">Deals you saved and companies you voted for. Private to you.</p>
        </div>
        <Link className="btn btn-ghost btn-sm" href="/marketplace">
          <Store size={15} strokeWidth={1.6} aria-hidden="true" />
          Browse the marketplace
        </Link>
      </div>

      <Finder
        deals={locked ? [] : deals.filter((d) => !watched.includes(d.id) && !inIt.has(d.id))}
        /* A name that is already an open deal is offered as the deal. */
        companies={companies.filter(
          (c) => votes[c.slug] === undefined && !(c.dealId && dealById.has(c.dealId)),
        )}
        onSave={save}
        onVote={vote}
      />

      {empty ? (
        <section className={`card ${s.empty}`}>
          <span className={s.emptyMark} aria-hidden="true">
            <Star size={20} strokeWidth={1.5} />
          </span>
          <h2 className={s.emptyTitle}>Nothing on your watchlist yet.</h2>
          <p className={s.emptyNote}>
            Save a deal you are weighing, or vote for a company you want AltSpot to go
            after. Both land here.
          </p>
          <Link className="btn btn-primary btn-sm" href="/marketplace">
            Explore investments
            <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <div className={s.pair}>
          <section className={`card ${s.list}`} aria-labelledby="watch-deals">
            <header className={s.listHead}>
              <h2 className={s.listTitle} id="watch-deals">
                <Star size={15} strokeWidth={1.6} aria-hidden="true" />
                Saved deals
              </h2>
              <span className={s.count}>{savedDeals.length}</span>
            </header>

            {savedDeals.length === 0 ? (
              <p className={s.none}>
                {locked
                  ? 'Deals appear here once offerings open to you.'
                  : 'No deals saved. Use the search above, or the star on any deal.'}
              </p>
            ) : (
              <ul className={s.rows}>
                {savedDeals.map((deal) => (
                  <DealRow
                    key={deal.id}
                    deal={deal}
                    subscribed={inIt.has(deal.id)}
                    onRemove={() => unsave(deal)}
                    onView={() => setPeek(deal)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className={`card ${s.list}`} aria-labelledby="watch-votes">
            <header className={s.listHead}>
              <h2 className={s.listTitle} id="watch-votes">
                <Radar size={15} strokeWidth={1.6} aria-hidden="true" />
                Your votes
              </h2>
              <span className={s.count}>{votedCompanies.length}</span>
            </header>

            {votedCompanies.length === 0 ? (
              <p className={s.none}>No votes yet. Search a company above to cast one.</p>
            ) : (
              <ul className={s.rows}>
                {votedCompanies.map((company) => (
                  <VoteRow
                    key={company.slug}
                    company={company}
                    amount={votes[company.slug]}
                    deal={company.dealId ? dealById.get(company.dealId) : undefined}
                    onVote={(amount) => vote(company, amount)}
                    onView={(deal) => setPeek(deal)}
                  />
                ))}
              </ul>
            )}

            <p className={s.foot}>A vote reserves nothing and moves no money.</p>
          </section>
        </div>
      )}

      {explore && explore.length > 0 ? (
        <div className={s.explore}>
          <CollapsibleSection
            id="explore"
            scope="watchlist"
            title="Explore"
            action={
              <Link className={s.exploreLink} href="/marketplace">
                All deals →
              </Link>
            }
          >
            <ExploreTiles groups={explore} />
          </CollapsibleSection>
        </div>
      ) : null}

      {peek ? (
        <DealPeek deal={peek} open onClose={() => setPeek(null)} />
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */

function Finder({
  deals,
  companies,
  onSave,
  onVote,
}: {
  deals: DealView[];
  companies: WatchCompany[];
  onSave: (deal: DealView) => void;
  onVote: (company: WatchCompany, amount: number) => Promise<boolean>;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [choosing, setChoosing] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();

  const q = query.trim().toLowerCase();
  const matchedDeals = q
    ? deals.filter((d) => d.name.toLowerCase().includes(q))
    : deals.slice(0, SUGGEST_EACH);
  const matchedCompanies = q
    ? companies.filter((c) => c.name.toLowerCase().includes(q))
    : companies.slice(0, SUGGEST_EACH);
  const nothing = matchedDeals.length === 0 && matchedCompanies.length === 0;

  const close = () => {
    setOpen(false);
    setChoosing(null);
  };

  /* A press anywhere outside the box closes the results (Tyler,
     2026-09-17: "hard to close"), alongside Escape and the Done button. */
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!box.current?.contains(event.target as Node | null)) close();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div
      className={s.finder}
      ref={box}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          close();
          (event.currentTarget.querySelector('input') as HTMLInputElement | null)?.blur();
        }
      }}
    >
      <label className={s.field}>
        <Search size={17} strokeWidth={1.6} aria-hidden="true" />
        <span className="sr-only">Add a deal or company</span>
        <input
          className={s.input}
          type="search"
          value={query}
          placeholder="Add a deal or company"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setChoosing(null);
            setOpen(true);
          }}
        />
        {query ? (
          <button
            type="button"
            className={s.clear}
            onClick={() => setQuery('')}
            aria-label="Clear"
          >
            <X size={15} strokeWidth={1.6} aria-hidden="true" />
          </button>
        ) : null}
      </label>

      {open ? (
        <div className={s.results} id={listId} role="listbox" aria-label="Matches">
          <button
            type="button"
            className={s.done}
            onClick={close}
            aria-label="Close the results"
          >
            <X size={14} strokeWidth={1.8} aria-hidden="true" />
            Close
          </button>
          {nothing ? (
            <p className={s.none}>
              {q ? `Nothing matches “${query.trim()}” that is not already here.` : 'Everything is already on your watchlist.'}
            </p>
          ) : (
            <>
              {!q ? <p className={s.resultsKey}>Suggestions</p> : null}
              {/* The whole row is the press (Tyler, 2026-09-17): a deal
                  saves, a Radar name opens its three amounts. The button
                  on the right says what the press will do. */}
              {matchedDeals.map((deal) => (
                <div
                  className={`${s.result} ${s.resultPress}`}
                  key={deal.id}
                  role="option"
                  aria-selected={false}
                  tabIndex={0}
                  onClick={() => onSave(deal)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSave(deal);
                    }
                  }}
                >
                  <CompanyMark name={deal.name} logoUrl={deal.logoUrl} size={32} />
                  <span className={s.resultWho}>
                    <b>{deal.name}</b>
                    <span className={s.kind}>
                      <Store size={12} strokeWidth={1.6} aria-hidden="true" />
                      Open deal
                    </span>
                  </span>
                  <span className={`btn btn-ghost btn-sm ${s.resultHint}`} aria-hidden="true">
                    <Star size={14} strokeWidth={1.6} />
                    Save
                  </span>
                </div>
              ))}
              {matchedCompanies.map((company) => (
                <div
                  className={
                    choosing === company.slug ? s.result : `${s.result} ${s.resultPress}`
                  }
                  key={company.slug}
                  role="option"
                  aria-selected={choosing === company.slug}
                  tabIndex={choosing === company.slug ? -1 : 0}
                  onClick={() => {
                    if (choosing !== company.slug) setChoosing(company.slug);
                  }}
                  onKeyDown={(event) => {
                    if (choosing !== company.slug && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      setChoosing(company.slug);
                    }
                  }}
                >
                  <CompanyMark name={company.name} logoUrl={company.logoUrl} size={32} />
                  <span className={s.resultWho}>
                    <b>{company.name}</b>
                    <span className={s.kind}>
                      <Radar size={12} strokeWidth={1.6} aria-hidden="true" />
                      On the Radar
                    </span>
                  </span>
                  {choosing === company.slug ? (
                    <QuickVote
                      name={company.name}
                      min={company.minIndication}
                      onVote={async (amount) => {
                        if (await onVote(company, amount)) setChoosing(null);
                      }}
                      onCancel={() => setChoosing(null)}
                    />
                  ) : (
                    <span className={`btn btn-ghost btn-sm ${s.resultHint}`} aria-hidden="true">
                      <Plus size={14} strokeWidth={1.6} />
                      Vote
                    </span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Three amounts as pills. A press is the vote. */
function QuickVote({
  name,
  min,
  current,
  onVote,
  onCancel,
}: {
  name: string;
  min: number;
  current?: number;
  onVote: (amount: number) => void;
  onCancel: () => void;
}) {
  return (
    <span className={s.quick} role="group" aria-label={`Vote on ${name}`}>
      {QUICK_VOTES.filter((amount) => amount >= min).map((amount) => (
        <button
          type="button"
          key={amount}
          className={s.amount}
          data-on={current === amount}
          onClick={() => onVote(amount)}
          aria-label={`Vote ${money(amount)}`}
        >
          {short(amount)}
        </button>
      ))}
      <button type="button" className={s.iconButton} onClick={onCancel} aria-label="Cancel">
        <X size={14} strokeWidth={1.6} aria-hidden="true" />
      </button>
    </span>
  );
}

function DealRow({
  deal,
  subscribed,
  onRemove,
  onView,
}: {
  deal: DealView;
  subscribed: boolean;
  onRemove: () => void;
  onView: () => void;
}) {
  /* Against the minimum to close, like every funding bar (lib/funding.ts). */
  const pct = fundingView(deal).toMinimumPct;
  const days = daysLeft(deal.targetClose);
  const soon = days > 0 && days <= CLOSING_SOON_DAYS;

  return (
    <li className={s.row}>
      <CompanyMark name={deal.name} logoUrl={deal.logoUrl} size={36} />

      <div className={s.body}>
        <div className={s.top}>
          <b className={s.name}>{deal.name}</b>
          <AssetClassIcon assetClass={deal.assetClass} size={12} />
        </div>
        <div className={s.meter}>
          <div className={s.bar} aria-label={`${pct}% of the minimum raised`} role="img">
            <div className={s.fill} style={{ width: `${Math.max(2, pct)}%` }} />
          </div>
          <span className={s.closes} data-soon={soon}>
            {days <= 0 ? 'Closed' : soon ? `${days} days left` : `Closes ${dateStr(deal.targetClose)}`}
          </span>
        </div>
      </div>

      <div className={s.actions}>
        {subscribed ? <span className={s.inIt}>You are in</span> : null}
        <button type="button" className={s.go} onClick={onView}>
          View
          <ArrowRight size={12} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${s.iconButton} ${s.starOn}`}
          onClick={onRemove}
          aria-label={`Remove ${deal.name} from your watchlist`}
          title="Remove"
        >
          <Star size={15} strokeWidth={1.6} fill="currentColor" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

function VoteRow({
  company,
  amount,
  deal,
  onVote,
  onView,
}: {
  company: WatchCompany;
  amount: number;
  /** The open deal this name became, when the member may see it. */
  deal?: DealView;
  onVote: (amount: number) => Promise<boolean>;
  onView: (deal: DealView) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className={s.row}>
      <CompanyMark name={company.name} logoUrl={company.logoUrl} size={36} />

      <div className={s.body}>
        <div className={s.top}>
          <b className={s.name}>{company.name}</b>
          <AssetClassIcon assetClass={company.assetClass} size={12} />
        </div>
        {deal ? (
          <span className={s.live}>
            <span className="live-dot" aria-hidden="true" />
            Now open
          </span>
        ) : (
          <span className={s.tracking}>Tracking</span>
        )}
      </div>

      <div className={s.actions}>
        {editing ? (
          <QuickVote
            name={company.name}
            min={company.minIndication}
            current={amount}
            onVote={async (next) => {
              if (await onVote(next)) setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <span className={s.voted}>
              <CircleCheck size={14} strokeWidth={1.7} aria-hidden="true" />
              <span className="sr-only">You voted </span>
              {money(amount)}
            </span>
            {deal ? (
              <button type="button" className={s.go} onClick={() => onView(deal)}>
                View
                <ArrowRight size={12} strokeWidth={1.8} aria-hidden="true" />
              </button>
            ) : null}
            <button
              type="button"
              className={s.iconButton}
              onClick={() => setEditing(true)}
              aria-label={`Change your vote on ${company.name}`}
              title="Change your vote"
            >
              <Pencil size={14} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
