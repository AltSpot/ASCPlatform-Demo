'use client';

/**
 * Step 1 — Rule 506(c) accreditation.
 *
 * Offerings are made under 506(c), which requires verifying rather than
 * merely asking. The simplest path is a one-page certification signed by
 * the investor's attorney or CPA, good for five years.
 *
 * AltSpot handles verification itself: the returned letter is read
 * automatically and confirmed by a reviewer. There is no verification
 * vendor in this flow, by design.
 */
import { useRef, useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
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
<p class="foot">Upload the completed letter through your AltSpot investor portal. AltSpot reads and confirms it directly. Certification remains valid for five years from the date of signature. This template is provided for convenience and does not constitute legal advice.</p>
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

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [downloaded, setDownloaded] = useState(
    wizard.accreditation.status === 'downloaded' ||
      wizard.accreditation.status === 'verified',
  );
  const [letterName, setLetterName] = useState<string | null>(null);
  const [verified, setVerified] = useState(
    wizard.accreditation.status === 'verified',
  );
  const [nextView, setNextView] = useState<WizardView | null>(null);
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
    toast('Template downloaded. Have your attorney or CPA sign it.');
  }

  /**
   * The file never leaves the browser. Only its name is sent, which is
   * what the server records alongside the verification decision.
   */
  async function handleLetter(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || busy) return;

    setBusy(true);
    setLetterName(file.name);

    try {
      const next = await api.uploadAccreditationLetter(file.name);
      setNextView(next);
      setVerified(true);
      toast(
        <>
          <b>Accreditation verified.</b> Valid for five years.
        </>,
      );
    } catch {
      setLetterName(null);
      toast('Could not read that letter. Try again.');
    } finally {
      setBusy(false);
      // Let the same file be chosen twice in a row.
      event.target.value = '';
    }
  }

  async function proceed() {
    if (busy) return;

    if (nextView) {
      onComplete(nextView);
      return;
    }

    // Verified on a previous visit: re-read rather than trusting state.
    setBusy(true);
    try {
      onComplete(await api.wizard());
    } catch {
      toast('Could not load your progress. Try again.');
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
        AltSpot offerings are made under SEC Rule 506(c), which requires us to verify,
        not just ask, that you&rsquo;re an accredited investor. The simplest path is a
        one-page certification signed by your attorney or CPA.{' '}
        <b style={{ color: 'var(--ink)' }}>You only do this once every five years.</b>
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div
          style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="kicker">Step one</div>
            <h3 style={{ marginTop: 8 }}>Download the certification letter</h3>
            <p className="small" style={{ marginTop: 6 }}>
              One page, pre-addressed to AltSpot Capital LLC. Your attorney, CPA,
              registered investment adviser or broker-dealer completes and signs it. It
              takes a professional about five minutes.
            </p>
          </div>
          <button className="btn btn-gold" onClick={downloadLetter}>
            Download letter
          </button>
        </div>

        {downloaded && (
          <div className="chip neutral" style={{ marginTop: 16 }}>
            <span className="dot" /> Template downloaded
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div
          style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="kicker">Step two</div>
            <h3 style={{ marginTop: 8 }}>Upload the signed letter</h3>
            <p className="small" style={{ marginTop: 6 }}>
              We read the letter automatically and an AltSpot reviewer confirms it. A
              person checks every certification before it counts. You keep the original;
              we retain the confirmation, not the document.
            </p>
          </div>
          <span className="demo-tag" style={{ flex: 'none' }}>
            <span className="dot" /> Demo · instant approval
          </span>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.html,.doc,.docx"
          style={{ display: 'none' }}
          onChange={handleLetter}
        />

        <div
          className={verified ? 'dz done' : 'dz'}
          role="button"
          tabIndex={0}
          aria-label="Upload your signed certification letter"
          style={{ marginTop: 16 }}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              fileRef.current?.click();
            }
          }}
        >
          <div style={{ fontSize: 26, marginBottom: 8 }}>{verified ? '✓' : '⬆'}</div>
          <b style={{ display: 'block', color: 'inherit' }}>
            {busy
              ? 'Reading letter…'
              : verified
                ? (letterName ?? 'Certification letter on file')
                : 'Upload signed certification letter'}
          </b>
          <span className="tiny" style={{ display: 'block', marginTop: 6 }}>
            PDF, image or document. The file stays on your device in this demo.
          </span>
        </div>

        {verified && (
          <>
            <div className="chip good" style={{ marginTop: 16 }}>
              <span className="dot" /> Verification complete · valid five years
            </div>
            <div className="demo-note" style={{ marginTop: 12 }}>
              Demo item. The upload is not stored and approval returns instantly. In
              production the letter is read automatically, then confirmed by an AltSpot
              reviewer before your status changes.
            </div>
          </>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 10 }}>What your certifier confirms</h3>
        <p className="small">
          That you meet at least one accredited-investor standard under Rule 501. For
          example, individual income over $200,000 (or $300,000 jointly) in each of the
          last two years, or net worth over $1,000,000 excluding your primary residence.
        </p>
      </div>

      <div className="wiz-actions">
        <button className="btn btn-gold" disabled={!verified || busy} onClick={proceed}>
          Continue
        </button>
        <span className="tiny">
          {verified
            ? 'Accreditation on file. Valid for five years.'
            : 'Upload the signed letter to continue.'}
        </span>
      </div>
    </>
  );
}
