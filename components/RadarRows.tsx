'use client';

/**
 * Your votes, on the dashboard: the whole of what the member has said
 * they would back, how it is spread, and a lever on every name.
 *
 * READ AS ONE POOL (Tyler, 2026-09-19). The total used to be a clause in
 * the footer. A member looking here is asking "what do I have spread
 * across these, and do I still mean it?", so the total leads, a share bar
 * shows the spread at a glance (each name in its own colour, which is a
 * key here and nothing else), and each row carries a minus and a plus
 * that move the vote one stop along the Radar's own ladder
 * (lib/vote-pool.ts). Nothing opens and nothing is confirmed: a press
 * changes the figure at once and saves a moment later, so a member can
 * play with the levers and watch the shares move. A failed save puts the
 * figure back and says so.
 *
 * THE LEVERS ARE CLOSED UNTIL ASKED FOR (Tyler, 2026-09-19). Open from
 * the start, a stray press on the way down the dashboard changed a vote.
 * At rest every row is read-only. A pencil opens one name's levers, and
 * "Adjust all" in the header opens every name at once for a member who
 * wants to rebalance; "Done" closes them. Nothing is lost by closing: a
 * change is saved the moment it is made.
 *
 * THE SPREAD is the picture of the whole: one segment a name, as wide as
 * its share of everything voted, in the name's own colour, with the share
 * written under it where there is room. Pointing at a segment lights its
 * row and pointing at a row lights its segment, and an open row stays lit,
 * so a member always sees which part of the bar they are moving.
 *
 * THE LINE OPENS THE COMPANY (Tyler, 2026-09-19). Pressing a row anywhere
 * that is not a lever or a link opens the Radar's own overview of that
 * name in the side panel (components/radar/RadarDetail, the panel Details
 * opens on the marketplace), so a member deciding whether to move a vote
 * can read the case without leaving the dashboard. The name is a real
 * button for the keyboard; the rest of the row is a convenience for the
 * pointer.
 *
 * A VOTE CAN BE TAKEN BACK (Tyler, 2026-09-19). With a name's levers out, a
 * small Remove sits under its figure. It asks once ("Remove? Yes / Keep")
 * because it is the one press here that cannot be nudged back, then the
 * row leaves and the pool re-totals. The platform's other two places to
 * vote (the Radar card and the Watchlist page) offer the same.
 *
 * It is not a budget. Raising one vote takes nothing from another and
 * there is no cap to spend down, because a vote reserves nothing and
 * moves no money. The line under the rows says so, in words.
 *
 * A name the member is already invested in is settled: its vote did its
 * job, so it shows the figure without the levers. The research (market
 * average, target range) stays on Marketplace, Radar.
 *
 * Every write is the marketplace's own API call, validated and audited
 * server side like any other vote.
 */
import { Check, Minus, Pencil, Plus, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import SidePanel from '@/components/SidePanel';
import RadarDetail, { RadarDetailHeader } from '@/components/radar/RadarDetail';
import { brandOf } from '@/lib/brand';
import { ApiError, api } from '@/lib/client/api';
import { money } from '@/lib/format';
import { ASSET_CLASSES, isAssetClass } from '@/lib/taxonomy';
import type { RadarCompanyView } from '@/lib/terminal/radar';
import { canStep, poolShares, poolTotal, stepVote } from '@/lib/vote-pool';

import s from './RadarRows.module.css';

export interface RadarRow {
  slug: string;
  name: string;
  logoUrl?: string;
  assetClass: string;
  /** What the member voted, in integer dollars. */
  voted: number;
  /** What the side panel needs to show this name's overview. */
  detail?: {
    view: RadarCompanyView;
    /** 1-indexed place on the board by dollars voted. */
    rank: number;
    total: number;
    demandShare: number;
  };
  /** Set when the deal sourcing this name is on the shelf right now. */
  live?: {
    dealId: string;
    /** Display date the allocation closes. */
    closes: string;
    /** True once the member has a subscription into it, in any state. */
    subscribed: boolean;
  };
}

/** How long after the last press a vote is saved. */
const SAVE_AFTER_MS = 650;

/** Initials for the monogram: "Anduril Industries" becomes AI. */
function monogram(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function classLabel(key: string): string {
  return isAssetClass(key) ? ASSET_CLASSES[key].label : key;
}

export default function RadarRows({ rows: allRows }: { rows: RadarRow[] }) {
  const router = useRouter();
  const [amounts, setAmounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(allRows.map((row) => [row.slug, row.voted])),
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  /* Which levers are out: one name's, everyone's, or (at rest) nobody's. */
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [openAll, setOpenAll] = useState(false);
  /* The name under the pointer, in the bar or in the list. */
  const [hot, setHot] = useState<string | null>(null);
  /* The name whose overview is open in the side panel. */
  const [panel, setPanel] = useState<string | null>(null);
  /* Names the member has taken back this visit, and the one being asked about. */
  const [gone, setGone] = useState<string[]>([]);
  const [asking, setAsking] = useState<string | null>(null);

  /* The figures as of the last press. State is a render behind, so two
     quick presses would both step from the same value; the handler reads
     and writes this instead. */
  const latest = useRef<Record<string, number>>(
    Object.fromEntries(allRows.map((row) => [row.slug, row.voted])),
  );
  /* What the server last accepted, to fall back to; and one timer a name. */
  const saved = useRef<Record<string, number>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  useEffect(() => {
    saved.current = Object.fromEntries(allRows.map((row) => [row.slug, row.voted]));
  }, [allRows]);
  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

  /* A name taken back this visit leaves at once; the server agrees a moment later. */
  const rows = allRows.filter((row) => !gone.includes(row.slug));

  if (rows.length === 0) {
    return (
      <div className={`card ${s.empty}`}>
        <p className={s.emptyLead}>Tell us what you want to invest in next.</p>
        <p className={s.emptyNote}>
          Vote for the private companies you would back. Enough votes and AltSpot goes and
          sources the deal.
        </p>
        <Link className="btn btn-ghost btn-sm" href="/marketplace?view=radar">
          Vote on what is next →
        </Link>
      </div>
    );
  }

  async function withdraw(row: RadarRow) {
    clearTimeout(timers.current[row.slug]);
    setAsking(null);
    setGone((slugs) => [...slugs, row.slug]);
    setStatus('saving');
    setError(null);
    try {
      await api.withdrawRadarInterest(row.slug);
      setStatus('saved');
      router.refresh();
    } catch (caught) {
      setGone((slugs) => slugs.filter((slug) => slug !== row.slug));
      setStatus('idle');
      setError(
        caught instanceof ApiError
          ? caught.message
          : `Could not remove your vote for ${row.name}. It is still there.`,
      );
    }
  }

  const votes = rows.map((row) => ({ slug: row.slug, amount: amounts[row.slug] ?? row.voted }));
  const total = poolTotal(votes);
  const shares = new Map(poolShares(votes).map((share) => [share.slug, share.percent]));

  const adjustable = rows.filter((row) => !row.live?.subscribed);
  const lit = hot ?? (openAll ? null : openSlug);
  const litRow = lit ? rows.find((row) => row.slug === lit) ?? null : null;

  function nudge(row: RadarRow, direction: 1 | -1) {
    const current = latest.current[row.slug] ?? row.voted;
    const next = stepVote(current, direction);
    if (next === current) return;

    latest.current = { ...latest.current, [row.slug]: next };
    setAmounts(latest.current);
    setError(null);
    setStatus('saving');

    clearTimeout(timers.current[row.slug]);
    timers.current[row.slug] = setTimeout(async () => {
      try {
        await api.indicateRadarInterest(row.slug, next);
        saved.current[row.slug] = next;
        setStatus('saved');
        /* The rest of the dashboard quotes votes too (Needs you, the rail). */
        router.refresh();
      } catch (caught) {
        latest.current = {
          ...latest.current,
          [row.slug]: saved.current[row.slug] ?? row.voted,
        };
        setAmounts(latest.current);
        setStatus('idle');
        setError(
          caught instanceof ApiError
            ? caught.message
            : `Could not save your vote for ${row.name}. It is back where it was.`,
        );
      }
    }, SAVE_AFTER_MS);
  }

  return (
    <div className={`card ${s.card}`}>
      {/* The pool: the total, then how it is spread. */}
      <div className={s.pool}>
        <div className={s.poolHead}>
          <div>
            <span className={s.poolKey}>You have voted</span>
            <span className={s.poolTotal}>{money(total)}</span>
          </div>
          <div className={s.poolSide}>
            <span className={s.poolNote} aria-live="polite">
              {status === 'saved' ? (
                <span className={s.savedTick}>
                  <Check size={13} strokeWidth={2} aria-hidden="true" />
                  Saved
                </span>
              ) : status === 'saving' ? (
                'Saving'
              ) : (
                `across ${rows.length === 1 ? '1 name' : `${rows.length} names`}`
              )}
            </span>
            {adjustable.length > 0 ? (
              <button
                type="button"
                className={s.adjust}
                aria-pressed={openAll}
                onClick={() => {
                  setOpenAll((on) => !on);
                  setOpenSlug(null);
                }}
              >
                {openAll ? (
                  <Check size={14} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <SlidersHorizontal size={14} strokeWidth={1.8} aria-hidden="true" />
                )}
                {openAll ? 'Done' : 'Adjust all'}
              </button>
            ) : null}
          </div>
        </div>

        {/* The spread. One segment a name, as wide as its share. */}
        <div className={s.spread} data-lit={lit ? 'true' : undefined}>
          {rows.map((row) => {
            const share = shares.get(row.slug) ?? 0;
            return (
              <span
                key={row.slug}
                className={s.slice}
                role="img"
                aria-label={`${row.name}: ${Math.round(share)}% of your votes`}
                data-hot={lit === row.slug ? 'true' : undefined}
                onPointerEnter={() => setHot(row.slug)}
                onPointerLeave={() => setHot(null)}
                style={{
                  ['--share' as string]: share,
                  ['--slice' as string]: brandOf(row.slug)?.hue ?? 'var(--as-gold)',
                }}
              >
                <span className={s.sliceBar} />
              </span>
            );
          })}
        </div>
        {/* One line under the bar, and only when there is something to say:
            the name and share of the colour being pointed at, or, with the
            levers out, that changes save themselves. Its height is held so
            the rows below never jump. */}
        <p className={s.readout} aria-live="off">
          {litRow ? (
            <>
              <span
                className={s.key}
                style={{ ['--slice' as string]: brandOf(litRow.slug)?.hue ?? 'var(--as-gold)' }}
                aria-hidden="true"
              />
              <b>{litRow.name}</b>
              <span>{Math.round(shares.get(litRow.slug) ?? 0)}% of your votes</span>
            </>
          ) : openAll ? (
            <span>Changes save on their own.</span>
          ) : null}
        </p>
      </div>

      <ul className={s.rows}>
        {rows.map((row) => {
          const amount = amounts[row.slug] ?? row.voted;
          const settled = Boolean(row.live?.subscribed);
          const open = !settled && (openAll || openSlug === row.slug);
          return (
            <li
              className={s.row}
              key={row.slug}
              data-live={row.live ? 'true' : undefined}
              data-hot={lit === row.slug ? 'true' : undefined}
              data-open={open ? 'true' : undefined}
              data-clickable={row.detail ? 'true' : undefined}
              onPointerEnter={() => setHot(row.slug)}
              onPointerLeave={() => setHot(null)}
              onClick={(event) => {
                /* A lever, the pencil or Invest is its own press. */
                if (!row.detail || (event.target as HTMLElement).closest('button, a')) return;
                setPanel(row.slug);
              }}
            >
              <span className={s.plate} aria-hidden="true">
                {row.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={s.logo} src={row.logoUrl} alt="" />
                ) : (
                  <span className={s.monogram}>{monogram(row.name)}</span>
                )}
              </span>

              <span className={s.who}>
                <span className={s.name}>
                  <span
                    className={s.key}
                    style={{ ['--slice' as string]: brandOf(row.slug)?.hue ?? 'var(--as-gold)' }}
                    aria-hidden="true"
                  />
                  {row.detail ? (
                    <button
                      type="button"
                      className={s.nameButton}
                      onClick={() => setPanel(row.slug)}
                      aria-label={`${row.name}: open the overview`}
                    >
                      {row.name}
                    </button>
                  ) : (
                    row.name
                  )}
                </span>
                {row.live ? (
                  <span className={s.statusLine} data-live="true">
                    <span className="live-dot" aria-hidden="true" />
                    {row.live.subscribed
                      ? 'Open now · you are in'
                      : `Open now · closes ${row.live.closes}`}
                    {row.live.subscribed ? null : (
                      <Link className={s.investLink} href={`/deals/${row.live.dealId}`}>
                        Invest →
                      </Link>
                    )}
                  </span>
                ) : (
                  <span className={s.statusLine}>{classLabel(row.assetClass)} · Tracking</span>
                )}
              </span>

              <span className={s.lever}>
                {!open ? (
                  <span className={s.slot} aria-hidden="true" />
                ) : (
                  <button
                    type="button"
                    className={s.step}
                    onClick={() => nudge(row, -1)}
                    disabled={!canStep(amount, -1)}
                    aria-label={`Lower your vote for ${row.name}`}
                  >
                    <Minus size={15} strokeWidth={2} aria-hidden="true" />
                  </button>
                )}
                <span className={s.figure}>
                  <span className={s.voteValue}>{money(amount)}</span>
                  {open && asking === row.slug ? (
                    <span className={s.ask}>
                      Remove?
                      <button type="button" className={s.askYes} onClick={() => withdraw(row)}>
                        Yes
                      </button>
                      <button type="button" className={s.askNo} onClick={() => setAsking(null)}>
                        Keep
                      </button>
                    </span>
                  ) : open ? (
                    <button
                      type="button"
                      className={s.removeVote}
                      onClick={() => setAsking(row.slug)}
                      aria-label={`Remove your vote for ${row.name}`}
                    >
                      Remove vote
                    </button>
                  ) : (
                    <span className={s.share}>{shares.get(row.slug) ?? 0}% of your votes</span>
                  )}
                </span>
                {!open ? (
                  <span className={s.slot} aria-hidden="true" />
                ) : (
                  <button
                    type="button"
                    className={s.step}
                    onClick={() => nudge(row, 1)}
                    disabled={!canStep(amount, 1)}
                    aria-label={`Raise your vote for ${row.name}`}
                  >
                    <Plus size={15} strokeWidth={2} aria-hidden="true" />
                  </button>
                )}

                {/* One name's levers: a pencil to open, a tick to close. While
                    every name is open the header's Done closes them together. */}
                {settled || openAll ? (
                  <span className={s.slot} aria-hidden="true" />
                ) : open ? (
                  <button
                    type="button"
                    className={s.edit}
                    data-on="true"
                    onClick={() => setOpenSlug(null)}
                    aria-label={`Done changing your vote for ${row.name}`}
                  >
                    <Check size={15} strokeWidth={2} aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={s.edit}
                    onClick={() => setOpenSlug(row.slug)}
                    aria-label={`Change your vote for ${row.name}`}
                  >
                    <Pencil size={14} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                )}
              </span>

            </li>
          );
        })}
      </ul>

      {rows.map((row) =>
        row.detail ? (
          <SidePanel
            key={row.slug}
            open={panel === row.slug}
            onClose={() => setPanel(null)}
            label={`${row.name}: overview`}
            header={
              <RadarDetailHeader
                company={row.detail.view}
                plate={
                  row.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={s.logo} src={row.logoUrl} alt="" aria-hidden="true" />
                  ) : (
                    <span className={s.monogram} aria-hidden="true">
                      {monogram(row.name)}
                    </span>
                  )
                }
                vote={
                  <span className="chip">
                    You voted {money(amounts[row.slug] ?? row.voted)}
                  </span>
                }
              />
            }
          >
            <RadarDetail
              company={row.detail.view}
              rank={row.detail.rank}
              total={row.detail.total}
              demandShare={row.detail.demandShare}
              dealHref={row.live ? `/deals/${row.live.dealId}` : undefined}
            />
          </SidePanel>
        ) : null,
      )}

      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={s.foot}>
        <Link className={s.more} href="/marketplace?view=radar">
          Vote on more names →
        </Link>
        <span className={s.legal}>A vote reserves nothing and moves no money.</span>
      </div>
    </div>
  );
}
