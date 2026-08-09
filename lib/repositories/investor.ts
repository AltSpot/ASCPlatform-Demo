/**
 * Investor repository — onboarding state, the Vault, investment profiles
 * and linked banks.
 *
 * `ensureInvestorRecords` is the bootstrap: it creates the one-per-user
 * rows and seeds a closed Meridian position so a first login lands on a
 * dashboard that already feels lived-in. That seeding is a DEMO SEAM and
 * fabricates a holding nobody bought. Read the note on `SEED_POSITION`
 * before trusting any position on this platform.
 */
import 'server-only';

import { prisma } from '../db';
import { DEMO_PERSONA, personaEmail } from '../demo-persona';
import { ACCREDITATION_VALIDITY_DAYS, DAY_MS } from '../domain';
import type {
  AccreditationStatus,
  BankView,
  ProfileView,
  VaultView,
  WizardView,
} from '../domain';

/**
 * DEMO SEAM — READ THIS ONE. Every new investor is handed a position
 * they never bought.
 *
 * The figures below are invented. `seedOpeningPosition` writes them into
 * the real Subscription and Document tables the moment an account is
 * bootstrapped, so within milliseconds of a first sign-in the investor
 * holds an `accepted` $25,000 commitment in Meridian, marked up to
 * $29,600, dated seven months ago, with a "Countersigned · closed"
 * subscription agreement filed in Docs. No money moved. Nothing was
 * signed: `signature` is null and the document has no body to open.
 *
 * It exists because a dashboard with nothing on it demonstrates nothing.
 * It is also the single most misleading thing in the codebase, because
 * these rows are indistinguishable from real ones at a glance. The only
 * marker is `seeded: true` on the subscription.
 *
 *   Production contract: there is none. A new investor holds nothing.
 *   Replacement: delete `SEED_POSITION`, delete `seedOpeningPosition`,
 *     and delete the call in `ensureInvestorRecords`. Nothing else reads
 *     them. The `seeded` column on Subscription goes with them, and until
 *     it does, anything that reports on positions should be checked for
 *     whether it filters on it.
 */
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
 * DEMO SEAM — fabricates one accepted position plus its countersigned
 * agreement. See the note on SEED_POSITION above; this is the function
 * that writes invented holdings into the real tables.
 *
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
      fundingMethod: 'ACH · linked account',
      createdAt: new Date(now - SEED_POSITION.signedDaysAgo * DAY_MS),
    },
  });

  await prisma.document.create({
    data: {
      userId,
      dealId: deal.id,
      subscriptionId: subscription.id,
      name: `Subscription Agreement: ${deal.entity}`,
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

/**
 * Verification is performed in-house: the signed letter is read
 * automatically and confirmed by an AltSpot reviewer, so `provider` names
 * us rather than a third-party verification vendor.
 */
const ACCREDITATION_PROVIDER = 'AltSpot review';

export async function recordLetterDownload(userId: string): Promise<void> {
  await prisma.accreditation.update({
    where: { userId },
    data: { status: 'downloaded' },
  });
}

/**
 * The investor returned a completed letter. The file itself is never
 * stored; only the fact of the upload, which puts the record in front of
 * a reviewer. The filename lives in the audit trail at the call site.
 */
export async function recordLetterUpload(userId: string): Promise<void> {
  await prisma.accreditation.update({
    where: { userId },
    data: {
      status: 'pending',
      method: 'professional_letter',
      provider: ACCREDITATION_PROVIDER,
    },
  });
}

/** The reviewer's confirmation. Good for five years from this moment. */
export async function verifyAccreditation(userId: string): Promise<void> {
  const now = new Date();
  await prisma.accreditation.update({
    where: { userId },
    data: {
      status: 'verified',
      method: 'professional_letter',
      provider: ACCREDITATION_PROVIDER,
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
      // DEMO SEAM — this is not a token. It is the last four digits with
      // a prefix, so it carries exactly the information it is supposed to
      // protect and reverses trivially. The full taxpayer ID is correctly
      // never persisted, which is the part that matters and must stay
      // true. Production sends the raw value to a tokenization vault and
      // stores the opaque handle it returns. Replace this expression, not
      // the column.
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
 * DEMO SEAM — submit for screening, and clear in the same write.
 *
 * `submittedAt` and `clearedAt` are both `now`, and `idUploaded` /
 * `selfieCaptured` are forced true whether or not either happened. No
 * KYC, AML, OFAC or PEP check runs. See app/api/kyc/submit/route.ts for
 * the production contract; this is the function that stops writing
 * `cleared` when the vendor adapter goes in.
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

/**
 * One account as it comes back from the link flow. Mirrors the shape
 * Plaid returns for a selected account, so the real integration fills
 * this in unchanged.
 */
export interface LinkedAccountInput {
  /** Last four digits, as reported by the institution. */
  mask: string;
  /** Checking, Savings, and so on. */
  type: string;
}

/**
 * Link every account the investor selected. The first selection becomes
 * the default funding source, which is what `getBank` hands the payment
 * page. Masks come from the selection; nothing is fabricated here.
 */
export async function linkBank(
  userId: string,
  institution: string,
  accounts: LinkedAccountInput[],
): Promise<BankView[]> {
  // One transaction so a partial selection can never land, and so the
  // "exactly one default" invariant holds at every readable moment.
  const rows = await prisma.$transaction(async (tx) => {
    await tx.bankAccount.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    const created = [];
    for (const [index, account] of accounts.entries()) {
      created.push(
        await tx.bankAccount.create({
          data: {
            userId,
            institution,
            mask: account.mask,
            type: account.type,
            isDefault: index === 0,
          },
        }),
      );
    }

    await tx.wizardState.update({
      where: { userId },
      data: { bankDone: true },
    });

    return created;
  });

  return rows.map((row) => ({
    id: row.id,
    institution: row.institution,
    mask: row.mask,
    type: row.type,
    linkedAt: row.linkedAt.toISOString(),
  }));
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

// ---------------- the "existing investor" persona ----------------

/**
 * DEMO SEAM — fully onboard a freshly created investor as the demo
 * persona, without any of it having happened.
 *
 * Accreditation is marked verified with no letter, KYC is marked cleared
 * with a hardcoded filename, the Vault is filled from DEMO_PERSONA, and a
 * bank account is written directly rather than through `linkBank`. There
 * is no production equivalent: this and its caller,
 * `createDemoPersonaInvestor`, are deleted together with the
 * existing-investor button.
 *
 * Everything the invest gate checks is satisfied here: accreditation
 * verified, W-9 in the Vault, KYC cleared, an investment profile, and a
 * linked bank. The visitor lands on the dashboard able to go straight
 * into a subscription.
 *
 * Called only for accounts minted by the existing-investor button, so a
 * normally created investor still walks the whole setup.
 */
export async function provisionDemoPersona(userId: string): Promise<void> {
  await ensureInvestorRecords(userId);

  const now = new Date();

  await verifyAccreditation(userId);
  await saveVault(userId, { ...DEMO_PERSONA.vault });

  await prisma.kycRecord.update({
    where: { userId },
    data: {
      idUploaded: true,
      idFileName: 'hannah-smith-license.jpg',
      selfieCaptured: true,
      status: 'cleared',
      submittedAt: now,
      clearedAt: now,
    },
  });

  await createProfile(userId, {
    type: DEMO_PERSONA.profile.type,
    name: DEMO_PERSONA.profile.name,
    taxClass: DEMO_PERSONA.vault.taxClass,
  });

  await prisma.bankAccount.create({
    data: {
      userId,
      institution: DEMO_PERSONA.bank.institution,
      mask: DEMO_PERSONA.bank.mask,
      type: DEMO_PERSONA.bank.type,
      isDefault: true,
    },
  });

  await prisma.wizardState.update({
    where: { userId },
    data: { profileDone: true, bankDone: true, completedAt: now },
  });
}

/**
 * Mint a brand new investor under the demo persona and onboard them.
 *
 * A distinct address per visitor, so two people using the
 * existing-investor button at the same time never share a profile or see
 * each other's commitments. The caller supplies the password hash, which
 * keeps hashing in lib/auth.ts where it belongs.
 */
export async function createDemoPersonaInvestor(
  passwordHash: string,
): Promise<{ id: string; email: string; name: string }> {
  const user = await prisma.user.create({
    data: {
      email: personaEmail(),
      name: DEMO_PERSONA.name,
      passwordHash,
    },
  });

  await provisionDemoPersona(user.id);

  return { id: user.id, email: user.email, name: user.name };
}
