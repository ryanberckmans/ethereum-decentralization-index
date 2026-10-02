/**
 * Every interface dictionary has English's exact shape, keeps every
 * placeholder and protected term, and follows its language's punctuation.
 * I18N_LOCALE=fr checks one locale.
 */
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {test} from 'node:test';
import {LOCALES, type Locale} from '../src/config.ts';
import {en} from '../src/i18n/en.ts';

type Tree = string | readonly Tree[] | {readonly [key: string]: Tree};

const only = process.env.I18N_LOCALE;
const targets = LOCALES.filter(locale => locale !== 'en' && (!only || locale === only));

/** Terms that stay exactly as written in every language. */
const PROTECTED = /EDI Directory|EDI|D0–D9|D\d|D\?|≥|SHA-256|JSON|CSV|GitHub|Sourcify|llms\.txt|agents\.md|sitemap\.xml/g;
/** Characters that could hide or reorder text. No-break spaces are allowed. */
const FORBIDDEN = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/;
const CJK = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;

const placeholders = (text: string) => new Set([...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]));
const protectedTerms = (text: string) => new Set(text.match(PROTECTED) ?? []);
const isPlural = (value: Tree): value is {one: string; other: string; zero?: string} =>
  typeof value === 'object' && !Array.isArray(value) && 'one' in value && 'other' in value && Object.keys(value).every(key => ['zero', 'one', 'other'].includes(key));

async function load(locale: Locale): Promise<Tree> {
  const file = new URL(`../src/i18n/${locale}.ts`, import.meta.url);
  assert.ok(existsSync(file), `src/i18n/${locale}.ts is missing`);
  const module = (await import(file.href)) as Record<string, Tree>;
  const values = Object.values(module);
  assert.equal(values.length, 1, `src/i18n/${locale}.ts should export exactly one dictionary`);
  return values[0];
}

function walk(source: Tree, target: Tree, path: string, visit: (english: string, text: string, path: string, plural?: Tree) => void, errors: string[]): void {
  if (typeof source === 'string') {
    if (typeof target !== 'string') errors.push(`${path}: expected a string`);
    else visit(source, target, path);
    return;
  }
  if (Array.isArray(source)) {
    if (!Array.isArray(target) || target.length !== source.length) {
      errors.push(`${path}: expected a list of ${source.length}`);
      return;
    }
    source.forEach((item, index) => walk(item, (target as readonly Tree[])[index], `${path}[${index}]`, visit, errors));
    return;
  }
  if (typeof target !== 'object' || Array.isArray(target) || target === null) {
    errors.push(`${path}: expected an object`);
    return;
  }
  const sourceKeys = Object.keys(source).sort();
  const targetKeys = Object.keys(target).sort();
  if (sourceKeys.join() !== targetKeys.join()) errors.push(`${path}: keys differ (${targetKeys.filter(key => !sourceKeys.includes(key)).join(', ') || 'none extra'}; missing ${sourceKeys.filter(key => !targetKeys.includes(key)).join(', ') || 'none'})`);
  if (isPlural(source as Tree)) {
    const english = source as Record<string, string>;
    const translated = target as Record<string, string>;
    const allowed = new Set(Object.values(english).flatMap(text => [...placeholders(text)]));
    const used = new Set<string>();
    for (const key of sourceKeys) {
      if (typeof translated[key] !== 'string') continue;
      for (const name of placeholders(translated[key])) {
        used.add(name);
        if (!allowed.has(name)) errors.push(`${path}.${key}: unknown placeholder {${name}}`);
      }
      visit(english[key], translated[key], `${path}.${key}`, source);
    }
    for (const name of allowed) if (!used.has(name)) errors.push(`${path}: no form uses {${name}}`);
    return;
  }
  for (const key of sourceKeys) if (key in target) walk((source as Record<string, Tree>)[key], (target as Record<string, Tree>)[key], path ? `${path}.${key}` : key, visit, errors);
}

function check(locale: Locale | 'en', dictionary: Tree): string[] {
  const errors: string[] = [];
  walk(en as unknown as Tree, dictionary, '', (english, text, path, plural) => {
    const separator = path.endsWith('Separator');
    if (!text.trim()) errors.push(`${path}: empty`);
    if (text !== text.trim() && !separator) errors.push(`${path}: leading or trailing space`);
    if (/ {2}/.test(text)) errors.push(`${path}: double space`);
    if (FORBIDDEN.test(text)) errors.push(`${path}: invisible or control character`);
    if (/["']/.test(text)) errors.push(`${path}: straight quote or apostrophe; use typographic marks`);
    if (!plural) {
      const a = [...placeholders(english)].sort().join();
      const b = [...placeholders(text)].sort().join();
      if (a !== b) errors.push(`${path}: placeholders {${b}} should be {${a}}`);
    }
    for (const term of protectedTerms(english)) if (!text.includes(term)) errors.push(`${path}: keep “${term}” as written`);
    if (locale === 'en') return;
    if (english === text && /[a-z]{3,}.* [a-z]{3,}/i.test(text) && text.length >= 16) errors.push(`${path}: still English`);
    if ((locale === 'zh-CN' || locale === 'ja') && new RegExp(`${CJK.source}[,;?!]|${CJK.source}[.:](?!\\w)`).test(text)) errors.push(`${path}: use full-width punctuation after CJK text`);
    if (locale === 'fr' && /\S[:;!?](?=\s|$)/.test(text.replace(/https?:\/\/\S+/g, ''))) errors.push(`${path}: French needs a space before : ; ! ?`);
  }, errors);
  return errors;
}

test('English dictionary follows the house rules', () => {
  assert.deepEqual(check('en', en as unknown as Tree), []);
});

for (const locale of targets) {
  test(`${locale} dictionary matches English`, async () => {
    const errors = check(locale, await load(locale));
    assert.deepEqual(errors, [], `${locale}:\n${errors.join('\n')}`);
  });
}
