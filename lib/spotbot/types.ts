/**
 * SpotBot wire types.
 *
 * Shared by the browser dock, the route handler and the answer engine, so
 * the contract survives replacing the local engine with a live model call.
 * Pure types only: this module is imported from both runtimes.
 */

/** Why SpotBot declined. One per gate rule, stable enough to report on. */
export type RefusalReason =
  | 'investment_recommendation'
  | 'performance_prediction'
  | 'position_sizing'
  | 'tax_or_legal_advice'
  | 'deal_comparison';

export interface SpotBotAnswer {
  /** The prose shown to the investor. Plain text, no markup. */
  body: string;
  /**
   * Provenance. Every answer says where it came from, because an investor
   * has to be able to check SpotBot against the real document.
   */
  source: string;
  /** True when the gate declined. The dock marks these differently. */
  refused: boolean;
  /** Present only on a refusal. */
  reason?: RefusalReason;
  /** Follow-ups SpotBot can actually answer, offered as one-tap chips. */
  followUps: string[];
}

export interface SpotBotRequest {
  question: string;
  /** Pathname the investor asked from. Answers are page aware. */
  pathname: string;
}
