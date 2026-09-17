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

export type VisualTone = 'gold' | 'good' | 'warn' | 'bad' | 'quiet';

/**
 * A picture Spot can answer with, beside the prose (Tyler, 2026-09-17:
 * "allow Spot to create visuals ... instead of just long paragraphs").
 * Four shapes cover the mechanics people ask about: a path of steps (the
 * escrow lifecycle, the 506(b) gate, what an SPV is), a meter with marks
 * on it (the funding bar, the investor cap, retirement money), a sum
 * (what goes to escrow) and a split (how an exit is shared). Every
 * figure in one is computed by the same functions the product uses, so a
 * picture cannot disagree with a page, and a figure that is behind a
 * switch is left out of the picture too. Serializable: the dock keeps
 * the thread in sessionStorage.
 */
export type SpotVisual =
  | {
      kind: 'path';
      title: string;
      steps: { label: string; note: string; tone?: VisualTone }[];
      /** A branch at the end: what happens if the happy path does not. */
      otherwise?: { label: string; note: string };
    }
  | {
      kind: 'meter';
      title: string;
      /** Percent of the track, 0 to 100. */
      value: number;
      fillLabel: string;
      marks: { at: number; label: string; tone?: VisualTone }[];
      caption: string;
    }
  | {
      kind: 'sum';
      title: string;
      rows: { label: string; value: string; note?: string; tone?: VisualTone }[];
      total: { label: string; value: string };
      caption: string;
    }
  | {
      kind: 'split';
      title: string;
      segments: { label: string; share: number; tone: 'base' | 'gold' | 'ember' }[];
      caption: string;
    };

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
  /** A picture of the mechanic, when the topic has one. */
  visual?: SpotVisual;
}

export interface SpotBotRequest {
  question: string;
  /**
   * Where the investor asked from, path plus query.
   *
   * The name is historical and the query matters: Radar and the
   * marketplace shelf are one route apart only by `?view=radar`, and
   * dropping it made the two rooms indistinguishable to the engine.
   */
  pathname: string;
}
