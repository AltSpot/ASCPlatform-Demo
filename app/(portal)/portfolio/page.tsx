/**
 * Portfolio — everything about what you hold, in one place.
 *
 * The dashboard answers "what is happening". This answers "what am I
 * actually exposed to", which is the question an LP asks second and
 * which no single figure can carry.
 *
 * Exposure is measured on cost rather than on the current mark. Marks
 * arrive per reporting period and move for reasons that have nothing to
 * do with how the money was deployed, so weighting by cost is what
 * describes the allocation decision that was made.
 */
import AllocationBreakdown, {
  type AllocationSlice,
} from '@/components/portfolio/AllocationBreakdown';
import { requireUser } from '@/lib/auth';
import { HELD_STATES } from '@/lib/domain';
import { money } from '@/lib/format';
import { getDealsByIds } from '@/lib/repositories/deals';
import { getDistributions } from '@/lib/repositories/distributions';
import { listSubscriptions } from '@/lib/repositories/subscriptions';
import {
  ASSET_CLASSES,
  INDUSTRY_TINTS,
  industryLabel,
  isAssetClass,
} from '@/lib/taxonomy';

import s from './Portfolio.module.css';

export const dynamic = 'force-dynamic';

export default async function PortfolioPage() {
  const user = await requireUser();

  const [subscriptions, distributions] = await Promise.all([
    listSubscriptions(user.id),
    getDistributions(user.id),
  ]);

  const held = subscriptions.filter((sub) => HELD_STATES.includes(sub.state));
  const deals = await getDealsByIds([...new Set(held.map((sub) => sub.dealId))]);

  const invested = held.reduce((sum, sub) => sum + sub.amount, 0);
  const value = held.reduce((sum, sub) => sum + (sub.currentValue ?? sub.amount), 0);

  /** Roll the positions up on one key. */
  function group(
    keyOf: (dealId: string) => string,
    labelOf: (key: string) => string,
    tintOf: (key: string, index: number) => string,
  ): AllocationSlice[] {
    const buckets = new Map<string, { amount: number; count: number }>();

    for (const sub of held) {
      const key = keyOf(sub.dealId);
      const current = buckets.get(key) ?? { amount: 0, count: 0 };
      buckets.set(key, { amount: current.amount + sub.amount, count: current.count + 1 });
    }

    return [...buckets.entries()].map(([key, bucket], index) => ({
      key,
      label: labelOf(key),
      amount: bucket.amount,
      count: bucket.count,
      tint: tintOf(key, index),
    }));
  }

  const byAssetClass = group(
    (dealId) => deals.get(dealId)?.assetClass ?? 'venture',
    (key) => (isAssetClass(key) ? ASSET_CLASSES[key].label : key),
    (key) => (isAssetClass(key) ? ASSET_CLASSES[key].tint : '#6C6459'),
  );

  const byIndustry = group(
    (dealId) => deals.get(dealId)?.industry ?? 'diversified',
    (key) => industryLabel(key === 'diversified' ? null : key),
    (_key, index) => INDUSTRY_TINTS[index % INDUSTRY_TINTS.length],
  );

  /**
   * The largest single position as a share of cost. Concentration is
   * the risk figure a private portfolio actually carries, and it is the
   * one nothing else on the platform states.
   */
  const largest = held.reduce((max, sub) => Math.max(max, sub.amount), 0);
  const concentration = invested ? (largest / invested) * 100 : 0;

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Portfolio</div>
          <h1 className="display">What you are exposed to.</h1>
        </div>
      </div>

      <div className={s.summary}>
        <Figure k="Cost basis" v={money(invested)} d={`${held.length} position${held.length === 1 ? '' : 's'}`} />
        <Figure k="Estimated value" v={money(value)} d="Latest reported marks" />
        <Figure
          k="Largest position"
          v={`${concentration.toFixed(0)}%`}
          d="Of cost basis"
        />
        <Figure
          k="Capital returned"
          v={money(distributions.total)}
          d={distributions.total > 0 ? 'Across all positions' : 'Nothing has exited yet'}
        />
      </div>

      <div className={s.grid}>
        <section className="card">
          <div className={s.head}>
            <p className={s.eyebrow}>
              <span className={s.rule} aria-hidden="true" />
              By asset class
            </p>
          </div>
          <AllocationBreakdown
            slices={byAssetClass}
            empty="Nothing held yet. Asset class exposure appears here after your first investment funds."
          />
        </section>

        <section className="card">
          <div className={s.head}>
            <p className={s.eyebrow}>
              <span className={s.rule} aria-hidden="true" />
              By industry
            </p>
          </div>
          <AllocationBreakdown
            slices={byIndustry}
            empty="Nothing held yet. Industry exposure appears here after your first investment funds."
          />
        </section>
      </div>

      <p className={s.note}>
        Exposure is weighted by cost rather than by current mark. Marks arrive
        per reporting period and move for reasons unrelated to how the money was
        deployed, so cost is what describes the allocation you chose. A
        multi-deal fund is shown as diversified, because it spans industries by
        construction and naming one would misstate what it gives you.
      </p>
    </>
  );
}

function Figure({ k, v, d }: { k: string; v: string; d: string }) {
  return (
    <div className={s.figure}>
      <span className={s.figureKey}>{k}</span>
      <span className={s.figureValue}>{v}</span>
      <span className={s.figureNote}>{d}</span>
    </div>
  );
}
