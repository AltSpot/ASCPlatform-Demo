'use client';

/**
 * Step 3 — identity verification: a government ID and a live capture.
 *
 * Neither image is uploaded in demo mode; only the fact of capture is
 * recorded. The camera stream is always stopped on unmount, so the
 * indicator light never lingers after leaving the step.
 */
import { useEffect, useRef, useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import type { WizardView } from '@/lib/domain';

export default function StepKyc({
  onComplete,
}: {
  onComplete: (next: WizardView) => void;
}) {
  const toast = useToast();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [idName, setIdName] = useState<string | null>(null);
  const [selfieTaken, setSelfieTaken] = useState(false);
  const [cameraLive, setCameraLive] = useState(false);
  const [busy, setBusy] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraLive(false);
  };

  // Release the camera when the investor leaves this step.
  useEffect(() => stopStream, []);

  async function handleIdFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIdName(file.name);
    try {
      await api.uploadId(file.name);
    } catch {
      toast('Could not record the ID capture.');
    }
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      simulateCapture();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraLive(true);
    } catch {
      toast('Camera unavailable — using simulated capture.');
      simulateCapture();
    }
  }

  async function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);

    stopStream();
    setSelfieTaken(true);
    toast('Live photo captured.');

    try {
      await api.captureSelfie();
    } catch {
      toast('Could not record the live capture.');
    }
  }

  /** Covers browsers or contexts where the camera is blocked outright. */
  async function simulateCapture() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 640, 480);
      gradient.addColorStop(0, '#1B1813');
      gradient.addColorStop(1, '#3B2E12');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#C9A14A';
      ctx.font = '20px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('Simulated live capture', 320, 240);
    }

    stopStream();
    setSelfieTaken(true);

    try {
      await api.captureSelfie();
    } catch {
      /* non-blocking */
    }
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      const next = await api.submitKyc();
      toast(
        <>
          <b>Identity submitted</b> — KYC / AML / OFAC screening in progress.
        </>,
      );
      onComplete(next);
    } catch {
      toast('Could not submit for screening — try again.');
    } finally {
      setBusy(false);
    }
  }

  const ready = Boolean(idName) && selfieTaken;

  return (
    <>
      <div className="eyebrow">Step 3 of 5</div>
      <h2 className="display" style={{ margin: '10px 0 12px' }}>
        Identity verification
      </h2>
      <p className="sub" style={{ marginBottom: 24 }}>
        Two quick captures — a photo of your government ID, and a live photo from your
        camera. Screening runs against KYC / AML / OFAC requirements.
      </p>

      <div className="grid c2" style={{ marginBottom: 16 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            1 · Government ID
          </div>
          <div
            className={idName ? 'dz done' : 'dz'}
            onClick={() => fileRef.current?.click()}
          >
            <div style={{ fontSize: 26, marginBottom: 8 }}>📄</div>
            {idName ? (
              <div>
                <b>✓ {idName}</b>
                <br />
                <span className="tiny">Received — replace by clicking again</span>
              </div>
            ) : (
              <div>
                <b style={{ color: 'var(--paper)' }}>Upload your driver&rsquo;s license</b>
                <br />
                <span className="tiny">Front side · JPG, PNG or PDF</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={handleIdFile}
          />
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            2 · Live photo
          </div>
          <div className="cam-frame">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ display: cameraLive ? 'block' : 'none' }}
            />
            <canvas
              ref={canvasRef}
              style={{ display: selfieTaken ? 'block' : 'none' }}
            />
            {!cameraLive && !selfieTaken && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--dim)',
                  textAlign: 'center',
                  padding: 20,
                  fontSize: 13,
                }}
              >
                Camera preview appears here
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={startCamera}>
              Start camera
            </button>
            <button
              className="btn btn-gold btn-sm"
              onClick={capture}
              disabled={!cameraLive}
            >
              Capture
            </button>
            <button className="skip" onClick={simulateCapture}>
              Camera blocked? Simulate
            </button>
          </div>
        </div>
      </div>

      <div className="wiz-actions">
        <button className="btn btn-gold" disabled={!ready || busy} onClick={submit}>
          Submit for screening &amp; continue
        </button>
        <span className="tiny">
          {ready ? 'Ready to submit.' : 'Both captures are required.'}
        </span>
      </div>
    </>
  );
}
