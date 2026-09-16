/**
 * The reader. Every Terminal piece is read here, inside the portal.
 *
 * Articles, reports and podcasts share this route because they share
 * almost everything: a headline, a standfirst, a body, a provenance
 * line, and something to read next. What differs is the apparatus at
 * the top. A report leads with the three figures it is built around; a
 * podcast leads with the player and its chapters. Splitting those into
 * three routes would have produced three copies of the same page and
 * three places for the disclosure to drift.
 *
 * Behind auth like everything else in the portal group, and the layout
 * enforces that. That also makes the route permanently dynamic, so there
 * is no generateStaticParams here: it would imply a prerender the session
 * check can never allow.
 *
 * A piece is not gated on accreditation, though. Terminal content is
 * education, and gating education behind the same wall as deal detail
 * would defeat the reason the section exists.
 */
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import PodcastPlayer from '@/components/terminal/PodcastPlayer';
import { dateStr } from '@/lib/format';
import {
  getLibraryItem,
  KIND_LABEL,
  relatedLibrary,
  type LibraryBlock,
} from '@/lib/terminal/library';

import s from './Reader.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getLibraryItem(slug);
  if (!item) return { title: 'Terminal · AltSpot' };

  return {
    title: `${item.title} · AltSpot Terminal`,
    description: item.standfirst,
  };
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getLibraryItem(slug);
  if (!item) notFound();

  const related = relatedLibrary(slug);
  const span =
    item.kind === 'podcast'
      ? `${item.minutes} min listen`
      : `${item.minutes} min read`;

  return (
    <article className={s.page}>
      <Link className={s.back} href="/terminal">
        <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
        Terminal
      </Link>

      <header className={s.head}>
        <div className={s.meta}>
          <span className={s.kind} data-kind={item.kind}>
            {KIND_LABEL[item.kind]}
          </span>
          <span className={s.topic}>{item.topic}</span>
        </div>

        <h1 className={s.title}>{item.title}</h1>
        <p className={s.standfirst}>{item.standfirst}</p>

        <div className={s.byline}>
          <span>{item.author}</span>
          <span className={s.dot} aria-hidden="true" />
          <span>{dateStr(item.publishedAt)}</span>
          <span className={s.dot} aria-hidden="true" />
          <span>{span}</span>
        </div>
      </header>

      <div className={s.art} style={{ background: item.art }} aria-hidden="true">
        <span className={s.artMark}>AltSpot Terminal</span>
      </div>

      {/* A report is built on a few figures, and burying them in the
          body makes the reader hunt for the thing they came for. */}
      {item.figures && item.figures.length > 0 ? (
        <div className={s.figures}>
          {item.figures.map((figure) => (
            <div className={s.figure} key={figure.k}>
              <span className={s.figureValue}>{figure.v}</span>
              <span className={s.figureKey}>{figure.k}</span>
            </div>
          ))}
        </div>
      ) : null}

      {item.chapters && item.chapters.length > 0 ? (
        <PodcastPlayer title={item.title} minutes={item.minutes} chapters={item.chapters} />
      ) : null}

      <div className={s.body}>
        {item.body.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </div>

      <p className={s.source}>{item.sourceNote}</p>

      {related.length > 0 ? (
        <section className={s.next}>
          <p className={s.nextKey}>
            <span className={s.rule} aria-hidden="true" />
            Read next
          </p>

          <div className={s.nextGrid}>
            {related.map((other) => (
              <Link
                className={s.nextCard}
                key={other.slug}
                href={`/terminal/${other.slug}`}
              >
                <span className={s.nextArt} style={{ background: other.art }} />
                <span className={s.nextBody}>
                  <span className={s.nextKind}>{KIND_LABEL[other.kind]}</span>
                  <b className={s.nextTitle}>{other.title}</b>
                  <span className={s.nextSpan}>
                    {other.kind === 'podcast'
                      ? `${other.minutes} min listen`
                      : `${other.minutes} min read`}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function Block({ block }: { block: LibraryBlock }) {
  switch (block.type) {
    case 'h':
      return <h2 className={s.h}>{block.text}</h2>;

    case 'quote':
      return (
        <blockquote className={s.quote}>
          <p>{block.text}</p>
          {block.attribution ? (
            <cite className={s.cite}>{block.attribution}</cite>
          ) : null}
        </blockquote>
      );

    case 'list':
      return (
        <ul className={s.list}>
          {(block.items ?? []).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      );

    /* An aside the reader should not be able to skim past. Used for the
       one sentence in a piece that changes how the rest is read. */
    case 'note':
      return <p className={s.noteBlock}>{block.text}</p>;

    default:
      return <p className={s.p}>{block.text}</p>;
  }
}
