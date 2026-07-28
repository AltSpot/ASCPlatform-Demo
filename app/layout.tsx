import type { Metadata } from 'next';

import { ToastProvider } from '@/components/Toast';

import './globals.css';

export const metadata: Metadata = {
  title: 'AltSpot Capital — Investor Portal',
  description:
    'The private room. Sourced, underwritten, and co-invested private-market opportunities for approved AltSpot members.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
