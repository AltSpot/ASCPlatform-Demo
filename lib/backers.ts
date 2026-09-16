/**
 * The other firms at the table.
 *
 * Some rounds AltSpot leads; some it co-invests in alongside a fund
 * that set the terms; and on the Radar, the last round a company
 * raised had a lead too. A member reads those names the way a lawyer
 * reads a signature block: who else looked at this and put money in.
 * So a deal and a Radar company can each carry a backing line, and
 * the card, the deal page and the board all draw it from here.
 *
 * DEMO SEAM. Every firm below is INVENTED. None of these names is a
 * real venture firm, the marks are drawn in code rather than supplied,
 * and nothing here claims any real fund has invested in anything.
 * When real syndicate partners are named, with their permission and
 * their own marks, this list is replaced and `BackerMark` renders an
 * <img> for the mark instead of the glyph. Consumers do not change.
 *
 * Pure and isomorphic. The mark is a glyph id rendered by
 * components/BackerMark.tsx so it takes currentColor on any surface:
 * the artwork band of a shelf card, glass in either theme.
 */

export type BackerGlyph = 'triangle' | 'diamond' | 'chevron' | 'ring' | 'peak' | 'square';

export interface Backer {
  id: string;
  name: string;
  glyph: BackerGlyph;
}

export const BACKERS = {
  ashgrove: { id: 'ashgrove', name: 'Ashgrove Capital', glyph: 'triangle' },
  northlight: { id: 'northlight', name: 'Northlight Partners', glyph: 'diamond' },
  sableridge: { id: 'sableridge', name: 'Sable Ridge', glyph: 'chevron' },
  halcyon: { id: 'halcyon', name: 'Halcyon Growth', glyph: 'ring' },
  cobaltpeak: { id: 'cobaltpeak', name: 'Cobalt Peak', glyph: 'peak' },
  bellwether: { id: 'bellwether', name: 'Bellwether Ventures', glyph: 'square' },
} as const satisfies Record<string, Backer>;

export type BackerId = keyof typeof BACKERS;

export function isBackerId(value: string): value is BackerId {
  return value in BACKERS;
}

/**
 * What a firm did on a round.
 *   led        set the terms; AltSpot co-invests on them.
 *   co-invest  investing alongside a round AltSpot leads.
 *   prior      led an earlier round; on the Radar, the last one.
 */
export type BackingRole = 'led' | 'co-invest' | 'prior';

export interface Backing {
  firm: BackerId;
  role: BackingRole;
}

/** The short label a card prints beside the mark. */
export function backingLabel(role: BackingRole): string {
  switch (role) {
    case 'led':
      return 'Led by';
    case 'co-invest':
      return 'With';
    case 'prior':
      return 'Last round';
  }
}

/** The sentence the deal page prints under the overview. */
export function backingSentence(backing: Backing): string {
  const name = BACKERS[backing.firm].name;
  switch (backing.role) {
    case 'led':
      return `${name} leads the round and set the terms. AltSpot is co-investing on the same terms.`;
    case 'co-invest':
      return `AltSpot leads the round. ${name} is co-investing on the same terms.`;
    case 'prior':
      return `${name} led the company's last round.`;
  }
}

/** Parse a stored backing list, dropping anything that does not resolve. */
export function parseBacking(value: unknown): Backing[] {
  if (!Array.isArray(value)) return [];
  const out: Backing[] = [];
  for (const item of value) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as Backing).firm === 'string' &&
      isBackerId((item as Backing).firm) &&
      ['led', 'co-invest', 'prior'].includes((item as Backing).role)
    ) {
      out.push({ firm: (item as Backing).firm, role: (item as Backing).role });
    }
  }
  return out;
}
