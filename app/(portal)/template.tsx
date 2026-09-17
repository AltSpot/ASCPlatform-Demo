/**
 * Remounts on every navigation inside the portal (a Next.js template, not
 * a layout), so each page arrives with the same soft rise instead of
 * appearing. The motion is .page-enter in app/globals.css, and it is off
 * for anyone who asked for reduced motion.
 */
export default function PortalTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
