'use client';

/**
 * SpotBotDock — the guide that follows the investor around the portal.
 *
 * Mounted once in the portal shell, so it survives client navigation and
 * the conversation persists as the investor moves between pages. It reads
 * the pathname on every render, which is what makes the greeting, the
 * brief and the suggested questions match the room you are standing in.
 *
 * Everything it says comes back from POST /api/spotbot. The gate that
 * decides what SpotBot will not answer runs there, server-side, so nothing
 * in this file can loosen it.
 *
 * Not to be confused with components/SpotBot.tsx, the per-deal Q&A card.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { ask } from '@/lib/spotbot/client';
import { pageContext } from '@/lib/spotbot/pages';
import type { SpotBotAnswer } from '@/lib/spotbot/types';

import styles from './SpotBotDock.module.css';

interface Message {
  id: number;
  role: 'you' | 'spotbot';
  body: string;
  source?: string;
  refused?: boolean;
}

const GREETING =
  'I explain how AltSpot works. Ask me what a step needs, what a term means, or what a document says. I will not tell you whether to invest.';

/** Shown when the request itself fails. Honest about which part broke. */
const UNREACHABLE: Omit<Message, 'id'> = {
  role: 'spotbot',
  body: 'I could not reach the platform guide just then. Try again in a moment. If it keeps failing, nothing on your account is affected, and the AltSpot team can answer directly.',
  source: 'AltSpot platform guide',
};

export default function SpotBotDock() {
  const pathname = usePathname() ?? '/';
  const page = useMemo(() => pageContext(pathname), [pathname]);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  /**
   * The last answer's follow-ups, tagged with the page they were offered
   * on. Tagging rather than clearing keeps this derived: follow-ups about
   * funding are noise once the investor has navigated to Docs, and they
   * fall away on their own when the pathname no longer matches.
   */
  const [followUps, setFollowUps] = useState<{ path: string; questions: string[] } | null>(
    null,
  );

  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  // Escape closes, from anywhere in the panel or the page behind it.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Focus follows the panel: into the composer on open, back to the
  // launcher on close, so keyboard users never lose their place.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) inputRef.current?.focus();
    else if (wasOpen.current) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  /**
   * The panel is fixed and would otherwise sit on top of the page. Tell
   * the document it is open so the shell can fold the content in beside
   * it instead of underneath it. An attribute rather than a prop because
   * the portal shell is a server component and the dock is mounted as a
   * sibling of the content, not a parent.
   */
  useEffect(() => {
    const root = document.body;
    if (open) root.dataset.spotOpen = 'true';
    else delete root.dataset.spotOpen;
    return () => {
      delete root.dataset.spotOpen;
    };
  }, [open]);

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    log.scrollTo({ top: log.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [messages, busy, open]);

  const push = useCallback((message: Omit<Message, 'id'>) => {
    setMessages((current) => [...current, { ...message, id: nextId.current++ }]);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;

      setDraft('');
      push({ role: 'you', body: question });
      setBusy(true);

      try {
        const answer: SpotBotAnswer = await ask({ question, pathname });
        push({
          role: 'spotbot',
          body: answer.body,
          source: answer.source,
          refused: answer.refused,
        });
        setFollowUps({ path: pathname, questions: answer.followUps });
      } catch {
        push(UNREACHABLE);
      } finally {
        setBusy(false);
      }
    },
    [busy, pathname, push],
  );

  const fresh = followUps?.path === pathname ? followUps.questions : [];
  const suggestions = (fresh.length > 0 ? fresh : page.suggested).slice(0, 3);

  return (
    <div className={styles.dock}>
      {open && (
        <div
          className={styles.panel}
          role="dialog"
          aria-label="Spot"
          id="spotbot-panel"
        >
          <div className={styles.head}>
            <div className={`orb ${styles.headOrb}`} aria-hidden="true" />
            <div className={styles.headText}>
              <span className={styles.headName}>Spot</span>
              <span className={styles.headPage}>{page.label}</span>
            </div>
            <button
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Close Spot"
            >
              <X size={15} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.brief}>
            <span className={styles.briefLabel}>On this page</span>
            <p className={styles.briefText}>{page.brief}</p>
          </div>

          <div className={styles.log} ref={logRef} role="log" aria-live="polite">
            {messages.length === 0 && <p className={styles.greeting}>{GREETING}</p>}

            {messages.map((message) =>
              message.role === 'you' ? (
                <div key={message.id} className={styles.you}>
                  {message.body}
                </div>
              ) : (
                <div
                  key={message.id}
                  className={styles.bot}
                  data-refused={message.refused ? 'true' : 'false'}
                >
                  {message.body}
                  {message.source && (
                    <span className={styles.src}>
                      SpotBot · {message.source} · explains, never advises
                    </span>
                  )}
                </div>
              ),
            )}

            {busy && <div className={styles.thinking}>Checking the guide</div>}
          </div>

          {suggestions.length > 0 && (
            <div className={styles.suggestions}>
              <span className={styles.suggestLabel}>
                {fresh.length > 0 ? 'Next' : 'Ask about'}
              </span>
              {suggestions.map((question) => (
                <button
                  key={question}
                  className={styles.suggest}
                  onClick={() => send(question)}
                  disabled={busy}
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          <form
            className={styles.composer}
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
          >
            <input
              ref={inputRef}
              className={styles.input}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about this page"
              aria-label="Ask Spot about this page"
              maxLength={400}
              autoComplete="off"
            />
            <button className={styles.send} type="submit" disabled={busy || !draft.trim()}>
              Ask
            </button>
          </form>

          <p className={styles.foot}>Spot explains, it never advises.</p>
        </div>
      )}

      <button
        ref={launcherRef}
        className={styles.launcher}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="spotbot-panel"
        aria-label={open ? 'Close Spot' : 'Open Spot, the AltSpot guide'}
      >
        <span className={`orb ${styles.launcherOrb}`} aria-hidden="true" />
        <span className={styles.launcherLabel}>Spot</span>
      </button>
    </div>
  );
}
