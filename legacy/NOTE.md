# Legacy — the original static demo

This is the front-end-only version of the portal that ASCPlatform replaces:
10 standalone HTML pages with `localStorage` standing in for a backend.

It is kept for one reason: **it is the visual reference.** `app/globals.css` was
ported from `assets/portal.css` verbatim, and the markup in the current React
components mirrors these pages closely. When a question comes up about what
something looked like or how a flow was worded originally, look here.

Nothing in the running application imports from this directory. It can be deleted
at any time without affecting the build.

To view it: open `index.html` in a browser. Note that it writes to the same
browser's `localStorage` under the `asc.` namespace and is completely independent
of the real database.
