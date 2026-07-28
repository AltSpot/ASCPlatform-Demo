/**
 * One beat of the deal narrative: monospace eyebrow, one statement,
 * an optional lede, then the content.
 *
 * Every section on the deal page goes through here so the vertical
 * rhythm is decided once instead of per-section.
 */
import type { ReactNode } from 'react';

import s from './Deal.module.css';

export default function Section({
  eyebrow,
  title,
  lede,
  id,
  children,
}: {
  eyebrow: string;
  title?: string;
  lede?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section className={s.section} id={id}>
      <div className={s.sectionHead}>
        <div className={s.eyebrow}>{eyebrow}</div>
        {title && <h2 className={s.sectionTitle}>{title}</h2>}
        {lede && <p className={s.sectionLede}>{lede}</p>}
      </div>
      {children}
    </section>
  );
}
