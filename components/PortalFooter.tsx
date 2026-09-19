/**
 * The line under every signed-in page (Tyler, 2026-09-19, institutional
 * polish): who this is, what kind of offering it is, who it is for, and
 * where the disclosures live. It names no deal and no figure, says the
 * same thing on every page, and is never the only place a risk is stated:
 * each surface still carries its own. Server component.
 */
import Link from 'next/link';

export default function PortalFooter() {
  return (
    <footer className="portal-foot">
      <p>
        <b>AltSpot Capital.</b> Private placements offered under Rule 506(b) of Regulation D, to
        accredited investors with an existing relationship with AltSpot. Not an offer to the
        public. Private investments are illiquid and can lose all of their value.
      </p>
      <nav aria-label="Legal">
        <Link href="/disclosures">Disclosures</Link>
        <Link href="/docs">Documents</Link>
      </nav>
    </footer>
  );
}
