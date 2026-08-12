/**
 * Login — the front door.
 *
 * An existing session skips straight through, so returning to "/" never
 * shows a signed-in investor a login form.
 *
 * Everyone lands on the dashboard, including first-time investors with no
 * setup done. Account setup is prompted there, not imposed here — the
 * platform is browsable from the first second, and verification is only
 * required to invest.
 */
import { redirect } from 'next/navigation';

import LoginForm from '@/components/LoginForm';
import { getSessionUser } from '@/lib/auth';

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect('/dashboard');

  return (
    <div className="login-wrap">
      <div className="orb login-orb" />
      <div className="orb login-orb2" />

      <div className="card login-card">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 26 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="brand-logo"
            style={{ height: 30 }}
            src="/brand/altspot-logo-white.png"
            alt="AltSpot"
          />
          <span
            style={{
              color: 'var(--muted)',
              fontFamily: 'var(--sans)',
              fontWeight: 400,
              fontSize: 13,
            }}
          >
            Capital
          </span>
        </div>

        <h1 className="display" style={{ fontSize: 30, marginBottom: 8 }}>
          The private room.
        </h1>
        <p className="sub" style={{ marginBottom: 26, fontSize: 14 }}>
          Sign in to your investor account. Access is limited to approved members of
          the AltSpot community.
        </p>

        <LoginForm />
      </div>
    </div>
  );
}
