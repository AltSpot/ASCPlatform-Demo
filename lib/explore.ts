/**
 * Quick filters: the ways a member can slice the shelf in one press.
 *
 * The dashboard's Explore section lists them as tiles and the marketplace
 * reads them back from the URL, so the two cannot disagree about what
 * "Series A and B" or "Partner-led" means. Four axes: asset class,
 * industry, who leads, and stage. The first two are the marketplace's
 * own filter row; lead and stage apply to the shelf only, because a Radar
 * name has no lead and its last round is not the round on offer.
 *
 * Pure and isomorphic.
 */
import { isLeadType, type LeadType } from './funding';
import {
  ASSET_CLASSES,
  INDUSTRIES,
  isAssetClass,
  isIndustry,
  type AssetClass,
  type Industry,
} from './taxonomy';

export type StageBucket = 'seed' | 'early' | 'growth' | 'late';

export const STAGE_LABEL: Record<StageBucket, string> = {
  seed: 'Pre-seed and seed',
  early: 'Series A and B',
  growth: 'Series C and growth',
  late: 'Late stage',
};

export const STAGE_KEYS = Object.keys(STAGE_LABEL) as StageBucket[];

export function isStageBucket(value: unknown): value is StageBucket {
  return typeof value === 'string' && value in STAGE_LABEL;
}

/** Which stage a deal's round falls in, read from its stage line. */
export function stageBucket(deal: { stage: string; assetClass: string }): StageBucket | null {
  const s = deal.stage.toLowerCase();
  if (/late stage|secondary/.test(s)) return 'late';
  if (/pre-seed|seed/.test(s)) return 'seed';
  if (/series [ab]\b/.test(s)) return 'early';
  if (/series [c-z]\b|growth/.test(s)) return 'growth';
  return null;
}

export const LEAD_FILTER_LABEL: Record<LeadType, string> = {
  altspot: 'AltSpot-led',
  partner: 'Partner-led',
};

/** Everything the marketplace can be opened already filtered by. */
export interface QuickFilter {
  assetClass: AssetClass | null;
  industry: Industry | null;
  lead: LeadType | null;
  stage: StageBucket | null;
}

export const NO_QUICK_FILTER: QuickFilter = {
  assetClass: null,
  industry: null,
  lead: null,
  stage: null,
};

/** Read a quick filter from the marketplace URL. Anything unknown is ignored. */
export function parseQuickFilter(params: Record<string, string | string[] | undefined>): QuickFilter {
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const cls = one('class');
  const industry = one('industry');
  const lead = one('lead');
  const stage = one('stage');
  return {
    assetClass: cls && isAssetClass(cls) ? cls : null,
    industry: industry && isIndustry(industry) ? industry : null,
    lead: lead && isLeadType(lead) ? lead : null,
    stage: isStageBucket(stage) ? stage : null,
  };
}

/** The marketplace link for one filter. */
export function quickFilterHref(filter: Partial<QuickFilter>): string {
  const q = new URLSearchParams();
  if (filter.assetClass) q.set('class', filter.assetClass);
  if (filter.industry) q.set('industry', filter.industry);
  if (filter.lead) q.set('lead', filter.lead);
  if (filter.stage) q.set('stage', filter.stage);
  const s = q.toString();
  return s ? `/marketplace?${s}#open-now` : '/marketplace';
}

export interface DealFacets {
  id: string;
  assetClass: string;
  industry: string | null;
  leadType: string;
  stage: string;
}

export function matchesQuickFilter(deal: DealFacets, f: QuickFilter): boolean {
  if (f.assetClass && deal.assetClass !== f.assetClass) return false;
  if (f.industry && deal.industry !== f.industry) return false;
  if (f.lead && deal.leadType !== f.lead) return false;
  if (f.stage && stageBucket(deal) !== f.stage) return false;
  return true;
}

export interface ExploreTile {
  axis: 'class' | 'lead' | 'stage' | 'industry';
  key: string;
  label: string;
  count: number;
  href: string;
}

export interface ExploreGroup {
  title: string;
  tiles: ExploreTile[];
}

/** The Explore section: every slice with at least one open deal in it. */
export function exploreGroups(deals: DealFacets[]): ExploreGroup[] {
  const count = (pred: (d: DealFacets) => boolean) => deals.filter(pred).length;

  const classes: ExploreTile[] = (Object.keys(ASSET_CLASSES) as AssetClass[]).map((key) => ({
    axis: 'class',
    key,
    label: ASSET_CLASSES[key].label,
    count: count((d) => d.assetClass === key),
    href: quickFilterHref({ assetClass: key }),
  }));

  const leads: ExploreTile[] = (Object.keys(LEAD_FILTER_LABEL) as LeadType[]).map((key) => ({
    axis: 'lead',
    key,
    label: LEAD_FILTER_LABEL[key],
    count: count((d) => d.leadType === key),
    href: quickFilterHref({ lead: key }),
  }));

  const stages: ExploreTile[] = STAGE_KEYS.map((key) => ({
    axis: 'stage',
    key,
    label: STAGE_LABEL[key],
    count: count((d) => stageBucket(d) === key),
    href: quickFilterHref({ stage: key }),
  }));

  const industries: ExploreTile[] = (Object.keys(INDUSTRIES) as Industry[])
    .map((key) => ({
      axis: 'industry' as const,
      key,
      label: INDUSTRIES[key],
      count: count((d) => d.industry === key),
      href: quickFilterHref({ industry: key }),
    }))
    .sort((a, b) => b.count - a.count);

  return [
    { title: 'Asset class', tiles: classes },
    { title: 'Who leads', tiles: leads },
    { title: 'Stage', tiles: stages },
    { title: 'Industry', tiles: industries },
  ]
    .map((group) => ({ ...group, tiles: group.tiles.filter((t) => t.count > 0) }))
    .filter((group) => group.tiles.length > 0);
}
