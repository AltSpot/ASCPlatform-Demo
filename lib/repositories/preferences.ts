/**
 * Preferences repository: the only place that touches investor_preferences.
 * The rules are lib/preferences.ts.
 */
import 'server-only';

import { audit } from '../audit';
import { prisma } from '../db';
import { parsePreferences, type Preferences } from '../preferences';

function toList(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** A member's preferences, or null if they have not answered yet. */
export async function getPreferences(userId: string): Promise<Preferences | null> {
  const row = await prisma.investorPreference.findUnique({ where: { userId } });
  if (!row) return null;
  return parsePreferences({
    showEverything: row.showEverything,
    assetClasses: toList(row.assetClassesJson),
    industries: toList(row.industriesJson),
    stages: toList(row.stagesJson),
    leads: toList(row.leadsJson),
    checkSize: row.checkSize,
    notifyMatches: row.notifyMatches,
  });
}

export async function savePreferences(userId: string, prefs: Preferences): Promise<Preferences> {
  const data = {
    showEverything: prefs.showEverything,
    assetClassesJson: JSON.stringify(prefs.assetClasses),
    industriesJson: JSON.stringify(prefs.industries),
    stagesJson: JSON.stringify(prefs.stages),
    leadsJson: JSON.stringify(prefs.leads),
    checkSize: prefs.checkSize,
    notifyMatches: prefs.notifyMatches,
  };
  await prisma.investorPreference.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
  await audit({
    userId,
    action: 'preferences.saved',
    entity: 'investor_preferences',
    metadata: { showEverything: prefs.showEverything },
  });
  return prefs;
}
