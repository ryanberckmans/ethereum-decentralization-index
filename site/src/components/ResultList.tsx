/**
 * Directory rows, rendered by the server for first paint and by the island
 * after a live search or filter change. Every row is a real link.
 */
import {Fragment} from 'react';
import type {Locale} from '../config.ts';
import {fmt} from '../i18n/format.ts';
import type {Messages} from '../i18n/en.ts';
import type {GradeGroup, ObjectHit} from '../model/directory.ts';
import type {Snippet} from '../model/search.ts';
import {GradeBadge, ReviewNote} from './Grade.tsx';
import {CheckIcon, PlusIcon, StoryIcon} from './Icons.tsx';

export type DirectoryMessages = Pick<Messages, 'directory' | 'grade' | 'kinds' | 'roles' | 'common'>;

export interface RowContext {
  locale: Locale;
  m: DirectoryMessages;
  networkNames: Readonly<Record<string, string>>;
  chainNames: Readonly<Record<number, string>>;
  objectHref: (slug: string) => string;
  compare: readonly string[];
  compareMax: number;
}

const TICKER = /^[A-Za-z0-9.$-]{2,10}$/;

function ticker(hit: ObjectHit): string | undefined {
  const {name, aliases} = hit.entry;
  return aliases.find(alias => TICKER.test(alias) && alias === alias.toUpperCase() && alias.toLowerCase() !== name.toLowerCase() && !name.includes(alias));
}

function fieldLabel(field: Snippet['field'], m: DirectoryMessages): string {
  const d = m.directory;
  switch (field) {
    case 'tags':
      return d.fieldTags;
    case 'role':
      return d.fieldRole;
    case 'summary':
      return d.fieldSummary;
    case 'story':
    case 'title':
    case 'dek':
      return d.fieldStory;
    case 'scope':
      return d.fieldScope;
    case 'controls':
      return d.fieldControls;
    case 'reason':
    case 'description':
      return d.fieldDescription;
    case 'kind':
    case 'network':
      return d.columns.kind;
    case 'alias':
      return d.fieldAlias;
    case 'id':
      return d.fieldId;
    default:
      return d.fieldName;
  }
}

export function Highlighted({snippet}: {snippet: Snippet}) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  snippet.marks.forEach(([start, end], index) => {
    if (start < at) return;
    if (start > at) parts.push(snippet.text.slice(at, start));
    parts.push(<mark key={index}>{snippet.text.slice(start, end)}</mark>);
    at = end;
  });
  if (at < snippet.text.length) parts.push(snippet.text.slice(at));
  return <>{parts}</>;
}

export function ResultRow({hit, ctx}: {hit: ObjectHit; ctx: RowContext}) {
  const {entry, state, match} = hit;
  const {m, locale} = ctx;
  const symbol = ticker(hit);
  const networks = entry.networks.map(id => ctx.networkNames[id] ?? id);
  const selected = ctx.compare.includes(entry.id);
  const full = !selected && ctx.compare.length >= ctx.compareMax;
  return (
    <li className="row" data-id={entry.id}>
      <div className="row-name">
        <a href={ctx.objectHref(entry.slug)}>{entry.name}</a>
        {symbol ? <span className="row-ticker">{symbol}</span> : null}
      </div>
      <p className={`row-summary${entry.ediSummary ? ' is-edi' : ''}`}>{entry.summary}</p>
      <div className="row-meta">
        {entry.role ? <span className="row-role">{m.roles[entry.role]}</span> : null}
        <span>{m.kinds[entry.kind]}</span>
        {networks.length ? <span>{fmt(m.directory.chains, {chains: networks.join(', ')})}</span> : null}
      </div>
      <div className="row-grade">
        <GradeBadge grade={state.mechanism} m={m} scope={m.grade.mechanism} />
        {state.position ? (
          <span className="review-note">
            {m.grade.position} <GradeBadge grade={state.position} m={m} scope={m.grade.position} size="sm" />
          </span>
        ) : null}
        <ReviewNote review={state.review} locale={locale} m={m} short />
      </div>
      <div className="row-extra">
        {entry.observation ? (
          <span className="row-obs">
            {entry.observation.metric}: <strong>{entry.observation.value}</strong>, {entry.observation.when}
            {entry.observation.scope ? ` (${entry.observation.scope})` : ''}
          </span>
        ) : null}
        <span className="row-flags">
          {entry.stories.length ? (
            <span className="flag flag-story">
              <StoryIcon />
              {m.directory.hasStory}
            </span>
          ) : null}
          {entry.edited ? <span className="flag">{m.directory.edited}</span> : <span className="flag flag-basic">{m.directory.basic}</span>}
        </span>
        <button
          type="button"
          className="compare-toggle"
          data-compare={entry.id}
          aria-pressed={selected}
          disabled={full}
          title={full ? fmt(m.directory.compareFull, {max: ctx.compareMax}) : undefined}
        >
          {selected ? <CheckIcon /> : <PlusIcon />}
          {m.directory.compareGo}
          <span className="sr-only"> {selected ? fmt(m.directory.compareRemove, {name: entry.name}) : fmt(m.directory.compareAdd, {name: entry.name})}</span>
        </button>
        {match?.chains ? (
          <span className="row-match">
            {fmt(m.directory.matchedIn, {field: m.directory.fieldAddress})}: {match.chains.map(chainId => ctx.chainNames[chainId] ?? `${chainId}`).join(', ')}
          </span>
        ) : match?.snippet ? (
          <span className="row-match">
            {fmt(m.directory.matchedIn, {field: fieldLabel(match.snippet.field, m)})}:{' '}
            <q>
              <Highlighted snippet={match.snippet} />
            </q>
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function groupLabel(group: GradeGroup, m: DirectoryMessages): string {
  return group === 'complete' ? m.grade.completeLong : group === 'partial' ? m.directory.partialGroup : m.directory.unknownGroup;
}

export function ResultList({hits, groups, ctx}: {hits: readonly ObjectHit[]; groups: readonly {group: GradeGroup; index: number}[]; ctx: RowContext}) {
  if (!groups.length)
    return (
      <ol className="result-list">
        {hits.map(hit => (
          <ResultRow key={hit.entry.id} hit={hit} ctx={ctx} />
        ))}
      </ol>
    );
  return (
    <>
      {groups.map((group, index) => (
        <Fragment key={group.group}>
          <h3 className="group-heading">{groupLabel(group.group, ctx.m)}</h3>
          <ol className="result-list">
            {hits.slice(group.index, groups[index + 1]?.index ?? hits.length).map(hit => (
              <ResultRow key={hit.entry.id} hit={hit} ctx={ctx} />
            ))}
          </ol>
        </Fragment>
      ))}
    </>
  );
}
