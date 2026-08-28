'use client';

/**
 * Spot — the guide that follows the investor around the portal.
 *
 * Mounted once in the portal shell, so the conversation survives client
 * navigation. It reads the pathname, which is what makes the greeting,
 * the brief and the suggested questions match the page you are on.
 *
 * The gate in lib/spotbot/gate.ts is what keeps "explains, never
 * advises" true. Nothing in this component is a control: it is the
 * surface, and the server refuses before the answer engine is reached.
 *
 * Conversation state is kept in sessionStorage rather than memory alone,
 * so a refresh mid-question does not lose the thread. It is deliberately
 * session-scoped and never sent anywhere: a member's questions are their
 * own, and Spot answers from a local knowledge base.
 */
import { Copy, Check, Maximize2, Minimize2, Trash2, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

const STORE_KEY = 'asc.spot.thread';
/** Enough to keep the thread useful, short enough to stay cheap to store. */
const KEEP = 40;

/** Within this many pixels of the bottom counts as "reading the latest". */
const AT_BOTTOM = 48;

function loadThread(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is Message =>
        !!m &&
        typeof m === 'object' &&
        typeof (m as Message).body === 'string' &&
        ((m as Message).role === 'you' || (m as Message).role === 'spotbot'),
    );
  } catch {
    // A private window, cleared storage, or malformed JSON. An empty
    // thread is always a correct answer here.
    return [];
  }
}

export default function SpotBotDock() {
  const pathname = usePathname() ?? '/';
  const page = useMemo(() => pageContext(pathname), [pathname]);

  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [pinned, setPinned] = useState(true);
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const restored = useRef(false);
  /** The last thing the member typed, for arrow-up recall. */
  const lastAsked = useRef('');

  /** Restore on first open. An event handler, so it never fights render. */
  const toggleOpen = useCallback(() => {
    setOpen((was) => {
      if (!was && !restored.current) {
        restored.current = true;
        const stored = loadThread();
        if (stored.length > 0) {
          nextId.current = stored.length;
          setMessages(stored.map((m, i) => ({ ...m, id: i })));
        }
      }
      return !was;
    });
  }, []);

  // Escape closes. Cmd/Ctrl+K toggles from anywhere, which is what a
  // member who lives in the portal will reach for.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggleOpen();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, toggleOpen]);

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
    if (open) {
      root.dataset.spotOpen = 'true';
      if (wide) root.dataset.spotWide = 'true';
      else delete root.dataset.spotWide;
    } else {
      delete root.dataset.spotOpen;
      delete root.dataset.spotWide;
    }
    return () => {
      delete root.dataset.spotOpen;
      delete root.dataset.spotWide;
    };
  }, [open, wide]);

  /** Keep the thread for this browser session only. */
  useEffect(() => {
    if (!restored.current) return;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-KEEP)));
    } catch {
      // Storage full or blocked. The in-memory thread still works.
    }
  }, [messages]);

  /** Follow the conversation, unless the member has scrolled up to read. */
  useEffect(() => {
    const log = logRef.current;
    if (!log || !pinned) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    log.scrollTo({ top: log.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [messages, busy, open, pinned]);

  const onLogScroll = useCallback(() => {
    const log = logRef.current;
    if (!log) return;
    const distance = log.scrollHeight - log.scrollTop - log.clientHeight;
    setPinned(distance <= AT_BOTTOM);
  }, []);

  const push = useCallback((message: Omit<Message, 'id'>) => {
    setMessages((all) => [...all, { ...message, id: nextId.current++ }]);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;

      setDraft('');
      lastAsked.current = question;
      setPinned(true);
      push({ role: 'you', body: question });
      setBusy(true);

      // The composer grew to fit the question; give it its height back.
      if (inputRef.current) inputRef.current.style.height = 'auto';

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

  const clearThread = useCallback(() => {
    setMessages([]);
    setFollowUps(null);
    nextId.current = 0;
    restored.current = true;
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      // Nothing to do. The in-memory thread is already cleared.
    }
    inputRef.current?.focus();
  }, []);

  const copyAnswer = useCallback(async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.body);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId((id) => (id === message.id ? null : id)), 1600);
    } catch {
      // Clipboard denied. Silent: the text is on screen and selectable.
    }
  }, []);

  /** Enter sends. Shift+Enter is a new line. Up recalls, when empty. */
  function onComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send(draft);
      return;
    }
    if (event.key === 'ArrowUp' && draft === '' && lastAsked.current) {
      event.preventDefault();
      setDraft(lastAsked.current);
    }
  }

  /** Grow to the question, up to the cap the stylesheet sets. */
  function onComposerInput(event: React.FormEvent<HTMLTextAreaElement>) {
    const el = event.currentTarget;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  const fresh = followUps?.path === pathname ? followUps.questions : [];
  const suggestions = (fresh.length > 0 ? fresh : page.suggested).slice(0, 3);
  const hasThread = messages.length > 0;

  return (
    <div className={styles.dock}>
      {open && (
        <div
          className={wide ? `${styles.panel} ${styles.panelWide}` : styles.panel}
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

            <div className={styles.headTools}>
              {hasThread && (
                <button
                  className={styles.tool}
                  onClick={clearThread}
                  aria-label="Clear this conversation"
                  title="Clear this conversation"
                >
                  <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
                </button>
              )}
              <button
                className={styles.tool}
                onClick={() => setWide((w) => !w)}
                aria-pressed={wide}
                aria-label={wide ? 'Narrow the panel' : 'Widen the panel'}
                title={wide ? 'Narrow' : 'Widen'}
              >
                {wide ? (
                  <Minimize2 size={14} strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <Maximize2 size={14} strokeWidth={1.5} aria-hidden="true" />
                )}
              </button>
              <button
                className={styles.tool}
                onClick={() => setOpen(false)}
                aria-label="Close Spot"
                title="Close"
              >
                <X size={15} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>

          {!hasThread && (
            <div className={styles.brief}>
              <span className={styles.briefLabel}>On this page</span>
              <p className={styles.briefText}>{page.brief}</p>
            </div>
          )}

          <div className={styles.logWrap}>
            <div
              className={styles.log}
              ref={logRef}
              onScroll={onLogScroll}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
            >
              {!hasThread && <p className={styles.greeting}>{GREETING}</p>}

              {messages.map((message) =>
                message.role === 'you' ? (
                  <div key={message.id} className={styles.youRow}>
                    <div className={styles.you}>{message.body}</div>
                  </div>
                ) : (
                  <div key={message.id} className={styles.botRow}>
                    <span className={`orb ${styles.botOrb}`} aria-hidden="true" />
                    <div
                      className={styles.bot}
                      data-refused={message.refused ? 'true' : 'false'}
                    >
                      <p className={styles.botBody}>{message.body}</p>
                      {message.source && (
                        <span className={styles.src}>
                          Spot · {message.source} · explains, never advises
                        </span>
                      )}
                      <button
                        className={styles.copy}
                        onClick={() => copyAnswer(message)}
                        aria-label="Copy this answer"
                        title="Copy"
                      >
                        {copiedId === message.id ? (
                          <Check size={13} strokeWidth={1.6} aria-hidden="true" />
                        ) : (
                          <Copy size={13} strokeWidth={1.5} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                ),
              )}

              {busy && (
                <div className={styles.botRow}>
                  <span className={`orb ${styles.botOrb}`} aria-hidden="true" />
                  <div className={styles.thinking}>
                    <span className={styles.thinkDot} />
                    <span className={styles.thinkDot} />
                    <span className={styles.thinkDot} />
                    <span className={styles.thinkWord}>Checking the guide</span>
                  </div>
                </div>
              )}
            </div>

            {!pinned && hasThread && (
              <button
                className={styles.jump}
                onClick={() => {
                  setPinned(true);
                  logRef.current?.scrollTo({
                    top: logRef.current.scrollHeight,
                    behavior: 'smooth',
                  });
                }}
              >
                Latest
              </button>
            )}
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
            <textarea
              ref={inputRef}
              className={styles.input}
              value={draft}
              rows={1}
              onChange={(event) => setDraft(event.target.value)}
              onInput={onComposerInput}
              onKeyDown={onComposerKeyDown}
              placeholder="Ask about this page"
              aria-label="Ask Spot about this page"
              maxLength={400}
              autoComplete="off"
            />
            <button className={styles.send} type="submit" disabled={busy || !draft.trim()}>
              Ask
            </button>
          </form>

          <p className={styles.foot}>
            Spot explains, it never advises.
            <kbd className={styles.kbd}>Enter</kbd> to send,
            <kbd className={styles.kbd}>Shift</kbd> +
            <kbd className={styles.kbd}>Enter</kbd> for a new line.
          </p>
        </div>
      )}

      <button
        ref={launcherRef}
        className={styles.launcher}
        onClick={toggleOpen}
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
