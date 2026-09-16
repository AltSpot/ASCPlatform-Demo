'use client';

/**
 * The wire, with a way in.
 *
 * Thirteen stories filed today, all of equal weight below the lead, is
 * a firehose: a reader scans it once, finds nothing addressed to them,
 * and leaves. But every story already carries a desk and a category,
 * and an investor's interest is almost never uniform across them.
 * Someone weighing a secondary wants the secondaries thread; someone
 * who has just read about QSBS wants the regulation one.
 *
 * So the categories become a filter. It is the same control vocabulary
 * as the Radar board and the shelf, deliberately: a member should learn
 * one filter row on this platform, not three.
 *
 * Filtering is local. All thirteen stories arrive with the page from
 * the server, so following a thread costs nothing and cannot fail.
 */
import { useMemo, useState } from 'react';

import type { NewsCategory, NewsItem } from '@/lib/terminal/news';

import WireRail from './WireRail';
import s from './Terminal.module.css';

/** Sentence case for a chip: "private-credit" reads as "Private credit". */
function label(category: string): string {
  const words = category.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default function WireBoard({ items }: { items: NewsItem[] }) {
  const [topic, setTopic] = useState<NewsCategory | null>(null);

  /* Built from what actually filed, in the order it filed, so a chip
     never resolves to an empty wire and the row does not reshuffle as
     stories come in. */
  const topics = useMemo(() => {
    const counts = new Map<NewsCategory, number>();
    for (const item of items) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return [...counts.entries()];
  }, [items]);

  const shown = useMemo(
    () => (topic === null ? items : items.filter((item) => item.category === topic)),
    [items, topic],
  );

  return (
    <>
      {topics.length > 1 ? (
        <div className={s.topics} role="group" aria-label="Filter the wire by topic">
          <button
            type="button"
            className={s.topic}
            aria-pressed={topic === null}
            onClick={() => setTopic(null)}
          >
            Everything
          </button>

          {topics.map(([category]) => (
            <button
              key={category}
              type="button"
              className={s.topic}
              aria-pressed={topic === category}
              onClick={() => setTopic(topic === category ? null : category)}
            >
              {label(category)}
            </button>
          ))}
        </div>
      ) : null}

      <WireRail items={shown} />
    </>
  );
}
