/**
 * Source files contain no characters that could hide or reorder code when
 * it is reviewed (Trojan Source): bidirectional controls, zero-width
 * characters or a byte-order mark. Strings that need one write it escaped.
 */
import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';
import {join, relative} from 'node:path';
import {test} from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname;
const DIRECTORIES = ['src', 'scripts', 'tests', 'public'];
const FILES = ['astro.config.ts', 'playwright.config.ts', 'package.json', 'tsconfig.json'];
const TEXT = /\.(ts|tsx|astro|mjs|js|css|json|md|txt|xml|svg|html|yaml|yml)$/;
const HIDDEN = /[\u00ad\u061c\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/u;

function* walk(directory: string): Generator<string> {
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (TEXT.test(entry.name)) yield path;
  }
}

test('no hidden or bidirectional characters in source', () => {
  const found: string[] = [];
  const paths = [...DIRECTORIES.flatMap(directory => [...walk(join(ROOT, directory))]), ...FILES.map(file => join(ROOT, file))];
  for (const path of paths) {
    readFileSync(path, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        const match = HIDDEN.exec(line);
        if (match) found.push(`${relative(ROOT, path)}:${index + 1} U+${match[0].codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`);
      });
  }
  assert.deepEqual(found, []);
});
