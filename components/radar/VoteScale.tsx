'use client';

/**
 * The vote control.
 *
 * Radar is a vote, not an order. A member is saying "go after this one,
 * and here is how strongly I mean it", so the whole range lives on one
 * scale rather than behind a field and a dropdown. What the scale will
 * not do is land on $37,412: it moves between the round numbers in
 * VOTE_LADDER, which get coarser as they get larger, because that is
 * how people talk about money. $5,000 is a real difference at the
 * bottom of the range and noise at the top.
 *
 * It always opens at $25,000. The minimum reads as the cheapest thing
 * you are allowed to say, and this is a show of hands.
 *
 * Everything here is a courtesy. app/api/radar/interest/route.ts
 * re-checks the minimum, the maximum and the company, and it is the
 * only thing that decides what is stored.
 */
import { useState } from 'react';

import { compact, money } from '@/lib/format';
import {
  VOTE_ANCHORS,
  VOTE_DEFAULT,
  VOTE_LADDER,
  voteIndexOf,
} from '@/lib/terminal/radar';

import s from './Radar.module.css';

export default function VoteScale({
  company,
  current,
  busy,
  error,
  onVote,
  onCancel,
  onRemove,
}: {
  /** Named in the label, so a screen reader knows what is being voted on. */
  company: string;
  /** The member's existing vote, if they are changing one. */
  current: number | null;
  busy: boolean;
  error: string | null;
  onVote: (amount: number) => void;
  /** Present only while changing an existing vote. */
  onCancel?: () => void;
  /** Takes the vote back entirely. Offered only when there is one. */
  onRemove?: () => void;
}) {
  const [index, setIndex] = useState(() =>
    voteIndexOf(current ?? VOTE_DEFAULT),
  );

  const amount = VOTE_LADDER[index];
  const filled = (index / (VOTE_LADDER.length - 1)) * 100;

  return (
    <div className={s.vote}>
      <div className={s.voteHead}>
        <span className={s.voteKey}>{current === null ? 'Your vote' : 'New vote'}</span>
        <span className={s.voteAmount}>{money(amount)}</span>
      </div>

      <input
        className={s.scale}
        type="range"
        min={0}
        max={VOTE_LADDER.length - 1}
        step={1}
        value={index}
        disabled={busy}
        aria-label={`How strongly you want AltSpot to go after ${company}`}
        aria-valuetext={money(amount)}
        onChange={(event) => setIndex(Number(event.target.value))}
        // The filled part of the track, so the scale reads as a level.
        style={{ ['--filled' as string]: `${filled}%` }}
      />

      {/* Anchors, not every stop. Tapping one jumps to it, which is how
          you cross a 39 step ladder on a phone without dragging. */}
      <div className={s.scaleTicks}>
        {VOTE_ANCHORS.map((value) => (
          <button
            key={value}
            type="button"
            className={s.tick}
            data-on={amount === value}
            disabled={busy}
            onClick={() => setIndex(voteIndexOf(value))}
          >
            {compact(value)}
          </button>
        ))}
      </div>

      <div className={s.voteActions}>
        <button
          type="button"
          className="btn btn-vote btn-sm"
          disabled={busy}
          onClick={() => onVote(amount)}
        >
          {busy ? 'Saving' : current === null ? 'Cast your vote' : 'Update vote'}
        </button>

        {onCancel ? (
          <button type="button" className={s.voteSwitch} onClick={onCancel}>
            Cancel
          </button>
        ) : null}

        {onRemove && current !== null ? (
          <button
            type="button"
            className={`${s.voteSwitch} ${s.voteRemove}`}
            onClick={onRemove}
            disabled={busy}
          >
            Remove vote
          </button>
        ) : null}
      </div>

      {error ? <p className={s.hint}>{error}</p> : null}
    </div>
  );
}
