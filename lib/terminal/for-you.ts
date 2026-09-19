/**
 * What the Terminal leads with for one member (Tyler, 2026-09-19).
 *
 * A reading room that opens the same for everyone is a feed; the point
 * of being inside the portal is that it can open on the piece that fits
 * where this member is. So the top of the Terminal is curated from what
 * the platform already knows: what they voted for, what they hold, what
 * is in flight, and what they told us in deal preferences. Each pick
 * carries its reason in words, because a recommendation a member cannot
 * trace is a black box, and this platform explains itself.
 *
 * It curates EDUCATION, never an offering: every pick is a library piece
 * or a wire story, none of which names a live deal or a return. Rules,
 * not a model, so the same member on the same day sees the same thing.
 *
 * Pure. The page gathers the signals; this only decides.
 */

export interface ForYouSignals {
  /** Asset classes the member voted for on the Radar or prefers. */
  classes: string[];
  /** Positions held in closed SPVs. */
  heldCount: number;
  /** A subscription signed and waiting to go to escrow. */
  awaitingEscrow: boolean;
  /** A subscription in escrow, waiting for its deal to close. */
  inEscrow: boolean;
  /** Has the member invested in anything yet? */
  newToInvesting: boolean;
  /** The count the Portfolio page measures against. */
  targetPositions: number;
}

export interface ForYouPick {
  slug: string;
  reason: string;
}

/** Library picks, best reason first, at most `limit`, only from `available`. */
export function pickLibrary(
  signals: ForYouSignals,
  available: string[],
  limit = 3,
): ForYouPick[] {
  const rules: (ForYouPick | null)[] = [
    signals.awaitingEscrow || signals.inEscrow
      ? {
          slug: 'how-altspot-is-paid',
          reason: signals.awaitingEscrow
            ? 'You have a subscription waiting to go to escrow'
            : 'You have money in escrow',
        }
      : null,
    signals.classes.includes('secondary')
      ? { slug: 'what-a-secondary-actually-buys', reason: 'You voted for a secondary' }
      : null,
    signals.heldCount < signals.targetPositions
      ? {
          slug: 'twenty-positions-equal-weight',
          reason:
            signals.heldCount === 0
              ? 'Before your first position'
              : `You hold ${signals.heldCount} of ${signals.targetPositions} positions`,
        }
      : null,
    signals.newToInvesting
      ? { slug: 'accreditation-explained', reason: 'New here: how access works' }
      : null,
    { slug: 'inside-a-data-room', reason: 'Before your next deal' },
    { slug: 'private-markets-q3-2026', reason: 'This quarter’s research' },
    { slug: 'the-denominator-problem', reason: 'How the market is moving' },
  ];

  const have = new Set(available);
  const out: ForYouPick[] = [];
  for (const rule of rules) {
    if (!rule || !have.has(rule.slug) || out.some((p) => p.slug === rule.slug)) continue;
    out.push(rule);
    if (out.length === limit) break;
  }
  return out;
}

/** Wire categories that match what the member follows. */
const CLASS_TO_CATEGORY: Record<string, string> = {
  secondary: 'Secondaries',
  venture: 'Venture',
  growth: 'Venture',
  fund: 'Fundraising',
  'real-asset': 'Real assets',
};

/** Wire stories in the member's categories, newest first, at most `limit`. */
export function pickWire<T extends { category: string }>(
  signals: ForYouSignals,
  items: T[],
  limit = 3,
): T[] {
  const wanted = new Set(signals.classes.map((c) => CLASS_TO_CATEGORY[c]).filter(Boolean));
  const matched = items.filter((item) => wanted.has(item.category));
  return (matched.length > 0 ? matched : items).slice(0, limit);
}
