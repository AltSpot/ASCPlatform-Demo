'use client';

/**
 * "How it works" for the Radar: one quiet button beside the lane title,
 * and a panel that slides in from the right.
 *
 * Four steps, one sentence each, because the mechanic is simple and the
 * panel's job is to say so. The line that has to be read, that a vote
 * reserves nothing and moves no money, closes it. Nothing here promises
 * a name becomes a deal.
 *
 * A native <dialog>, portalled to <body> for the same reason the Radar
 * detail is: inside the page it sat under a sticky bar and a transform,
 * and in the top layer it does neither. Escape and a press on the scrim
 * both close it.
 */
import { CircleHelp, Radar, Search, Star, Vote, X } from 'lucide-react';
import { useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import s from './HowItWorks.module.css';

const STEPS = [
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
] as const;

export default function RadarHowItWorks() {
  const dialog = useRef<HTMLDialogElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const panel = (
    <dialog
      ref={dialog}
      className={s.sheet}
      aria-labelledby="radar-how-title"
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current?.close();
      }}
    >
      <div className={s.frame}>
        <header className={s.head}>
          <p className="eyebrow">The Radar</p>
          <h2 className={s.title} id="radar-how-title">
            How it works
          </h2>
          <button
            type="button"
            className={s.close}
            onClick={() => dialog.current?.close()}
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </header>

        <ol className={s.steps}>
          {STEPS.map(({ icon: Icon, title, body }) => (
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

        <p className={s.note}>
          A vote is not a commitment. It reserves nothing, moves no money, and nothing on
          the Radar is being offered.
        </p>
      </div>
    </dialog>
  );

  return (
    <>
      <button
        type="button"
        className={s.trigger}
        onClick={() => dialog.current?.showModal()}
      >
        <CircleHelp size={15} strokeWidth={1.6} aria-hidden="true" />
        How it works
      </button>
      {mounted ? createPortal(panel, document.body) : null}
    </>
  );
}
