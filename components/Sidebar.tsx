'use client';

/**
 * Portal sidebar. Active state is derived from the current route rather
 * than passed in, so a new page cannot forget to light its own nav item.
 *
 * TWO GROUPS, NOT ONE LIST. Eight entries in a single column made a
 * member read the whole thing to find any of it, and the last three,
 * documents, profiles and settings, are the member's own paperwork
 * rather than the product. Nobody goes looking for their tax forms in
 * the same breath as a deal, so they sit under their own label.
 *
 * ORDER. Dashboard, Marketplace, Watchlist, Portfolio, then Terminal
 * (Tyler, 2026-09-17). The shelf, what the member is following and what
 * they hold come first; the terminal is what you read around them, and
 * a rail should be ordered by what people came to do.
 *
 * MARKS, NOT GLYPHS, for those two. Marketplace and Terminal are
 * AltSpot product lines with logos of their own, so they carry them.
 * The rest of the rail is Lucide, because Docs and Settings are pages,
 * not products.
 *
 * Secondaries is deliberately present but disabled — the liquidity
 * surface is gated pending a BD partner and counsel review.
 *
 * THE RAIL COLLAPSES. On a laptop it is 236px of a 1440px screen taken
 * permanently by seven links, and the deal page in particular wants
 * every pixel it can get. The toggle sits beside the wordmark, it is
 * present in both states, and the choice is remembered per device.
 * Collapsed, the rail keeps its icons and its lit row, so it is still a
 * nav rather than a hidden drawer.
 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChartPie,
  FileText,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Star,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useSyncExternalStore } from 'react';

import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import { api } from '@/lib/client/api';
import { initials } from '@/lib/format';
import type { SessionUser } from '@/lib/domain';
import type { NeedsYouItem } from '@/lib/needs-you';

import s from './Sidebar.module.css';

/** What the account chip may truthfully claim. */
export type SidebarStatus = 'approved' | 'eligible' | 'cooling_off' | 'setup';

interface NavEntry {
  id: string;
  label: string;
  href: string;
  /** The Lucide glyph, for the entries with no mark of their own. */
  icon?: LucideIcon;
  /**
   * A product's own mark, from public/brand. Terminal and Marketplace
   * are AltSpot product lines with logos of their own, so they carry
   * them rather than a generic glyph.
   */
  mark?: string;
  /** Routes that should also light this entry. */
  match: string[];
}

interface NavGroup {
  label: string;
  entries: NavEntry[];
}

const GROUPS: NavGroup[] = [
  {
    label: 'Investing',
    entries: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        match: ['/dashboard', '/payment'],
      },
      {
        id: 'marketplace',
        label: 'Marketplace',
        href: '/marketplace',
        mark: '/brand/altspot-marketplace-avatar.svg',
        match: ['/marketplace', '/deals', '/invest'],
      },
      {
        id: 'watchlist',
        label: 'Watchlist',
        href: '/watchlist',
        icon: Star,
        match: ['/watchlist'],
      },
      {
        id: 'portfolio',
        label: 'Portfolio',
        href: '/portfolio',
        icon: ChartPie,
        match: ['/portfolio'],
      },
      {
        id: 'terminal',
        label: 'Terminal',
        href: '/terminal',
        mark: '/brand/altspot-terminal-avatar.svg',
        match: ['/terminal'],
      },
    ],
  },
  {
    label: 'Your account',
    entries: [
      {
        id: 'docs',
        label: 'Docs',
        href: '/docs',
        icon: FileText,
        match: ['/docs'],
      },
      {
        id: 'profiles',
        label: 'Profiles',
        href: '/profiles',
        icon: UserRound,
        match: ['/profiles'],
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        match: ['/settings'],
      },
    ],
  },
];

/* ---------------- the collapsed state ----------------

   Kept on the document root rather than in React state, because the
   grid column that has to change lives in app/globals.css on `.layout`,
   which this component does not own. One attribute, one variable, one
   transition.

   The preference is per device and lives in localStorage: whether
   someone wants the rail narrow is a fact about their screen, not about
   their account, and it is not worth a column or a round trip. Read
   through useSyncExternalStore so the server render (open) and the
   client render agree on first paint. */
const STORE = 'asc.rail.collapsed';

/**
 * THE ATTRIBUTE IS THE TRUTH, not storage and not React state.
 *
 * The blocking script in the portal layout sets it before hydration, so
 * by the time this component mounts the rail may already be narrow
 * while React's first render believed otherwise. Reading storage in the
 * snapshot did not fix that: the value was right and React never
 * re-read it, so the first press after a reload flipped the wrong way
 * and appeared to do nothing.
 *
 * Reading the attribute, watching it with a MutationObserver, and
 * nudging React once on subscribe makes the component follow the
 * document rather than race it. Storage is written alongside, but only
 * so the next page load starts in the same state.
 */
function isCollapsed(): boolean {
  return document.documentElement.dataset.rail === 'mini';
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-rail'],
  });
  window.addEventListener('storage', onChange);

  /* One nudge after mount, so React re-reads a snapshot that was
     already true before it hydrated. */
  const nudge = requestAnimationFrame(onChange);

  return () => {
    observer.disconnect();
    cancelAnimationFrame(nudge);
    window.removeEventListener('storage', onChange);
  };
}

function setCollapsed(next: boolean): void {
  if (next) document.documentElement.dataset.rail = 'mini';
  else delete document.documentElement.dataset.rail;

  try {
    window.localStorage.setItem(STORE, String(next));
  } catch {
    /* Storage refused. The rail still moves for this visit. */
  }
}

/**
 * V18 iconography: Lucide, 1.5px stroke, currentColor. The system
 * calibrates that weight at 24px; portal chrome is denser than the
 * marketing surface, so nav sits at 17px and keeps the stroke.
 */
function Icon({ glyph: Glyph }: { glyph: LucideIcon }) {
  return <Glyph size={17} strokeWidth={1.5} aria-hidden="true" />;
}

/**
 * The slot a nav entry's mark sits in.
 *
 * A product mark is not a glyph: it arrives in AltSpot's own gold and
 * ember and it does not take `currentColor`, so the slot behind it has
 * to stay dark on the lit row as well. Gold marks on the gold ramp the
 * other slots use would simply disappear. The row still reads as active
 * from its pill, its border and its brighter type.
 */
function Slot({ entry }: { entry: NavEntry }) {
  if (entry.mark) {
    return (
      <span className={s.slot} data-mark="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.mark} src={entry.mark} alt="" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className={s.slot}>{entry.icon ? <Icon glyph={entry.icon} /> : null}</span>
  );
}

/**
 * Where the member stands, in a word or two.
 *
 * This said "Approved" for every account regardless of state, so a
 * member who had not verified anything was told they were approved by
 * the chrome on every page. On a platform where approval is a
 * regulatory fact rather than a greeting, that is not a cosmetic
 * error.
 */
const STATUS_LABEL: Record<SidebarStatus, string> = {
  approved: 'Approved',
  eligible: 'Eligible',
  cooling_off: 'Cooling off',
  setup: 'Setup incomplete',
};

export default function Sidebar({
  user,
  status,
  needs = [],
}: {
  user: SessionUser;
  status: SidebarStatus;
  /** What needs the member, for the bell. lib/needs-you.ts. */
  needs?: NeedsYouItem[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  const collapsed = useSyncExternalStore(subscribe, isCollapsed, () => false);

  async function signOut() {
    await api.logout().catch(() => {});
    router.push('/');
    router.refresh();
  }

  return (
    <aside className={s.sidebar}>
      <div className={s.brandRow}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-logo" src="/brand/altspot-wordmark.svg" alt="AltSpot" />

        <span className={s.brandTools}>
          {/* What needs the member, from any page (Tyler, 2026-09-17). */}
          <NotificationBell items={needs} />

        {/* Always present, in both states, because a control that
            disappears when you use it is a trap. */}
        <button
          type="button"
          className={s.railToggle}
          /* Read the document rather than the render: whatever React
             believes, the attribute is what the page is doing. */
          onClick={() => setCollapsed(!isCollapsed())}
          aria-pressed={collapsed}
          aria-label={collapsed ? 'Open the sidebar' : 'Close the sidebar'}
          title={collapsed ? 'Open the sidebar' : 'Close the sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} strokeWidth={1.6} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={16} strokeWidth={1.6} aria-hidden="true" />
          )}
        </button>
        </span>
      </div>

      <nav className={s.nav} aria-label="Investor portal">
        {GROUPS.map((group) => (
          <div className={s.group} key={group.label}>
            <p className={s.groupLabel}>
              {group.label}
              <span className={s.groupRule} aria-hidden="true" />
            </p>

            {group.entries.map((entry) => {
              const active = entry.match.some((prefix) => pathname.startsWith(prefix));
              return (
                <Link
                  key={entry.id}
                  href={entry.href}
                  className={active ? `${s.item} ${s.active}` : s.item}
                  aria-current={active ? 'page' : undefined}
                  title={entry.label}
                  data-tour={`rail-${entry.id}`}
                >
                  <Slot entry={entry} />
                  <span className={s.itemLabel}>{entry.label}</span>
                </Link>
              );
            })}

            {group.label === 'Investing' ? (
              <div className={`${s.item} ${s.soon}`} title="Phase 2. Select positions may become eligible for an organized annual liquidity window; participation and execution are not guaranteed.">
                <span className={s.slot}>
                  <Icon glyph={TrendingUp} />
                </span>
                <span className={s.itemLabel}>Secondaries</span>
                <span className={s.badge}>Soon</span>
              </div>
            ) : null}
          </div>
        ))}
      </nav>

      <div className={s.foot}>
        <ThemeToggle />

        <div className={s.user}>
          <span className={s.avatar}>{initials(user.name)}</span>
          <span className={s.who}>
            <b className={s.name}>{user.name}</b>
            <span className={s.status} data-status={status}>
              <span className={s.statusDot} aria-hidden="true" />
              {STATUS_LABEL[status]}
            </span>
          </span>
          <button
            type="button"
            className={s.exit}
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={15} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
