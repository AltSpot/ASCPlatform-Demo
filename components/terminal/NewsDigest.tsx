/**
 * The dashboard digest: the wire, compressed to a glance.
 *
 * Three headlines, a timestamp each, and one way through to the
 * Terminal. No art, no deks, no lead treatment. The dashboard belongs
 * to the portfolio, and this card is a doorway, not a destination.
 *
 * Reads the same module the Terminal reads, so a headline can never
 * appear in one place and not the other.
 */
import Link from 'next/link';

import type { NewsItem } from '@/lib/terminal/news';

import s from './Terminal.module.css';

export default function NewsDigest({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="card">
      <div className={s.digestHead}>
        <span className={s.live}>
          <span className={s.liveDot} />
          Private markets
        </span>
      </div>

      <div className={s.digestList}>
        {items.map((item) => (
          <div className={s.digestItem} key={item.id}>
            <div className={s.digestTime}>{item.age}</div>
            <div className={s.digestBody}>
              <div className={s.digestHeadline}>{item.headline}</div>
              <div className={s.digestMeta}>
                {item.category} / {item.source}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={s.digestFoot}>
        <Link className="btn btn-quiet btn-sm" href="/terminal">
          Open the Terminal
        </Link>
      </div>
    </div>
  );
}
