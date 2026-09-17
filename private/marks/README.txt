Company marks. Deliberately NOT in public/.

Anything in public/ is served to anyone, signed in or not, and a file
name is information: a logo at /calder-logo.svg names a live offering
to a logged-out visitor. Under Rule 506(b) no deal, Radar company or
term may appear on a logged-out surface, so marks live here and are
served by app/api/marks/[file]/route.ts:

  - signed in, always;
  - and for a mark whose name is a deal id, only to a member who has
    cleared the relationship gate, exactly like the deal itself.

A request the viewer may not see gets the same 404 as a file that does
not exist, so the route cannot be used to learn which marks exist.

To add a mark: drop <name>.svg here and point logoUrl at
/api/marks/<name>.svg (a deal in prisma/seed.ts, or a Radar company in
lib/terminal/radar.ts). openai.svg and databricks.svg belong to the
archived real-company entries (prisma/archive, lib/terminal/radar.archive.txt)
and are not referenced by anything live.
