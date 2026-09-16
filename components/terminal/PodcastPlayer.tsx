'use client';

/**
 * The episode player, and its chapters.
 *
 * DEMO SEAM — there is no audio file yet, so the transport does not
 * play anything. Everything else is real: the chapter list, the
 * progress bar, the seek behavior and the keyboard handling all work
 * against a local clock, so the surface a member will use is the
 * surface being built rather than a picture of one.
 *
 * When audio lands, `audioUrl` joins LibraryItem, the `<audio>` element
 * replaces the clock, and `seek` calls `audio.currentTime`. The chapter
 * list and the layout do not change. That is why the timeline is kept
 * in one place here rather than spread through the markup.
 *
 * Chapters are the point of this component. A forty minute episode with
 * no way in is one a member will not start, and a list of six lines
 * with timestamps is the difference between a file and something worth
 * opening at a desk.
 */
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { LibraryChapter } from '@/lib/terminal/library';

import s from './PodcastPlayer.module.css';

/** "06:20" to seconds. Chapters are authored as display timestamps. */
function toSeconds(at: string): number {
  const parts = at.split(':').map(Number);
  if (parts.some((part) => Number.isNaN(part))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function PodcastPlayer({
  title,
  minutes,
  chapters,
}: {
  title: string;
  minutes: number;
  chapters: LibraryChapter[];
}) {
  const total = minutes * 60;
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const track = useRef<HTMLDivElement>(null);

  /* The stand-in clock. Replaced wholesale by the audio element's own
     timeupdate event, which is why nothing else here reads it. */
  useEffect(() => {
    if (!playing) return;

    const id = window.setInterval(() => {
      setAt((current) => {
        if (current + 1 >= total) {
          setPlaying(false);
          return total;
        }
        return current + 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [playing, total]);

  const seek = useCallback(
    (seconds: number) => setAt(Math.min(total, Math.max(0, seconds))),
    [total],
  );

  /* Which chapter the clock is inside. Last one whose start is behind
     us, so an episode with no chapter at zero still resolves. */
  const currentIndex = chapters.reduce(
    (found, chapter, index) => (toSeconds(chapter.at) <= at ? index : found),
    0,
  );

  function scrub(event: React.MouseEvent<HTMLDivElement>) {
    const box = track.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    seek(((event.clientX - box.left) / box.width) * total);
  }

  return (
    <div className={s.player}>
      <div className={s.transport}>
        <button
          type="button"
          className={s.skip}
          onClick={() => seek(at - 15)}
          aria-label="Back fifteen seconds"
        >
          <SkipBack size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={s.play}
          onClick={() => setPlaying((was) => !was)}
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        >
          {playing ? (
            <Pause size={19} strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Play size={19} strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          className={s.skip}
          onClick={() => seek(at + 30)}
          aria-label="Forward thirty seconds"
        >
          <SkipForward size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>

        <div className={s.timeline}>
          <div
            className={s.track}
            ref={track}
            onClick={scrub}
            role="slider"
            tabIndex={0}
            aria-label="Position in the episode"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={Math.round(at)}
            aria-valuetext={clock(at)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') seek(at + 15);
              if (event.key === 'ArrowLeft') seek(at - 15);
              if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                setPlaying((was) => !was);
              }
            }}
          >
            <div className={s.fill} style={{ width: `${(at / total) * 100}%` }} />

            {/* Chapter starts, marked on the bar. An episode is easier
                to enter when its shape is visible before you commit. */}
            {chapters.map((chapter) => (
              <span
                key={chapter.at}
                className={s.tick}
                style={{ left: `${(toSeconds(chapter.at) / total) * 100}%` }}
                aria-hidden="true"
              />
            ))}
          </div>

          <div className={s.clock}>
            <span>{clock(at)}</span>
            <span>{clock(total)}</span>
          </div>
        </div>
      </div>

      <p className={s.demo}>
        Demo environment. The transport works against a local clock; audio
        is not attached in the demo.
      </p>

      <ol className={s.chapters}>
        {chapters.map((chapter, index) => (
          <li key={chapter.at}>
            <button
              type="button"
              className={s.chapter}
              aria-current={index === currentIndex}
              onClick={() => {
                seek(toSeconds(chapter.at));
                setPlaying(true);
              }}
            >
              <span className={s.chapterAt}>{chapter.at}</span>
              <span className={s.chapterLabel}>{chapter.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
