'use client';

/**
 * The marketplace switcher: what is open today, and what AltSpot is
 * tracking. "Watchlist" is deliberately not used here: that word belongs
 * to the investor's own saved list, which is a different thing.
 *
 * Both panels are rendered on the server and handed in as children, so
 * the deals and the Radar board keep server-correct numbers on first
 * paint. This component only decides which one is on screen, which is
 * why switching costs nothing.
 *
 * The chosen tab is written to the URL with replaceState rather than a
 * router push: a reload or a shared link lands on the right panel, and
 * the back button still leaves the marketplace instead of walking the
 * user through their own tab presses.
 */
import { useState, type ReactNode } from 'react';

import s from './Marketplace.module.css';

export type MarketplaceView = 'current' | 'radar';

interface PanelCopy {
  title: string;
  lede: string;
}

const COPY: Record<MarketplaceView, PanelCopy> = {
  current: {
    title: 'Open now.',
    lede: 'Deals you can invest in today. AltSpot has its own capital in every one.',
  },
  radar: {
    title: 'What we are tracking.',
    lede: 'Private companies AltSpot is looking at. None of these are open today. Tell us which ones you want and how much you would put in, and we will know where to focus.',
  },
};

export default function MarketplaceTabs({
  initial,
  dealCount,
  radarCount,
  current,
  radar,
}: {
  initial: MarketplaceView;
  dealCount: number;
  radarCount: number;
  current: ReactNode;
  radar: ReactNode;
}) {
  const [view, setView] = useState<MarketplaceView>(initial);

  function select(next: MarketplaceView) {
    if (next === view) return;
    setView(next);

    const url = next === 'current' ? '/marketplace' : `/marketplace?view=${next}`;
    window.history.replaceState(null, '', url);
  }

  const copy = COPY[view];

  return (
    <>
      <div className={s.switcher} role="tablist" aria-label="Marketplace views">
        <button
          type="button"
          role="tab"
          className={s.tab}
          aria-selected={view === 'current'}
          aria-controls="marketplace-panel"
          onClick={() => select('current')}
        >
          Current opportunities
          <span className={s.count}>{dealCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          className={s.tab}
          aria-selected={view === 'radar'}
          aria-controls="marketplace-panel"
          onClick={() => select('radar')}
        >
          AltSpot Radar
          <span className={s.count}>{radarCount}</span>
        </button>
      </div>

      <div className={s.panel} id="marketplace-panel" role="tabpanel" key={view}>
        <div className={s.panelHead}>
          <h2>{copy.title}</h2>
          <p>{copy.lede}</p>
        </div>
        {view === 'current' ? current : radar}
      </div>
    </>
  );
}
