/**
 * The directory island: search, filters, sort, paging and the comparison
 * selection, all reflected in the URL. The server renders the same controls
 * and results, so the page works without JavaScript (a native GET form, links
 * for paging, and a CSS :target sheet for filters on phones). Once the small
 * same-origin index has loaded, every change is computed locally with the same
 * code the server uses.
 *
 * @cc [label:product] restoration-without-side-effects
 * Enter commits a history entry and continuous typing coalesces into one.
 * Filter and sort changes are discrete entries; Back restores them, and the
 * phone filter sheet closes on Back without losing what was chosen. Nothing
 * here performs a financial action or contacts a third party.
 */
import {useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent, type MouseEvent, type ReactNode} from 'react';
import {LIMITS, type Locale} from '../config.ts';
import type {Role} from '../content/vocab.ts';
import {fmt, formatDate, plural} from '../i18n/format.ts';
import type {Messages} from '../i18n/en.ts';
import {runDirectory, type DirectoryResult, type Facets} from '../model/directory.ts';
import {
  effectiveSort,
  EMPTY_QUERY,
  filterCount,
  NETWORK_NONE,
  parseDirectoryQuery,
  REVIEW_FILTERS,
  serializeDirectoryQuery,
  SORTS,
  toggled,
  type DirectoryQuery,
  type QueryParam,
  type Sort,
} from '../model/query.ts';
import {prepareIndex, type PreparedIndex} from '../model/search.ts';
import {D_LEVELS, KINDS, type DirectoryIndex, type DLevel} from '../model/view-types.ts';
import {utcToday, msUntilUtcMidnight} from '../model/dates.ts';
import {CloseIcon, FilterIcon, SearchIcon} from '../components/Icons.tsx';
import {ResultsBody, type BodyContext, type ResultsMessages} from '../components/ResultsBody.tsx';

export type DirectoryAppMessages = ResultsMessages & Pick<Messages, 'edition'>;

export interface DirectoryAppProps {
  locale: Locale;
  m: DirectoryAppMessages;
  query: DirectoryQuery;
  invalid: QueryParam[];
  /** The UTC date the server evaluated EDI for. */
  serverDate: string;
  /** Dates on which some EDI result changes. */
  changeDates: string[];
  summary: Pick<DirectoryResult, 'total' | 'page' | 'pages' | 'sort'> & {facets: Facets};
  networks: {id: string; name: string}[];
  roles: Role[];
  showRoles: boolean;
  chainNames: Record<number, string>;
  /** Names of the objects in the comparison selection, for the tray before the index loads. */
  compareNames: Record<string, string>;
  indexUrl: string;
  entrances?: ReactNode;
  children?: ReactNode;
}

type HistoryMode = 'push' | 'replace' | 'replace-later';

const RETURN_KEY = 'edi-directory-return';

function changedBetween(changeDates: readonly string[], from: string, to: string): boolean {
  return changeDates.some(date => date > from && date <= to);
}

export default function DirectoryApp(props: DirectoryAppProps) {
  const {locale, m} = props;
  const home = `/${locale}/`;
  const [query, setQuery] = useState<DirectoryQuery>(props.query);
  const [index, setIndex] = useState<{raw: DirectoryIndex; prepared: PreparedIndex} | null>(null);
  const [indexFailed, setIndexFailed] = useState(false);
  const [taken, setTaken] = useState(false);
  const [today, setToday] = useState(props.serverDate);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const queryRef = useRef(query);
  queryRef.current = query;
  const indexRef = useRef(index);
  indexRef.current = index;
  const historyMode = useRef<HistoryMode | null>(null);
  const typing = useRef(false);
  const sheetRef = useRef(false);
  const replaceTimer = useRef<number | undefined>(undefined);
  const loading = useRef<Promise<void> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const sheetElement = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLAnchorElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const urlFor = useCallback((value: DirectoryQuery) => {
    const search = serializeDirectoryQuery(value);
    return `${home}${search ? `?${search}` : ''}`;
  }, [home]);

  // ---------------------------------------------------------------- index

  const ensureIndex = useCallback((): Promise<void> => {
    if (indexRef.current) return Promise.resolve();
    if (loading.current) return loading.current;
    loading.current = fetch(props.indexUrl, {credentials: 'same-origin'})
      .then(response => {
        if (!response.ok) throw new Error(`Index request failed: ${response.status}`);
        return response.json() as Promise<DirectoryIndex>;
      })
      .then(raw => {
        if (raw.version !== 1 || !Array.isArray(raw.entries)) throw new Error('Unexpected index format');
        const networkNames = new Map(raw.networks.map(network => [network.id, network.name]));
        const storyTitles = new Map(raw.stories.map(story => [story.id, story.title]));
        const objectNames = new Map(raw.entries.map(entry => [entry.id, entry.name]));
        const prepared = prepareIndex(raw, {
          role: role => m.roles[role as Role] ?? role,
          kind: kind => m.kinds[kind as keyof typeof m.kinds] ?? kind,
          network: id => networkNames.get(id) ?? id,
          story: id => storyTitles.get(id) ?? id,
          object: id => objectNames.get(id) ?? id,
        });
        setIndex({raw, prepared});
      })
      .catch(() => {
        loading.current = null;
        setIndexFailed(true);
      });
    return loading.current;
  }, [props.indexUrl, m]);

  useEffect(() => {
    void ensureIndex();
  }, [ensureIndex]);

  // EDI results for today, when the server evaluated an earlier date and a review fell due since.
  useEffect(() => {
    if (!index || today === props.serverDate) return;
    if (changedBetween(props.changeDates, props.serverDate, today)) setTaken(true);
    document.dispatchEvent(new CustomEvent('edi:evaluated', {detail: today}));
  }, [index, today, props.changeDates, props.serverDate]);

  useEffect(() => {
    const now = utcToday();
    if (now !== today) setToday(now);
    let timer = window.setTimeout(function tick() {
      setToday(utcToday());
      timer = window.setTimeout(tick, msUntilUtcMidnight() + 1000);
    }, msUntilUtcMidnight() + 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') setToday(utcToday());
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const live = useMemo(() => (index && taken ? runDirectory(index.prepared, query, today, locale) : null), [index, taken, query, today, locale]);
  const summary = live ?? props.summary;
  const facets = live?.facets ?? props.summary.facets;

  // ---------------------------------------------------------------- history

  const update = useCallback(
    (next: DirectoryQuery, mode: HistoryMode) => {
      historyMode.current = mode;
      setQuery(next);
      setTaken(true);
      void ensureIndex();
    },
    [ensureIndex],
  );

  useEffect(() => {
    const mode = historyMode.current;
    if (!mode) return;
    historyMode.current = null;
    const url = urlFor(query);
    const write = (kind: 'push' | 'replace') => {
      if (`${location.pathname}${location.search}` === url) return;
      if (kind === 'push') history.pushState(history.state, '', url);
      else history.replaceState(history.state, '', url);
    };
    window.clearTimeout(replaceTimer.current);
    if (mode === 'replace-later') replaceTimer.current = window.setTimeout(() => write('replace'), 250);
    else write(mode);
  }, [query, urlFor]);

  useEffect(() => {
    const validators = {
      network: (id: string) => props.networks.some(network => network.id === id),
      object: (id: string) => !indexRef.current || indexRef.current.raw.entries.some(entry => entry.id === id),
    };
    const onPop = () => {
      if (sheetRef.current) {
        // Back closes the filter sheet and keeps what was chosen in it.
        sheetRef.current = false;
        setSheetOpen(false);
        history.replaceState(history.state, '', urlFor(queryRef.current));
        toggleRef.current?.focus();
        return;
      }
      const {query: next} = parseDirectoryQuery(new URLSearchParams(location.search), validators);
      if (serializeDirectoryQuery(next) === serializeDirectoryQuery(queryRef.current)) return;
      typing.current = false;
      historyMode.current = null;
      if (!indexRef.current) {
        location.reload();
        return;
      }
      setQuery(next);
      setTaken(true);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [props.networks, urlFor]);

  // Back from an object page returns focus to the row that was opened.
  useEffect(() => {
    const restore = () => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(RETURN_KEY) ?? 'null') as {path: string; id: string} | null;
        if (!saved || saved.path !== `${location.pathname}${location.search}`) return;
        const row = [...document.querySelectorAll<HTMLElement>('.row[data-id]')].find(element => element.dataset.id === saved.id);
        row?.querySelector<HTMLAnchorElement>('.row-name a')?.focus({preventScroll: true});
      } catch {
        // Storage can be unavailable; restoring focus is a convenience.
      }
    };
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === 'back_forward') restore();
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) restore();
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  // A polite, debounced announcement of the result count for screen readers.
  useEffect(() => {
    if (!live) return;
    const timer = window.setTimeout(() => setAnnouncement(plural(live.total, locale, m.directory.results)), 600);
    return () => window.clearTimeout(timer);
  }, [live, locale, m]);

  // ---------------------------------------------------------------- sheet

  const openSheet = (event: MouseEvent) => {
    if (window.matchMedia('(min-width: 960px)').matches) return;
    event.preventDefault();
    history.pushState({ediSheet: true}, '', location.href);
    sheetRef.current = true;
    setSheetOpen(true);
  };
  const closeSheet = () => {
    if (sheetRef.current) history.back();
  };
  useEffect(() => {
    if (!sheetOpen) return;
    const panel = sheetElement.current;
    panel?.querySelector<HTMLElement>('h2')?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);
  const onSheetKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!sheetOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSheet();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...(sheetElement.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, [tabindex="0"]') ?? [])].filter(
      element => element.offsetParent !== null,
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  // ---------------------------------------------------------------- handlers

  const listMode: HistoryMode = sheetOpen ? 'replace' : 'push';

  const onQueryInput = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.slice(0, LIMITS.query);
    const mode: HistoryMode = typing.current ? 'replace-later' : 'push';
    typing.current = true;
    update({...queryRef.current, q: value.trim() ? value : '', page: 1}, mode);
  };
  const onSubmit = (event: FormEvent) => {
    if (!index && indexFailed) return; // Let the browser submit the form.
    event.preventDefault();
    typing.current = false;
    update({...queryRef.current, q: queryRef.current.q.trim().replace(/\s+/g, ' ')}, 'replace');
    if (sheetRef.current) closeSheet();
  };
  const toggle = <K extends 'role' | 'kind' | 'network' | 'grade' | 'review'>(key: K, value: DirectoryQuery[K][number]) => {
    typing.current = false;
    update(toggled(queryRef.current, key, value), listMode);
  };
  const setField = (patch: Partial<DirectoryQuery>) => {
    typing.current = false;
    update({...queryRef.current, ...patch, page: patch.page ?? 1}, listMode);
  };
  const clearFilters = (event?: MouseEvent) => {
    event?.preventDefault();
    setField({role: [], kind: [], network: [], grade: [], atleast: null, review: [], story: false});
  };
  const toggleCompare = async (id: string) => {
    await ensureIndex();
    const current = queryRef.current.compare;
    const next = current.includes(id) ? current.filter(item => item !== id) : current.length < LIMITS.compare ? [...current, id] : current;
    historyMode.current = 'replace';
    setQuery({...queryRef.current, compare: next});
    setTaken(true);
  };

  const onResultsClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const compare = target.closest<HTMLElement>('[data-compare]');
    if (compare) {
      event.preventDefault();
      void toggleCompare(compare.dataset.compare!);
      return;
    }
    const pageLink = target.closest<HTMLAnchorElement>('a[data-page]');
    if (pageLink && index && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      typing.current = false;
      update({...queryRef.current, page: Number(pageLink.dataset.page)}, 'push');
      resultsRef.current?.scrollIntoView({block: 'start'});
      document.getElementById('results-title')?.focus({preventScroll: true});
      return;
    }
    const clear = target.closest<HTMLAnchorElement>('a[data-clear]');
    if (clear && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      update({...EMPTY_QUERY, compare: queryRef.current.compare}, 'push');
      return;
    }
    const row = target.closest<HTMLElement>('.row[data-id]');
    if (row && target.closest('a')) {
      try {
        sessionStorage.setItem(RETURN_KEY, JSON.stringify({path: `${location.pathname}${location.search}`, id: row.dataset.id}));
      } catch {
        // Ignore: storage may be disabled.
      }
    }
  };

  // ---------------------------------------------------------------- render

  const networkNames = useMemo(() => Object.fromEntries(props.networks.map(network => [network.id, network.name])), [props.networks]);
  const names = useMemo(() => {
    if (!index) return props.compareNames;
    return Object.fromEntries(index.raw.entries.map(entry => [entry.id, entry.name]));
  }, [index, props.compareNames]);
  const ctx: BodyContext = {
    locale,
    m,
    networkNames,
    chainNames: props.chainNames,
    objectHref: slug => `/${locale}/objects/${slug}`,
    storyHref: slug => `/${locale}/stories/${slug}`,
    pageHref: page => urlFor({...query, page}),
    clearHref: urlFor({...EMPTY_QUERY, compare: query.compare}),
    objectName: id => names[id] ?? id,
    compare: query.compare,
    compareMax: LIMITS.compare,
  };

  const sort = effectiveSort(query);
  const activeFilters = filterCount(query);
  const count = plural(summary.total, locale, m.directory.results);
  const stale = !live && changedBetween(props.changeDates, props.serverDate, today);
  const nextChange = props.changeDates.find(date => date > props.serverDate);

  const chip = (label: string, next: DirectoryQuery, key: string) => (
    <li key={key}>
      <a
        className="chip-button"
        href={urlFor(next)}
        onClick={event => {
          event.preventDefault();
          update(next, 'push');
        }}
      >
        {label} <CloseIcon width={14} height={14} />
        <span className="sr-only">{` (${m.directory.clear})`}</span>
      </a>
    </li>
  );
  const chips = [
    ...query.kind.map(kind => chip(m.kinds[kind], toggled(query, 'kind', kind), `kind-${kind}`)),
    ...query.role.map(role => chip(m.roles[role], toggled(query, 'role', role), `role-${role}`)),
    ...query.network.map(network =>
      chip(network === NETWORK_NONE ? m.directory.networkUnrecorded : (networkNames[network] ?? network), toggled(query, 'network', network), `network-${network}`),
    ),
    ...query.grade.map(level => chip(fmt(m.directory.gradeOption, {label: `D${level}`}), toggled(query, 'grade', level), `grade-${level}`)),
    ...(query.atleast !== null ? [chip(fmt(m.directory.atLeastOption, {label: `D${query.atleast}`}), {...query, atleast: null, page: 1}, 'atleast')] : []),
    ...query.review.map(review => chip(reviewLabel(review, m), toggled(query, 'review', review), `review-${review}`)),
    ...(query.story ? [chip(m.directory.story, {...query, story: false, page: 1}, 'story')] : []),
  ];

  const option = (
    key: 'role' | 'kind' | 'network' | 'review',
    value: string,
    label: string,
    countValue: number | undefined,
    checked: boolean,
  ) => (
    <label className={`option${!countValue && !checked ? ' is-empty' : ''}`} key={`${key}-${value}`}>
      <input type="checkbox" name={key} value={value} checked={checked} onChange={() => toggle(key, value as never)} />
      <span className="option-label">{label}</span>
      <span className="option-count">{countValue ?? 0}</span>
    </label>
  );

  return (
    <form ref={formRef} method="get" action={home} className="directory" onSubmit={onSubmit} noValidate data-directory="">
      <div className="directory-top">
        <div className="search" role="search">
          <label htmlFor="directory-q" className="sr-only">
            {m.directory.searchLabel}
          </label>
          <div className="search-field">
            <SearchIcon />
            <input
              id="directory-q"
              type="search"
              name="q"
              value={query.q}
              onChange={onQueryInput}
              onFocus={() => void ensureIndex()}
              placeholder={m.directory.searchPlaceholder}
              maxLength={LIMITS.query}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
            />
          </div>
          <button className="button" type="submit">
            {m.directory.searchButton}
          </button>
        </div>
        {props.entrances}
        {props.invalid.length ? (
          <p className="notice notice-warn" role="note">
            {fmt(m.directory.invalidParams, {names: props.invalid.join(', ')})}
          </p>
        ) : null}
        {stale && indexFailed && nextChange ? (
          <p className="notice notice-warn">
            {fmt(m.edition.stale, {evaluated: formatDate(props.serverDate, locale), due: formatDate(nextChange, locale)})}{' '}
            <a href={urlFor(query)}>{m.edition.reload}</a>
          </p>
        ) : null}
      </div>

      <div className="workspace">
        <div
          ref={sheetElement}
          id="filters"
          className="filters"
          data-open={sheetOpen ? 'true' : undefined}
          role={sheetOpen ? 'dialog' : undefined}
          aria-modal={sheetOpen ? true : undefined}
          aria-labelledby="filters-title"
          onKeyDown={onSheetKey}
        >
          <div className="filters-head">
            <h2 id="filters-title" className="facet-title" tabIndex={-1}>
              {m.directory.filters}
            </h2>
            <a
              className="button button-quiet"
              href="#directory-results"
              onClick={event => {
                if (!sheetRef.current) return;
                event.preventDefault();
                closeSheet();
              }}
            >
              <CloseIcon />
              <span>{m.directory.close}</span>
            </a>
          </div>
          <div className="filters-body">
            <fieldset className="facet">
              <legend>{m.directory.kind}</legend>
              {KINDS.map(kind => option('kind', kind, m.kinds[kind], facets.kind[kind], query.kind.includes(kind)))}
            </fieldset>
            {props.showRoles ? (
              <fieldset className="facet">
                <legend>{m.directory.role}</legend>
                {props.roles.map(role => option('role', role, m.roles[role], facets.role[role], query.role.includes(role)))}
              </fieldset>
            ) : null}
            <fieldset className="facet">
              <legend>{m.directory.grade}</legend>
              <div className="facet-grades">
                {D_LEVELS.map(level => {
                  const n = facets.grade[level] ?? 0;
                  const checked = query.grade.includes(level);
                  return (
                    <label key={level} className={`grade-toggle${!n && !checked ? ' is-empty' : ''}`}>
                      <input type="checkbox" name="grade" value={`d${level}`} checked={checked} onChange={() => toggle('grade', level)} />
                      <span className={`grade grade-sm g${level}`} aria-hidden="true">
                        D{level}
                      </span>
                      <span className="option-count" aria-hidden="true">
                        {n}
                      </span>
                      <span className="sr-only">{`${fmt(m.directory.gradeOption, {label: `D${level}`})} (${n})`}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <fieldset className="facet">
              <legend>
                <label htmlFor="directory-atleast">{m.directory.atLeast}</label>
              </legend>
              <select
                id="directory-atleast"
                className="select"
                name="atleast"
                value={query.atleast === null ? '' : `d${query.atleast}`}
                onChange={event => setField({atleast: event.target.value ? (Number(event.target.value.slice(1)) as DLevel) : null})}
              >
                <option value="">{m.directory.any}</option>
                {D_LEVELS.filter(level => level > 0).map(level => (
                  <option key={level} value={`d${level}`}>
                    {`${fmt(m.directory.atLeastOption, {label: `D${level}`})} (${facets.atleast[level] ?? 0})`}
                  </option>
                ))}
              </select>
            </fieldset>
            <fieldset className="facet">
              <legend>{m.directory.review}</legend>
              {REVIEW_FILTERS.map(review => option('review', review, reviewLabel(review, m), facets.review[review], query.review.includes(review)))}
            </fieldset>
            <fieldset className="facet">
              <legend>{m.directory.network}</legend>
              {props.networks.map(network => option('network', network.id, network.name, facets.network[network.id], query.network.includes(network.id)))}
              {option('network', NETWORK_NONE, m.directory.networkUnrecorded, facets.network[NETWORK_NONE], query.network.includes(NETWORK_NONE))}
            </fieldset>
            <fieldset className="facet">
              <legend className="sr-only">{m.directory.story}</legend>
              <label className={`option${!facets.story && !query.story ? ' is-empty' : ''}`}>
                <input type="checkbox" name="story" value="1" checked={query.story} onChange={() => setField({story: !query.story})} />
                <span className="option-label">{m.directory.story}</span>
                <span className="option-count">{facets.story}</span>
              </label>
            </fieldset>
            <div className="filters-actions no-js-only">
              <button type="submit" className="button">
                {m.directory.searchButton}
              </button>
            </div>
          </div>
          <div className="filters-foot">
            <a className="button button-quiet" href={urlFor({...query, role: [], kind: [], network: [], grade: [], atleast: null, review: [], story: false, page: 1})} onClick={clearFilters}>
              {m.directory.clear}
            </a>
            <button
              type="submit"
              className="button"
              onClick={event => {
                if (!sheetRef.current) return;
                event.preventDefault();
                closeSheet();
              }}
            >
              {fmt(m.directory.apply, {count: summary.total})}
            </button>
          </div>
        </div>
        {sheetOpen ? <div className="scrim" onClick={closeSheet} aria-hidden="true" /> : null}

        <section className="results-area" aria-labelledby="results-title">
          <div className="results-head" ref={resultsRef}>
            <h2 id="results-title" className="results-count" tabIndex={-1}>
              {count}
            </h2>
            <div className="results-tools">
              <a ref={toggleRef} href="#filters" className="button button-quiet filters-toggle" onClick={openSheet} aria-haspopup="dialog">
                <FilterIcon />
                {activeFilters ? fmt(m.directory.filtersCount, {count: activeFilters}) : m.directory.filters}
              </a>
              <label htmlFor="directory-sort" className="sort-label">
                {m.directory.sort}
              </label>
              <select id="directory-sort" className="sort-select" name="sort" value={sort} onChange={event => setField({sort: event.target.value as Sort, page: 1})}>
                {SORTS.filter(value => value !== 'relevance' || query.q).map(value => (
                  <option key={value} value={value}>
                    {sortLabel(value, m)}
                  </option>
                ))}
              </select>
            </div>
            {sort === 'editorial' ? <p className="sort-note">{m.directory.sortEditorialNote}</p> : null}
            {sort === 'grade-asc' || sort === 'grade-desc' ? <p className="sort-note">{m.directory.sortGradeNote}</p> : null}
          </div>
          {chips.length ? (
            <ul className="active-filters" aria-label={m.directory.filters}>
              {chips}
              {chips.length > 1 ? (
                <li>
                  <a className="chip-button" href={urlFor({...query, role: [], kind: [], network: [], grade: [], atleast: null, review: [], story: false, page: 1})} onClick={clearFilters}>
                    {m.directory.clearAll}
                  </a>
                </li>
              ) : null}
            </ul>
          ) : null}
          <div id="directory-results" className="results-body" onClick={onResultsClick}>
            {live ? <ResultsBody result={live} ctx={ctx} /> : props.children}
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {announcement}
          </p>
          {query.compare.map(id => (
            <input key={id} type="hidden" name="compare" value={id} />
          ))}
          {query.compare.length ? (
            <div className="tray" role="region" aria-label={fmt(m.directory.compareTray, {count: query.compare.length, max: LIMITS.compare})}>
              <p className="tray-names">
                <strong>{fmt(m.directory.compareTray, {count: query.compare.length, max: LIMITS.compare})}</strong>
                {': '}
                {query.compare.map(id => names[id] ?? id).join(', ')}
              </p>
              <button type="button" className="button tray-clear" onClick={() => void toggleCompareClear()}>
                {m.directory.clear}
              </button>
              <a className="button" href={`/${locale}/compare?ids=${query.compare.join(',')}`}>
                {m.directory.compareGo}
              </a>
            </div>
          ) : null}
        </section>
      </div>
    </form>
  );

  function toggleCompareClear() {
    historyMode.current = 'replace';
    setQuery({...queryRef.current, compare: []});
  }
}

function reviewLabel(review: (typeof REVIEW_FILTERS)[number], m: DirectoryAppMessages): string {
  switch (review) {
    case 'complete':
      return m.directory.reviewComplete;
    case 'partial':
      return m.directory.reviewPartial;
    case 'unknown':
      return m.directory.reviewUnknown;
    case 'overdue':
      return m.directory.reviewOverdue;
    case 'permanent':
      return m.directory.reviewPermanent;
  }
}

function sortLabel(sort: Sort, m: DirectoryAppMessages): string {
  switch (sort) {
    case 'relevance':
      return m.directory.sortRelevance;
    case 'editorial':
      return m.directory.sortEditorial;
    case 'name':
      return m.directory.sortName;
    case 'reviewed':
      return m.directory.sortReviewed;
    case 'grade-asc':
      return m.directory.sortGradeAsc;
    case 'grade-desc':
      return m.directory.sortGradeDesc;
  }
}
