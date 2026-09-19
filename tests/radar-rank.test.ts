import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { momentum, rankRadar, type Rankable } from '../lib/radar-rank';

const BOARD: Rankable[] = Array.from({ length: 12 }, (_, i) => ({
  slug: `co-${String(i).padStart(2, '0')}`,
  interestDollars: (12 - i) * 1_000_000,
  recentDollars: i === 9 ? 2_400_000 : 50_000,
  listedDaysAgo: i * 10,
}));

describe('the order of the Radar', () => {
  test('every name is dealt exactly once, in every sort', () => {
    for (const sort of ['featured', 'top', 'rising', 'new'] as const) {
      const out = rankRadar(BOARD, sort, 3).map((c) => c.slug);
      assert.equal(out.length, BOARD.length);
      assert.equal(new Set(out).size, BOARD.length);
    }
  });

  test('most voted is by dollars; rising is by momentum, not size', () => {
    assert.equal(rankRadar(BOARD, 'top', 0)[0].slug, 'co-00');
    assert.equal(rankRadar(BOARD, 'rising', 0)[0].slug, 'co-09');
    assert.ok(momentum(BOARD[9]) > momentum(BOARD[0]));
  });

  test('featured opens with a leader, a rising name and a quiet name', () => {
    const [a, b, c] = rankRadar(BOARD, 'featured', 0);
    assert.equal(a.slug, 'co-00');
    assert.equal(b.slug, 'co-09');
    assert.ok(Number(c.slug.slice(3)) >= 6, 'the third seat is from the quiet half');
  });

  test('no name is stuck: over a cycle every quiet name reaches the first two rows', () => {
    const quiet = BOARD.slice(6).map((c) => c.slug);
    const seen = new Set<string>();
    for (let day = 0; day < quiet.length; day += 1) {
      for (const c of rankRadar(BOARD, 'featured', day).slice(0, 6)) seen.add(c.slug);
    }
    for (const slug of quiet) assert.ok(seen.has(slug), `${slug} never reached the top rows`);
  });
});
