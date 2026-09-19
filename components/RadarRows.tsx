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
import { Check, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { brandOf } from '@/lib/brand';
import { ApiError, api } from '@/lib/client/api';
import { money } from '@/lib/format';
import { ASSET_CLASSES, isAssetClass } from '@/lib/taxonomy';
import { canStep, poolShares, poolTotal, stepVote } from '@/lib/vote-pool';

import s from './RadarRows.module.css';

export interface RadarRow {
  slug: string;
  name: string;
  logoUrl?: string;
  assetClass: string;
  /** What the member voted, in integer dollars. */
  voted: number;
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

export default function RadarRows({ rows }: { rows: RadarRow[] }) {
  const router = useRouter();
  const [amounts, setAmounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(rows.map((row) => [row.slug, row.voted])),
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  /* The figures as of the last press. State is a render behind, so two
     quick presses would both step from the same value; the handler reads
     and writes this instead. */
  const latest = useRef<Record<string, number>>(
    Object.fromEntries(rows.map((row) => [row.slug, row.voted])),
  );
  /* What the server last accepted, to fall back to; and one timer a name. */
  const saved = useRef<Record<string, number>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  useEffect(() => {
    saved.current = Object.fromEntries(rows.map((row) => [row.slug, row.voted]));
  }, [rows]);
  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

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

  const votes = rows.map((row) => ({ slug: row.slug, amount: amounts[row.slug] ?? row.voted }));
  const total = poolTotal(votes);
  const shares = new Map(poolShares(votes).map((share) => [share.slug, share.percent]));

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
        </div>

        <div className={s.spread} role="img" aria-label="How your votes are spread">
          {rows.map((row) => (
            <span
              key={row.slug}
              className={s.slice}
              title={`${row.name}: ${shares.get(row.slug) ?? 0}%`}
              style={{
                ['--share' as string]: `${shares.get(row.slug) ?? 0}%`,
                ['--slice' as string]: brandOf(row.slug)?.hue ?? 'var(--as-gold)',
              }}
            />
          ))}
        </div>
        <p className={s.poolHint}>
          Use the minus and plus to move your votes around. Changes save on their own.
        </p>
      </div>

      <ul className={s.rows}>
        {rows.map((row) => {
          const amount = amounts[row.slug] ?? row.voted;
          const settled = Boolean(row.live?.subscribed);
          return (
            <li className={s.row} key={row.slug} data-live={row.live ? 'true' : undefined}>
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
                  {row.name}
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

              <span className={s.lever} data-settled={settled ? 'true' : undefined}>
                {settled ? null : (
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
                  <span className={s.share}>{shares.get(row.slug) ?? 0}% of your votes</span>
                </span>
                {settled ? null : (
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
              </span>

            </li>
          );
        })}
      </ul>

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
