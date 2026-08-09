/**
 * Terminal — the Private Markets Monitor.
 *
 * The third section of the Terminal, and the one that answers a
 * question the rest of the portal does not: what is the weather in
 * private markets right now. News gives events. The Journal gives
 * AltSpot's opinion. This gives the handful of numbers an investor
 * should be able to recite before deciding anything.
 *
 * DEMO SEAM. Every figure below is illustrative. It is not market data,
 * it is not sourced from a vendor, and the UI labels it as such on the
 * section itself. In production each indicator comes from a licensed
 * data provider and carries its own `source` string rather than the
 * shared demo disclosure.
 *
 * PRODUCTION CONTRACT:
 *   · `getMarketMonitor()` keeps its signature and returns
 *     `MarketIndicator[]` in display order.
 *   · `series` is oldest to newest and drives the sparkline only. It is
 *     never a claim about anyone's return.
 *   · `value` is already formatted for display, because indicators do
 *     not share a unit. `delta` is the signed change against the prior
 *     period, formatted the same way.
 *   · `direction` says which way the number moved, not whether that is
 *     good. Nothing here is a recommendation.
 *   · Failure returns an empty array, and the section renders nothing.
 *
 * Deliberately cuttable: nothing else in the app imports this module.
 * Delete the file and the section and the Terminal still stands.
 */

export type IndicatorDirection = 'up' | 'down' | 'flat';

export interface MarketIndicator {
  id: string;
  label: string;
  /** Formatted for display. Units are not shared across indicators. */
  value: string;
  /** Signed change against the prior period, already formatted. */
  delta: string;
  direction: IndicatorDirection;
  /** The reading period the value describes. */
  period: string;
  /** One line. What an investor should take from it. */
  note: string;
  /** Oldest to newest. Sparkline only. */
  series: number[];
}

const INDICATORS: MarketIndicator[] = [
  {
    id: 'secondary-discount',
    label: 'Secondary discount to last round',
    value: '11.4%',
    delta: '2.1 pts',
    direction: 'down',
    period: 'Trailing 8 quarters',
    note: 'Late-stage names are changing hands closer to their last primary price than at any point in two years.',
    series: [26.5, 24.1, 21.8, 19.4, 17.9, 15.2, 13.5, 11.4],
  },
  {
    id: 'median-premoney',
    label: 'Median late-stage pre-money',
    value: '$412M',
    delta: '$18M',
    direction: 'up',
    period: 'Trailing 8 quarters',
    note: 'The middle of the late-stage market has recovered slowly. The top decile did most of the moving.',
    series: [305, 298, 312, 330, 356, 371, 394, 412],
  },
  {
    id: 'structured-rounds',
    label: 'Rounds carrying structure',
    value: '18%',
    delta: '4 pts',
    direction: 'down',
    period: 'Trailing 8 quarters',
    note: 'Ratchets, participating preferred and pay-to-play are appearing in fewer term sheets. Read the preference stack anyway.',
    series: [34, 33, 31, 29, 27, 24, 22, 18],
  },
  {
    id: 'dry-powder',
    label: 'Venture dry powder',
    value: '$281B',
    delta: '$9B',
    direction: 'down',
    period: 'Trailing 8 quarters',
    note: 'Committed but undeployed capital is drawing down. Slower fundraising is not yet being replaced.',
    series: [312, 318, 316, 309, 302, 296, 290, 281],
  },
  {
    id: 'time-to-close',
    label: 'Term sheet to close',
    value: '47 days',
    delta: '6 days',
    direction: 'up',
    period: 'Median, trailing year',
    note: 'Diligence is taking longer. Budget for it when a funding window is short.',
    series: [33, 34, 36, 38, 41, 43, 44, 47],
  },
  {
    id: 'exit-count',
    label: 'Venture-backed exits',
    value: '214',
    delta: '31',
    direction: 'up',
    period: 'Most recent quarter',
    note: 'Strategic acquisitions are carrying the count. The listing window remains narrow.',
    series: [126, 131, 148, 152, 167, 178, 183, 214],
  },
];

/**
 * The indicator board, in display order.
 *
 * Async by construction so a licensed data provider drops in behind
 * this signature. Never throws.
 */
export async function getMarketMonitor(): Promise<MarketIndicator[]> {
  return INDICATORS;
}
