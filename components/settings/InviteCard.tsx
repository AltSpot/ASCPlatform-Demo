'use client';

/**
 * Invite someone you know (Tyler, 2026-09-19: move it up, make it worth
 * doing, and say why).
 *
 * WHAT MAY BE PROMISED HERE IS NARROW, ON PURPOSE. AltSpot raises under
 * Rule 506(b), which allows no general solicitation, and a member is not
 * a registered broker. Two things follow, and this card is written inside
 * both:
 *
 *   1. NOTHING OF VALUE FOR AN INTRODUCTION. No cash, credit, fee discount,
 *      carry share, allocation priority or gift, to the inviter or the
 *      invitee, at sign-up or when anyone invests. Pay tied to bringing in
 *      investors is what makes a person an unregistered finder. The
 *      platform already enforces the code half of this: nothing in fee,
 *      carry or eligibility logic may read a referral
 *      (tests/referral.test.ts).
 *   2. PEOPLE YOU KNOW, SENT DIRECTLY. Not posted, not broadcast. The link
 *      leads to sign-up and the same investor questionnaire as everyone;
 *      it opens no deal and skips no step, and AltSpot forms its own
 *      relationship with the person before they are shown anything.
 *
 * So the benefit shown is the true one, and it is the platform's own
 * mechanic rather than a reward: AltSpot sources what members vote for, so
 * more members voting means the names a member wants get sourced sooner.
 * If counsel later approves anything more (a non-transaction-based thank
 * you, for instance), it is added here and nowhere else.
 */
import { Check, Copy, Radar, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';

import s from './InviteCard.module.css';

const POINTS = [
  {
    icon: Radar,
    title: 'More votes, sooner deals',
    body: 'AltSpot goes after what members vote for. Every member adds their votes to the Radar, so the names you want reach the point where we source them sooner.',
  },
  {
    icon: ShieldCheck,
    title: 'The same door for everyone',
    body: 'They register and complete the investor questionnaire exactly as you did. An invitation opens no deal and skips no step.',
  },
  {
    icon: Users,
    title: 'People you know, sent directly',
    body: 'Share it one to one with people you know personally. Please do not post it publicly or send it to a list.',
  },
];

export default function InviteCard({
  inviteUrl,
  onCopy,
}: {
  inviteUrl: string;
  /** Copies the link and tells the member. Returns whether it worked. */
  onCopy: () => Promise<boolean> | boolean | void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className={`card gold ${s.card}`}>
      <div className={s.lead}>
        <span className={s.kicker}>Invite</span>
        <h3 className={s.title}>Bring someone into the room.</h3>
        <p className={s.sub}>
          The Radar gets sharper with every serious member on it. If you know someone who
          invests the way you do, send them your link.
        </p>

        <div className={s.link}>
          <input
            className="input"
            readOnly
            value={inviteUrl}
            aria-label="Your invite link"
            onFocus={(event) => event.currentTarget.select()}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={async () => {
              const ok = await onCopy();
              if (ok === false) return;
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2200);
            }}
          >
            {copied ? (
              <Check size={15} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Copy size={15} strokeWidth={1.7} aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <p className={s.fine}>
          Nobody is paid or rewarded for an introduction, now or when anyone invests, and an
          invitation changes nothing about fees or access for you or for them.
        </p>
      </div>

      <ul className={s.points}>
        {POINTS.map(({ icon: Icon, title, body }) => (
          <li className={s.point} key={title}>
            <span className={s.glyph} aria-hidden="true">
              <Icon size={16} strokeWidth={1.7} />
            </span>
            <span>
              <b>{title}</b>
              <span className={s.body}>{body}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
