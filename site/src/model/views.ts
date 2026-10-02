/**
 * Server-side projections from the read model into localized, plain view
 * data for pages and for the browser's directory index.
 */
import {describeAssessment, displayedLevel, levelLabel, type Assessment} from 'ethereum-decentralization-index';
import {EDI_LOCALE, type Locale} from '../config.ts';
import type {Observation} from '../content/schema.ts';
import {fmt, formatDate, formatDateRange, formatExact, formatQuantity} from '../i18n/format.ts';
import type {Messages} from '../i18n/en.ts';
import {messages} from '../i18n/index.ts';
import type {Catalog, ObjectRecord} from './catalog.ts';
import type {RawState, Segment} from './edition-types.ts';
import {entity, networkChoices, CHAIN_IDS} from './registry.ts';
import type {DatedView, DirectoryEntry, DirectoryIndex, FeaturedObservation, GradeView, SearchConcept} from './view-types.ts';
import {ROLES} from '../content/vocab.ts';
import {normalize} from './search.ts';

export type GradeSubject = 'mechanism' | 'position' | 'ethereum-l1';

export function gradeView(value: Assessment, locale: Locale, subject: GradeSubject = 'mechanism'): GradeView {
  const described = describeAssessment(value, EDI_LOCALE[locale], subject);
  return {
    label: levelLabel(value),
    status: value.status,
    level: displayedLevel(value),
    effective: value.effectiveLevel,
    floor: value.knownFloor,
    short: described.short,
    unresolved: [...value.unresolved],
    ...(value.reviewedAt ? {reviewedAt: value.reviewedAt} : {}),
  };
}

/** EDI's full description of an assessment in the page locale (for profiles and the methodology). */
export function gradeMeaning(value: Assessment, locale: Locale, subject: GradeSubject = 'mechanism') {
  return describeAssessment(value, EDI_LOCALE[locale], subject);
}

export function mechanismSubject(id: string): GradeSubject {
  return id === 'ethereum' ? 'ethereum-l1' : 'mechanism';
}

export function datedView(id: string, raw: RawState, locale: Locale): DatedView {
  return {
    mechanism: gradeView(raw.mechanism, locale, mechanismSubject(id)),
    ...(raw.position ? {position: gradeView(raw.position, locale, 'position')} : {}),
    review: raw.review,
    ...(raw.positionReview ? {positionReview: raw.positionReview} : {}),
  };
}

export function datedTimeline(id: string, segments: readonly Segment<RawState>[], locale: Locale): Segment<DatedView>[] {
  return segments.map(segment => ({from: segment.from, value: datedView(id, segment.value, locale)}));
}

export function chainName(chainId: number): string {
  const id = Object.entries(CHAIN_IDS).find(([, value]) => value === chainId)?.[0];
  return (id && entity(id)?.name) || `Chain ${chainId}`;
}

export interface ObservationView {
  id: string;
  metric: string;
  definition: string;
  /** Formatted value with comparator, unit and rate period. */
  value: string;
  /** The exact reported value with grouping, for accessible descriptions. */
  exact: string;
  when: string;
  /** Chain scope in words. */
  chains: string;
  multichain: boolean;
  scope: string;
  measure: Observation['measure'];
}

export function observationView(observation: Observation, locale: Locale, m: Messages = messages(locale)): ObservationView {
  let value = formatQuantity(observation.value, observation.unit, locale);
  if (observation.ratePeriod) {
    const key = ({day: 'perDay', week: 'perWeek', month: 'perMonth', year: 'perYear'} as const)[observation.ratePeriod];
    value = fmt(m.observation[key], {value});
  }
  if (observation.comparator) {
    const key = ({'more-than': 'more', 'at-least': 'atLeast', about: 'about'} as const)[observation.comparator];
    value = fmt(m.observation[key], {value});
  }
  const when = observation.interval
    ? formatDateRange(observation.interval.start, observation.interval.end, locale)
    : observation.asOf
      ? fmt(m.observation.asOf, {date: formatDate(observation.asOf, locale)})
      : m.common.unknownDate;
  const chains =
    observation.chainIds === 'multichain-unsplit'
      ? m.observation.multichain
      : observation.chainIds === 'not-applicable'
        ? m.observation.notApplicable
        : observation.chainIds.map(chainName).join(m.common.listSeparator);
  return {
    id: observation.id,
    metric: observation.metric,
    definition: observation.metricDefinition,
    value,
    exact: fmt(m.observation.exact, {value: formatExact(observation.value, observation.unit, locale)}),
    when,
    chains,
    multichain: observation.chainIds === 'multichain-unsplit',
    scope: observation.scope,
    measure: observation.measure,
  };
}

function featured(catalog: Catalog, object: ObjectRecord, locale: Locale, m: Messages): FeaturedObservation | undefined {
  const id = object.editorial?.data.featuredObservationId;
  const observation = id ? catalog.observations.get(id) : undefined;
  if (!observation) return undefined;
  const view = observationView(observation, locale, m);
  return {metric: view.metric, value: view.value, when: view.when, ...(view.multichain || observation.chainIds === 'not-applicable' ? {scope: view.chains} : {})};
}

export function directoryEntry(catalog: Catalog, object: ObjectRecord, locale: Locale, m: Messages = messages(locale)): DirectoryEntry {
  const observation = featured(catalog, object, locale, m);
  return {
    id: object.id,
    slug: object.slug,
    name: object.name,
    kind: object.kind,
    ...(object.role ? {role: object.role} : {}),
    summary: object.summary ?? object.entity.scope,
    ediSummary: object.summary === undefined,
    scope: object.entity.scope,
    controls: [...object.entity.controls],
    reason: object.entity.reason,
    networks: object.networks,
    addresses: object.deployments.map(d => [d.chainId, d.address]),
    aliases: object.aliases,
    tags: object.tags,
    stories: object.storyIds,
    edited: object.edited,
    rank: object.rank,
    reviewedAt: object.entity.reviewedAt,
    ...(observation ? {observation} : {}),
    states: datedTimeline(object.id, object.timeline, locale),
  };
}

const indexMemo = new Map<string, DirectoryIndex>();

/** The full directory index for one locale. Valid for every date: entries carry their EDI timelines. */
export function directoryIndex(catalog: Catalog, locale: Locale): DirectoryIndex {
  const key = `${catalog.edition.id}|${locale}`;
  const cached = indexMemo.get(key);
  if (cached) return cached;
  const m = messages(locale);
  const used = new Set(catalog.objects.flatMap(object => object.networks));
  const classified = catalog.objects.filter(object => object.role).length;
  const index: DirectoryIndex = {
    version: 1,
    edition: catalog.edition.id,
    locale,
    entries: catalog.objects.map(object => directoryEntry(catalog, object, locale, m)),
    stories: catalog.stories.map(story => ({
      id: story.id,
      slug: story.slug,
      title: story.data.title,
      dek: story.data.dek,
      objects: story.data.objectIds,
      collections: story.data.collections,
      rank: story.rank,
    })),
    subjects: [...catalog.subjects.values()].map(subject => ({
      id: subject.id,
      kind: subject.kind,
      name: subject.name,
      description: subject.description,
      aliases: subject.aliases,
      ...(subject.relatedEdiId ? {relatedId: subject.relatedEdiId} : {}),
      ...(subject.chainId ? {chainId: subject.chainId} : {}),
      ...(subject.address ? {address: subject.address.toLowerCase()} : {}),
      ...(subject.ethereumRelation === 'outside-ethereum' ? {outsideEthereum: true} : {}),
    })),
    networks: networkChoices()
      .filter(chain => used.has(chain.id))
      .map(chain => ({id: chain.id, name: chain.name, ...(CHAIN_IDS[chain.id] ? {chainId: CHAIN_IDS[chain.id]} : {})})),
    roles: ROLES.filter(role => catalog.objects.some(object => object.role === role)),
    roleCoverage: catalog.objects.length ? classified / catalog.objects.length : 0,
    vocabulary: searchVocabulary(m),
    stopWords: normalize(m.searchStopWords).split(' ').filter(Boolean),
  };
  indexMemo.set(key, index);
  return index;
}

/** Each idea's words in the page language and in English, with the English words records use for it. */
function searchVocabulary(m: Messages): SearchConcept[] {
  const english = messages('en').searchTerms;
  const words = (text: string) => normalize(text).split(' ').filter(Boolean);
  return (Object.keys(english) as (keyof typeof english)[]).map(key => ({
    words: [...new Set([...words(m.searchTerms[key]), ...words(english[key])])],
    english: words(english[key]),
  }));
}
