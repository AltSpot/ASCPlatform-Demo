#!/usr/bin/env node
/**
 * One-off: lift the taxonomy filter styles out of the Radar stylesheet
 * into a shared one, so the shelf can use the same control.
 *
 * Kept for the same reason scripts/legibility-sweep.mjs is: the edit it
 * makes spans two files and a reviewer should be able to read what
 * moved rather than reconstruct it from a diff. Not part of the build.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const RADAR = 'components/radar/Radar.module.css';
const SHARED = 'components/filters/TaxonomyFilters.module.css';

const css = readFileSync(RADAR, 'utf8');

const cut = (from, to) => {
  const start = css.indexOf(from);
  const end = css.indexOf(to);
  if (start === -1 || end === -1) throw new Error(`could not find ${from.slice(0, 40)}`);
  return css.slice(start, end);
};

const tints = cut(
  '/* One variable pair per class: the colour, and the line drawn in it.',
  '/* Rank on the board.',
);
const filters = cut(
  '.filters {',
  '/* Card identity: class chip, then industry as the quiet second line. */',
);

const header = `/* ==================================================================
   Filtering by taxonomy: asset class and industry.

   Shared. The Radar board and the deal shelf ask the same question of
   the same two axes, and a member who has learned the control on one
   should not have to learn it again on the other. It lived in
   components/radar until the shelf needed it, which is the moment a
   thing stops belonging to the feature that happened to need it first.

   The tint classes live here too. They set two variables, --chip-tint
   and --chip-line, and anything carrying one of these class names picks
   up its class colour: the filter chip here, and the sector chip on a
   Radar card, which reads them through components/filters/classes.ts.
   ================================================================== */

`;

writeFileSync(SHARED, header + tints + filters);
writeFileSync(RADAR, css.replace(tints, '').replace(filters, ''));

console.log(`moved ${(tints + filters).split('\n').length} lines to ${SHARED}`);
