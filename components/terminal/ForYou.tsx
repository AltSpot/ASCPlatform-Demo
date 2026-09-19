/**
 * For you: what the Terminal leads with for this member.
 *
 * Three library pieces chosen by lib/terminal/for-you.ts from what the
 * platform already knows (votes, positions, what is in flight), each with
 * its reason in words, beside the wire stories in the categories the
 * member follows. Education only: nothing here names a live deal or a
 * return. Server component.
 */
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

import type { LibraryCard } from '@/lib/terminal/library';
import type { NewsItem } from '@/lib/terminal/news';

import TerminalArt from './TerminalArt';
import s from './Terminal.module.css';

export interface ForYouCard extends LibraryCard {
  reason: string;
}

function span(card: LibraryCard): string {
  return card.kind === 'podcast' ? `${card.minutes} min listen` : `${card.minutes} min read`;
}

export default function ForYou({
  name,
  picks,
  wire,
}: {
  name: string;
  picks: ForYouCard[];
  wire: NewsItem[];
}) {
  if (picks.length === 0) return null;
  const [lead, ...rest] = picks;

  return (
    <section className={s.forYou} aria-label="For you">
      <header className={s.fyHead}>
        <span className={s.fyKicker}>
          <Sparkles size={14} strokeWidth={1.7} aria-hidden="true" />
          For you
        </span>
        <h2 className={s.fyTitle}>{name}, start here.</h2>
        <p className={s.fySub}>
          Picked from what you voted for, what you hold and what is in flight. Education only.
        </p>
      </header>

      <div className={s.fyGrid}>
        <Link className={s.fyLead} href={`/terminal/${lead.slug}`}>
          <TerminalArt className={s.fyLeadArt} slug={lead.slug} kind={lead.kind} art={lead.art}>
            <span className={s.fyReason}>{lead.reason}</span>
          </TerminalArt>
          <div className={s.fyLeadBody}>
            <span className={s.cardKind} data-kind={lead.kind}>
              {lead.kind === 'podcast' ? 'Podcast' : lead.kind === 'report' ? 'Report' : 'Article'} · {span(lead)}
            </span>
            <h3 className={s.fyLeadTitle}>{lead.title}</h3>
            <p className={s.fyLeadDek}>{lead.standfirst}</p>
            <span className={s.go}>{lead.kind === 'podcast' ? 'Listen' : 'Read'} →</span>
          </div>
        </Link>

        <div className={s.fySide}>
          {rest.map((card) => (
            <Link className={s.fyRow} key={card.slug} href={`/terminal/${card.slug}`}>
              <TerminalArt className={s.fyRowArt} slug={card.slug} kind={card.kind} art={card.art} />
              <span className={s.fyRowBody}>
                <span className={s.fyRowReason}>{card.reason}</span>
                <b className={s.fyRowTitle}>{card.title}</b>
                <span className={s.fyRowMeta}>{span(card)}</span>
              </span>
            </Link>
          ))}

          {wire.length > 0 ? (
            <div className={s.fyWire}>
              <span className={s.fyWireKey}>
                <span className="live-dot" aria-hidden="true" />
                From today&rsquo;s wire, in what you follow
              </span>
              <ul>
                {wire.map((item) => (
                  <li key={item.id}>
                    <b>{item.headline}</b>
                    <span>
                      {item.category} · {item.age}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
