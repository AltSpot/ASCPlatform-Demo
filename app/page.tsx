/**
 * Login — the front door.
 *
 * An existing session skips straight through, so returning to "/" never
 * shows a signed-in investor a login form.
 *
 * Everyone lands on the dashboard, including first-time investors with no
 * setup done. Account setup is prompted there, not imposed here: the
 * platform is browsable from the first second, and verification is only
 * required to invest.
 *
 * ONE COLUMN, CENTRED, AND IT IS THE SITE'S HERO. thealtspot.com opens
 * on a small wordmark, "Investing made easy" in Borna with the last word
 * in the gold-to-ember gradient and the orb as its period, and a set of
 * concentric hairline rings converging on the middle of the frame. A
 * member who applied on the site and then signs in here should not feel
 * they have arrived somewhere else, so the door repeats the hero and
 * sets the card down in the middle of it.
 *
 * The mark is the AltSpot wordmark, the same file the sidebar and the
 * wizard use. Not the Capital lockup: the portal is AltSpot's, and the
 * product line is named inside it, not on the door.
 */
import { redirect } from 'next/navigation';

import LoginForm from '@/components/LoginForm';
import ThemeToggle from '@/components/ThemeToggle';
import { Orb } from '@/components/ui';
import { getSessionUser } from '@/lib/auth';

import s from './Login.module.css';

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect('/dashboard');

  return (
    <div className={s.page}>
      {/* The site's hero furniture. Decorative in full: the rings and
          the bloom carry no meaning, and the orb is punctuation. */}
      <div className={s.aura} aria-hidden="true">
        <span className={s.bloom} />
        <span className={`${s.ring} ${s.ring1}`} />
        <span className={`${s.ring} ${s.ring2}`} />
        <span className={`${s.ring} ${s.ring3}`} />
        <span className={`${s.ring} ${s.ring4}`} />
        <span className={s.arc} />
      </div>

      <main className={s.body}>
        <header className={s.masthead}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.mark} src="/brand/altspot-wordmark.svg" alt="AltSpot" />
          <h1 className={s.line}>
            Investing made <em className={s.hot}>easy</em>
            <Orb className={s.period} variant="period" size="0.3em" glow={false} />
          </h1>
        </header>

        <section className={s.card}>
          <LoginForm />
        </section>
      </main>

      {/* The appearance switch lives on the rail everywhere else, and the
          rail is behind auth. Without a copy here the only way into
          Daylight is to sign in first, which is the wrong order for
          anyone being shown the product. */}
      <div className={s.appearance}>
        <ThemeToggle />
      </div>

      <footer className={s.foot}>
        Functional demo. All money is simulated and nothing here is an offer to
        sell securities.
      </footer>
    </div>
  );
}
