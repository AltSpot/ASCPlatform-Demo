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

import { api } from '@/lib/client/api';
import { initials } from '@/lib/format';
import type { SessionUser } from '@/lib/domain';

interface NavEntry {
  id: string;
  label: string;
  href: string;
  icon: string;
  /** Routes that should also light this entry. */
  match: string[];
}

const NAV: NavEntry[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'M3 13h6V3H3v10zm0 8h6v-6H3v6zm8 0h10V11H11v10zm0-18v6h10V3H11z',
    match: ['/dashboard', '/payment'],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    href: '/marketplace',
    icon: 'M4 7l8-4 8 4v2H4V7zm1 4h14v8h-4v-5H9v5H5v-8z',
    match: ['/marketplace', '/deals', '/invest'],
  },
  {
    id: 'docs',
    label: 'Docs',
    href: '/docs',
    icon: 'M6 2h9l5 5v15H6V2zm8 1.5V8h4.5L14 3.5zM8 12h8v1.6H8V12zm0 4h8v1.6H8V16z',
    match: ['/docs'],
  },
  {
    id: 'profiles',
    label: 'Profiles',
    href: '/profiles',
    icon: 'M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9zm-8 9a8 8 0 0116 0H4z',
    match: ['/profiles'],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: 'M12 8a4 4 0 110 8 4 4 0 010-8zm9 4l-2.1-.7.3-2.2-1.9-1.1-1.7 1.4-2-.9L13 6h-2l-.6 2.5-2 .9-1.7-1.4-1.9 1.1.3 2.2L3 12l2.1.7-.3 2.2 1.9 1.1 1.7-1.4 2 .9L11 18h2l.6-2.5 2-.9 1.7 1.4 1.9-1.1-.3-2.2L21 12z',
    match: ['/settings'],
  },
];

function Icon({ d }: { d: string }) {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
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
        <div className="orb" />
        <div className="brand-name">
          Alt<span>Spot</span>
        </div>
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
            <Icon d={entry.icon} />
            {entry.label}
          </Link>
        );
      })}

      <div className="nav-item soon" title="Secondary liquidity — in design">
        <Icon d="M7 17l4-6 3 3 4-7" />
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
