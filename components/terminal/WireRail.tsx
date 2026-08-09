/**
 * The wire. One lead story, then the rest as a scannable grid.
 *
 * Server component. It never reads the clock: `age` arrives already
 * rendered from lib/terminal/news.ts, computed once from a single
 * `now`, so every card agrees and hydration has nothing to argue
 * about.
 *
 * A story becomes a link only when it carries a url. Nothing here
 * pretends to be a story you can go and read.
 */
import type { ReactNode } from 'react';

import type { NewsItem } from '@/lib/terminal/news';

import s from './Terminal.module.css';

function Shell({
  href,
  className,
  children,
}: {
  href?: string;
  className: string;
  children: ReactNode;
}) {
  if (!href) return <article className={className}>{children}</article>;
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  );
}

function Meta({ item }: { item: NewsItem }) {
  return (
    <div className={s.wireFoot}>
      <span>{item.source}</span>
      <span className={s.sep}>/</span>
      <span>{item.age}</span>
    </div>
  );
}

export default function WireRail({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return (
      <div className={s.quiet}>
        <b>The wire is quiet</b>
        <span>
          Nothing has filed in the last few hours. It will fill back in on its own.
        </span>
      </div>
    );
  }

  const lead = items.find((item) => item.lead) ?? items[0];
  const rest = items.filter((item) => item.id !== lead.id);

  return (
    <>
      <Shell href={lead.url} className={s.lead}>
        <div className={s.leadTag}>
          <span className={s.cat} data-cat={lead.category}>
            {lead.category}
          </span>
          <span className={s.live}>
            <span className={s.liveDot} />
            Lead story
          </span>
        </div>
        <h3 className={s.leadHeadline}>{lead.headline}</h3>
        <p className={s.leadDek}>{lead.dek}</p>
        <Meta item={lead} />
      </Shell>

      <div className={s.wireGrid}>
        {rest.map((item) => (
          <Shell key={item.id} href={item.url} className={s.wireItem}>
            <span className={s.cat} data-cat={item.category}>
              {item.category}
            </span>
            <h4 className={s.wireHeadline}>{item.headline}</h4>
            <p className={s.wireDek}>{item.dek}</p>
            <Meta item={item} />
          </Shell>
        ))}
      </div>
    </>
  );
}
