/**
 * An unknown deal id. Rendered inside the portal shell, in the
 * product's own type, rather than the framework's default 404, which
 * is the one unstyled page a member could otherwise reach by editing
 * a link.
 */
import Link from 'next/link';

export default function DealNotFound() {
  return (
    <div className="card" style={{ maxWidth: 560, marginTop: 40, padding: 34 }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>
        Not on the shelf
      </div>
      <h1 className="display" style={{ fontSize: 30, marginBottom: 12 }}>
        That deal is not here.
      </h1>
      <p className="sub" style={{ marginBottom: 22 }}>
        It may have closed and been taken down, or the link is out of date.
        Everything currently open is on the marketplace.
      </p>
      <Link className="btn btn-gold" href="/marketplace">
        Open the marketplace →
      </Link>
    </div>
  );
}
