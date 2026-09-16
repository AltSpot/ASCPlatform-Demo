/**
 * GET /reshoot
 *
 * One URL that puts the demo back into a known state and lands you on the
 * screen the next take starts from. Built for recording the product films,
 * where a take is spoiled by a stray click and the reset has to cost
 * nothing: no Settings page, no sign-in form, no typing between takes.
 *
 * It wipes the current investor exactly as Settings > Reset demo data
 * does, mints a new one, and redirects.
 *
 *   /reshoot                        Hannah Smith, seeded book, dashboard
 *   /reshoot?to=/marketplace        Hannah, straight to the shelf
 *   /reshoot?to=/deals/calder       Hannah, on the lead deal, nothing signed
 *   /reshoot?as=new                 empty account, onboarding wizard
 *   /reshoot?as=new&to=/marketplace empty account, at the gate
 *
 * `as=new` mints an address carrying "+new", which lib/repositories/
 * investor.ts treats as the clean-account seam: no positions, no votes, no
 * watchlist, no onboarding. That is the only way to reach the empty states
 * and the invest gate.
 *
 * DEMO SEAM — demo-only and refuses when DEMO_MODE is off. It destroys an
 * investor's books on an unauthenticated GET, which is not a thing a real
 * deployment does. Delete this route with the rest of the demo seams.
 */
import { audit } from '@/lib/audit';
import { createSession, destroySession, getSessionUser, hashPassword } from '@/lib/auth';
import { DEMO_MODE } from '@/lib/config';
import { deleteInvestor, releaseHeldAllocation } from '@/lib/repositories/demo';
import {
  createDemoPersonaInvestor,
  ensureInvestorRecords,
} from '@/lib/repositories/investor';
import { prisma } from '@/lib/db';

/** Same shape the wizard expects, and never a real person's address. */
function cleanAddress(): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `recording+new+${suffix}@altspot.demo`;
}

/**
 * Only same-origin paths. `to` comes off the query string, so an
 * unvalidated value is an open redirect, and "//evil.example" is a path
 * to the browser but an origin to the URL parser.
 */
function safePath(raw: string | null): string {
  if (!raw) return '/dashboard';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard';
  return raw;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (!DEMO_MODE) {
    return new Response('Not found', { status: 404 });
  }

  const target = safePath(url.searchParams.get('to'));
  const wantsEmpty = url.searchParams.get('as') === 'new';

  // Clear whoever is signed in, exactly as the Settings control does.
  const current = await getSessionUser();
  if (current) {
    await releaseHeldAllocation(current.id);
    await audit({
      userId: current.id,
      action: 'demo.reset',
      entity: 'user',
      entityId: current.id,
      metadata: { via: 'reshoot' },
    });
    await destroySession();
    await deleteInvestor(current.id);
  }

  if (wantsEmpty) {
    const user = await prisma.user.create({
      data: {
        email: cleanAddress(),
        name: 'Demo Investor',
        passwordHash: await hashPassword('demo-password'),
      },
    });
    await createSession(user.id);
    await ensureInvestorRecords(user.id);
  } else {
    const user = await createDemoPersonaInvestor(await hashPassword('demo-persona'));
    await createSession(user.id);
  }

  /* 303 rather than 302: the browser must issue a GET for the target, and
     no-store keeps a reset URL out of the back/forward cache, which
     otherwise replays a stale page between takes. */
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(target, url.origin).toString(),
      'Cache-Control': 'no-store',
    },
  });
}
