/**
 * The funding-progress rules (work order screen 5): raised against the
 * minimum to close, the allocation as the "up to" cap, escrow status and
 * the admission cut-off.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  admissionCutoff,
  closingTime,
  dealChip,
  fundingView,
} from '@/lib/funding';

const OPEN = {
  allocationTotal: 2_000_000,
  allocationRemaining: 640_000,
  minimumToClose: 1_000_000,
  targetClose: 'Oct 6, 2026',
  status: 'open',
};

describe('fundingView', () => {
  test('measures raised against the minimum, not the allocation', () => {
    const f = fundingView({ ...OPEN, allocationRemaining: 1_500_000 });
    assert.equal(f.raised, 500_000);
    assert.equal(f.toMinimumPct, 50);
    assert.equal(f.ofAllocationPct, 25);
    assert.equal(f.minimumMet, false);
  });

  test('a raise past its minimum is met, and the bar percentage caps at 100', () => {
    const f = fundingView(OPEN);
    assert.equal(f.raised, 1_360_000);
    assert.equal(f.minimumMet, true);
    assert.equal(f.toMinimumPct, 100);
    assert.equal(f.minimumAtPct, 50);
  });

  test('escrow is held while open and closed once the deal closes', () => {
    assert.equal(fundingView(OPEN).escrow, 'held');
    assert.equal(fundingView({ ...OPEN, status: 'closed' }).escrow, 'closed');
  });

  test('a deal with no minimum set falls back to its allocation', () => {
    const f = fundingView({ ...OPEN, minimumToClose: 0 });
    assert.equal(f.minimum, 2_000_000);
  });

  test('admissions are open before the cut-off and closed after it', () => {
    const close = closingTime(OPEN.targetClose)!;
    const cutoff = admissionCutoff(OPEN.targetClose, 24)!;
    assert.equal(close - cutoff, 24 * 3_600_000);
    assert.equal(fundingView(OPEN, cutoff - 1).admissionsOpen, true);
    assert.equal(fundingView(OPEN, cutoff).admissionsOpen, false);
    assert.equal(fundingView({ ...OPEN, status: 'closed' }, cutoff - 1).admissionsOpen, false);
  });
});

describe('dealChip', () => {
  test('leads with the deal type and keeps the round', () => {
    assert.equal(dealChip({ leadType: 'altspot', tag: 'AltSpot-led · Series A' }), 'AltSpot-led · Series A');
    assert.equal(dealChip({ leadType: 'partner', tag: 'Co-invest · Series C' }), 'Partner-led · Series C');
    assert.equal(dealChip({ leadType: 'altspot', tag: 'Late-stage secondary' }), 'AltSpot-led · Secondary');
  });
});
