#!/usr/bin/env node
/**
 * One-off: raise the floor on micro type across every stylesheet.
 *
 * Not part of the build and not meant to be run again. It is committed
 * because the sweep it performed touched twenty files, and a reviewer
 * asking "why is every label suddenly 10px" deserves to read the rule
 * rather than diff twenty stylesheets to infer it.
 *
 * THE RULE. Mono uppercase labels had drifted down to 8.5px with 0.2em
 * of tracking in the faintest grey on the palette. Each of those three
 * decisions is defensible alone; together they produced type that could
 * be seen and not read, and the worst of it was on numbers, where a
 * reader cannot infer a misread character from context the way they can
 * in a word.
 *
 *   · No type below 10px anywhere.
 *   · A mono uppercase label carries medium weight, because at this
 *     size a 400 stroke on a dark ground disappears.
 *   · Tracking above 0.16em comes back to 0.14em. Wide tracking is the
 *     AltSpot eyebrow and it stays, but past a point it stops being a
 *     style and starts being a gap between letters.
 *
 * The colour half of the fix is one token, --as-text-faint, lifted in
 * app/globals.css where it belongs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['app', 'components'];
const FLOOR = 10;

/** Every stylesheet under the given roots, skipping build output. */
function sheets(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...sheets(path));
    else if (entry.endsWith('.css')) out.push(path);
  }
  return out;
}

let files = 0;
let sizes = 0;
let weights = 0;
let tracks = 0;

for (const root of ROOTS) {
  for (const path of sheets(root)) {
    const before = readFileSync(path, 'utf8');

    /* Split on rule ends so each block can be judged on its own: a
       weight belongs with the family and the size that asked for it. */
    const blocks = before.split(/(?<=\})/);

    const after = blocks
      .map((block) => {
        if (!block.includes('{')) return block;

        let next = block.replace(/font-size:\s*(\d+(?:\.\d+)?)px/g, (whole, value) => {
          if (Number(value) >= FLOOR) return whole;
          sizes += 1;
          const spaced = whole.includes(': ') ? ': ' : ':';
          return `font-size${spaced}${FLOOR}px`;
        });

        const mono = /var\(--font-mono\)|var\(--fm\)/.test(next);
        const upper = /text-transform:\s*uppercase/.test(next);
        const small = /font-size:\s*1[01](?:\.\d+)?px/.test(next);

        if (mono && upper && small) {
          if (!/font-weight/.test(next)) {
            weights += 1;
            next = next.replace(
              /(font-size:\s*\d+(?:\.\d+)?px;)/,
              '$1\n  font-weight: var(--w-medium);',
            );
          }
          next = next.replace(/letter-spacing:\s*(0?\.\d+)em/g, (whole, value) => {
            if (Number(value) <= 0.16) return whole;
            tracks += 1;
            const spaced = whole.includes(': ') ? ': ' : ':';
            return `letter-spacing${spaced}0.14em`;
          });
        }

        return next;
      })
      .join('');

    if (after !== before) {
      writeFileSync(path, after);
      files += 1;
    }
  }
}

console.log(
  `${files} files · ${sizes} sizes raised · ${weights} weights added · ${tracks} tracking pulled in`,
);
