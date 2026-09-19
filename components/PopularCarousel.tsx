'use client';

/**
 * Most popular, as a row you can scroll.
 *
 * The dashboard's first section after the strip: the deals and Radar
 * names the membership is paying attention to, ranked by
 * lib/popularity.ts, as small tiles in a horizontal row rather than a
 * grid. A row scrolls, so it can hold ten without owning the page, and
 * a tile is a door rather than a summary: mark, name, one figure, one
 * word about what it is, and the whole thing is the link.
 *
 * Deals and Radar names sit in the same row on purpose. A member deciding
 * where to put attention should see both kinds of thing side by side:
 * what is open to invest in, and what is gathering votes. The tile says
 * which is which with one live or quiet mark.
 *
 * Client island for the two scroll buttons. The data arrives from the
 * server fully formed.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import CompanyLogo from '@/components/CompanyLogo';

import s from './PopularCarousel.module.css';

export interface PopularItem {
  kind: 'deal' | 'radar';
  id: string;
  name: string;
  /** The tile's ground: the deal's art, or the class tint for a Radar name. */
  art: string;
  logoUrl: string | null;
  /** The one figure: "$640K left" or "$9.5M voted". */
  figure: string;
  /** The one word under it: "Closes Oct 5" or "412 members". */
  line: string;
  href: string;
  /** Closing inside a fortnight, or a Radar name gathering fast. */
  hot?: boolean;
}

export default function PopularCarousel({ items }: { items: PopularItem[] }) {
  const track = useRef<HTMLDivElement>(null);
  /* Each arrow shows only when there is somewhere to go, so on first
     load the back arrow is not sitting over the first tile. */
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () =>
      setEdges({
        start: el.scrollLeft <= 4,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
      });
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [items.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <div className={s.wrap}>
      <div className={s.track} ref={track}>
        {items.map((item, index) => (
          <Link
            key={`${item.kind}:${item.id}`}
            href={item.href}
            className={s.tile}
            data-kind={item.kind}
            style={{ ['--i' as string]: index }}
          >
            <span className={s.art} style={{ background: item.art }} aria-hidden="true">
              {item.logoUrl ? (
                <CompanyLogo className={s.mark} slug={item.id} logoUrl={item.logoUrl} scale={0.68} />
              ) : (
                <span className={s.monogram}>{item.name.slice(0, 1)}</span>
              )}
            </span>
            <span className={s.body}>
              <span className={s.kind} data-hot={item.hot ? 'true' : undefined}>
                <span className={s.kindDot} aria-hidden="true" />
                {item.kind === 'deal' ? 'Open now' : 'On the Radar'}
              </span>
              <span className={s.name}>{item.name}</span>
              <span className={s.figure}>{item.figure}</span>
              <span className={s.line}>{item.line}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className={s.nav}>
        <button
          type="button"
          className={s.navBtn}
          data-hidden={edges.start}
          tabIndex={edges.start ? -1 : 0}
          onClick={() => scrollBy(-1)}
          aria-label="Scroll back"
        >
          <ChevronLeft size={16} strokeWidth={1.6} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={s.navBtn}
          data-hidden={edges.end}
          tabIndex={edges.end ? -1 : 0}
          onClick={() => scrollBy(1)}
          aria-label="Scroll forward"
        >
          <ChevronRight size={16} strokeWidth={1.6} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
