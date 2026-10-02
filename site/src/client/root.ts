/**
 * The language-neutral root: goes to the directory in the reader's language,
 * keeping any query and fragment. A language chosen on this site wins, then
 * the browser's languages (model/routing.ts), then English.
 */
import {negotiateLocale} from '../model/routing.ts';
import {paths} from '../model/urls.ts';

const KEY = 'edi-lang';

function remembered(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

document.addEventListener('click', event => {
  const code = (event.target as Element).closest<HTMLAnchorElement>('a[data-lang]')?.dataset.lang;
  try {
    if (code) localStorage.setItem(KEY, code);
  } catch {
    // Not remembered; the link still opens that language.
  }
});

const locale = negotiateLocale(remembered(), navigator.languages?.join(',') ?? navigator.language);
location.replace(`${paths.home(locale)}${location.search}${location.hash}`);
