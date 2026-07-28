/**
 * The story, one idea per chapter.
 *
 * These used to be slides on a separate route, boxed and stacked. A
 * pitch that has to be followed top to bottom reads better as chapters
 * with air between them than as slides crammed into cards, so there is
 * no card here at all: a kicker, a statement, a couple of paragraphs.
 */
import type { DeckSlide } from '@/lib/domain';

import s from './Deal.module.css';

export default function Narrative({ chapters }: { chapters: DeckSlide[] }) {
  if (chapters.length === 0) return null;

  return (
    <>
      {chapters.map((chapter, i) => (
        <section className={s.chapter} key={`${chapter.kicker}-${i}`}>
          <div className={s.chapterKicker}>{chapter.kicker}</div>
          <h2 className={s.chapterTitle}>{chapter.title}</h2>

          <div className={s.chapterBody}>
            {chapter.body.map((paragraph, j) => (
              <p key={j}>{paragraph}</p>
            ))}
          </div>

          {chapter.stats && chapter.stats.length > 0 && (
            <div className={s.inlineStats}>
              {chapter.stats.map((stat) => (
                <div className={s.inlineStat} key={stat.k}>
                  <div className={s.statK}>{stat.k}</div>
                  <div className={s.inlineStatV}>{stat.v}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </>
  );
}
