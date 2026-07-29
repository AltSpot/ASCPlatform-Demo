/**
 * The standard indicator set for a revenue-producing company.
 *
 * AltSpot mostly buys companies that already have revenue, so every deal
 * page should answer the same questions in the same order. An investor
 * comparing two deals should be reading the same eight lines, not hunting
 * through whatever each memo happened to emphasise.
 *
 * A missing indicator is NOT hidden. It renders as "Not disclosed",
 * because the absence is information: it tells an investor what was not
 * shared, and it tells us which diligence gap to close before the deal
 * goes out. Silently omitting a weak number is how a deck flatters a
 * company.
 *
 * `entryMultiple` is the one figure we compute rather than collect, since
 * it is the number every investor works out for themselves anyway and the
 * comparables table is denominated in exactly the same units.
 */

export interface IndicatorSpec {
  key: string;
  label: string;
  /** Why an investor should care. Shown as help text, kept to one line. */
  why: string;
}

/**
 * Order matters. It runs quality of revenue, then efficiency, then
 * survival, then price.
 */
export const INDICATOR_SPECS: readonly IndicatorSpec[] = [
  {
    key: 'revenue',
    label: 'Revenue',
    why: 'Contracted and recurring, not booked or projected.',
  },
  {
    key: 'growth',
    label: 'Growth',
    why: 'Trailing, annualised. A single strong month is not a trend.',
  },
  {
    key: 'grossMargin',
    label: 'Gross margin',
    why: 'What survives cost of delivery, at current scale.',
  },
  {
    key: 'retention',
    label: 'Net revenue retention',
    why: 'Whether existing customers grow or leak. The cleanest quality signal.',
  },
  {
    key: 'concentration',
    label: 'Customer concentration',
    why: 'Share of revenue from the largest customer. Concentration is fragility.',
  },
  {
    key: 'burn',
    label: 'Monthly burn',
    why: 'Net cash out per month at the current plan.',
  },
  {
    key: 'runway',
    label: 'Runway',
    why: 'Months of cash at that burn, before this round.',
  },
  {
    key: 'entryMultiple',
    label: 'Entry multiple',
    why: 'Pre-money divided by revenue. Compare directly to the comparables below.',
  },
];

export const NOT_DISCLOSED = 'Not disclosed';

export interface ResolvedIndicator extends IndicatorSpec {
  value: string;
  note: string | null;
  disclosed: boolean;
}

/**
 * Merge a deal's supplied values onto the standard set, preserving order
 * and filling gaps explicitly.
 */
export function resolveIndicators(
  supplied: Record<string, { value: string; note?: string }> | undefined,
): ResolvedIndicator[] {
  const values = supplied ?? {};

  return INDICATOR_SPECS.map((spec) => {
    const hit = values[spec.key];
    return {
      ...spec,
      value: hit?.value ?? NOT_DISCLOSED,
      note: hit?.note ?? null,
      disclosed: Boolean(hit?.value),
    };
  });
}

/** How many of the standard indicators a deal actually answers. */
export function disclosureScore(indicators: ResolvedIndicator[]): {
  disclosed: number;
  total: number;
} {
  return {
    disclosed: indicators.filter((i) => i.disclosed).length,
    total: indicators.length,
  };
}
