/**
 * The small script every page loads. It never evaluates EDI and never calls a
 * third party: it swaps in the EDI results the build computed for the
 * reader's UTC date, applies display preferences, and wires language, copy,
 * menu and guide controls.
 */
import {utcToday, msUntilUtcMidnight} from '../model/dates.ts';

const root = document.documentElement;
const locale = root.dataset.locale ?? 'en';
const evaluated = root.dataset.evaluated ?? utcToday();

function formatDate(iso: string): string {
  const tag = locale === 'en' ? 'en-GB' : locale;
  try {
    return new Intl.DateTimeFormat(tag, {dateStyle: 'medium', timeZone: 'UTC'}).format(new Date(`${iso}T00:00:00Z`));
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------- dated content

/** Show, for each dated element, EDI's result for today's UTC date. */
function applyDates(today: string): void {
  for (const element of document.querySelectorAll<HTMLElement>('[data-dated]')) {
    const templates = [...element.querySelectorAll<HTMLTemplateElement>(':scope > template[data-from]')];
    let chosen: HTMLTemplateElement | null = null;
    for (const template of templates) if ((template.dataset.from ?? '') <= today) chosen = template;
    const applied = element.dataset.applied ?? element.dataset.dated ?? '';
    const target = chosen?.dataset.from ?? element.dataset.dated ?? '';
    if (!chosen || applied === target) continue;
    for (const child of [...element.childNodes]) if (!(child instanceof HTMLTemplateElement)) child.remove();
    element.prepend(chosen.content.cloneNode(true));
    element.dataset.applied = target;
  }
  // Inside SVG figures each result is a group; show the one that applies today.
  for (const group of document.querySelectorAll<SVGGElement>('g[data-dated-svg]')) {
    const options = [...group.children].filter((child): child is SVGGElement => child instanceof SVGGElement && child.dataset.from !== undefined);
    let chosen = options[0];
    for (const option of options) if ((option.dataset.from ?? '') <= today) chosen = option;
    for (const option of options) option.setAttribute('visibility', option === chosen ? 'visible' : 'hidden');
  }
  // The directory island re-renders its rows itself and announces when it has (edi:evaluated).
  const changes = (root.dataset.changeDates ?? '').split(',').filter(Boolean);
  const crossed = changes.some(date => date > evaluated && date <= today);
  if (today > evaluated && !(crossed && document.querySelector('[data-directory]'))) setEvaluated(today);
}

function setEvaluated(date: string): void {
  for (const time of document.querySelectorAll<HTMLTimeElement>('[data-evaluated-text]')) {
    const template = time.dataset.template;
    if (!template) continue;
    time.dateTime = date;
    time.textContent = template.replace('{date}', formatDate(date));
  }
}

document.addEventListener('edi:evaluated', event => setEvaluated((event as CustomEvent<string>).detail));

let today = utcToday();
applyDates(today);
function recheck(): void {
  const now = utcToday();
  if (now !== today) {
    today = now;
    applyDates(today);
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') recheck();
});
window.addEventListener('pageshow', recheck);
(function midnight() {
  window.setTimeout(() => {
    recheck();
    midnight();
  }, msUntilUtcMidnight() + 1000);
})();

// ---------------------------------------------------------------- preferences

const THEME_KEY = 'edi-theme';
const themeSelects = [...document.querySelectorAll<HTMLSelectElement>('select[data-theme-select]')];
let savedTheme = 'system';
try {
  savedTheme = localStorage.getItem(THEME_KEY) ?? 'system';
} catch {
  // Storage disabled: the system theme applies.
}
for (const select of themeSelects) {
  select.value = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'system';
  select.addEventListener('change', () => {
    const value = select.value;
    for (const other of themeSelects) other.value = value;
    if (value === 'light' || value === 'dark') root.setAttribute('data-theme', value);
    else root.removeAttribute('data-theme');
    try {
      if (value === 'light' || value === 'dark') localStorage.setItem(THEME_KEY, value);
      else localStorage.removeItem(THEME_KEY);
    } catch {
      // Preference is not saved; the choice still applies to this page.
    }
  });
}

/**
 * Points a language link at the same search, filters, comparison or section
 * in the other language. It runs before the link is used in any way: a
 * click, a middle click, the context menu (open in a new tab, copy the
 * link) or keyboard focus.
 */
function followAddress(event: Event): HTMLAnchorElement | null {
  const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-lang]') : null;
  if (!link) return null;
  link.search = location.search;
  link.hash = location.hash;
  return link;
}
for (const type of ['pointerdown', 'focusin', 'contextmenu']) document.addEventListener(type, followAddress);

document.addEventListener('click', event => {
  const link = followAddress(event);
  if (!link) return;
  try {
    // Remembered in this browser only, to choose the language when someone opens the bare site root.
    localStorage.setItem('edi-lang', link.dataset.lang ?? '');
  } catch {
    // Not remembered; the link still opens that language.
  }
});

// ---------------------------------------------------------------- menus

const menus = [...document.querySelectorAll<HTMLDetailsElement>('details[data-menu]')];
for (const menu of menus) {
  menu.addEventListener('toggle', () => {
    if (menu.open) for (const other of menus) if (other !== menu) other.open = false;
  });
}
document.addEventListener('click', event => {
  for (const menu of menus) if (menu.open && !menu.contains(event.target as Node)) menu.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  for (const menu of menus)
    if (menu.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
});

// ---------------------------------------------------------------- copy

document.addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLButtonElement>('button[data-copy]');
  if (!button) return;
  const value = button.dataset.copy ?? '';
  const label = button.querySelector<HTMLElement>('[data-copy-label]');
  void navigator.clipboard?.writeText(value).then(() => {
    if (!label) return;
    const before = label.textContent;
    label.textContent = button.dataset.copied ?? before;
    window.setTimeout(() => (label.textContent = before), 1600);
  });
});

// ---------------------------------------------------------------- EDI guide

document.addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLButtonElement>('button[data-guide]');
  if (!button) return;
  event.preventDefault();
  void import('./guide.tsx').then(module => module.openGuide(button));
});
