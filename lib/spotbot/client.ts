'use client';

/**
 * The browser's door to SpotBot.
 *
 * This mirrors lib/client/api.ts deliberately: same credentials, same JSON
 * headers, same error envelope. It sits here rather than in that file only
 * because SpotBot ships as a self-contained module. Fold `ask` into
 * lib/client/api.ts when the two are next touched together, and delete this.
 */
import type { SpotBotAnswer, SpotBotRequest } from './types';

export async function ask(request: SpotBotRequest): Promise<SpotBotAnswer> {
  const response = await fetch('/api/spotbot', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Spot is unavailable');
  }

  return payload as SpotBotAnswer;
}
