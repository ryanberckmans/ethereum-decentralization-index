/**
 * The compare page as built: its heading and where a comparison starts.
 * The comparison itself is drawn in the browser by the compare island
 * (islands/CompareApp.tsx with components/Comparison.tsx), from the address
 * and the site's own data files.
 */
import type {Locale} from '../config.ts';
import {messages} from '../i18n/index.ts';
import type {CompareAppMessages} from '../islands/CompareApp.tsx';
import {encodeValue} from '../model/query.ts';
import {paths} from '../model/urls.ts';
import {catalog} from '../server/site.ts';
import {Crumbs, type PageEnv} from './Editorial.tsx';

/** Curated starting points; each is a set of exact EDI records. */
export const SUGGESTIONS: readonly (readonly string[])[] = [
  ['usdc', 'weth9'],
  ['native-eth', 'weth9'],
  ['uniswap-v2', 'uniswap-v3', 'uniswap-v4'],
  ['weth9', 'seaport-v1.6'],
  ['ethereum', 'base'],
  ['morpho-blue', 'aave-v4'],
];

/** The strings the compare island needs, and nothing else. */
export function compareMessages(locale: Locale): CompareAppMessages {
  const m = messages(locale);
  return {
    compare: m.compare,
    grade: m.grade,
    roles: m.roles,
    kinds: m.kinds,
    kindsPlural: m.kindsPlural,
    common: m.common,
    observation: m.observation,
    directory: {networkUnrecorded: m.directory.networkUnrecorded, compareFull: m.directory.compareFull},
  };
}

export function CompareHead({env}: {env: PageEnv}) {
  const {m, locale} = env;
  return (
    <header className="page-head">
      <Crumbs env={env} items={[{label: m.nav.directory, href: paths.home(locale)}, {label: m.compare.title}]} />
      <h1>{m.compare.title}</h1>
      <p className="lede">{m.compare.intro}</p>
    </header>
  );
}

/** Suggested comparisons, shown until the reader chooses objects; without scripts, a note that comparing needs them. */
export function CompareStart({env}: {env: PageEnv}) {
  const {m, locale} = env;
  return (
    <>
      <section className="section compare-start js-only" aria-labelledby="suggestions-title">
        <h2 id="suggestions-title">{m.compare.suggestions}</h2>
        <p className="section-note">{m.compare.empty}</p>
        <ul className="suggestions">
          {SUGGESTIONS.filter(set => set.every(id => catalog.object(id))).map(set => (
            <li key={set.join(',')}>
              <a href={`${paths.compare(locale)}?ids=${set.map(encodeValue).join(',')}`}>
                {set.map((id, i) => (
                  <span key={id}>
                    {i ? <span className="suggestion-and"> · </span> : null}
                    {catalog.nameOf(id)}
                  </span>
                ))}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <noscript>
        <p className="notice">
          {m.compare.noScript} <a href={paths.home(locale)}>{m.nav.directory}</a>
        </p>
      </noscript>
    </>
  );
}
