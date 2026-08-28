'use client';

/**
 * Portal sidebar. Active state is derived from the current route rather
 * than passed in, so a new page cannot forget to light its own nav item.
 *
 * Secondaries is deliberately present but disabled — the liquidity
 * surface is gated pending a BD partner and counsel review.
 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  LayoutDashboard,
  Newspaper,
  Settings,
  Store,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

import { api } from '@/lib/client/api';
import { initials } from '@/lib/format';
import type { SessionUser } from '@/lib/domain';

interface NavEntry {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Routes that should also light this entry. */
  match: string[];
}

const NAV: NavEntry[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    match: ['/dashboard', '/payment'],
  },
  {
    id: 'terminal',
    label: 'Terminal',
    href: '/terminal',
    icon: Newspaper,
    match: ['/terminal'],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    href: '/marketplace',
    icon: Store,
    match: ['/marketplace', '/deals', '/invest'],
  },
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
];

/**
 * V18 iconography: Lucide, 1.5px stroke, currentColor. The system
 * calibrates that weight at 24px; portal chrome is denser than the
 * marketing surface, so nav sits at 18px and keeps the stroke.
 */
function Icon({ glyph: Glyph }: { glyph: LucideIcon }) {
  return <Glyph className="ico" size={18} strokeWidth={1.5} aria-hidden="true" />;
}

export default function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await api.logout().catch(() => {});
    router.push('/');
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-logo" src="/brand/altspot-capital-product-lockup.svg" alt="AltSpot Capital" />
      </div>

      <div className="nav-label">Investor portal</div>

      {NAV.map((entry) => {
        const active = entry.match.some((prefix) => pathname.startsWith(prefix));
        return (
          <Link
            key={entry.id}
            href={entry.href}
            className={active ? 'nav-item active' : 'nav-item'}
          >
            <Icon glyph={entry.icon} />
            {entry.label}
          </Link>
        );
      })}

      <div className="nav-item soon" title="Secondary liquidity, in design">
        <Icon glyph={TrendingUp} />
        Secondaries
        <span className="badge-soon">Soon</span>
      </div>

      <div className="side-foot">
        <div className="user-chip">
          <div className="avatar">{initials(user.name)}</div>
          <div className="who">
            <b>{user.name}</b>
            <span>Approved member</span>
          </div>
          <button className="logout" onClick={signOut} title="Sign out">
            Exit
          </button>
        </div>
      </div>
    </aside>
  );
}
