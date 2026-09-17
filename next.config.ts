import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * The dev-mode floating badge sits in the bottom-left corner, exactly
   * where the sidebar's account chip is, and it appears in every
   * screenshot and screen recording taken against the dev server. This
   * product is demonstrated from `npm run serve`, so the indicator is
   * off. It has no effect on a production build, which never renders it.
   *
   * Build and lint errors still fail the build: nothing here suppresses
   * a real problem, only the overlay that reports it on top of the UI.
   */
  devIndicators: false,

  /**
   * The deal-terms switches in lib/config.ts are read by client islands
   * too (the fee table, the payment page), and a browser has no
   * process.env. Inlining them at build keeps the server render and the
   * hydrated page reading the same value, so a flag cannot show a fee on
   * one and hide it on the other. Changing one means a rebuild, which is
   * the right cost for a compliance switch.
   */
  env: {
    ASC_SHOW_FEE_TERMS: process.env.ASC_SHOW_FEE_TERMS ?? 'false',
    ASC_SHOW_CARRY_TERMS: process.env.ASC_SHOW_CARRY_TERMS ?? 'false',
    ASC_SHOW_SPONSOR_ALIGNMENT: process.env.ASC_SHOW_SPONSOR_ALIGNMENT ?? 'true',
    ASC_ADMISSION_CUTOFF_HOURS: process.env.ASC_ADMISSION_CUTOFF_HOURS ?? '24',
  },
};

export default nextConfig;
