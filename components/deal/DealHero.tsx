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
 * The fact strip lost two of its five. The fee and the carry are 5% and
 * 10% on every deal AltSpot has ever done, so beside a scarce figure
 * like what is left of the allocation they were filler; they are stated
 * as one line under the strip, and in full in the terms section.
 */
import type { ReactNode } from 'react';

import BackerMark from '@/components/BackerMark';
import type { DealView } from '@/lib/domain';
import { money } from '@/lib/format';

import s from './Deal.module.css';

export default function DealHero({
  deal,
  cta,
  tools,
}: {
  deal: DealView;
  cta: ReactNode;
  /** Header controls, set hard right: the watchlist toggle today. */
  tools?: ReactNode;
}) {
  const subscribed =
    deal.allocationTotal > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((deal.allocationTotal - deal.allocationRemaining) / deal.allocationTotal) *
                100,
            ),
          ),
        )
      : 0;

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

          <span className="chip">{deal.tag}</span>

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

          <div className={s.heroFacts}>
            <Fact k="Minimum" v={money(deal.minInvestment)} />
            <Fact k="Allocation" v={money(deal.allocationTotal)} />
            <Fact k="Remaining" v={money(deal.allocationRemaining)} />
          </div>

          <div className={s.heroAlloc}>
            <div className={s.heroBar}>
              <div className={s.heroFill} style={{ width: `${Math.max(2, subscribed)}%` }} />
            </div>
            <p className={s.heroBarLab}>
              <span>{subscribed}% subscribed</span>
              <span>
                {deal.fees.management}% at closing · {deal.fees.carry}% carry
              </span>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className={s.fact}>
      <div className={s.factK}>{k}</div>
      <div className={s.factV}>{v}</div>
    </div>
  );
}
