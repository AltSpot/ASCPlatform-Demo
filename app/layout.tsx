import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';

import { ToastProvider } from '@/components/Toast';

import './globals.css';

/* The three faces are self-hosted and loaded here rather than through a
   CSS @import, so they are preloaded with the document and the first
   paint is Borna and Figtree, not Georgia and system-ui swapping a beat
   later. Figtree and Manrope are the variable latin builds from
   Google Fonts (OFL); Borna is an owned asset. Each face is exposed as
   the CSS variable globals.css already uses, so no component changes. */
const display = localFont({
  src: '../public/fonts/borna-medium.otf',
  weight: '500',
  variable: '--font-display',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
  adjustFontFallback: false,
});

const sans = localFont({
  src: '../public/fonts/figtree-latin.woff2',
  weight: '300 900',
  variable: '--font-sans',
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

/* The data face: Manrope with its tabular figures baked into the default
   glyphs (fontTools), so every number on the platform lines up in columns.
   Chosen in the type lab over JetBrains Mono, Figtree and Onest (Tyler,
   2026-09-17). It is --font-mono, which every eyebrow, label and figure
   reads, and --font-figure, which the large display numbers read. */
const data = localFont({
  src: '../public/fonts/manrope-tabular-latin.woff2',
  weight: '200 800',
  variable: '--font-data',
  fallback: ['system-ui', 'sans-serif'],
});

/**
 * What a link to this site shows anywhere it is pasted: a browser tab, a
 * chat preview, a social card. Platform only (Rule 506(b), work order
 * screen 4): no deal, no Radar company, no term. Pages that name a deal
 * set their own title, and those pages are behind login and the
 * relationship gate, so a preview crawler never sees one.
 */
const TAGLINE = 'The new standard for private market ownership.';

export const metadata: Metadata = {
  title: 'AltSpot',
  description: TAGLINE,
  openGraph: {
    title: 'AltSpot',
    description: TAGLINE,
    siteName: 'AltSpot',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'AltSpot',
    description: TAGLINE,
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /* The rail width and the theme are both written onto this element
       by the blocking script below, before React hydrates, so that a
       collapsed sidebar never paints wide first and Daylight never
       flashes the ember canvas before it turns over. React would
       otherwise report the attributes it did not render as a mismatch.
       The suppression is scoped to the html tag's own attributes, not
       its subtree.

       Both preferences are per device and live in localStorage, which
       is why neither can be rendered on the server: the document has to
       carry them before first paint, and only the browser knows them.

       data-scroll-behavior declares that the smooth scrolling in
       globals.css is deliberate, so the router does not have to guess
       whether to suppress it between routes. */
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={[
        display.variable,
        sans.variable,
        data.variable,
      ].join(' ')}
      suppressHydrationWarning
    >
      <body>
        {/* beforeInteractive so it runs ahead of hydration. Written as
            a next/script rather than a bare tag: a raw <script> in a
            component body is never executed on client navigation, and
            React says so in development every time this page renders. */}
        <Script id="asc-device-preferences" strategy="beforeInteractive">
          {"try{var d=document.documentElement.dataset;" +
            "if(localStorage.getItem('asc.rail.collapsed')==='true')d.rail='mini';" +
            "var t=localStorage.getItem('asc.theme');if(t==='light'||t==='ice')d.theme=t}catch(e){}"}
        </Script>

        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
