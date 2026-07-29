/**
 * Why we underwrote it, as short bullets rather than paragraphs.
 *
 * Each line is one reason and stands on its own. If a bullet needs more
 * than about three lines it belongs in the memo, not on this page.
 */
import Section from './Section';
import s from './Deal.module.css';

export default function WhatWeLike({ points }: { points: string[] }) {
  if (points.length === 0) return null;

  return (
    <Section eyebrow="What we like" title="Why we put our own capital in." id="why">
      <ul className={s.likeList}>
        {points.map((point) => (
          <li key={point} className={s.likeItem}>
            <span className={s.likeMark} aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
