/**
 * The compare island. The page is built once; the island reads ?ids= (and
 * the add, pair and layout controls) from the address, loads the directory
 * index and the compare data file, and draws the comparison for the reader's
 * UTC date. Its links and forms stay ordinary GET links and forms; the island
 * follows them in place and keeps one canonical address, so Back, refresh
 * and shared links restore the same comparison.
 */
import {useCallback, useEffect, useLayoutEffect, useMemo, useState, type MouseEvent, type ReactNode, type SubmitEvent} from 'react';
import {LIMITS, PRODUCT, type Locale} from '../config.ts';
import {andList, fmt} from '../i18n/format.ts';
import {fetchSiteJson} from '../client/fetch.ts';
import {Comparison, type CompareMessages, type CompareRecord} from '../components/Comparison.tsx';
import {compareObservations, parseCompareParams, type CompareData} from '../model/compare.ts';
import {findObject} from '../model/routing.ts';
import {paths} from '../model/urls.ts';
import {segmentAt, type DirectoryIndex} from '../model/view-types.ts';
import {Fallback} from './fallback.tsx';
import {useReturnPlace} from './use-return-place.ts';
import {useUtcDate} from './use-utc-date.ts';

export type CompareAppMessages = CompareMessages;

export interface CompareAppProps {
  locale: Locale;
  m: CompareAppMessages;
  /** The page title when nothing is compared. */
  title: string;
  /** The UTC date the build evaluated EDI for. */
  evaluatedFor: string;
  indexUrl: string;
  dataUrl: string;
  /** Where a comparison starts: suggestions, and the no-script note. */
  children?: ReactNode;
}

interface Loaded {
  index: DirectoryIndex;
  data: CompareData;
}

/** Whether an address asks for a comparison (rather than the page's starting point). */
function asksToCompare(params: URLSearchParams): boolean {
  return params.getAll('ids').some(value => value.trim() !== '') || (params.get('add') ?? '').trim() !== '';
}

export default function CompareApp(props: CompareAppProps) {
  return (
    <Fallback built={props.children}>
      <Compare {...props} />
    </Fallback>
  );
}

function Compare(props: CompareAppProps) {
  const {locale, m} = props;
  const home = paths.compare(locale);
  /** The address's query string; null until the island has read it, so its first render matches the built page. */
  const [search, setSearch] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const today = useUtcDate(props.evaluatedFor);

  useEffect(() => {
    const read = () => setSearch(location.search);
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);

  useLayoutEffect(() => {
    if (search !== null) document.documentElement.removeAttribute('data-query');
  }, [search]);

  const params = useMemo(() => (search === null ? null : new URLSearchParams(search)), [search]);
  const wanted = params !== null && asksToCompare(params);

  /** The active locale's index and compare data, loaded once per page (see client/fetch.ts). */
  const load = useCallback(() => {
    setFailed(false);
    setLoading(true);
    Promise.all([fetchSiteJson<DirectoryIndex>(props.indexUrl), fetchSiteJson<CompareData>(props.dataUrl)])
      .then(([index, data]) => {
        if (!Array.isArray(index.entries) || !Array.isArray(data.observations)) throw new Error('Unexpected data format');
        setLoaded({index, data});
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [props.indexUrl, props.dataUrl]);

  useEffect(() => {
    if (wanted && !loaded && !loading && !failed) load();
  }, [wanted, loaded, loading, failed, load]);

  // An EDI ID or a profile slug (current, earlier `--` form, or capitalized) names a record; names never do.
  const parsed = useMemo(() => {
    if (!params || !loaded || !wanted) return null;
    return parseCompareParams(params, value => findObject(value, loaded.index.entries)?.id, LIMITS.compare);
  }, [params, loaded, wanted]);

  // One canonical address per comparison, so a refresh or a shared link shows the same thing. An
  // address with names that are not records, or too many, keeps them, so a refresh still explains them.
  useEffect(() => {
    if (!parsed || parsed.unknown.length || parsed.truncated) return;
    const canonical = `${home}${parsed.canonical ? `?${parsed.canonical}` : ''}`;
    if (`${location.pathname}${location.search}` !== canonical) history.replaceState(history.state, '', canonical);
  }, [parsed, home]);

  const comparison = useMemo(() => {
    if (!parsed || !loaded) return null;
    const {index, data} = loaded;
    const networkNames = new Map([...index.entries.map(entry => [entry.id, entry.name] as const), ...index.networks.map(network => [network.id, network.name] as const)]);
    const records: CompareRecord[] = parsed.ids.map(id => {
      const entry = index.entries.find(item => item.id === id)!;
      return {
        id,
        slug: entry.slug,
        name: entry.name,
        kind: entry.kind,
        ...(entry.role ? {role: entry.role} : {}),
        scope: entry.scope,
        networks: entry.networks.map(network => networkNames.get(network) ?? network),
        controls: entry.controls,
        limits: data.limits[id] ?? [],
        reviewedAt: entry.reviewedAt,
        state: segmentAt(entry.states, today),
      };
    });
    const choices = index.entries.map(({id, name, kind}) => ({id, name, kind})).sort((a, b) => a.name.localeCompare(b.name, 'en'));
    return {records, choices, observations: compareObservations(parsed.ids, data.observations)};
  }, [parsed, loaded, today]);

  // The tab title names what is compared, and a comparison is not a page to index.
  useEffect(() => {
    if (search === null) return;
    const names = comparison?.records.map(record => record.name) ?? [];
    document.title = names.length ? `${m.compare.title}${m.common.labelSeparator}${andList(names, locale)} · ${PRODUCT.name}` : props.title;
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (wanted) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.name = 'robots';
        robots.content = 'noindex';
        document.head.append(robots);
      }
    } else robots?.remove();
  }, [search, wanted, comparison, m, locale, props.title]);

  /** Follows a compare address in place, as a page load would: a new history entry, the top of the page, focus at the start of the content. */
  const go = (url: URL) => {
    const next = `${url.pathname}${url.search}`;
    // The address already shown adds no entry, or Back would seem to do nothing.
    if (next === `${location.pathname}${location.search}`) history.replaceState(history.state, '', next);
    else history.pushState(history.state, '', next);
    setSearch(url.search);
    window.scrollTo({top: 0});
    document.getElementById('main')?.focus({preventScroll: true});
  };

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!link || link.target) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== home) return;
    event.preventDefault();
    go(url);
  };

  const onSubmit = (event: SubmitEvent<HTMLDivElement>) => {
    const form = event.target as HTMLFormElement;
    const url = new URL(form.action, location.href);
    if (event.defaultPrevented || form.method.toLowerCase() !== 'get' || url.origin !== location.origin || url.pathname !== home) return;
    event.preventDefault();
    const query = new URLSearchParams();
    new FormData(form).forEach((value, key) => query.append(key, String(value)));
    url.search = query.toString();
    go(url);
  };

  // Back to a page loaded afresh returns to the same place in the comparison once it is drawn.
  useReturnPlace(search !== null && (!wanted || comparison !== null || failed));

  let body: ReactNode;
  if (!wanted) body = props.children;
  else if (failed)
    body = (
      <p className="notice notice-warn" role="alert">
        {m.compare.failed}{' '}
        <button type="button" className="button button-quiet" onClick={load}>
          {m.common.retry}
        </button>
      </p>
    );
  else if (!parsed || !comparison)
    body = (
      <p className="compare-loading" role="status">
        {m.compare.loading}
      </p>
    );
  else
    body = (
      <>
        {parsed.unknown.length ? (
          <p className="notice notice-warn" role="status">
            {fmt(m.compare.unknownIds, {ids: parsed.unknown.join(m.common.listSeparator)})}
          </p>
        ) : null}
        {parsed.truncated ? (
          <p className="notice notice-warn" role="status">
            {fmt(m.compare.tooMany, {max: LIMITS.compare})}
          </p>
        ) : null}
        {comparison.records.length ? (
          <Comparison locale={locale} m={m} records={comparison.records} observations={comparison.observations} view={parsed.view} choices={comparison.choices} />
        ) : (
          props.children
        )}
      </>
    );

  return (
    <div className="compare-app" onClick={onClick} onSubmit={onSubmit} aria-busy={wanted && !parsed && !failed ? true : undefined}>
      {body}
    </div>
  );
}
