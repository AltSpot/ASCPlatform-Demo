'use client';

/**
 * A panel that slides in from the right, over the page.
 *
 * The marketplace's one way of saying more about something without
 * leaving the grid: the Radar's detail, a deal's quick look and How it
 * works all open here, so a member learns one gesture. The page behind
 * stays where it was, the panel scrolls on its own, and Escape, the
 * close button or a press on the scrim all dismiss it.
 *
 * A native <dialog> in the top layer, portalled to <body>: inside a card
 * it sat under the card's overflow clip and hover transform, and the
 * sticky filter bar drew over it.
 *
 * Controlled from outside with `open` and `onClose`, so the thing that
 * owns the data (a card) decides when it opens.
 */
import { X } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import s from './SidePanel.module.css';

export default function SidePanel({
  open,
  onClose,
  label,
  header,
  footer,
  children,
  width = 'regular',
}: {
  open: boolean;
  onClose: () => void;
  /** The accessible name. */
  label: string;
  /** The top of the panel: identity and anything that must stay in view. */
  header: ReactNode;
  /** Pinned to the bottom: the action. */
  footer?: ReactNode;
  children: ReactNode;
  width?: 'regular' | 'wide';
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  /* Closing plays the slide out before the dialog leaves the top layer. */
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      setClosing(false);
      el.showModal();
    }
    if (!open && el.open) {
      setClosing(true);
      const done = window.setTimeout(() => {
        el.close();
        setClosing(false);
      }, 260);
      return () => window.clearTimeout(done);
    }
  }, [open, mounted]);

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialog}
      className={s.sheet}
      data-width={width}
      data-closing={closing}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className={s.frame}>
        <header className={s.head}>
          <div className={s.headBody}>{header}</div>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </header>
        <div className={s.body}>{children}</div>
        {footer ? <footer className={s.foot}>{footer}</footer> : null}
      </div>
    </dialog>,
    document.body,
  );
}
