/**
 * Server-rendered building blocks for editorial pages: links to EDI objects,
 * live (dated) EDI badges, contextual subjects, citations, observations,
 * relationships and the numbered source list. Server-only: these read the
 * catalog, so they are never imported by an island.
 */
import type {ReactNode} from 'react';
import type {Locale} from '../config.ts';
import type {EvidenceState, Observation, Relationship} from '../content/schema.ts';
import type {Messages} from '../i18n/en.ts';
import {fmt, formatDate} from '../i18n/format.ts';
import {Dated} from '../components/Dated.tsx';
import {GradeBadge} from '../components/Grade.tsx';
import {ExternalIcon} from '../components/Icons.tsx';
import type {TokenContext} from '../components/Markdown.tsx';
import {paths} from '../model/urls.ts';
import {chainName, datedTimeline, observationView} from '../model/views.ts';
import type {DatedView, Segment} from '../model/view-types.ts';
import type {Citations} from '../server/citations.ts';
import {catalog} from '../server/site.ts';

/** What every server view needs: the page language, its strings and the evaluation date. */
export interface PageEnv {
  locale: Locale;
  m: Messages;
  /** The UTC date this response was evaluated for. */
  date: string;
}

/** Editorial text is written in English; pages in other languages mark it as such. */
export function contentLang(env: PageEnv): string | undefined {
  return env.locale === 'en' ? undefined : 'en';
}

/** EDI's localized results for one record from the evaluation date on. */
export function datedFor(id: string, env: PageEnv): Segment<DatedView>[] {
  return datedTimeline(id, catalog.timelineFrom(id, env.date), env.locale);
}

export function isContextSubject(id: string): boolean {
  return /^(org|product|deployment|network|ref):/.test(id);
}

export function ObjectLink({id, env}: {id: string; env: PageEnv}) {
  const object = catalog.object(id);
  if (!object) return <>{id}</>;
  return (
    <a className="token-object" href={paths.object(env.locale, object.slug)}>
      {object.name}
    </a>
  );
}

/** A live EDI badge. Later results are kept for the reader's date (see Dated). */
export function DatedGrade({id, env, scope = 'mechanism', size, label}: {id: string; env: PageEnv; scope?: 'mechanism' | 'position'; size?: 'sm' | 'lg'; label?: string}) {
  return (
    <Dated
      segments={datedFor(id, env)}
      render={view => {
        const grade = scope === 'position' ? view.position : view.mechanism;
        if (!grade) return <span className="muted">{env.m.grade.noGrade}</span>;
        return <GradeBadge grade={grade} m={env.m} size={size} scope={label} />;
      }}
    />
  );
}

/** A contextual subject in running text: named, never graded. */
export function SubjectInline({id, env}: {id: string; env: PageEnv}) {
  const subject = catalog.subjects.get(id);
  if (!subject) return <>{id}</>;
  return (
    <span className="subject-tag" title={`${subject.description} ${env.m.subjects.notAssessed}.`}>
      {subject.name}
    </span>
  );
}

export function Cite({ids, citations, env}: {ids: readonly string[]; citations: Citations; env: PageEnv}) {
  const numbers = [...new Set(ids.map(id => citations.number(id)).filter((n): n is number => n !== undefined))].sort((a, b) => a - b);
  if (!numbers.length) return null;
  return (
    <sup className="cite">
      {numbers.map(n => (
        <a key={n} href={`#source-${n}`} aria-label={fmt(env.m.sources.sourceN, {n})}>
          [{n}]
        </a>
      ))}
    </sup>
  );
}

export function EvidenceTag({state, env}: {state: EvidenceState; env: PageEnv}) {
  return (
    <span className="evidence-tag" data-state={state} title={env.m.evidenceHelp[state]}>
      {env.m.evidence[state]}
    </span>
  );
}

/**
 * Resolves the tokens in editorial Markdown. Observations listed on the page
 * link to their full entry, which carries the unit, scope and source.
 */
export function tokenContext(env: PageEnv, citations: Citations, listed: ReadonlySet<string> = new Set()): TokenContext {
  return {
    render(token): ReactNode {
      switch (token.kind) {
        case 'object':
          return <ObjectLink id={token.id} env={env} />;
        case 'grade':
          return <DatedGrade id={token.id} env={env} scope={token.scope} size="sm" />;
        case 'subject':
          return <SubjectInline id={token.id} env={env} />;
        case 'claim':
          return <Cite ids={[token.id]} citations={citations} env={env} />;
        case 'obs': {
          const observation = catalog.observations.get(token.id);
          if (!observation) return null;
          const view = observationView(observation, env.locale, env.m);
          const value = <strong className="obs-inline">{view.value}</strong>;
          return (
            <>
              {listed.has(token.id) ? (
                <a className="obs-link" href={`#obs-${token.id}`} title={view.exact}>
                  {value}
                </a>
              ) : (
                value
              )}{' '}
              <span className="obs-when">({view.when})</span>
            </>
          );
        }
      }
    },
  };
}

/** The name of an EDI object (linked, with its live badge) or a contextual subject (with its kind). */
export function SubjectRef({id, env, badge = true}: {id: string; env: PageEnv; badge?: boolean}) {
  if (isContextSubject(id)) {
    const subject = catalog.subjects.get(id);
    return (
      <span className="subject-ref">
        <span className="subject-name">{subject?.name ?? id}</span>{' '}
        <span className="not-assessed">
          {subject ? `${env.m.subjects[subject.kind]} · ` : ''}
          {env.m.subjects.notAssessed}
        </span>
      </span>
    );
  }
  return (
    <span className="subject-ref">
      <ObjectLink id={id} env={env} />
      {badge ? (
        <>
          {' '}
          <DatedGrade id={id} env={env} size="sm" />
        </>
      ) : null}
    </span>
  );
}

function chainList(chainIds: readonly number[] | undefined): string | undefined {
  return chainIds?.length ? chainIds.map(chainName).join(', ') : undefined;
}

export function ObservationItem({
  observation,
  env,
  citations,
  showSubject,
}: {
  observation: Observation;
  env: PageEnv;
  citations: Citations;
  showSubject: boolean;
}) {
  const {m} = env;
  const view = observationView(observation, env.locale, m);
  const derivation = observation.derivation;
  return (
    <li className="obs" id={`obs-${observation.id}`}>
      <p className="obs-metric">
        {showSubject ? (
          <>
            <span className="obs-subject">{catalog.nameOf(observation.subjectId)}</span>
            <span aria-hidden="true"> · </span>
          </>
        ) : null}
        {view.metric}
      </p>
      <p className="obs-value" title={view.exact}>
        {view.value}
        <span className="sr-only">. {view.exact}</span>
      </p>
      <p className="obs-meta">
        <span>{view.when}</span>
        <span>{m.observation.measure[observation.measure]}</span>
        {view.multichain ? null : <span>{view.chains}</span>}
        <span>
          {m.observation.source}
          <Cite ids={observation.sourceClaimIds} citations={citations} env={env} />
        </span>
      </p>
      {view.multichain ? <p className="obs-warn">{m.observation.multichain}</p> : null}
      <p className="obs-scope">{view.scope}</p>
      <details className="obs-more">
        <summary>{m.observation.definition}</summary>
        <p>{view.definition}</p>
        {derivation ? <p>{fmt(m.observation.derived, {method: derivation.method})}</p> : null}
      </details>
    </li>
  );
}

export function ObservationList({observations, env, citations, showSubject}: {observations: readonly Observation[]; env: PageEnv; citations: Citations; showSubject: (o: Observation) => boolean}) {
  return (
    <ol className="obs-list" lang={contentLang(env)}>
      {observations.map(observation => (
        <ObservationItem key={observation.id} observation={observation} env={env} citations={citations} showSubject={showSubject(observation)} />
      ))}
    </ol>
  );
}

/** Relationship wording from one end: "issued by Circle", "settles on Ethereum". */
export function relationVerb(relationship: Relationship, from: string, m: Messages): string {
  return relationship.from === from ? m.relationships[relationship.type] : m.relationshipsReverse[relationship.type];
}

export function RelationshipList({
  relationships,
  env,
  citations,
  perspective,
}: {
  relationships: readonly Relationship[];
  env: PageEnv;
  citations: Citations;
  /** When set, each line is read from this subject's side and names only the other end. */
  perspective?: string;
}) {
  const {m} = env;
  return (
    <ul className="relations">
      {relationships.map(relationship => {
        const other = perspective === relationship.from ? relationship.to : relationship.from;
        const chains = chainList(relationship.chainIds);
        return (
          <li className="relation" key={relationship.id}>
            <p className="relation-line">
              {perspective ? null : <SubjectRef id={relationship.from} env={env} />}
              <span className="relation-type">{perspective ? relationVerb(relationship, perspective, m) : m.relationships[relationship.type]}</span>
              <SubjectRef id={perspective ? other : relationship.to} env={env} />
            </p>
            {relationship.note ? (
              <p className="relation-note" lang={contentLang(env)}>
                {relationship.note}
              </p>
            ) : null}
            <p className="relation-meta">
              <EvidenceTag state={relationship.state} env={env} />
              {chains ? <span>{chains}</span> : null}
              {relationship.validFrom ? <span>{fmt(m.relationshipMeta.since, {date: formatDate(relationship.validFrom, env.locale)})}</span> : null}
              {relationship.validTo ? <span>{fmt(m.relationshipMeta.until, {date: formatDate(relationship.validTo, env.locale)})}</span> : null}
              <Cite ids={relationship.sourceClaimIds} citations={citations} env={env} />
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/** Every source the page cites, numbered as cited. */
export function SourcesList({citations, env}: {citations: Citations; env: PageEnv}) {
  const {m, locale} = env;
  return (
    <ol className="sources" lang={contentLang(env)}>
      {citations.ids.map((id, index) => {
        const claim = catalog.claims.get(id);
        if (!claim) return null;
        const n = index + 1;
        return (
          <li className="source" id={`source-${n}`} key={id}>
            <span className="source-n" aria-hidden="true">
              {n}
            </span>
            <p className="source-statement">
              <span className="sr-only">{fmt(m.sources.sourceN, {n})}: </span>
              {claim.statement}
            </p>
            <p className="source-meta">
              <EvidenceTag state={claim.state} env={env} />
              <a href={claim.sourceUrl} rel="noopener noreferrer" className="source-link">
                {claim.title ?? claim.publisher}
                <ExternalIcon />
                <span className="sr-only"> ({m.common.external})</span>
              </a>
              {claim.title ? <span>{claim.publisher}</span> : null}
            </p>
            <p className="source-meta">
              {claim.sourcePublishedAt ? <span>{fmt(m.sources.published, {date: formatDate(claim.sourcePublishedAt, locale)})}</span> : null}
              {claim.observedAt ? <span>{fmt(m.sources.observed, {date: formatDate(claim.observedAt, locale)})}</span> : null}
              <span>{fmt(m.sources.retrieved, {date: formatDate(claim.retrievedAt, locale)})}</span>
              {claim.locator ? <span>{fmt(m.sources.locator, {text: claim.locator})}</span> : null}
            </p>
            {claim.qualification ? <p className="source-qual">{claim.qualification}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Breadcrumb trail; the last item is the current page. */
export function Crumbs({items, env}: {items: {label: string; href?: string}[]; env: PageEnv}) {
  return (
    <nav aria-label={env.m.nav.breadcrumb}>
      <ol className="crumbs">
        {items.map((item, index) => (
          <li key={index}>{item.href ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}
