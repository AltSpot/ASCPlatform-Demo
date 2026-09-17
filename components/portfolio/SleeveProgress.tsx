/**
 * Building the sleeve: where a book stands against the construction the
 * platform teaches (lib/portfolio-plan.ts). A count against twenty, the
 * largest position against equal weight, and the three rules in a row.
 * It measures; it does not tell a member what to do with their money.
 * Server component.
 */
import { CalendarRange, Scale, Vault } from 'lucide-react';

import Term from '@/components/Term';
import { SLEEVE, sleeveProgress } from '@/lib/portfolio-plan';

import s from './SleeveProgress.module.css';

export default function SleeveProgress({ invested }: { invested: number[] }) {
  const p = sleeveProgress(invested);
  const overweight = p.count > 1 && p.largestSharePercent > p.equalWeightPercent * 3;

  return (
    <div className={s.wrap}>
      <div className={s.meter}>
        <div className={s.top}>
          <span className={s.label}>
            <Term q="Why does the platform talk about twenty positions?" quiet>
              Positions toward twenty
            </Term>
          </span>
          <span className={s.figure}>
            {p.count} <small>of {p.target}</small>
          </span>
        </div>
        <div className={s.track} role="img" aria-label={`${p.count} of ${p.target} positions`}>
          {Array.from({ length: p.target }, (_, i) => (
            <span key={i} className={s.cell} data-on={i < p.count} />
          ))}
        </div>
        <p className={s.note}>
          {p.count === 0
            ? 'Your first position starts the sleeve. Twenty at equal weight, over about three years, is the shape a diversified early-stage sleeve usually takes.'
            : overweight
              ? `Your largest position is ${p.largestSharePercent}% of what you have put in; equal weight across twenty is about ${p.equalWeightPercent}%. Early positions are always heavy until the count catches up.`
              : `Your largest position is ${p.largestSharePercent}% of what you have put in; equal weight across twenty is about ${p.equalWeightPercent}%.`}
        </p>
      </div>

      <ul className={s.rules}>
        <li>
          <span className={s.glyph} aria-hidden="true">
            <CalendarRange size={15} strokeWidth={1.6} />
          </span>
          <b>Over about {SLEEVE.deployYears} years</b>
          <span>Six or seven positions a year, not all at once.</span>
        </li>
        <li>
          <span className={s.glyph} aria-hidden="true">
            <Scale size={15} strokeWidth={1.6} />
          </span>
          <b>Equal weight</b>
          <span>Around {Math.round(100 / SLEEVE.targetPositions)}% of the sleeve each. Nobody knows in advance which one carries it.</span>
        </li>
        <li>
          <span className={s.glyph} aria-hidden="true">
            <Vault size={15} strokeWidth={1.6} />
          </span>
          <b>
            {SLEEVE.reserveMinPercent}% to {SLEEVE.reserveMaxPercent}% kept back
          </b>
          <span>For follow-ons in the ones that break out.</span>
        </li>
      </ul>

      <p className={s.foot}>
        A description of how a diversified sleeve is built, not advice about your money. How
        much to commit is between you and your advisor.
      </p>
    </div>
  );
}
