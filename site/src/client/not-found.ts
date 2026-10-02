/**
 * The not-found page's script. A static host serves 404.html for any address
 * it has no file for, so the address is read here: an old, mistyped or
 * locale-less address, or a raw EDI ID, goes to the page it means
 * (model/routing.ts); a reader of another language goes to the not-found page
 * in theirs; otherwise the page suggests close matches from the directory
 * index. It loads only the site's own index (client/fetch.ts).
 */
import {isLocale, LIMITS, type Locale} from '../config.ts';
import {localeOfPath, negotiateLocale, resolveMissing, wordsOfPath, type KnownPages} from '../model/routing.ts';
import {labelsFor, prepareIndex, search} from '../model/search.ts';
import {paths} from '../model/urls.ts';
import type {DirectoryIndex} from '../model/view-types.ts';
import {fetchSiteJson} from './fetch.ts';

interface Labels {
  roles: Record<string, string>;
  kinds: Record<string, string>;
  story: string;
}

const NOTHING: KnownPages = {objects: [], stories: []};

function rememberedLocale(): string | null {
  try {
    return localStorage.getItem('edi-lang');
  } catch {
    return null;
  }
}

function reveal(root: HTMLElement): void {
  root.removeAttribute('data-pending');
}

/** Close matches by identity (IDs, names, aliases, titles): a word found in some description is not a suggestion. */
function suggest(root: HTMLElement, index: DirectoryIndex, words: string, labels: Labels): void {
  const prepared = prepareIndex(index, labelsFor(index, labels));
  const objects = new Map<string, number>();
  const stories = new Map<string, number>();
  const collect = (query: string, penalty: number) => {
    const found = search(prepared, query);
    for (const [id, match] of found.objects) if (match.tier <= 2) objects.set(id, Math.min(objects.get(id) ?? 99, match.tier + penalty));
    for (const hit of found.stories) if (hit.match.tier <= 2) stories.set(hit.item.id, Math.min(stories.get(hit.item.id) ?? 99, hit.match.tier + penalty));
  };
  collect(words, 0);
  if (!objects.size && !stories.size) for (const word of words.split(' ').filter(word => word.length >= 3)) collect(word, 4);
  const entries = new Map(index.entries.map(entry => [entry.id, entry]));
  const storyById = new Map(index.stories.map(story => [story.id, story]));
  const rankOf = (id: string) => entries.get(id)?.rank ?? 999;
  const objectHits = [...objects].sort((a, b) => a[1] - b[1] || rankOf(a[0]) - rankOf(b[0])).slice(0, 6).flatMap(([id]) => entries.get(id) ?? []);
  const storyHits = [...stories].sort((a, b) => a[1] - b[1]).slice(0, 3).flatMap(([id]) => storyById.get(id) ?? []);
  if (!objectHits.length && !storyHits.length) return;
  const locale = index.locale;
  const list = root.querySelector('[data-match-list]')!;
  const item = (href: string, name: string, note: string) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = href;
    link.textContent = name;
    const muted = document.createElement('span');
    muted.className = 'muted';
    muted.textContent = note;
    li.append(link, ' ', muted);
    list.append(li);
  };
  for (const entry of objectHits) item(paths.object(locale, entry.slug), entry.name, entry.role ? (labels.roles[entry.role] ?? entry.role) : (labels.kinds[entry.kind] ?? entry.kind));
  for (const story of storyHits) item(paths.story(locale, story.slug), story.title, labels.story);
  root.querySelector<HTMLElement>('[data-matches]')!.hidden = false;
}

async function run(root: HTMLElement): Promise<void> {
  const pageLocale = root.dataset.locale as Locale;
  const edition = root.dataset.edition ?? '';
  const labels = JSON.parse(root.querySelector('[data-not-found-labels]')?.textContent ?? '{}') as Labels;
  const localized = root.hasAttribute('data-localized');
  const asked = new URLSearchParams(location.search).get('path') ?? '';
  const missing = localized ? (asked.startsWith('/') && !asked.startsWith('//') ? asked.slice(0, 2048) : '') : location.pathname;
  const reader = negotiateLocale(rememberedLocale(), navigator.languages?.join(',') ?? navigator.language);
  const locale = localized ? pageLocale : (localeOfPath(missing) ?? reader);
  const load = () => fetchSiteJson<DirectoryIndex>(paths.index(locale, edition)).catch(() => null);
  let index: DirectoryIndex | null = null;
  if (!localized) {
    // Addresses that need no index (a locale's casing, a section, a collection) first; records and stories need the index.
    let resolution = resolveMissing(missing, reader, NOTHING);
    if (!resolution.path) {
      index = await load();
      if (index) resolution = resolveMissing(missing, reader, {objects: index.entries, stories: index.stories});
    }
    if (resolution.path && resolution.path !== missing) {
      location.replace(`${resolution.path}${location.search}${location.hash}`);
      return;
    }
    if (isLocale(resolution.locale) && resolution.locale !== pageLocale) {
      location.replace(paths.notFound(resolution.locale, missing));
      return;
    }
  }
  reveal(root);
  const words = wordsOfPath(missing, LIMITS.query);
  if (!words) return;
  const input = root.querySelector<HTMLInputElement>('#nf-q');
  if (input && !input.value) input.value = words;
  index ??= await load();
  if (index) suggest(root, index, words, labels);
}

const root = document.querySelector<HTMLElement>('[data-not-found]');
if (root) void run(root).catch(() => reveal(root));
