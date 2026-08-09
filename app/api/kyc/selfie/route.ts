/**
 * POST /api/kyc/selfie — records that a live capture was taken.
 *
 * DEMO SEAM — no frame is transmitted and no liveness check happens.
 *   Simulated: the request has no body. The browser asserts that a
 *     capture occurred and the server believes it, so the step can also
 *     be satisfied by the "Camera blocked? Simulate" button in
 *     components/wizard/StepKyc.tsx, which draws a placeholder.
 *   Production contract: the frame goes from the browser to the KYC
 *     vendor for liveness and a face match against the identity document.
 *     This server retains the vendor's result, never the image.
 *   Replacement: the request carries the vendor's capture reference, and
 *     `recordSelfie` persists it alongside the outcome.
 */
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';
import { getWizardView, recordSelfie } from '@/lib/repositories/investor';

export const POST = route(async () => {
  const user = await requireUser();
  await recordSelfie(user.id);
  return ok(await getWizardView(user.id));
});
