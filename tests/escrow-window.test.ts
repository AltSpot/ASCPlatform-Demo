import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { escrowWindow, windowedDeadline } from '../lib/funding';

const DAY = 86_400_000;
const signed = Date.UTC(2026, 8, 12, 15);

describe("the member's ten days to reach escrow", () => {
  test('a row that stored the later admission cut-off is still ten days from signing', () => {
    const cutoff = signed + 27 * DAY;
    assert.equal(windowedDeadline(signed, cutoff), signed + 10 * DAY);
  });

  test('an earlier stored deadline wins, so reading can only shorten', () => {
    const cutoff = signed + 4 * DAY;
    assert.equal(windowedDeadline(signed, cutoff), cutoff);
  });

  test('an unsigned row keeps whatever it stored', () => {
    assert.equal(windowedDeadline(null, null), null);
    assert.equal(windowedDeadline(null, 5), 5);
  });

  test('signed Sep 12 is due Sep 22, with 3 of 10 days left on Sep 19', () => {
    const clock = escrowWindow(signed, signed + 10 * DAY, signed + 7 * DAY);
    assert.ok(clock);
    assert.equal(new Date(clock.dueAt).toISOString().slice(0, 10), '2026-09-22');
    assert.equal(clock.windowDays, 10);
    assert.equal(clock.daysLeft, 3);
  });

  test('days left never exceeds the window and never goes below zero', () => {
    assert.equal(escrowWindow(signed, signed + 10 * DAY, signed - 5 * DAY)?.daysLeft, 10);
    assert.equal(escrowWindow(signed, signed + 10 * DAY, signed + 30 * DAY)?.daysLeft, 0);
  });

  test('a window cut short by admissions closing says how many days it really was', () => {
    assert.equal(escrowWindow(signed, signed + 4 * DAY, signed)?.windowDays, 4);
  });
});
