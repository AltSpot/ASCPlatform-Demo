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
};

export default nextConfig;
