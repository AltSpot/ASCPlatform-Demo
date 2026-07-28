'use client';

/**
 * Step 1 — Rule 506(c) accreditation.
 *
 * Offerings are made under 506(c), which requires verifying rather than
 * merely asking. The simplest path is a one-page certification signed by
 * the investor's attorney or CPA, good for five years.
 */
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { PARTNERS } from '@/lib/config';
import type { VaultView, WizardView } from '@/lib/domain';

function buildLetter(investorName: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Accredited Investor Certification</title>
<style>body{font-family:Georgia,serif;max-width:680px;margin:60px auto;color:#222;line-height:1.7;font-size:15px;padding:0 24px}
h1{font-size:19px;letter-spacing:.04em;text-transform:uppercase;text-align:center}.b{border-bottom:1px solid #333;display:inline-block;min-width:260px}
.foot{margin-top:60px;font-size:12px;color:#777}</style></head><body>
<h1>Third-Party Verification of Accredited Investor Status</h1>
<p style="text-align:center;color:#777;font-size:13px">Pursuant to Rule 506(c)(2)(ii)(C) under Regulation D · AltSpot Capital LLC</p>
<p>To: AltSpot Capital LLC</p>
<p>I am a licensed attorney, certified public accountant, SEC-registered investment adviser, or registered broker-dealer. Within the preceding three months, I have taken reasonable steps to verify, and hereby confirm, that:</p>
<p style="margin:26px 0">Investor: <span class="b">&nbsp;${investorName}&nbsp;</span></p>
<p>is an <b>accredited investor</b> as defined in Rule 501(a) of Regulation D under the Securities Act of 1933.</p>
<p>Basis of verification (check one):</p>
<p>&#9634;&nbsp; Income exceeding $200,000 individually (or $300,000 jointly) in each of the two most recent years, with a reasonable expectation of the same this year<br>
&#9634;&nbsp; Net worth exceeding $1,000,000, excluding primary residence<br>
&#9634;&nbsp; Professional certification or other qualifying status under Rule 501(a)</p>
<p style="margin-top:40px">Certifier name: <span class="b"></span><br><br>Firm &amp; license: <span class="b"></span><br><br>Signature: <span class="b"></span> &nbsp;&nbsp; Date: <span class="b" style="min-width:120px"></span></p>
<p class="foot">Return the completed letter through your AltSpot investor portal. Certification remains valid for five years from the date of signature. AltSpot Capital LLC partners with ${PARTNERS.accreditation} for verification processing. This template is provided for convenience and does not constitute legal advice.</p>
</body></html>`;
}

export default function StepAccreditation({
  userName,
  vault,
  wizard,
  onComplete,
}: {
  userName: string;
  vault: VaultView;
  wizard: WizardView;
  onComplete: (next: WizardView) => void;
}) {
  const toast = useToast();

  const alreadyStarted =
    wizard.accreditation.status === 'downloaded' ||
    wizard.accreditation.status === 'verified';

  const [downloaded, setDownloaded] = useState(alreadyStarted);
  const [busy, setBusy] = useState(false);

  async function downloadLetter() {
    const investorName =
      vault.first && vault.last ? `${vault.first} ${vault.last}` : userName;

    const blob = new Blob([buildLetter(investorName)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'AltSpot_Accreditation_Certification.html';
    anchor.click();
    URL.revokeObjectURL(url);

    try {
      await api.accreditationDownloaded();
    } catch {
      // The download already happened; the status write is not worth blocking on.
    }

    setDownloaded(true);
    toast(
      <>
        Letter downloaded — verification request opened with{' '}
        <b>{PARTNERS.accreditation}</b>.
      </>,
    );
  }

  async function markVerified() {
    if (busy) return;
    setBusy(true);
    try {
      const next = await api.verifyAccreditation();
      toast(
        <>
          <b>Accreditation verified</b> — valid for five years.
        </>,
      );
      onComplete(next);
    } catch {
      toast('Could not record verification — try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="eyebrow">Step 1 of 5</div>
      <h2 className="display" style={{ margin: '10px 0 12px' }}>
        Accreditation verification
      </h2>
      <p className="sub" style={{ marginBottom: 24 }}>
        AltSpot offerings are made under SEC Rule 506(c), which requires us to verify —
        not just ask — that you&rsquo;re an accredited investor. The simplest path: a
        one-page certification signed by your attorney or CPA.{' '}
        <b style={{ color: 'var(--paper)' }}>You only do this once every five years.</b>
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h3>Professional certification letter</h3>
            <p className="small" style={{ marginTop: 6 }}>
              Download the letter, have your attorney or CPA complete and sign it, and
              return it through this portal. On download, a secure verification request
              is opened with{' '}
              <b style={{ color: 'var(--gold-bright)' }}>{PARTNERS.accreditation}</b>,
              our accreditation partner.
            </p>
          </div>
          <button className="btn btn-gold" onClick={downloadLetter}>
            Download certification letter
          </button>
        </div>

        {downloaded && (
          <div className="chip good" style={{ marginTop: 16 }}>
            <span className="dot" /> Sent to {PARTNERS.accreditation} — verification in
            progress
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 10 }}>What your certifier confirms</h3>
        <p className="small">
          That you meet at least one accredited-investor standard under Rule 501 — for
          example, individual income over $200,000 (or $300,000 jointly) in each of the
          last two years, or net worth over $1,000,000 excluding your primary residence.
          The letter takes a professional about five minutes.
        </p>
      </div>

      <div className="wiz-actions">
        <button
          className="btn btn-gold"
          disabled={!downloaded || busy}
          onClick={markVerified}
        >
          Mark verified &amp; continue
        </button>
        <span className="tiny">
          {downloaded
            ? 'For the demo, continuing marks you verified instantly.'
            : 'Download the letter to continue.'}
        </span>
      </div>
    </>
  );
}
