/**
 * Portal shell — every signed-in page renders inside this.
 *
 * Authentication is enforced here rather than in each page, so a new
 * route added under (portal) is protected by construction.
 */
import { redirect } from 'next/navigation';

import Sidebar from '@/components/Sidebar';
import { getSessionUser } from '@/lib/auth';

export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();
  if (!user) redirect('/');

  return (
    <div className="layout">
      <Sidebar user={user} />
      <main className="main">{children}</main>
    </div>
  );
}
