'use client';

/**
 * Money out and money back, by quarter, on one axis.
 *
 * The question this answers is the one a distribution list cannot:
 * when does the cash actually move, and how far through getting the
 * original capital back is this portfolio. A log of five payments in
 * date order makes a reader do that arithmetic in their head.
 *
 * Contributions hang below the zero line and distributions stand above
 * it, split so return of capital and gain never share a bar. The line
 * across the top is cumulative cash returned against cumulative paid
 * in, which is DPI drawn rather than stated: it reaches the top of the
 * plot when the portfolio has returned everything that went into it.
 *
 * Bars, not an area. These are discrete events on dates. Anything that
 * joins them implies cash moving in the quarters where none did.
 */
import { useState } from 'react';

import { money, percent } from '@/lib/format';

import s from './CashFlow.module.css';

export interface FlowPeriod {
  label: string;
  contributed: number;
  capital: number;
  gain: number;
  /** Cumulative, as of the end of this quarter. */
  paidIn: number;
  distributed: number;
}

export default function CashFlow({ periods }: { periods: FlowPeriod[] }) {
  const [at, setAt] = useState<number | null>(null);

  if (periods.length === 0) return null;

  const biggest = Math.max(
    1,
    ...periods.map((period) =>
      Math.max(period.contributed, period.capital + period.gain),
    ),
  );

  const active = at === null ? periods.length - 1 : at;
  const period = periods[active];
  const back = period.paidIn ? period.distributed / period.paidIn : 0;

  return (
    <div className="card">
      <div className={s.head}>
        <div className={s.readout}>
          <span className={s.when}>{period.label}</span>
          <span className={s.figure}>
            {period.contributed || period.capital || period.gain
              ? [
                  period.contributed ? `${money(period.contributed)} out` : null,
                  period.capital + period.gain
                    ? `${money(period.capital + period.gain)} back`
                    : null,
                ]
                  .filter(Boolean)
                  .join(', ')
              : 'No cash moved'}
          </span>
          <span className={s.cume}>
            {money(period.distributed)} distributed of {money(period.paidIn)} invested
          </span>
        </div>

        <div className={s.keys}>
          <span className={s.key}>
            <span className={`${s.swatch} ${s.swatchGain}`} aria-hidden="true" />
            Gain
          </span>
          <span className={s.key}>
            <span className={`${s.swatch} ${s.swatchCapital}`} aria-hidden="true" />
            Capital back
          </span>
          <span className={s.key}>
            <span className={`${s.swatch} ${s.swatchOut}`} aria-hidden="true" />
            Invested
          </span>
        </div>
      </div>

      <div className={s.plot} onPointerLeave={() => setAt(null)}>
        {/* Cumulative cash returned as a share of cash in. Sits behind
            the bars, because it is context for them and not a series a
            reader should read first. */}
        <div className={s.progress} aria-hidden="true">
          <span className={s.progressFill} style={{ width: `${Math.min(100, back * 100)}%` }} />
        </div>

        <div className={s.bars}>
          {/* One line across the whole plot, not a segment per column.
              Drawn once so it reads as an axis rather than as six
              disconnected ticks. */}
          <span className={s.zero} aria-hidden="true" />

          {periods.map((entry, index) => {
            const inHeight = (entry.contributed / biggest) * 100;
            const capitalHeight = (entry.capital / biggest) * 100;
            const gainHeight = (entry.gain / biggest) * 100;

            return (
              <button
                type="button"
                key={entry.label}
                className={s.slot}
                aria-current={index === active}
                aria-label={`${entry.label}: ${money(entry.contributed)} in, ${money(entry.capital + entry.gain)} back`}
                onPointerEnter={() => setAt(index)}
                onFocus={() => setAt(index)}
              >
                <span className={s.up}>
                  <span className={s.gain} style={{ height: `${gainHeight}%` }} />
                  <span className={s.capital} style={{ height: `${capitalHeight}%` }} />
                </span>

                <span className={s.down}>
                  <span className={s.out} style={{ height: `${inHeight}%` }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={s.axis}>
        <span>{periods[0].label}</span>
        <span className={s.dpi}>
          DPI {back.toFixed(2)}× · {percent(back, 0)} of capital back
        </span>
        <span>{periods[periods.length - 1].label}</span>
      </div>
    </div>
  );
}
