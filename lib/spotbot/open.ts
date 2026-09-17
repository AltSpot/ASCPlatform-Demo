'use client';

/**
 * One way to open Spot from anywhere on a page.
 *
 * A term a member might not know, a How it works panel that has said
 * its four sentences, a fee row: each can hand a question to Spot
 * instead of sending the member off to type it. The dock is mounted once
 * in the portal shell and listens for this event, so a caller needs no
 * ref, no context and no prop drilled through a server component.
 */
export const SPOT_OPEN_EVENT = 'asc:spot';

export interface SpotOpenDetail {
  /** A question to ask on opening. Omit to open the panel and nothing else. */
  question?: string;
}

export function openSpot(question?: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<SpotOpenDetail>(SPOT_OPEN_EVENT, { detail: { question } }),
  );
}
