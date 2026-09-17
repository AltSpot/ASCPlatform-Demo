/**
 * Referral links: the pure rules.
 *
 * A partner or a member shares /r/<code>. Following it lands on sign-up,
 * and only sign-up: never on a deal, whatever the link carries. The new
 * member walks the same investor questionnaire and the same Rule 506(b)
 * relationship gate as anyone else, and the code is recorded on their
 * record for reporting.
 *
 * REPORTING ONLY. No one is paid per investor or per dollar they bring
 * in (docs/structure-decisions-sept-2026.md section 5): nothing in fee,
 * carry or eligibility logic may read a referral. tests/referral.test.ts
 * reads those modules as text and fails if one mentions it.
 *
 * Pure and isomorphic.
 */

export type ReferralKind = 'partner' | 'member';

/** The cookie that carries a followed link as far as sign-up. */
export const REFERRAL_COOKIE = 'asc_ref';

/** Long enough to register later the same week, short enough to lapse. */
export const REFERRAL_COOKIE_DAYS = 14;

/** Lowercase letters, digits and hyphens, 4 to 32 characters. */
const CODE = /^[a-z0-9](?:[a-z0-9-]{2,30})[a-z0-9]$/;

/** Normalise a code from a URL or cookie, or null if it is not one. */
export function normalizeReferralCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toLowerCase();
  return CODE.test(code) ? code : null;
}

/** Where a followed link sends someone. Never anywhere else. */
export function referralLanding(signedIn: boolean): string {
  return signedIn ? '/dashboard' : '/?join=1';
}

/** The path to share. The origin is added where the page knows it. */
export function referralPath(code: string): string {
  return `/r/${code}`;
}
