/**
 * Deal preferences: what a member wants to see, and whether a deal fits.
 *
 * WHEN IT IS ASKED. Once AltSpot approves a member's questionnaire, which
 * is also when the cooling-off period starts: the wait is the natural time
 * to say what they are looking for, and the answers are ready the day
 * offerings open. Until they answer, a card sits at the top of the
 * dashboard. Afterwards it lives in Settings.
 *
 * HOW LITTLE IT ASKS. Six questions, every one a row of chips, all of
 * them optional, and "Show me everything" as a one-press answer to the
 * lot. A question left blank means any.
 *
 * WHAT IT DOES. It decides which deals are marked as a match and which
 * new deals a member is told about. It never hides an offering: every
 * member eligible for a deal can still see it on the shelf.
 *
 * Nothing here may depend on how a member arrived on the platform.
 *
 * Pure and isomorphic.
 */
import { isLeadType, type LeadType } from './funding';
import { isStageBucket, stageBucket, type StageBucket } from './explore';
import { isAssetClass, isIndustry, type AssetClass, type Industry } from './taxonomy';

export const CHECK_SIZES = {
  '10-25': { label: '$10K to $25K', max: 25_000 },
  '25-50': { label: '$25K to $50K', max: 50_000 },
  '50-100': { label: '$50K to $100K', max: 100_000 },
  '100+': { label: '$100K and up', max: Number.POSITIVE_INFINITY },
} as const;

export type CheckSize = keyof typeof CHECK_SIZES;

export function isCheckSize(value: unknown): value is CheckSize {
  return typeof value === 'string' && value in CHECK_SIZES;
}

export interface Preferences {
  showEverything: boolean;
  assetClasses: AssetClass[];
  industries: Industry[];
  stages: StageBucket[];
  leads: LeadType[];
  checkSize: CheckSize | null;
  notifyMatches: boolean;
}

export const EVERYTHING: Preferences = {
  showEverything: true,
  assetClasses: [],
  industries: [],
  stages: [],
  leads: [],
  checkSize: null,
  notifyMatches: true,
};

/** Clean a submitted body: unknown keys dropped, duplicates removed. */
export function parsePreferences(body: unknown): Preferences {
  const b = (body ?? {}) as Record<string, unknown>;
  const list = <T extends string>(v: unknown, ok: (x: string) => x is T): T[] =>
    Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string').filter(ok))] : [];
  return {
    showEverything: b.showEverything === true,
    assetClasses: list(b.assetClasses, isAssetClass),
    industries: list(b.industries, isIndustry),
    stages: list(b.stages, (x): x is StageBucket => isStageBucket(x)),
    leads: list(b.leads, isLeadType),
    checkSize: isCheckSize(b.checkSize) ? b.checkSize : null,
    notifyMatches: b.notifyMatches !== false,
  };
}

/** True when the answers amount to no filter at all. */
export function isOpenToEverything(p: Preferences): boolean {
  return (
    p.showEverything ||
    (p.assetClasses.length === 0 &&
      p.industries.length === 0 &&
      p.stages.length === 0 &&
      p.leads.length === 0 &&
      p.checkSize === null)
  );
}

export interface MatchableDeal {
  assetClass: string;
  industry: string | null;
  leadType: string;
  stage: string;
  minInvestment: number;
}

/** Does a deal fit? Every answered question has to agree; blank means any. */
export function matchesPreferences(deal: MatchableDeal, p: Preferences): boolean {
  if (isOpenToEverything(p)) return true;
  if (p.assetClasses.length && !p.assetClasses.includes(deal.assetClass as AssetClass)) return false;
  if (p.industries.length && !(deal.industry && p.industries.includes(deal.industry as Industry))) return false;
  if (p.leads.length && !p.leads.includes(deal.leadType as LeadType)) return false;
  if (p.stages.length) {
    const bucket = stageBucket(deal);
    if (!bucket || !p.stages.includes(bucket)) return false;
  }
  if (p.checkSize && deal.minInvestment > CHECK_SIZES[p.checkSize].max) return false;
  return true;
}

/** One line for Settings: what the member asked for, in words. */
export function summarize(p: Preferences, labels: {
  assetClass: (k: AssetClass) => string;
  industry: (k: Industry) => string;
  stage: (k: StageBucket) => string;
  lead: (k: LeadType) => string;
}): string {
  if (isOpenToEverything(p)) return 'Everything on the platform.';
  const parts = [
    p.assetClasses.map(labels.assetClass).join(', '),
    p.industries.map(labels.industry).join(', '),
    p.stages.map(labels.stage).join(', '),
    p.leads.map(labels.lead).join(', '),
    p.checkSize ? CHECK_SIZES[p.checkSize].label : '',
  ].filter(Boolean);
  return `${parts.join(' · ')}.`;
}
