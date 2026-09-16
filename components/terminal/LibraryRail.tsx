'use client';

/**
 * The library rail: everything the Terminal publishes, filtered by kind.
 *
 * Every card goes to `/terminal/<slug>`, inside the portal. Nothing here
 * opens a new tab, and no card carries the outward arrow, because there
 * is nowhere outward to go. That is the whole point of hosting the
 * content: a member who clicks a piece is still in the portal when they
 * finish it, and the next thing they see is ours.
 *
 * The newest piece leads at full width. A section that gives its latest
 * work the same tile as something from eighteen months ago is telling a
 * returning member there is nothing new to come back for.
 *
 * The filter is client-side over a list the server already sent. The
 * library is small enough that a round trip per tab would be slower and
 * would lose the reader's place on the page.
 */
import Link from 'next/link';
import { useState } from 'react';

import { dateStr } from '@/lib/format';
import type { LibraryCard, LibraryKind } from '@/lib/terminal/library';

import s from './Terminal.module.css';

const TABS: { key: 'all' | LibraryKind; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'article', label: 'Articles' },
  { key: 'report', label: 'Reports' },
  { key: 'podcast', label: 'Podcasts' },
];

/** Read or listen. The verb is the fastest way to say which one it is. */
function span(card: LibraryCard): string {
  return card.kind === 'podcast'
    ? `${card.minutes} min listen`
    : `${card.minutes} min read`;
}

export default function LibraryRail({ items }: { items: LibraryCard[] }) {
  const [tab, setTab] = useState<'all' | LibraryKind>('all');

  const shown = tab === 'all' ? items : items.filter((item) => item.kind === tab);

  if (items.length === 0) {
    return (
      <div className={s.quiet}>
        <b>Nothing published yet</b>
        <span>
          Articles, reports and episodes appear here as they are published,
          and they are read in the portal rather than anywhere else.
        </span>
      </div>
    );
  }

  const [latest, ...rest] = shown;

  return (
    <>
      <div className={s.kinds} role="group" aria-label="Filter the library">
        {TABS.map((option) => {
          const count =
            option.key === 'all'
              ? items.length
              : items.filter((item) => item.kind === option.key).length;

          return (
            <button
              key={option.key}
              type="button"
              className={s.kind}
              aria-pressed={option.key === tab}
              disabled={count === 0}
              onClick={() => setTab(option.key)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {latest ? (
        <Link className={s.feature} href={`/terminal/${latest.slug}`}>
          <span className={s.featureArt} style={{ background: latest.art }}>
            <span className={s.artMark}>AltSpot Terminal</span>
          </span>

          <div className={s.featureBody}>
            <span className={s.featureKey}>
              {tab === 'all' ? 'Latest' : `Latest ${TABS.find((t) => t.key === tab)?.label.toLowerCase().replace(/s$/, '')}`}
            </span>
            <h3 className={s.featureTitle}>{latest.title}</h3>
            <p className={s.featureExcerpt}>{latest.standfirst}</p>
            <span className={s.featureFoot}>
              <span>
                {dateStr(latest.publishedAt)} · {latest.topic} · {span(latest)}
              </span>
              <span className={s.go}>
                {latest.kind === 'podcast' ? 'Listen' : 'Read'} →
              </span>
            </span>
          </div>
        </Link>
      ) : null}

      {rest.length > 0 ? (
        <>
          <p className={s.backKey}>More in the library</p>
          <div className={s.journalGrid}>
            {rest.map((card) => (
              <Link
                key={card.slug}
                className={s.post}
                href={`/terminal/${card.slug}`}
              >
                <span className={s.postArt} style={{ background: card.art }}>
                  <span className={s.artMark}>{card.topic}</span>
                </span>

                <div className={s.postBody}>
                  <span className={s.cardKind} data-kind={card.kind}>
                    {card.kind === 'podcast'
                      ? 'Podcast'
                      : card.kind === 'report'
                        ? 'Report'
                        : 'Article'}
                  </span>
                  <h4 className={s.postTitle}>{card.title}</h4>
                  <p className={s.postExcerpt}>{card.standfirst}</p>
                  <div className={s.postFoot}>
                    <span>{dateStr(card.publishedAt)}</span>
                    <span className={s.go}>{span(card)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
