'use client';

/**
 * Appearance, in Settings (Tyler, 2026-09-19).
 *
 * The three themes were only reachable from the small switch at the foot
 * of the rail, which a member has no reason to find. Here each one is a
 * tile that looks like what it is: a small drawing of the canvas, a pane
 * and the two buttons, in that theme's own colours, with a sentence on
 * when it suits. Pressing a tile is the rail's switch, the same `setTheme`
 * and the same stored preference, so the two can never disagree.
 *
 * EMBER IS THE DEFAULT. A new member, or a browser with nothing stored,
 * gets the ember canvas: it is `:root`, and nothing reads the operating
 * system's colour scheme, so the product opens the same on every laptop.
 * The choice is kept on this device, like the rail width and the folded
 * sections.
 *
 * A preview cannot read the theme tokens, because they describe whichever
 * theme is on. Each tile carries its own few colours as custom properties,
 * taken from that theme's block in globals.css.
 */
import { Check } from 'lucide-react';

import { setTheme, useTheme, type Theme } from '@/components/ThemeToggle';

import s from './AppearanceCard.module.css';

interface Option {
  id: Theme;
  name: string;
  note: string;
  ground: string;
  pane: string;
  edge: string;
  ink: string;
  quiet: string;
  primaryBg: string;
  primaryFg: string;
}

const OPTIONS: Option[] = [
  {
    id: 'dark',
    name: 'Ember',
    note: 'The platform’s own canvas. Dark and warm, easiest on the eyes at night.',
    ground: 'radial-gradient(120% 90% at 100% 0%, #3A2208 0%, #0B0907 58%)',
    pane: '#121110',
    edge: '#2B2926',
    ink: '#F4EFE6',
    quiet: '#7C766D',
    primaryBg: '#EFE9DC',
    primaryFg: '#15110A',
  },
  {
    id: 'ice',
    name: 'Ice',
    note: 'The same dark canvas with cool, frosted panes.',
    ground: 'radial-gradient(120% 90% at 0% 0%, #12304A 0%, #07090D 60%)',
    pane: '#141B24',
    edge: '#34475C',
    ink: '#EEF4FB',
    quiet: '#7E8C9C',
    primaryBg: '#EFE9DC',
    primaryFg: '#15110A',
  },
  {
    id: 'light',
    name: 'Daylight',
    note: 'A light canvas for a bright room or a projector.',
    ground: 'radial-gradient(120% 90% at 100% 0%, #F8D9B0 0%, #F3EADC 60%)',
    pane: '#FBF6EC',
    edge: '#D9CCB6',
    ink: '#1D1810',
    quiet: '#8A7F6F',
    primaryBg: '#1D1810',
    primaryFg: '#F8F3E9',
  },
];

export default function AppearanceCard() {
  const theme = useTheme();

  return (
    <div className="card">
      <h3 className={s.title}>Appearance</h3>
      <p className="small">
        Three looks, one platform. Ember is the default. Your choice is kept on this device.
      </p>

      <div className={s.options} role="radiogroup" aria-label="Appearance">
        {OPTIONS.map((option) => {
          const on = theme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={s.option}
              data-on={on}
              onClick={() => setTheme(option.id)}
            >
              <span
                className={s.preview}
                aria-hidden="true"
                style={{
                  ['--pv-ground' as string]: option.ground,
                  ['--pv-pane' as string]: option.pane,
                  ['--pv-edge' as string]: option.edge,
                  ['--pv-ink' as string]: option.ink,
                  ['--pv-quiet' as string]: option.quiet,
                  ['--pv-primary-bg' as string]: option.primaryBg,
                  ['--pv-primary-fg' as string]: option.primaryFg,
                }}
              >
                <span className={s.pvPane}>
                  <span className={s.pvLine} data-w="short" />
                  <span className={s.pvFigure} />
                  <span className={s.pvLine} />
                  <span className={s.pvButtons}>
                    <span className={s.pvGold} />
                    <span className={s.pvPrimary} />
                  </span>
                </span>
              </span>

              <span className={s.meta}>
                <span className={s.name}>
                  {option.name}
                  {option.id === 'dark' ? <span className={s.default}>Default</span> : null}
                </span>
                <span className={s.note}>{option.note}</span>
              </span>

              <span className={s.tick} aria-hidden="true">
                {on ? <Check size={13} strokeWidth={2.4} /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
