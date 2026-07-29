/**
 * Which confirmation panel discharges which clause.
 *
 * Kept out of the generated documents on purpose. Those files are
 * counsel's content and are overwritten wholesale on every re-import;
 * this mapping is ours and must survive that. It is also the artifact
 * counsel reviews when they check that the plain-language panels actually
 * cover the agreement, so it belongs somewhere readable.
 *
 * Only the subscription agreement is mapped: it is the only instrument
 * the investor executes. The memorandum is delivered and the operating
 * agreement is joined by counterpart, so neither has panels.
 */

/** Clause numbers, by the panel that covers them. */
const PANEL_CLAUSES: Record<number, string[]> = {
  1: ['2', '1.2', '1.3', '1.5', '1.6'],
  2: ['3.1', '3.6', '3.7', '3.9', '3.10'],
  3: ['3.2', '3.3', '3.4', '3.5'],
  4: ['3.8', '3.11', '3.12'],
  5: ['4.1', '4.2', '4.3', '6.1'],
  6: ['1.4', '5', '6.2', '3.13', '3.14', '3.15'],
};

const CLAUSE_TO_PANEL = new Map<string, number>();
for (const [panel, clauses] of Object.entries(PANEL_CLAUSES)) {
  for (const clause of clauses) CLAUSE_TO_PANEL.set(clause, Number(panel));
}

/**
 * The panel covering a clause. Falls back to the article, so an unnumbered
 * paragraph inside Article 5 still lights up with Article 5.
 */
export function panelForClause(
  documentSlug: string,
  clause: string | null | undefined,
  articleNumeral: string | null | undefined,
): number | null {
  if (documentSlug !== 'subscription-agreement') return null;
  if (clause && CLAUSE_TO_PANEL.has(clause)) return CLAUSE_TO_PANEL.get(clause)!;
  if (articleNumeral && CLAUSE_TO_PANEL.has(articleNumeral)) {
    return CLAUSE_TO_PANEL.get(articleNumeral)!;
  }
  return null;
}

/** Clause list for a panel, used to show counsel what each one covers. */
export function clausesForPanel(panel: number): string[] {
  return PANEL_CLAUSES[panel] ?? [];
}
