/**
 * Referral links (lib/referral.ts).
 *
 * The line that matters most is the last describe: no one may be paid
 * per investor they bring in, so nothing that decides a fee, a carry
 * split, or whether a member may see or join a deal may read a referral.
 * These modules are read as text, so a future edit that starts branching
 * on who referred someone fails here before it ships.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { normalizeReferralCode, referralLanding, referralPath } from '@/lib/referral';

describe('normalizeReferralCode', () => {
  test('accepts the codes the platform issues', () => {
    assert.equal(normalizeReferralCode('northlight'), 'northlight');
    assert.equal(normalizeReferralCode('m-1a2b3c4d5e'), 'm-1a2b3c4d5e');
    assert.equal(normalizeReferralCode('  NorthLight '), 'northlight');
  });

  test('refuses anything that could smuggle a path, a query or markup', () => {
    for (const raw of ['', 'ab', '../deals', 'calder?to=/deals/calder', '/deals/calder', 'a b c d', '<script>', '-lead', 'x'.repeat(33), 42, null]) {
      assert.equal(normalizeReferralCode(raw), null, `accepted ${String(raw)}`);
    }
  });
});

describe('referralLanding', () => {
  test('a followed link lands on sign-up or the dashboard, never a deal', () => {
    assert.equal(referralLanding(false), '/?join=1');
    assert.equal(referralLanding(true), '/dashboard');
    for (const signedIn of [true, false]) {
      assert.ok(!referralLanding(signedIn).includes('/deals'));
      assert.ok(!referralLanding(signedIn).includes('/invest'));
    }
  });

  test('the shared path is /r/<code>', () => {
    assert.equal(referralPath('northlight'), '/r/northlight');
  });
});

describe('referral source is reporting only', () => {
  const DECIDERS = [
    'lib/fees.ts',
    'lib/funding.ts',
    'lib/spv-rules.ts',
    'lib/preferences.ts',
    'lib/explore.ts',
    'lib/repositories/spv.ts',
    'lib/relationship.ts',
    'lib/domain.ts',
    'lib/repositories/deals.ts',
    'lib/repositories/subscriptions.ts',
    'app/api/subscriptions/route.ts',
    'app/(portal)/invest/[dealId]/page.tsx',
  ];

  for (const file of DECIDERS) {
    test(`${file} never reads a referral`, () => {
      const source = readFileSync(file, 'utf8');
      // Identifiers, not the English word: 'preferredTerms' and 'referred to
      // a person' (questionnaire review) are not referral links.
      assert.ok(!/referral|REFERRAL_|asc_ref/i.test(source), `${file} mentions referrals`);
    });
  }
});
