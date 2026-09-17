/**
 * The picture under a Spot answer. Four shapes (lib/spotbot/types.ts):
 * a path of steps, a meter with marks, a sum, a split. Pure rendering of
 * what the engine sent; nothing is computed here, so the browser cannot
 * show a figure the server did not.
 */
import { ArrowDown, Check } from 'lucide-react';

import type { SpotVisual as Visual } from '@/lib/spotbot/types';

import s from './SpotVisual.module.css';

export default function SpotVisual({ visual }: { visual: Visual }) {
  switch (visual.kind) {
    case 'path':
      return (
        <figure className={s.fig} aria-label={visual.title}>
          <figcaption className={s.title}>{visual.title}</figcaption>
          <ol className={s.path}>
            {visual.steps.map((step, i) => (
              <li className={s.step} key={step.label} data-tone={step.tone ?? 'default'}>
                <span className={s.node} aria-hidden="true">
                  {step.tone === 'good' ? <Check size={11} strokeWidth={2.4} /> : i + 1}
                </span>
                <span className={s.stepText}>
                  <b>{step.label}</b>
                  <span>{step.note}</span>
                </span>
              </li>
            ))}
          </ol>
          {visual.otherwise ? (
            <p className={s.otherwise}>
              <ArrowDown size={12} strokeWidth={1.8} aria-hidden="true" />
              <span>
                <b>{visual.otherwise.label}.</b> {visual.otherwise.note}
              </span>
            </p>
          ) : null}
        </figure>
      );

    case 'meter': {
      const value = Math.max(0, Math.min(100, visual.value));
      return (
        <figure className={s.fig} aria-label={visual.title}>
          <figcaption className={s.title}>{visual.title}</figcaption>
          <div className={s.meterWrap}>
            <div
              className={s.track}
              role="img"
              aria-label={`${visual.fillLabel}: ${value} percent`}
            >
              <span className={s.fill} style={{ width: `${value}%` }} />
              {visual.marks.map((mark) => (
                <span
                  key={mark.label}
                  className={s.mark}
                  data-tone={mark.tone ?? 'default'}
                  style={{ left: `${Math.min(100, Math.max(0, mark.at))}%` }}
                  aria-hidden="true"
                />
              ))}
            </div>
            {/* The marks are named in a legend under the track, never over
                it: two marks a few percent apart had their labels on top
                of each other. */}
            <ul className={s.legend}>
              <li data-tone="fill">
                <span className={s.swatch} aria-hidden="true" />
                {visual.fillLabel}
              </li>
              {visual.marks.map((mark) => (
                <li key={mark.label} data-tone={mark.tone ?? 'default'}>
                  <span className={s.tick} aria-hidden="true" />
                  {mark.label}
                </li>
              ))}
            </ul>
          </div>
          <p className={s.caption}>{visual.caption}</p>
        </figure>
      );
    }

    case 'sum':
      return (
        <figure className={s.fig} aria-label={visual.title}>
          <figcaption className={s.title}>{visual.title}</figcaption>
          <dl className={s.sum}>
            {visual.rows.map((row) => (
              <div className={s.sumRow} key={row.label} data-tone={row.tone ?? 'default'}>
                <dt>
                  {row.label}
                  {row.note ? <small>{row.note}</small> : null}
                </dt>
                <dd>{row.value}</dd>
              </div>
            ))}
            <div className={`${s.sumRow} ${s.sumTotal}`}>
              <dt>{visual.total.label}</dt>
              <dd>{visual.total.value}</dd>
            </div>
          </dl>
          <p className={s.caption}>{visual.caption}</p>
        </figure>
      );

    case 'split': {
      const total = visual.segments.reduce((sum, seg) => sum + seg.share, 0) || 1;
      return (
        <figure className={s.fig} aria-label={visual.title}>
          <figcaption className={s.title}>{visual.title}</figcaption>
          <div className={s.split} role="img" aria-label={visual.segments.map((x) => x.label).join(', ')}>
            {visual.segments.map((seg) => (
              <span
                key={seg.label}
                className={s.segment}
                data-tone={seg.tone}
                style={{ flexGrow: seg.share / total }}
              />
            ))}
          </div>
          <ul className={s.legend}>
            {visual.segments.map((seg) => (
              <li key={seg.label} data-tone={seg.tone}>
                <span className={s.swatch} aria-hidden="true" />
                {seg.label}
              </li>
            ))}
          </ul>
          <p className={s.caption}>{visual.caption}</p>
        </figure>
      );
    }
  }
}
