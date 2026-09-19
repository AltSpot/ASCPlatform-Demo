/**
 * The cover: the film on the left, the ask on the right.
 *
 * WHY THE VIDEO LEADS. The page is a pitch, and a pitch that opens with
 * four paragraphs asks the reader to do the work before they know
 * whether they care. A founder on film for two minutes settles that
 * faster than any headline, so it goes first, at full width, next to the
 * only three things a member needs in order to act: what it is, what it
 * costs to join, and the button. Everything else is below, in the order
 * an investor actually reads.
 *
 * A deal with no film keeps the frame and fills it with the deal's own
 * artwork and mark, so the hero has the same shape either way and a
 * missing walkthrough is not a hole in the page.
 *
 * THE FUNDING PICTURE (work order screen 5). Every deal raises into
 * escrow and closes when its minimum is met, so the strip under the ask
 * is RAISED SO FAR, MINIMUM TO CLOSE, CLOSING DATE and ESCROW STATUS, with
 * the bar measured against the minimum (components/FundingProgress). The
 * deal type chip says who leads. Under it, on every deal, AltSpot's role:
 * organizer and adviser. The alignment chip carries no figure, no entity
 * and no mechanism, and is a config switch (SHOW_SPONSOR_ALIGNMENT). No
 * fee or carry figure appears in the hero; those are in the terms, behind
 * their own switches.
 */
import type { ReactNode } from 'react';

import { Radar, ShieldCheck, Users } from 'lucide-react';

import BackerMark from '@/components/BackerMark';
import FundingProgress from '@/components/FundingProgress';
import Term from '@/components/Term';
import { SHOW_SPONSOR_ALIGNMENT } from '@/lib/config';
import type { DealView } from '@/lib/domain';
import { money } from '@/lib/format';
import { dealChip } from '@/lib/funding';

import s from './Deal.module.css';

export default function DealHero({
  deal,
  cta,
  tools,
  votedAmount = null,
}: {
  deal: DealView;
  cta: ReactNode;
  /** Header controls, set hard right: the watchlist toggle today. */
  tools?: ReactNode;
  /** What this member voted for the company on the Radar, if they did. */
  votedAmount?: number | null;
}) {
  return (
    <header className={s.hero}>
      <div className={s.heroWash} style={{ background: deal.art }} aria-hidden="true" />

      <div className={s.heroGrid}>
        <div className={s.film}>
          {deal.videoUrl ? (
            <video className={s.filmVideo} src={deal.videoUrl} controls playsInline />
          ) : (
            <div className={s.filmEmpty} style={{ background: deal.art }}>
              {deal.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={s.filmMark} src={deal.logoUrl} alt="" aria-hidden="true" />
              )}
              {/* No play control and no "film to come" tag while the slot
                  is empty. A dead play button on the lead deal reads as an
                  unfinished page, and this panel is the first thing in
                  frame in both demo films. When `videoUrl` is set the
                  branch above renders the real player. */}
              <span className={s.filmLabel}>{deal.name}</span>
            </div>
          )}
        </div>

        <div className={s.ask}>
          <div className={s.heroTop}>
            <div className={s.identity}>
              {deal.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={s.logo} src={deal.logoUrl} alt="" aria-hidden="true" />
              )}
              <span className={s.name}>{deal.name}</span>
            </div>
            {tools}
          </div>

          <div className={s.heroChips}>
            <span className="chip">{dealChip(deal)}</span>
            {votedAmount ? (
              <span className={s.votedChip}>
                <Radar size={12} strokeWidth={2} aria-hidden="true" />
                You voted {money(votedAmount)} for this on the Radar
              </span>
            ) : null}
          </div>

          <h1 className={s.headline}>{deal.headline ?? deal.blurb}</h1>

          <p className={s.heroMeta}>
            <span>{deal.sector}</span>
            <i>/</i>
            <span>{deal.stage}</span>
            {deal.backing[0] ? (
              <>
                <i>/</i>
                <BackerMark backing={deal.backing[0]} />
              </>
            ) : null}
          </p>

          <div className={s.actions}>{cta}</div>

        </div>
      </div>

      {/* The funding picture, across the full width of the cover. */}
      <div className={s.heroFunding}>
        <FundingProgress deal={deal} showAdmissions layout="row" />
        <div className={s.heroRole}>
          <span className={s.organized}>
            <ShieldCheck size={13} strokeWidth={1.7} aria-hidden="true" />
            <Term q="What is an SPV?" quiet>
              Organized and advised by AltSpot
            </Term>
          </span>
          {SHOW_SPONSOR_ALIGNMENT ? (
            <span className={s.alignment}>
              <Users size={13} strokeWidth={1.7} aria-hidden="true" />
              Sponsors invest alongside members
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
