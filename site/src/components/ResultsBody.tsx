/**
 * The directory's result area: other matching groups, the object rows and
 * the pager. Shared by the server render and the island.
 */
import type {Messages} from '../i18n/en.ts';
import {fmt} from '../i18n/format.ts';
import type {DirectoryResult} from '../model/directory.ts';
import {ResultList, type RowContext, Highlighted} from './ResultList.tsx';

export type ResultsMessages = RowContext['m'] & Pick<Messages, 'subjects'>;

export interface BodyContext extends RowContext {
  m: ResultsMessages;
  storyHref: (slug: string) => string;
  pageHref: (page: number) => string;
  clearHref: string;
  objectName: (id: string) => string;
}

function pageList(page: number, pages: number): (number | null)[] {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter(n => n >= 1 && n <= pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((n, index) => {
    if (index && n - sorted[index - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}

export function Pager({result, ctx}: {result: Pick<DirectoryResult, 'page' | 'pages' | 'total'>; ctx: BodyContext}) {
  if (result.pages <= 1) return null;
  const {m} = ctx;
  const from = (result.page - 1) * 30 + 1;
  const to = Math.min(result.total, result.page * 30);
  return (
    <nav className="pager" aria-label={m.directory.pagination}>
      <p className="pager-status">{fmt(m.directory.showing, {from, to, total: result.total})}</p>
      <ul className="pager-pages">
        {result.page > 1 ? (
          <li>
            <a href={ctx.pageHref(result.page - 1)} rel="prev" data-page={result.page - 1}>
              {m.directory.previous}
            </a>
          </li>
        ) : null}
        {pageList(result.page, result.pages).map((n, index) =>
          n === null ? (
            <li key={`gap-${index}`} aria-hidden="true">
              <span>…</span>
            </li>
          ) : (
            <li key={n}>
              {n === result.page ? (
                <span aria-current="page">
                  <span className="sr-only">{fmt(m.directory.page, {page: n})}</span>
                  <span aria-hidden="true">{n}</span>
                </span>
              ) : (
                <a href={ctx.pageHref(n)} data-page={n} aria-label={fmt(m.directory.page, {page: n})}>
                  {n}
                </a>
              )}
            </li>
          ),
        )}
        {result.page < result.pages ? (
          <li>
            <a href={ctx.pageHref(result.page + 1)} rel="next" data-page={result.page + 1}>
              {m.directory.next}
            </a>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

export function ResultsBody({result, ctx}: {result: DirectoryResult; ctx: BodyContext}) {
  const {m} = ctx;
  return (
    <>
      {result.stories.length || result.subjects.length ? (
        <div className="side-groups">
          {result.stories.length ? (
            <section className="side-group" aria-labelledby="group-stories">
              <h2 id="group-stories">{m.directory.stories}</h2>
              <ul className="mini-list">
                {result.stories.map(({item, match}) => (
                  <li key={item.id}>
                    <p className="mini-title">
                      <a href={ctx.storyHref(item.slug)}>{item.title}</a>
                    </p>
                    <p className="mini-line">{match.snippet && match.snippet.field !== 'title' ? <Highlighted snippet={match.snippet} /> : item.dek}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {result.subjects.length ? (
            <section className="side-group" aria-labelledby="group-context">
              <h2 id="group-context">{m.directory.context}</h2>
              <ul className="mini-list">
                {result.subjects.map(({item}) => (
                  <li key={item.id}>
                    <p className="mini-title">
                      {item.name} <span className="not-assessed">{m.subjects.notAssessed}</span>
                    </p>
                    <p className="mini-line">
                      {m.subjects[item.kind]}: {item.description}
                      {item.outsideEthereum ? ` ${m.subjects.outsideEthereum}.` : ''}
                    </p>
                    {item.relatedId ? (
                      <p className="mini-line">{fmt(m.subjects.relatedRecord, {name: ctx.objectName(item.relatedId)})}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
      {result.total === 0 ? (
        <div className="results-empty">
          <p>
            <strong>{m.directory.noResults}</strong>
          </p>
          <p className="muted">{m.directory.noResultsHint}</p>
          <p>
            <a href={ctx.clearHref} data-clear="all">
              {m.directory.clearAll}
            </a>
          </p>
        </div>
      ) : (
        <ResultList hits={result.objects} groups={result.groups} ctx={ctx} />
      )}
      <Pager result={result} ctx={ctx} />
    </>
  );
}
