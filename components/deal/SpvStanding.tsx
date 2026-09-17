/**
 * Where the SPV stands, live, from its commitments (Tyler, 2026-09-17:
 * "show this in live form"). Two meters under the terms:
 *
 *   MEMBERS       admitted against the investor cap. Past it a new member
 *                 joins the waitlist; a member already in keeps their spot.
 *   RETIREMENT    IRA and 401(k) money as a share of the SPV, with the two
 *                 marks the rule draws: a subscription that would take it to
 *                 RETIREMENT_WARN_PERCENT is allowed with a warning, one that
 *                 would reach RETIREMENT_BLOCK_PERCENT is refused.
 *
 * The figures are the same standing the subscribe, sign and escrow routes
 * decide on (lib/repositories/spv.ts, lib/spv-rules.ts), so the page cannot
 * describe a limit the server would not enforce. Server component.
 */
import { Users, Landmark } from 'lucide-react';

import Term from '@/components/Term';
import { RETIREMENT_BLOCK_PERCENT, RETIREMENT_WARN_PERCENT } from '@/lib/config';
import { money } from '@/lib/format';
import { effectiveCap, retirementPercentAfter, type SpvStanding as Standing } from '@/lib/spv-rules';

import Section from './Section';
import s from './SpvStanding.module.css';

export default function SpvStanding({
  standing,
  alreadyMember,
}: {
  standing: Standing;
  alreadyMember: boolean;
}) {
  const cap = effectiveCap(standing.cap);
  const members = Math.min(standing.members, cap);
  const memberPct = cap > 0 ? Math.round((members / cap) * 100) : 0;
  const full = standing.members >= cap;

  /* Retirement money as it stands, with nothing added. */
  const retirePct = retirementPercentAfter(standing, 0, false);
  const retireTone =
    retirePct >= RETIREMENT_BLOCK_PERCENT ? 'bad' : retirePct >= RETIREMENT_WARN_PERCENT ? 'warn' : 'ok';
  /* The meter runs to a little past the block so the marks have room. */
  const scale = RETIREMENT_BLOCK_PERCENT * 1.4;
  const retireFill = Math.min(100, (retirePct / scale) * 100);

  return (
    <Section eyebrow="The SPV today" title="Who is in, and what the rules leave room for." id="spv">
      <div className={s.grid}>
        <div className={s.meter}>
          <div className={s.top}>
            <span className={s.glyph} aria-hidden="true">
              <Users size={15} strokeWidth={1.6} />
            </span>
            <span className={s.label}>
              <Term q="Is there a limit on how many members an SPV can have?" quiet>
                Members
              </Term>
            </span>
            <span className={s.figure}>
              {members} <small>of {cap}</small>
            </span>
          </div>
          <div className={s.track} role="img" aria-label={`${members} of ${cap} members`}>
            <span className={s.fill} data-tone={full ? 'full' : 'ok'} style={{ width: `${Math.max(2, memberPct)}%` }} />
          </div>
          <p className={s.note}>
            {full
              ? alreadyMember
                ? 'At its member limit. Your spot is held.'
                : 'At its member limit. New members join the waitlist, and anyone already in keeps their spot.'
              : `${cap - members} ${cap - members === 1 ? 'spot' : 'spots'} left before the waitlist opens. Committed so far: ${money(standing.committed)}.`}
          </p>
        </div>

        <div className={s.meter}>
          <div className={s.top}>
            <span className={s.glyph} aria-hidden="true">
              <Landmark size={15} strokeWidth={1.6} />
            </span>
            <span className={s.label}>
              <Term q="How does investing through an IRA work here?" quiet>
                Retirement money
              </Term>
            </span>
            <span className={s.figure} data-tone={retireTone}>
              {Math.round(retirePct)}%
            </span>
          </div>
          <div
            className={s.track}
            role="img"
            aria-label={`Retirement accounts are ${Math.round(retirePct)} percent of this SPV`}
          >
            <span className={s.fill} data-tone={retireTone} style={{ width: `${Math.max(2, retireFill)}%` }} />
            <span className={s.mark} data-tone="warn" style={{ left: `${(RETIREMENT_WARN_PERCENT / scale) * 100}%` }} />
            <span className={s.mark} data-tone="bad" style={{ left: `${(RETIREMENT_BLOCK_PERCENT / scale) * 100}%` }} />
          </div>
          <ul className={s.legend} aria-hidden="true">
            <li data-tone="warn">
              <span className={s.tick} /> {RETIREMENT_WARN_PERCENT}% warns
            </li>
            <li data-tone="bad">
              <span className={s.tick} /> {RETIREMENT_BLOCK_PERCENT}% refused
            </li>
          </ul>
          <p className={s.note}>
            IRA and 401(k) subscriptions stay under {RETIREMENT_BLOCK_PERCENT}% of each SPV. One that
            would take them to {RETIREMENT_WARN_PERCENT}% goes through with a warning; one that would
            reach {RETIREMENT_BLOCK_PERCENT}% is refused. Checkout tells you as you type.
          </p>
        </div>
      </div>
    </Section>
  );
}
