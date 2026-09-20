import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { dealChip, dealLead, dealRound, STAGE_RUNGS, stageRung } from '../lib/funding';

describe("a deal's stage, on its own", () => {
  test('the round and the lead come apart, and the chip still reads as before', () => {
    const deal = { leadType: 'altspot', tag: 'AltSpot-led · Series A' };
    assert.equal(dealRound(deal), 'Series A');
    assert.equal(dealLead(deal), 'AltSpot-led');
    assert.equal(dealChip(deal), 'AltSpot-led · Series A');
    assert.equal(dealRound({ tag: 'Late-stage secondary' }), 'Secondary');
  });

  test('rounds sit on the ladder from earliest to latest', () => {
    assert.equal(stageRung('Seed'), 1);
    assert.equal(stageRung('Series A'), 2);
    assert.equal(stageRung('Series B'), 3);
    assert.equal(stageRung('Series C'), 4);
    assert.equal(stageRung('Series E'), 4);
    assert.equal(stageRung('Growth'), 5);
    assert.equal(stageRung('Growth equity'), 5);
    assert.equal(stageRung('Secondary'), 5);
    for (const round of ['Seed', 'Series A', 'Series C', 'Secondary']) {
      const rung = stageRung(round);
      assert.ok(rung !== null && rung >= 1 && rung <= STAGE_RUNGS);
    }
  });

  test('a fund, a real asset or an exit is not a point on the ladder', () => {
    for (const round of ['Fund I', 'Real assets', 'Exited', '']) {
      assert.equal(stageRung(round), null);
    }
  });
});
