/**
 * Portfolio — everything about what you hold, in one place.
 *
 * The dashboard answers "what is happening". This answers "what am I
 * actually exposed to, and how is it doing", which is the question an
 * LP asks second and which no single figure can carry.
 *
 * THE FIGURES ARE THE ONES LPs USE, not the ones that are easiest to
 * compute. A private book is judged on three ratios against what was
 * paid in: how much has come back (DPI), what the rest is marked at
 * (RVPI), and the two together (TVPI). They are stated here in plain
 * words rather than acronyms, because a member is not a fund
 * administrator, but they are the same three numbers and they add up
 * the same way.
 *
 * Exposure is measured on cost rather than on the current mark. Marks
 * arrive per reporting period and move for reasons that have nothing to
 * do with how the money was deployed, so weighting by cost is what
 * describes the allocation decision that was made.
 *
 * Every figure here is derived from the positions themselves. Nothing
 * on this page is stored, so nothing on it can drift from the ledger.
 */
import Link from 'next/link';

import AllocationTabs, {
  type AllocationAxis,
} from '@/components/portfolio/AllocationTabs';
import Holdings, { type Holding } from '@/components/portfolio/Holdings';
import SleeveProgress from '@/components/portfolio/SleeveProgress';
import CollapsibleSection from '@/components/CollapsibleSection';
import Term from '@/components/Term';
import CashFlow from '@/components/portfolio/CashFlow';
import ExternalHoldings from '@/components/portfolio/ExternalHoldings';
import DistributionLog from '@/components/portfolio/DistributionLog';
import PositionReturns, { type PositionReturn } from '@/components/portfolio/PositionReturns';
import ValueCurve from '@/components/portfolio/ValueCurve';
import FeesPaid, { type FeeLine } from '@/components/portfolio/FeesPaid';
import { requireUser } from '@/lib/auth';
import { HELD_STATES, isLivePosition } from '@/lib/domain';
import { CARRY_PERCENT, FEE_TERMS, SHOW_CARRY_TERMS, SHOW_FEE_TERMS } from '@/lib/config';
import { carryOn, feeBreakdown, reservePercent } from '@/lib/fees';
import { irr, ledgerBook, positionFlows } from '@/lib/portfolio-metrics';
import { dateStr, money, percent } from '@/lib/format';
import { getDealsByIds } from '@/lib/repositories/deals';
import { getDistributions } from '@/lib/repositories/distributions';
import { listExternal } from '@/lib/repositories/external';
import { buildPortfolioSeries } from '@/lib/portfolio-series';
import { getMarks } from '@/lib/repositories/marks';
import { listSubscriptions } from '@/lib/repositories/subscriptions';
import {
  ASSET_CLASSES,
  INDUSTRY_TINTS,
  industryLabel,
  isAssetClass,
} from '@/lib/taxonomy';

import s from './Portfolio.module.css';

export const dynamic = 'force-dynamic';

/**
 * Vintage is not a taxonomy, so it gets no taxonomy colours. It is one
 * ordered ramp in the Capital gold, deepest year oldest, so the bar
 * reads as a sequence rather than as five unrelated categories.
 */
const VINTAGE_TINTS = Array.from(
  { length: 5 },
  (_unused, i) => `var(--as-vintage-${i + 1})`,
);

export default async function PortfolioPage() {
  const user = await requireUser();

  const [subscriptions, distributions, marks, external] = await Promise.all([
    listSubscriptions(user.id),
    getDistributions(user.id),
    getMarks(user.id),
    listExternal(user.id),
  ]);

  const held = subscriptions.filter((sub) => HELD_STATES.includes(sub.state));
  const deals = await getDealsByIds([...new Set(held.map((sub) => sub.dealId))]);

  /* The book totals through lib/portfolio-metrics, the same call the
     dashboard makes, so a figure here cannot disagree with one there.
     Invested counts every dollar that ever went to work, realized
     positions included; fair value counts only what is still held. */
  const book = ledgerBook(held, distributions.items);
  const { invested, liveCost, fairValue: value, realized: returned } = book;
  const { dpi, tvpi, unrealized } = book;

  const live = held.filter(isLivePosition);

  /** Cash returned per position, so a row can show what it has paid. */
  const paidBySub = new Map<string, number>();
  /** And the same cash with its dates, which is what an IRR needs. */
  const flowsBySub = new Map<string, { at: string; amount: number }[]>();

  for (const item of distributions.items) {
    paidBySub.set(item.subscriptionId, (paidBySub.get(item.subscriptionId) ?? 0) + item.amount);

    const flows = flowsBySub.get(item.subscriptionId) ?? [];
    flows.push({ at: item.paidAt, amount: item.amount });
    flowsBySub.set(item.subscriptionId, flows);
  }

  const asOf = new Date();

  const holdings: Holding[] = held
    .map((sub) => {
      const deal = deals.get(sub.dealId);
      const marked = sub.currentValue ?? sub.amount;
      const paid = paidBySub.get(sub.id) ?? 0;

      return {
        id: sub.id,
        dealId: sub.dealId,
        name: deal?.name ?? sub.dealId,
        tag: deal?.tag ?? '',
        logoUrl: deal?.logoUrl ?? null,
        assetClass: deal?.assetClass ?? 'venture',
        vintage: sub.signedAt ? new Date(sub.signedAt).getUTCFullYear() : null,
        cost: sub.amount,
        value: marked,
        returned: paid,
        /* Total value over cost: what it is marked at plus what it has
           already paid out, against what went in. The only multiple
           that is true of a position which has distributed. */
        multiple: sub.amount ? (marked + paid) / sub.amount : 0,
        /* Money-weighted, from the date the money went in, with the
           current mark as the terminal flow. A realized position's
           mark is zero, so its IRR is settled rather than estimated. */
        irr: irr(
          positionFlows(
            {
              invested: sub.amount,
              fairValue: isLivePosition(sub) ? marked : 0,
              fundedAt: sub.fundedAt,
            },
            flowsBySub.get(sub.id) ?? [],
            asOf,
          ),
          asOf,
        ),
        exited: !isLivePosition(sub),
      };
    })
    .sort((a, b) => b.cost - a.cost);

  /**
   * Roll the positions up on one key. `compare` orders the buckets
   * before tints are assigned, so an ordered axis gets its tint ramp in
   * the same direction the reader will read it.
   */
  function group(
    keyOf: (dealId: string, sub: (typeof held)[number]) => string,
    labelOf: (key: string) => string,
    tintOf: (key: string, index: number) => string,
    compare: (a: [string, number], b: [string, number]) => number = (a, b) =>
      b[1] - a[1],
  ) {
    const buckets = new Map<string, { amount: number; count: number; value: number }>();

    for (const sub of live) {
      const key = keyOf(sub.dealId, sub);
      const current = buckets.get(key) ?? { amount: 0, count: 0, value: 0 };

      buckets.set(key, {
        amount: current.amount + sub.amount,
        count: current.count + 1,
        /* What the slice is worth now: its mark plus anything it has
           already paid out, so a slice that distributed is not shown
           as having shrunk. */
        value:
          current.value +
          (sub.currentValue ?? sub.amount) +
          (paidBySub.get(sub.id) ?? 0),
      });
    }

    return [...buckets.entries()]
      .sort((a, b) => compare([a[0], a[1].amount], [b[0], b[1].amount]))
      .map(([key, bucket], index) => ({
        key,
        label: labelOf(key),
        amount: bucket.amount,
        count: bucket.count,
        value: bucket.value,
        tint: tintOf(key, index),
      }));
  }

  const axes: AllocationAxis[] = [
    {
      key: 'class',
      label: 'Asset class',
      slices: group(
        (dealId) => deals.get(dealId)?.assetClass ?? 'venture',
        (key) => (isAssetClass(key) ? ASSET_CLASSES[key].label : key),
        (key) => (isAssetClass(key) ? ASSET_CLASSES[key].tint : 'var(--as-text-faint)'),
      ),
    },
    {
      key: 'industry',
      label: 'Industry',
      slices: group(
        (dealId) => deals.get(dealId)?.industry ?? 'diversified',
        (key) => industryLabel(key === 'diversified' ? null : key),
        (_key, index) => INDUSTRY_TINTS[index % INDUSTRY_TINTS.length],
      ),
    },
    {
      /* Vintage is the axis a private book is judged on over time: two
         good years and one bad one is a different portfolio from three
         average ones, and only the year it went in shows that. */
      key: 'vintage',
      label: 'Vintage',
      order: 'given',
      slices: group(
        (_dealId, sub) =>
          sub.signedAt ? String(new Date(sub.signedAt).getUTCFullYear()) : 'Unknown',
        (key) => key,
        (_key, index) => VINTAGE_TINTS[index % VINTAGE_TINTS.length],
        /* Oldest first. The point of this axis is the sequence, and a
           run of years sorted by size is not one. */
        (a, b) => a[0].localeCompare(b[0]),
      ),
    },
  ];

  /*
   * What has actually been charged. Three different kinds of number:
   * money already gone, money already deducted from proceeds before
   * they were paid out, and money that is owed on nothing until a mark
   * becomes an exit. See components/portfolio/FeesPaid.tsx.
   */
  const managementPaid = held.reduce(
    (sum, sub) => sum + feeBreakdown(sub.amount).reserve,
    0,
  );

  /* Distributions are what reached the investor, so carry was already
     taken out of them. Grossing the recorded gain back up is what says
     how much: at a 20% rate, $80 paid out means $20 kept. */
  const carryTaken = held.reduce((sum, sub) => {
    const rate = CARRY_PERCENT;
    const netGain = (distributions.items ?? [])
      .filter((item) => item.subscriptionId === sub.id && item.kind === 'gain')
      .reduce((paid, item) => paid + item.amount, 0);
    return sum + (netGain * rate) / (100 - rate);
  }, 0);

  /* Only on positions marked above cost, and only hypothetically: a
     mark is not an exit and carry is owed on nothing until it is. */
  const carryAccruing = live.reduce(
    (sum, sub) => sum + carryOn((sub.currentValue ?? sub.amount) - sub.amount),
    0,
  );

  /* Figures only behind their switches (lib/config.ts). Off, the section
     says where the terms are instead of printing a number. */
  const feeLines: FeeLine[] = [
    ...(SHOW_FEE_TERMS
      ? [
          {
            key: 'management',
            label: 'Management fee reserves funded',
            amount: Math.round(managementPaid),
            note: `${reservePercent()}% of each commitment (${FEE_TERMS.annualPercent}% a year for ${FEE_TERMS.termYears} years), funded once at closing across ${held.length} position${held.length === 1 ? '' : 's'}. Unearned amounts come back to you.`,
          },
        ]
      : []),
    ...(SHOW_CARRY_TERMS
      ? [
          {
            key: 'carry-taken',
            label: 'Carry taken at exit',
            amount: Math.round(carryTaken),
            note:
              carryTaken > 0
                ? `${CARRY_PERCENT}% of profits, deducted from proceeds before they were distributed to you.`
                : 'Nothing has exited above cost yet, so no carry has been taken.',
          },
          {
            key: 'carry-accruing',
            label: 'Carry if marked today',
            amount: Math.round(carryAccruing),
            note: `What ${CARRY_PERCENT}% of profits would come to at current marks. Owed on nothing until a position actually exits.`,
            contingent: true,
          },
        ]
      : []),
  ];

  /**
   * The book's own IRR. Every contribution on the date it funded, every
   * distribution on the date it was paid, and today's total fair value
   * as one terminal inflow.
   *
   * "Net" because the management fee is already out of the capital that
   * went to work, and carry is taken from proceeds before they are
   * distributed. There is no gross figure on this page to confuse it
   * with.
   */
  const bookIrr = irr(
    [
      ...held
        .filter((sub) => sub.fundedAt)
        .map((sub) => ({ at: sub.fundedAt!, amount: -sub.amount })),
      ...distributions.items.map((item) => ({
        at: item.paidAt,
        amount: item.amount,
      })),
      { at: asOf.toISOString(), amount: value },
    ],
    asOf,
  );

  /*
   * The history, quarter by quarter. Marks are reported per period and
   * carried forward between them, so this is drawn from what was
   * actually reported rather than interpolated between two endpoints.
   */
  const series = buildPortfolioSeries(
    held.map((sub) => ({
      id: sub.id,
      amount: sub.amount,
      fundedAt: sub.fundedAt,
      realizedAt: sub.realizedAt,
      currentValue: sub.currentValue,
    })),
    marks,
    distributions.items.map((item) => ({
      subscriptionId: item.subscriptionId,
      paidAt: item.paidAt,
      amount: item.amount,
      kind: item.kind,
    })),
    new Date(),
  );

  /* What each position has done to the number, in dollars. Realized
     positions count their proceeds; live ones count their mark. */
  const drivers: PositionReturn[] = holdings.map((holding) => ({
    id: holding.id,
    name: holding.name,
    logoUrl: holding.logoUrl,
    cost: holding.cost,
    totalValue: holding.value + holding.returned,
    exited: holding.exited,
  }));

  /**
   * The largest single position as a share of cost. Concentration is
   * the risk figure a private portfolio actually carries, and it is the
   * one nothing else on the platform states.
   */
  /* Every institutional statement dates its figures. */
  const asOfLabel = dateStr(asOf);

  const largest = live.reduce((max, sub) => Math.max(max, sub.amount), 0);
  const concentration = liveCost ? largest / liveCost : 0;

  if (held.length === 0) {
    return (
      <>
        <div className="page-head">
          <div className="titles">
            <div className="eyebrow">Portfolio</div>
            <h1 className="display">What you are exposed to.</h1>
          </div>
        </div>

        <div className="card">
          <p className="tiny">
            Nothing held on AltSpot yet. Your exposure, your vintages and
            everything a position has paid back appear here from the moment
            your first investment funds.{' '}
            <Link href="/marketplace">Open the marketplace</Link>.
          </p>
        </div>

        {/* A member with no AltSpot deals can still make this their
            portfolio. Offering it here rather than only under a book
            they do not have yet is the whole point of the feature. */}
        <CollapsibleSection
          scope="portfolio"
          id="external"
          title="Held elsewhere"
          note="Self-reported, kept out of AltSpot totals"
        >
          <ExternalHoldings initial={external} />
        </CollapsibleSection>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Portfolio</div>
          <h1 className="display">What you are exposed to.</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn btn-ghost" href="/docs">
            Documents
          </Link>
          <Link className="btn btn-gold" href="/portfolio/statement">
            Download statement
          </Link>
        </div>
      </div>

      {/* The whole page in one sentence, in the member's words, before the
          capital account says it again in an LP's. Same figures. */}
      <p className={s.plain}>
        You put in <b>{money(invested)}</b>. It is worth <b>{money(value)}</b> today
        {returned > 0 ? (
          <>
            {' '}
            and <b>{money(returned)}</b> has been paid back to you
          </>
        ) : null}
        . Together that is{' '}
        <b className={tvpi >= 1 ? s.up : s.down}>{tvpi.toFixed(2)} times</b> what you put in.
        <span className={s.asOf}>
          As of {asOfLabel}. Marks are reported by each vehicle, quarterly, and are unaudited.
        </span>
      </p>

      {/* The capital account, in the order an LP statement states it:
          what went in, what it is marked at, what has come back, the
          two together as a multiple, the same thing annualized, and how
          much of it sits in one name. */}
      <div className={s.summary}>
        <Figure
          k="Invested"
          v={money(invested)}
          d={
            live.length === held.length
              ? `Cost basis · ${held.length} position${held.length === 1 ? '' : 's'}`
              : `Cost basis · ${live.length} held, ${held.length - live.length} realized`
          }
        />
        <Figure
          k="Fair value"
          ask="How is the fair value of a position decided?"
          v={money(value)}
          d={`${unrealized >= 0 ? '+' : '−'}${money(Math.abs(unrealized))} unrealized`}
          tone={unrealized >= 0 ? 'up' : 'down'}
        />
        <Figure
          k="Realized"
          ask="What does Realized and DPI mean on my portfolio page?"
          v={money(returned)}
          d={returned > 0 ? `DPI ${dpi.toFixed(2)}×` : 'Nothing distributed yet'}
        />
        <Figure
          k="TVPI"
          ask="What does TVPI mean on my portfolio page?"
          v={`${tvpi.toFixed(2)}×`}
          d="Total value over invested"
          lead
        />
        <Figure
          k="Net IRR"
          ask="What does Net IRR mean on my portfolio page?"
          v={percent(bookIrr, 1, { signed: true })}
          d="Annualized, money-weighted"
          tone={bookIrr === null ? undefined : bookIrr >= 0 ? 'up' : 'down'}
        />
        <Figure
          k="Largest position"
          v={percent(concentration, 0)}
          d="Share of invested capital"
        />
      </div>

      <nav className={s.jump} aria-label="On this page">
        {series.length >= 2 ? <a href="#p-curve">Over time</a> : null}
        <a href="#p-drivers">By position</a>
        <a href="#p-holdings">Ledger</a>
        <a href="#p-allocation">Exposure</a>
        <a href="#p-sleeve">The sleeve</a>
        <a href="#p-distributions">Cash back</a>
        <a href="#p-fees">Fees</a>
        <a href="#p-external">Held elsewhere</a>
      </nav>

      {series.length >= 2 ? (
        <CollapsibleSection
          scope="portfolio"
          id="curve"
        anchor="p-curve"
          title="Performance over time"
          note="Total value against invested, by quarter"
        >
          <ValueCurve
            points={series.map((period) => ({
              label: period.label,
              paidIn: period.paidIn,
              value: period.value,
              distributed: period.distributed,
            }))}
          />
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection
        scope="portfolio"
        id="drivers"
        anchor="p-drivers"
        title="How each position is doing"
        note="Up or down against what you put in, as a percent or in dollars"
      >
        <PositionReturns rows={drivers} />
      </CollapsibleSection>

      <CollapsibleSection
        scope="portfolio"
        id="holdings"
        anchor="p-holdings"
        title="Positions"
        note="Held and realized, on AltSpot"
      >
        <Holdings rows={holdings} />
      </CollapsibleSection>

      <CollapsibleSection
        scope="portfolio"
        id="allocation"
        anchor="p-allocation"
        title="Exposure"
        note="Weighted by invested capital"
      >
        <AllocationTabs axes={axes} total={liveCost} />
      </CollapsibleSection>

      {/* The construction the platform teaches (lib/portfolio-plan.ts):
          the count against twenty, the weight of the largest position, and
          the three rules. Measures the book; advises nothing. */}
      <CollapsibleSection
        scope="portfolio"
        id="sleeve"
        anchor="p-sleeve"
        title="Building the sleeve"
        note="Twenty positions, equal weight, over three years"
      >
        <SleeveProgress invested={live.map((sub) => sub.amount)} />
      </CollapsibleSection>

      <CollapsibleSection
        scope="portfolio"
        id="distributions"
        anchor="p-distributions"
        title="Distributions"
        note="Return of capital and gain, kept apart"
      >
        {series.length >= 2 ? (
          <CashFlow
            periods={series.map((period) => ({
              label: period.label,
              contributed: period.contributedInPeriod,
              capital: period.capitalInPeriod,
              gain: period.gainInPeriod,
              paidIn: period.paidIn,
              distributed: period.distributed,
            }))}
          />
        ) : null}

        <div className={s.stack} />

        <DistributionLog
          items={distributions.items.map((item) => ({
            ...item,
            dealName: deals.get(item.dealId)?.name ?? item.dealId,
          }))}
          returnOfCapital={distributions.returnOfCapital}
          gain={distributions.gain}
        />
      </CollapsibleSection>

      <CollapsibleSection
        scope="portfolio"
        id="fees"
        anchor="p-fees"
        title="Fees charged"
        note="Every fee, against your own money"
      >
        <FeesPaid lines={feeLines} />
      </CollapsibleSection>

      <CollapsibleSection
        scope="portfolio"
        id="external"
        anchor="p-external"
        title="Held elsewhere"
        note="Self-reported, kept out of AltSpot totals"
      >
        <ExternalHoldings initial={external} />
      </CollapsibleSection>

      <details className={s.method}>
        <summary>How these figures are built</summary>
        <p className={s.note}>
        Invested is cost basis, including
        positions that have since realized: dropping an exit from the
        denominator would flatter every ratio above. Fair value is the latest
        mark reported by each vehicle and is zero once a position exits, at
        which point its result sits in Realized instead. Total value is the two
        together, MOIC is total value over invested for one position, and TVPI
        is the same ratio across the book. Net IRR is money-weighted and
        annualized, with today&rsquo;s fair value as the closing flow; it is net
        of the management fee and of any carry taken from proceeds.
        Exposure is weighted by invested capital rather than by mark, because a
        mark moves for reasons unrelated to the allocation you chose, and a
        multi-deal fund reads as diversified because it spans industries by
        construction. Holdings you have entered under Held elsewhere are
        self-reported, are not verified by AltSpot, and are excluded from every
        figure above. Demo environment: every AltSpot position here is seeded
        and no figure describes a real outcome.
        </p>
      </details>
    </>
  );
}

function Figure({
  k,
  ask,
  v,
  d,
  tone,
  lead,
}: {
  k: string;
  /** The question Spot is opened with when the label is pressed. */
  ask?: string;
  v: string;
  d: string;
  tone?: 'up' | 'down';
  lead?: boolean;
}) {
  return (
    <div className={lead ? `${s.figure} ${s.figureLead}` : s.figure}>
      <span className={s.figureKey}>
        {ask ? (
          <Term q={ask} quiet>
            {k}
          </Term>
        ) : (
          k
        )}
      </span>
      <span className={s.figureValue}>{v}</span>
      <span className={tone ? `${s.figureNote} ${s[tone]}` : s.figureNote}>{d}</span>
    </div>
  );
}
