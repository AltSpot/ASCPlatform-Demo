/**
 * One dropdown (Tyler, 2026-09-21).
 *
 * A native <select> hands its open list to the operating system, which on
 * the platform's dark glass is a grey system menu. Every dropdown is
 * components/ui/Select, so this reads the components and pages as text
 * and fails on a native select, and on a Select wrapped in a <label>
 * (a label forwards every press inside it, the open list included, back
 * to the trigger).
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return files(full);
    return /\.tsx$/.test(name) ? [full] : [];
  });
}

const sources = [...files('components'), ...files('app')].map((file) => ({
  file,
  text: readFileSync(file, 'utf8'),
}));

describe('dropdowns', () => {
  test('no native select anywhere a member can reach', () => {
    const offenders = sources
      .filter(({ file, text }) => !file.endsWith(path.join('ui', 'Select.tsx')) && /<select[\s>]/.test(text))
      .map(({ file }) => file);
    assert.deepEqual(offenders, [], `use components/ui/Select instead: ${offenders.join(', ')}`);
  });

  test('a Select is never the child of a <label>', () => {
    const offenders = sources
      .filter(({ text }) => /<label[^>]*>(?:(?!<\/label>)[\s\S])*<Select[\s\n]/.test(text))
      .map(({ file }) => file);
    assert.deepEqual(offenders, [], `wrap it in a <div className="field">: ${offenders.join(', ')}`);
  });
});
