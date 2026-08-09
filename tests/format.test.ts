/**
 * Presentation helpers.
 *
 * Three things here are load bearing rather than cosmetic.
 *
 * `maskTin` is the last thing that stands between a taxpayer ID and a
 * screen. `dateStr` is pinned to UTC so a server render and a browser
 * render of the same timestamp produce the same string, which is what
 * keeps React from reporting a hydration mismatch on a page full of
 * dates. And `EMPTY` is the placeholder glyph that exists so nobody ever
 * types a dash into user-facing copy, which the brand voice forbids.
 *
 * The rest is small, but every one of these functions renders money or a
 * deadline in front of an investor, so a zero that disappears or a day
 * that rounds the wrong way is a real defect.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { DAY_MS } from '@/lib/domain';
import {
  EMPTY,
  dateStr,
  daysLeft,
  initials,
  maskTin,
  money,
  nameFromEmail,
} from '@/lib/format';

describe('the EMPTY placeholder', () => {
  test('is an en dash, never an em dash', () => {
    // The voice rule bans em dashes in user-facing copy. EMPTY exists so a
    // writer never has to reach for one, so it must not be one itself.
    assert.equal(EMPTY, '–');
    assert.notEqual(EMPTY, '—');
  });

  test('is what every helper falls back to, so a missing value never renders as blank or NaN', () => {
    assert.equal(money(null), EMPTY);
    assert.equal(money(undefined), EMPTY);
    assert.equal(money(NaN), EMPTY);
    assert.equal(dateStr(null), EMPTY);
    assert.equal(dateStr(undefined), EMPTY);
    assert.equal(dateStr('not a date'), EMPTY);
  });
});

describe('money', () => {
  test('zero is a value and renders as $0, not as the placeholder', () => {
    // A falsy check here instead of an explicit null check would hide a
    // real balance of zero behind a dash.
    assert.equal(money(0), '$0');
  });

  test('whole dollars render with thousands separators and no decimals', () => {
    assert.equal(money(500), '$500');
    assert.equal(money(10_500), '$10,500');
    assert.equal(money(1_050_000), '$1,050,000');
    assert.equal(money(100_000_000), '$100,000,000');
  });

  test('fractional dollars round to whole dollars by default', () => {
    assert.equal(money(500.05), '$500');
    assert.equal(money(500.5), '$501');
  });

  test('decimals are shown only when asked for', () => {
    assert.equal(money(500.05, 2), '$500.05');
    assert.equal(money(1_234.5, 2), '$1,234.5');
    // minimumFractionDigits is 0, so a round number never gains ".00".
    assert.equal(money(500, 2), '$500');
  });

  test('the locale is pinned, so the server and the browser render the same string', () => {
    // en-US is explicit in the helper. A machine defaulting to a locale
    // that groups with dots would otherwise produce a hydration mismatch.
    assert.equal(money(1_234_567), '$1,234,567');
  });
});

describe('dateStr', () => {
  const ORIGINAL_TZ = process.env.TZ;

  before(() => {
    // Pinned to a timezone behind UTC for the length of this block. CI
    // runs in UTC, where a missing timeZone option would look correct, so
    // without this the assertion below would not actually test anything.
    process.env.TZ = 'America/Los_Angeles';
  });

  after(() => {
    process.env.TZ = ORIGINAL_TZ;
  });

  test('a timestamp renders in UTC regardless of the machine timezone', () => {
    // Midnight UTC is the previous day in Los Angeles. If the timeZone
    // option is ever dropped, this renders "Dec 31, 2025" and every dated
    // figure in the portal starts disagreeing between server and client.
    assert.equal(dateStr(Date.UTC(2026, 0, 1, 0, 0, 0)), 'Jan 1, 2026');
    assert.equal(dateStr('2026-01-01T00:00:00.000Z'), 'Jan 1, 2026');
    assert.equal(dateStr('2026-01-01T23:59:59.999Z'), 'Jan 1, 2026');
  });

  test('accepts a Date, an ISO string and an epoch number identically', () => {
    const expected = 'Mar 15, 2026';
    const epoch = Date.UTC(2026, 2, 15, 12, 0, 0);
    assert.equal(dateStr(new Date(epoch)), expected);
    assert.equal(dateStr(new Date(epoch).toISOString()), expected);
    assert.equal(dateStr(epoch), expected);
  });

  test('an unparseable value renders as the placeholder rather than "Invalid Date"', () => {
    assert.equal(dateStr(''), EMPTY);
    assert.equal(dateStr('yesterday'), EMPTY);
    assert.equal(dateStr(new Date('nope')), EMPTY);
  });
});

describe('daysLeft', () => {
  test('a full ten day funding window reads as ten days', () => {
    assert.equal(daysLeft(Date.now() + 10 * DAY_MS), 10);
  });

  test('a partial day counts as a day, so a deadline today never reads as zero', () => {
    // Ceiling, not floor. An investor with eleven hours left has one day
    // to fund, and telling them zero would read as already lapsed.
    assert.equal(daysLeft(Date.now() + DAY_MS / 2), 1);
    assert.equal(daysLeft(Date.now() + 60_000), 1);
  });

  test('a lapsed deadline floors at zero and never goes negative', () => {
    assert.equal(daysLeft(Date.now() - DAY_MS), 0);
    assert.equal(daysLeft(Date.now() - 400 * DAY_MS), 0);
  });

  test('no deadline means nothing is counting down', () => {
    assert.equal(daysLeft(null), 0);
    assert.equal(daysLeft(undefined), 0);
    assert.equal(daysLeft(''), 0);
  });
});

describe('maskTin', () => {
  test('renders only the last four digits behind a fixed mask', () => {
    assert.equal(maskTin('1234'), '···-··-1234');
  });

  test('a missing taxpayer ID masks completely rather than rendering an empty tail', () => {
    assert.equal(maskTin(null), '···-··-····');
    assert.equal(maskTin(undefined), '···-··-····');
    assert.equal(maskTin(''), '···-··-····');
    for (const rendered of [maskTin(null), maskTin(undefined), maskTin('')]) {
      assert.equal(/\d/.test(rendered), false, 'a digit escaped an empty mask');
    }
  });

  test('the mask never widens: at most four digits reach the screen', () => {
    for (const last4 of ['1234', '0000', '9999']) {
      const rendered = maskTin(last4);
      const digits = rendered.replace(/\D/g, '');
      assert.equal(digits.length, 4, `${rendered} exposed ${digits.length} digits`);
      assert.equal(digits, last4);
    }
  });

  test('maskTin trusts its input, so the four digit guarantee lives upstream in saveVault', () => {
    // Documented, and worth knowing. This helper interpolates whatever it
    // is handed. It does not truncate. The reason no more than four digits
    // can ever reach it is that `saveVault` in lib/repositories/investor.ts
    // stores `digits.slice(-4)` and the full taxpayer ID is never
    // persisted at all, so `tinLast4` is the only value any caller has.
    // If a caller ever passes a raw taxpayer ID, this returns it in full.
    assert.equal(maskTin('123456789'), '···-··-123456789');
  });
});

describe('initials', () => {
  test('takes the first letter of the first two words, uppercased', () => {
    assert.equal(initials('Ryan Billings'), 'RB');
    assert.equal(initials('ada lovelace'), 'AL');
    assert.equal(initials('Jean Luc Picard'), 'JL');
  });

  test('a single name still yields a monogram', () => {
    assert.equal(initials('Cher'), 'C');
  });

  test('extra whitespace does not produce a blank initial', () => {
    assert.equal(initials('  Grace   Hopper '), 'GH');
  });

  test('an unknown name falls back rather than rendering an empty avatar', () => {
    assert.equal(initials(null), 'AI');
    assert.equal(initials(undefined), 'AI');
    assert.equal(initials(''), 'AI');
  });
});

describe('nameFromEmail', () => {
  test('turns the local part into a display name', () => {
    assert.equal(nameFromEmail('jane.doe@example.com'), 'Jane Doe');
    assert.equal(nameFromEmail('jane_doe@example.com'), 'Jane Doe');
    assert.equal(nameFromEmail('jane-doe@example.com'), 'Jane Doe');
    assert.equal(nameFromEmail('jane@example.com'), 'Jane');
  });

  test('the domain never leaks into the name', () => {
    assert.equal(nameFromEmail('investor@altspot.example').includes('altspot'), false);
  });

  test('runs of separators collapse to one space', () => {
    assert.equal(nameFromEmail('jane..doe@example.com'), 'Jane Doe');
  });
});
