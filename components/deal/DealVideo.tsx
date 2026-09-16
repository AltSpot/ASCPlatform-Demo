'use client';

/**
 * The walkthrough, as a thumbnail in the overview.
 *
 * The hero carries the film at size. This is the second door to the
 * same recording, set beside the short version so a member who read the
 * paragraph first has the film one click away without scrolling back
 * up. Every deal gets one, so deals compare like for like.
 *
 * The thumbnail is the deal's own artwork and mark under a dark scrim,
 * the same treatment the hero uses, so no theme has to know what is in
 * the art. It opens a native <dialog>: focus is trapped, Escape closes
 * it and the page behind is inert, with no library.
 *
 * NO FAKE PLAYER. A deal without `videoUrl` opens the same dialog with
 * the poster and one plain line saying the walkthrough has not been
 * published, rather than a play button that does nothing. When a film
 * is attached to the deal row the real <video> appears here and in the
 * hero with no code change.
 */
import { Play, X } from 'lucide-react';
import { useRef } from 'react';

import s from './Deal.module.css';

export default function DealVideo({
  name,
  art,
  logoUrl,
  videoUrl,
}: {
  name: string;
  art: string;
  logoUrl: string | null;
  videoUrl: string | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const player = useRef<HTMLVideoElement>(null);

  const open = () => {
    dialog.current?.showModal();
    void player.current?.play().catch(() => {
      /* Autoplay refused. The controls are there. */
    });
  };
  const close = () => dialog.current?.close();

  return (
    <>
      <button
        type="button"
        className={s.videoThumb}
        onClick={open}
        aria-label={`Watch the ${name} walkthrough`}
      >
        {/* The artwork alone. The deal's mark sits behind the play button
            at this size and reads as clutter; the player shows it. */}
        <span className={s.videoArt} style={{ background: art }} aria-hidden="true" />
        <span className={s.videoPlay} aria-hidden="true">
          <Play size={20} strokeWidth={1.5} fill="currentColor" />
        </span>
        <span className={s.videoCaption}>
          <span className={s.videoKicker}>Walkthrough</span>
          <span className={s.videoTitle}>{name}, the deal in brief</span>
        </span>
      </button>

      <dialog
        ref={dialog}
        className={s.videoDialog}
        aria-label={`${name} walkthrough`}
        onClose={() => player.current?.pause()}
        onClick={(e) => {
          // A click on the backdrop lands on the dialog itself.
          if (e.target === dialog.current) close();
        }}
      >
        <div className={s.videoFrame}>
          {videoUrl ? (
            <video ref={player} className={s.filmVideo} src={videoUrl} controls playsInline />
          ) : (
            <div className={s.videoPending} style={{ background: art }}>
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={s.videoMark} src={logoUrl} alt="" aria-hidden="true" />
              )}
              <p className={s.videoPendingText}>
                The {name} walkthrough has not been published yet. It will play here the
                moment it is.
              </p>
            </div>
          )}
          <button type="button" className={s.videoClose} onClick={close} aria-label="Close">
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </dialog>
    </>
  );
}
