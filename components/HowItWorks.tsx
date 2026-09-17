'use client';

/**
 * "How it works": one quiet button beside a lane's title, and the
 * right-hand panel (components/SidePanel) with the mechanic in four
 * steps, one sentence each, and the line that has to be read.
 *
 * Two editions, one per marketplace lane. The Radar's says a vote
 * reserves nothing. Invest's says the money goes to escrow and comes back
 * if the minimum is not met, which is the whole of what a member needs to
 * know before pressing Invest. Neither promises an outcome, and neither
 * carries a fee or carry figure.
 */
import {
  CircleHelp,
  FileSignature,
  Landmark,
  Radar,
  Search,
  Star,
  Store,
  Vote,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import AskSpot from '@/components/AskSpot';
import SidePanel from '@/components/SidePanel';

import s from './HowItWorks.module.css';

interface Edition {
  eyebrow: string;
  steps: { icon: LucideIcon; title: string; body: string }[];
  note: string;
  /** What Spot is asked from the panel's foot. */
  ask: string;
}

const EDITIONS: Record<'radar' | 'invest', Edition> = {
  radar: {
    eyebrow: 'The Radar',
    steps: [
      {
        icon: Vote,
        title: 'Vote for a company',
        body: 'Pick a private company you would back and the amount you would consider.',
      },
      {
        icon: Radar,
        title: 'Demand is counted',
        body: 'The board ranks every name by the dollars members have voted.',
      },
      {
        icon: Search,
        title: 'AltSpot goes after it',
        body: 'The names with the most demand are the ones we work to bring to the platform.',
      },
      {
        icon: Star,
        title: 'It shows up for you',
        body: 'If one opens, it appears under Open now with a Radar mark, and on your Watchlist.',
      },
    ],
    note: 'A vote is not a commitment. It reserves nothing, moves no money, and nothing on the Radar is being offered.',
    ask: 'What does voting on the Radar do?',
  },
  invest: {
    eyebrow: 'Open now',
    steps: [
      {
        icon: Store,
        title: 'Pick a deal',
        body: 'Every deal is its own SPV, organized and advised by AltSpot.',
      },
      {
        icon: FileSignature,
        title: 'Read and sign',
        body: 'Choose your amount (minimums from $5,000, set per offering), read the documents and sign, all in one flow.',
      },
      {
        icon: Landmark,
        title: 'Send to escrow',
        body: 'Your money is held in escrow, never in an AltSpot account, until the deal closes.',
      },
      {
        icon: Star,
        title: 'It closes at the minimum',
        body: 'When the minimum is met by the closing date, the SPV invests. If not, escrow returns your money.',
      },
    ],
    note: 'Admissions close 24 hours before the wire. Private investments are illiquid and can lose all of their value.',
    ask: 'What happens after I send to escrow?',
  },
};

export default function HowItWorks({ edition }: { edition: 'radar' | 'invest' }) {
  const [open, setOpen] = useState(false);
  const { eyebrow, steps, note, ask } = EDITIONS[edition];

  return (
    <>
      <button type="button" className={s.trigger} onClick={() => setOpen(true)}>
        <CircleHelp size={15} strokeWidth={1.6} aria-hidden="true" />
        How it works
      </button>

      <SidePanel
        open={open}
        onClose={() => setOpen(false)}
        label={`How ${eyebrow} works`}
        header={
          <>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className={s.title}>How it works</h2>
          </>
        }
      >
        <ol className={s.steps}>
          {steps.map(({ icon: Icon, title, body }) => (
            <li className={s.step} key={title}>
              <span className={s.glyph} aria-hidden="true">
                <Icon size={18} strokeWidth={1.6} />
              </span>
              <span className={s.copy}>
                <b className={s.stepTitle}>{title}</b>
                <span className={s.stepBody}>{body}</span>
              </span>
            </li>
          ))}
        </ol>

        <p className={s.note}>{note}</p>

        <AskSpot question={ask} />
      </SidePanel>
    </>
  );
}
