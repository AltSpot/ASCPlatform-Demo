/**
 * What stands out about the company, as numbered points rather than
 * bullets.
 *
 * THE HEADING IS ABOUT THE COMPANY, NOT ABOUT US. It read "What we
 * like" over "Why we put our own capital in.", which planted AltSpot's
 * judgement at the top of the one section a reader turns to when a deal
 * has gone badly. The conviction it was reaching for is better carried
 * as a fact than as a claim: the committed amount is stated on the
 * marketplace card and in the overview, and a number AltSpot has
 * actually wired says more than a headline saying it believes.
 *
 * So the points are framed as attributes of the business. Nothing about
 * what is written underneath changes, and the section still makes the
 * case; it just makes it about the company.
 *
 * The file, the component and `deal.whatWeLike` keep their names. Same
 * reasoning as Spot keeping its SpotBot identifiers: renaming would
 * move a schema field and its seed data for no reader-visible gain.
 *
 * Each line is one reason and stands on its own. If a reason needs more
 * than about three lines it belongs in the memo, not on this page.
 *
 * They are numbered because they are an argument, and an argument has a
 * shape: a reader who has seen four reasons knows there is a fifth, and
 * a reader deciding whether to keep going knows how much is left. As a
 * column of identical dots it read as a list of features, which is the
 * wrong genre for the part of the page making the case.
 */
import Section from './Section';
import s from './Deal.module.css';

export default function WhatWeLike({ points }: { points: string[] }) {
  if (points.length === 0) return null;

  return (
    <Section
      eyebrow="Company highlights"
      title="What stands out about the company."
      id="why"
    >
      <ol className={s.likeList}>
        {points.map((point, i) => (
          <li key={point} className={s.likeItem} style={{ ['--i' as string]: i }}>
            <span className={s.likeNum} aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className={s.likeText}>{point}</span>
          </li>
        ))}
      </ol>
    </Section>
  );
}
