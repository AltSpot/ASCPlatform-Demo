'use client';

/**
 * Where a bar's chosen option sits, so one outline can glide from option
 * to option instead of each option lighting on its own (Tyler,
 * 2026-09-21: switching should "make perfect sense"). The bar marks its
 * chosen child with data-active="true"; this measures that child against
 * the bar and re-measures when the choice, the bar's size or the fonts
 * change. Returns null until there is something to point at, so nothing
 * is drawn on the server or when nothing is chosen.
 */
import { useLayoutEffect, useState, type RefObject } from 'react';

export interface IndicatorBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useSlidingIndicator(
  bar: RefObject<HTMLElement | null>,
  activeKey: string | null,
): IndicatorBox | null {
  const [box, setBox] = useState<IndicatorBox | null>(null);

  useLayoutEffect(() => {
    const el = bar.current;
    if (!el) return;
    const measure = () => {
      const active = el.querySelector<HTMLElement>('[data-active="true"]');
      if (!active) {
        setBox(null);
        return;
      }
      setBox({
        x: active.offsetLeft,
        y: active.offsetTop,
        width: active.offsetWidth,
        height: active.offsetHeight,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, [bar, activeKey]);

  return box;
}
