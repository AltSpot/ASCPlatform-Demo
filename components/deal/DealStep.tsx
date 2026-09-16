/**
 * Previous and next deal, in the breadcrumb row.
 *
 * The rail at the foot of the page is for a reader who finished. This
 * is for one who did not: three paragraphs in, decided, and wanting the
 * next name without scrolling to the bottom of a deal they have already
 * dismissed.
 *
 * Order is the shelf's own order, so stepping through here walks the
 * marketplace in the sequence it presents. Both ends stop rather than
 * wrap: an investor who has reached the last deal should be told that,
 * not returned silently to the first one.
 *
 * A HAIRLINE SPLITS THE TWO SIDES. Without it, the first deal in the
 * shelf rendered as "← OpenAI →": one dimmed arrow, one name, one live
 * arrow, all in a single pill, which reads as one control pointing both
 * ways. The divider and the stop label make the dead end look like a
 * dead end.
 */
import Link from 'next/link';

import s from './Deal.module.css';

export interface DealStepTarget {
  id: string;
  name: string;
}

export default function DealStep({
  prev,
  next,
}: {
  prev: DealStepTarget | null;
  next: DealStepTarget | null;
}) {
  if (!prev && !next) return null;

  return (
    <div className={s.step}>
      {prev ? (
        <Link className={s.stepLink} href={`/deals/${prev.id}`} rel="prev">
          <span aria-hidden="true">←</span>
          <span className={s.stepName}>{prev.name}</span>
        </Link>
      ) : (
        <span className={`${s.stepLink} ${s.stepOff}`}>
          <span aria-hidden="true">←</span>
          <span className={s.stepName}>First</span>
        </span>
      )}

      <span className={s.stepDivide} aria-hidden="true" />

      {next ? (
        <Link className={s.stepLink} href={`/deals/${next.id}`} rel="next">
          <span className={s.stepName}>{next.name}</span>
          <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span className={`${s.stepLink} ${s.stepOff}`}>
          <span className={s.stepName}>Last</span>
          <span aria-hidden="true">→</span>
        </span>
      )}
    </div>
  );
}
