/**
 * Investor repository — onboarding state, the Vault, investment profiles
 * and linked banks.
 *
 * `ensureInvestorRecords` is the bootstrap: it creates the one-per-user
 * rows and seeds a closed Meridian position so a first login lands on a
 * dashboard that already feels lived-in.
 */
import 'server-only';

import { prisma } from '../db';
import { ACCREDITATION_VALIDITY_DAYS, DAY_MS } from '../domain';
import type {
  AccreditationStatus,
  BankView,
  ProfileView,
  VaultView,
  WizardView,
} from '../domain';

/** The demo position that makes a new dashboard look inhabited. */
const SEED_POSITION = {
  dealId: 'meridian',
  amount: 25_000,
  currentValue: 29_600,
  signedDaysAgo: 210,
  fundedDaysAgo: 208,
  acceptedDaysAgo: 205,
};

export async function ensureInvestorRecords(userId: string): Promise<void> {
  const existing = await prisma.wizardState.findUnique({ where: { userId } });
  if (existing) return;

  await prisma.$transaction([
    prisma.wizardState.create({ data: { userId } }),
    prisma.accreditation.create({ data: { userId } }),
    prisma.kycRecord.create({ data: { userId } }),
    prisma.vaultInfo.create({ data: { userId } }),
  ]);

  await seedOpeningPosition(userId);
}

/**
 * Seeds one accepted position plus its countersigned agreement.
 * Skipped silently if the deal is not present, so the bootstrap never
 * blocks a login on seed data.
 */
async function seedOpeningPosition(userId: string): Promise<void> {
  const deal = await prisma.deal.findUnique({
    where: { id: SEED_POSITION.dealId },
  });
  if (!deal) return;

  const now = Date.now();
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      dealId: deal.id,
      amount: SEED_POSITION.amount,
      state: 'accepted',
      seeded: true,
      currentValue: SEED_POSITION.currentValue,
      signature: null,
      signedAt: new Date(now - SEED_POSITION.signedDaysAgo * DAY_MS),
      fundedAt: new Date(now - SEED_POSITION.fundedDaysAgo * DAY_MS),
      acceptedAt: new Date(now - SEED_POSITION.acceptedDaysAgo * DAY_MS),
      fundingMethod: 'ACH — linked account',
      createdAt: new Date(now - SEED_POSITION.signedDaysAgo * DAY_MS),
    },
  });

  await prisma.document.create({
    data: {
      userId,
      dealId: deal.id,
      subscriptionId: subscription.id,
      name: `Subscription Agreement — ${deal.entity}`,
      type: 'agreement',
      note: 'Countersigned · closed',
      savedAt: new Date(now - SEED_POSITION.acceptedDaysAgo * DAY_MS),
    },
  });
}

// ---------------- wizard ----------------

export async function getWizardView(userId: string): Promise<WizardView> {
  await ensureInvestorRecords(userId);

  const [accreditation, kyc, vault, wizard] = await Promise.all([
    prisma.accreditation.findUnique({ where: { userId } }),
    prisma.kycRecord.findUnique({ where: { userId } }),
    prisma.vaultInfo.findUnique({ where: { userId } }),
    prisma.wizardState.findUnique({ where: { userId } }),
  ]);

  // The W-9 step counts as complete once the identifying fields are on file.
  const infoComplete = Boolean(
    vault?.first && vault?.last && vault?.street && vault?.tinLast4,
  );

  return {
    accreditation: {
      status: (accreditation?.status ?? 'not_started') as AccreditationStatus,
      method: accreditation?.method ?? null,
      verifiedAt: accreditation?.verifiedAt?.toISOString() ?? null,
      expiresAt: accreditation?.expiresAt?.toISOString() ?? null,
    },
    info: { complete: infoComplete },
    kyc: {
      idUploaded: kyc?.idUploaded ?? false,
      selfieCaptured: kyc?.selfieCaptured ?? false,
      complete: kyc?.status === 'cleared' || kyc?.status === 'pending',
    },
    profileDone: wizard?.profileDone ?? false,
    bankDone: wizard?.bankDone ?? false,
    complete: Boolean(wizard?.completedAt),
  };
}

export async function markWizardComplete(userId: string): Promise<void> {
  await prisma.wizardState.update({
    where: { userId },
    data: { completedAt: new Date() },
  });
}

// ---------------- accreditation ----------------

export async function recordLetterDownload(userId: string): Promise<void> {
  await prisma.accreditation.update({
    where: { userId },
    data: { status: 'downloaded', provider: 'Parallel Markets' },
  });
}

export async function verifyAccreditation(userId: string): Promise<void> {
  const now = new Date();
  await prisma.accreditation.update({
    where: { userId },
    data: {
      status: 'verified',
      method: 'professional_letter',
      provider: 'Parallel Markets',
      verifiedAt: now,
      expiresAt: new Date(now.getTime() + ACCREDITATION_VALIDITY_DAYS * DAY_MS),
    },
  });
}

// ---------------- the Vault (W-9) ----------------

export interface VaultInput {
  first: string;
  last: string;
  taxClass: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  /** Raw entry from the form. Only the last 4 digits are ever persisted. */
  tin: string;
}

export async function saveVault(userId: string, input: VaultInput): Promise<void> {
  const digits = input.tin.replace(/\D/g, '');
  const last4 = digits.slice(-4);

  await prisma.vaultInfo.update({
    where: { userId },
    data: {
      first: input.first,
      last: input.last,
      taxClass: input.taxClass,
      street: input.street,
      city: input.city,
      state: input.state,
      zip: input.zip,
      tinLast4: last4 || null,
      // Stand-in for the token a real tokenization vault would return.
      tinToken: last4 ? `tok_demo_${last4}` : null,
    },
  });
}

export async function getVault(userId: string): Promise<VaultView> {
  const vault = await prisma.vaultInfo.findUnique({ where: { userId } });
  return {
    first: vault?.first ?? null,
    last: vault?.last ?? null,
    taxClass: vault?.taxClass ?? null,
    street: vault?.street ?? null,
    city: vault?.city ?? null,
    state: vault?.state ?? null,
    zip: vault?.zip ?? null,
    tinLast4: vault?.tinLast4 ?? null,
  };
}

// ---------------- KYC ----------------

export async function recordIdUpload(
  userId: string,
  fileName: string,
): Promise<void> {
  await prisma.kycRecord.update({
    where: { userId },
    data: { idUploaded: true, idFileName: fileName },
  });
}

export async function recordSelfie(userId: string): Promise<void> {
  await prisma.kycRecord.update({
    where: { userId },
    data: { selfieCaptured: true },
  });
}

/**
 * Submit for screening. Demo mode clears immediately; production would
 * leave this pending until the provider calls back.
 */
export async function submitKyc(userId: string): Promise<void> {
  const now = new Date();
  await prisma.kycRecord.update({
    where: { userId },
    data: {
      idUploaded: true,
      selfieCaptured: true,
      status: 'cleared',
      submittedAt: now,
      clearedAt: now,
    },
  });
}

// ---------------- investment profiles ----------------

function toProfileView(row: {
  id: string;
  type: string;
  name: string;
  taxClass: string | null;
  isDefault: boolean;
  createdAt: Date;
}): ProfileView {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    taxClass: row.taxClass,
    isDefault: row.isDefault,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listProfiles(userId: string): Promise<ProfileView[]> {
  const rows = await prisma.investmentProfile.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(toProfileView);
}

export async function createProfile(
  userId: string,
  input: { type: string; name: string; taxClass?: string | null },
): Promise<ProfileView> {
  const count = await prisma.investmentProfile.count({ where: { userId } });

  const row = await prisma.investmentProfile.create({
    data: {
      userId,
      type: input.type,
      name: input.name,
      taxClass: input.taxClass ?? null,
      isDefault: count === 0,
    },
  });

  await prisma.wizardState.update({
    where: { userId },
    data: { profileDone: true },
  });

  return toProfileView(row);
}

/** Exactly one profile is default; setting one clears the rest. */
export async function setDefaultProfile(
  userId: string,
  profileId: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.investmentProfile.updateMany({
      where: { userId },
      data: { isDefault: false },
    }),
    prisma.investmentProfile.updateMany({
      where: { userId, id: profileId },
      data: { isDefault: true },
    }),
  ]);
}

// ---------------- bank ----------------

export async function linkBank(
  userId: string,
  institution: string,
): Promise<BankView> {
  // Demo masks are random; production reads them back from Plaid.
  const mask = String(Math.floor(1000 + Math.random() * 9000));

  await prisma.bankAccount.updateMany({
    where: { userId },
    data: { isDefault: false },
  });

  const row = await prisma.bankAccount.create({
    data: { userId, institution, mask, type: 'Checking', isDefault: true },
  });

  await prisma.wizardState.update({
    where: { userId },
    data: { bankDone: true },
  });

  return {
    id: row.id,
    institution: row.institution,
    mask: row.mask,
    type: row.type,
    linkedAt: row.linkedAt.toISOString(),
  };
}

export async function getBank(userId: string): Promise<BankView | null> {
  const row = await prisma.bankAccount.findFirst({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { linkedAt: 'desc' }],
  });
  if (!row) return null;

  return {
    id: row.id,
    institution: row.institution,
    mask: row.mask,
    type: row.type,
    linkedAt: row.linkedAt.toISOString(),
  };
}
