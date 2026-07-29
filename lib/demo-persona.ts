/**
 * The "existing investor" persona.
 *
 * Two ways into the demo, and the difference is the point:
 *
 *   Type an email and password  -> a NEW investor. Nothing is on file, so
 *                                  the walkthrough covers accreditation,
 *                                  the W-9, KYC and the rest.
 *   Use existing investor       -> Hannah Smith, fully onboarded. Straight
 *                                  to the marketplace and into a
 *                                  subscription.
 *
 * Hannah is provisioned FRESH for each visitor rather than being a single
 * shared account. Two people clicking the button at the same time would
 * otherwise be editing the same profile and watching each other's
 * commitments appear. Each gets their own copy, and the ephemeral sweep
 * clears them like any other demo account.
 *
 * Entirely fictional. The address, the taxpayer ID and the bank are
 * invented, and no real person is described here.
 */

export const DEMO_PERSONA = {
  name: 'Hannah Smith',
  /** Local part; a random suffix is appended so each visitor is distinct. */
  emailLocal: 'hannah.smith',
  emailDomain: 'altspot.demo',

  vault: {
    first: 'Hannah',
    last: 'Smith',
    taxClass: 'Individual / sole proprietor',
    street: '1412 Montana Avenue, Apt 5',
    city: 'Santa Monica',
    state: 'CA',
    zip: '90403',
    // Fictional. Only the last four are ever persisted.
    tin: '000-00-4417',
  },

  profile: {
    type: 'Personal',
    name: 'Hannah Smith · Personal',
  },

  bank: {
    institution: 'Chase',
    mask: '8021',
    type: 'Checking',
  },
} as const;

/** A distinct address per visitor, so nobody shares Hannah's state. */
export function personaEmail(): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${DEMO_PERSONA.emailLocal}+${suffix}@${DEMO_PERSONA.emailDomain}`;
}
