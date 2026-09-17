/**
 * GET /r/:code — a partner or member referral link.
 *
 * Public, and it only ever does one thing: remember the code and send the
 * visitor to sign-up. It never lands on a deal, whatever else is on the
 * URL, because under Rule 506(b) a referral is how someone arrives at the
 * relationship gate, not a way past it. A signed-in member who follows a
 * link is sent to their dashboard and nothing is re-attributed.
 *
 * An unknown or retired code still lands on sign-up, without a cookie, so
 * the link neither errors nor reveals which codes exist.
 */
import { cookies } from 'next/headers';

import { getSessionUser } from '@/lib/auth';
import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_DAYS,
  normalizeReferralCode,
  referralLanding,
} from '@/lib/referral';
import { findActiveReferralCode } from '@/lib/repositories/referrals';

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const url = new URL(request.url);
  const { code: raw } = await context.params;

  const user = await getSessionUser();
  const target = referralLanding(user !== null);

  if (!user) {
    const code = normalizeReferralCode(raw);
    const referral = code ? await findActiveReferralCode(code) : null;
    if (referral) {
      const jar = await cookies();
      jar.set(REFERRAL_COOKIE, referral.code, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: REFERRAL_COOKIE_DAYS * 86_400,
      });
    }
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(target, url.origin).toString(),
      'Cache-Control': 'no-store',
    },
  });
}
