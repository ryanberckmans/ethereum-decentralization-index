/**
 * Public data exports, schema version 1. Every EDI result is exported as a
 * projection with its record ID, scope, evaluation date and source revision,
 * never as a bare number; mechanism and position results stay separate.
 * Editorial figures keep their exact decimal value, unit, time basis, chain
 * and entity scope, definition and sources.
 */
import {levelLabel, safeEvidenceUrl, type Assessment} from 'ethereum-decentralization-index';
import {DEFAULT_LOCALE, PRODUCT} from '../config.ts';
import {inlineText, type Block, type TokenRef} from '../content/markdown.ts';
import type {Observation, Relationship, SourceClaim} from '../content/schema.ts';
import type {ObjectRecord, StoryRecord} from '../model/catalog.ts';
import type {ReviewState} from '../model/edition-types.ts';
import {toCsv} from '../model/csv.ts';
import {dependentsOf} from '../model/registry.ts';
import {EXPORTS, paths} from '../model/urls.ts';
import {catalog} from './site.ts';

export const SCHEMA_VERSION = 1;

/** Where the EDI results come from: this repository at the edition's commit. */
function source() {
  const edition = catalog.edition;
  return {repository: PRODUCT.repository, commit: edition.ediCommit, registryDate: edition.ediRegistryDate};
}

function review(state: ReviewState | undefined) {
  return state ? {permanent: state.permanent, dueAt: state.dueAt, overdue: state.overdue} : null;
}

/** One EDI result exactly as EDI returned it for `date`, with what it covers and where it came from. */
function projection(id: string, scope: 'mechanism' | 'position', value: Assessment, reviewState: ReviewState | undefined, date: string) {
  return {
    id,
    scope,
    evaluationDate: date,
    label: levelLabel(value),
    status: value.status,
    effectiveLevel: value.effectiveLevel,
    knownFloor: value.knownFloor,
    unresolved: [...value.unresolved],
    reviewedAt: value.reviewedAt ?? null,
    review: review(reviewState),
    source: source(),
  };
}

/** The fields of one EDI result that can change on a later date. */
function stateOf(value: Assessment, reviewState: ReviewState | undefined) {
  return {
    label: levelLabel(value),
    status: value.status,
    effectiveLevel: value.effectiveLevel,
    knownFloor: value.knownFloor,
    unresolved: [...value.unresolved],
    review: review(reviewState),
  };
}

/** The record's EDI results on `date`, and the results this edition's review dates produce later. */
function assessmentOf(object: ObjectRecord, date: string) {
  const [current, ...later] = catalog.timelineFrom(object.id, date);
  const raw = current.value;
  return {
    mechanism: projection(object.id, 'mechanism', raw.mechanism, raw.review, date),
    position: raw.position ? projection(object.id, 'position', raw.position, raw.positionReview, date) : null,
    scheduled: later.map(segment => ({
      from: segment.from,
      mechanism: stateOf(segment.value.mechanism, segment.value.review),
      position: segment.value.position ? stateOf(segment.value.position, segment.value.positionReview) : null,
    })),
  };
}

const absolute = (origin: string, path: string) => `${origin}${path}`;

export function directoryRecord(object: ObjectRecord, date: string, origin: string) {
  const editorial = object.editorial?.data;
  return {
    id: object.id,
    slug: object.slug,
    name: object.name,
    kind: object.kind,
    role: object.role ?? null,
    summary: object.summary ?? null,
    ediScope: object.entity.scope,
    networks: object.networks,
    deployments: object.deployments.map(deployment => ({chainId: deployment.chainId, address: deployment.address})),
    aliases: object.aliases,
    tags: object.tags,
    stories: object.storyIds,
    profile: {
      url: absolute(origin, paths.object(DEFAULT_LOCALE, object.slug)),
      data: absolute(origin, EXPORTS.object(object.slug)),
      edited: object.edited,
      editorialReviewedAt: editorial?.editorialReviewedAt ?? null,
    },
    assessment: assessmentOf(object, date),
  };
}

function edition() {
  const e = catalog.edition;
  return {
    id: e.id,
    ediCommit: e.ediCommit,
    ediCommitDirty: e.ediCommitDirty,
    ediRegistryDate: e.ediRegistryDate,
    ediRegistrySha256: e.ediRegistrySha256,
    ediPolicyDate: e.ediPolicyDate,
    ediRubricVersion: e.ediRubricVersion,
    editorialRevision: e.editorialRevision,
    builtAt: e.builtAt,
    observedThrough: e.observedThrough ?? null,
  };
}

/** The envelope every JSON export shares. */
function envelope<T>(kind: string, date: string, data: T) {
  return {schemaVersion: SCHEMA_VERSION, kind, edition: catalog.edition.id, evaluationDate: date, ...data};
}

export function editionManifest(date: string, origin: string) {
  const file = (path: string, format: 'json' | 'csv', description: string) => ({url: absolute(origin, path), format, description});
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: 'edition',
    product: {name: PRODUCT.name, index: PRODUCT.indexName, repository: PRODUCT.repository, site: origin},
    edition: edition(),
    evaluationDate: date,
    changeDates: catalog.changeDates,
    counts: {records: catalog.objects.length, stories: catalog.stories.length, observations: catalog.observations.size, claims: catalog.claims.size, relationships: catalog.relationships.length},
    files: [
      file(EXPORTS.directoryJson, 'json', 'Every EDI record with its EDI results for the evaluation date, scope, networks, deployments and editorial metadata.'),
      file(EXPORTS.directoryCsv, 'csv', 'The same records as one row each, for spreadsheets.'),
      file(EXPORTS.observationsJson, 'json', 'Dated editorial figures with unit, time basis, chain and entity scope, definition and sources.'),
      file(EXPORTS.observationsCsv, 'csv', 'The same figures as one row each, for spreadsheets.'),
      file(EXPORTS.claimsJson, 'json', 'Sourced claims with their evidence state.'),
      file(EXPORTS.relationshipsJson, 'json', 'Typed, sourced editorial connections. These never change EDI results.'),
      file(EXPORTS.storiesJson, 'json', 'Stories with their thesis, objects, evidence and text.'),
      {url: absolute(origin, EXPORTS.object('{slug}')), format: 'json' as const, description: 'One record in full: EDI fields, results, editorial text, figures, claims and connections.'},
    ],
    notes: [
      'EDI is the only assessment authority. Results are computed with EDI’s date-aware functions for evaluationDate (UTC) and change on the dates in changeDates without a new edition.',
      'Figures are never summed, averaged or ranked. Compare them only within one comparisonGroup with the same unit, time basis and chain scope.',
    ],
  };
}

export function directoryExport(date: string, origin: string) {
  return envelope('directory', date, {records: catalog.objects.map(object => directoryRecord(object, date, origin))});
}

export function directoryCsv(date: string, origin: string): string {
  const rows = catalog.objects.map(object => ({object, record: directoryRecord(object, date, origin)}));
  return toCsv(rows, [
    ['id', r => r.object.id],
    ['name', r => r.object.name],
    ['kind', r => r.object.kind],
    ['role', r => r.object.role],
    ['mechanism_label', r => r.record.assessment.mechanism.label],
    ['mechanism_status', r => r.record.assessment.mechanism.status],
    ['mechanism_effective_level', r => r.record.assessment.mechanism.effectiveLevel],
    ['mechanism_known_floor', r => r.record.assessment.mechanism.knownFloor],
    ['position_label', r => r.record.assessment.position?.label ?? ''],
    ['position_status', r => r.record.assessment.position?.status ?? ''],
    ['review_permanent', r => r.record.assessment.mechanism.review?.permanent ?? ''],
    ['review_due', r => r.record.assessment.mechanism.review?.dueAt ?? ''],
    ['review_overdue', r => r.record.assessment.mechanism.review?.overdue ?? ''],
    ['evaluation_date', () => date],
    ['edi_commit', () => catalog.edition.ediCommit],
    ['edi_registry_date', () => catalog.edition.ediRegistryDate],
    ['networks', r => r.object.networks.join(' ')],
    ['deployments', r => r.object.deployments.map(d => `${d.chainId}:${d.address}`).join(' ')],
    ['edi_scope', r => r.object.entity.scope],
    ['summary', r => r.object.summary ?? ''],
    ['profile_url', r => r.record.profile.url],
    ['edition', () => catalog.edition.id],
  ]);
}

function observationRecord(observation: Observation) {
  return {
    id: observation.id,
    subject: {id: observation.subjectId, name: catalog.nameOf(observation.subjectId), ediRecord: catalog.object(observation.subjectId) !== undefined},
    metric: observation.metric,
    definition: observation.metricDefinition,
    value: observation.value,
    comparator: observation.comparator ?? null,
    unit: observation.unit,
    measure: observation.measure,
    asOf: observation.asOf ?? null,
    interval: observation.interval ?? null,
    ratePeriod: observation.ratePeriod ?? null,
    chainIds: observation.chainIds,
    deploymentAddresses: observation.deploymentAddresses ?? [],
    scope: observation.scope,
    comparisonGroup: observation.comparisonGroup ?? null,
    derivation: observation.derivation ?? null,
    sourceClaimIds: observation.sourceClaimIds,
  };
}

export function observationsExport(date: string) {
  return envelope('observations', date, {observations: [...catalog.observations.values()].map(observationRecord)});
}

export function observationsCsv(): string {
  return toCsv([...catalog.observations.values()], [
    ['id', o => o.id],
    ['subject_id', o => o.subjectId],
    ['subject_name', o => catalog.nameOf(o.subjectId)],
    ['metric', o => o.metric],
    ['value', o => o.value],
    ['comparator', o => o.comparator ?? ''],
    ['unit', o => o.unit],
    ['measure', o => o.measure],
    ['as_of', o => o.asOf ?? ''],
    ['interval_start', o => o.interval?.start ?? ''],
    ['interval_end', o => o.interval?.end ?? ''],
    ['rate_period', o => o.ratePeriod ?? ''],
    ['chain_ids', o => (Array.isArray(o.chainIds) ? o.chainIds.join(' ') : o.chainIds)],
    ['scope', o => o.scope],
    ['comparison_group', o => o.comparisonGroup ?? ''],
    ['definition', o => o.metricDefinition],
    ['source_claim_ids', o => o.sourceClaimIds.join(' ')],
    ['source_urls', o => o.sourceClaimIds.map(id => catalog.claims.get(id)?.sourceUrl ?? '').filter(Boolean).join(' ')],
    ['edition', () => catalog.edition.id],
  ]);
}

function claimRecord(claim: SourceClaim) {
  return {
    id: claim.id,
    statement: claim.statement,
    state: claim.state,
    sourceUrl: claim.sourceUrl,
    publisher: claim.publisher,
    title: claim.title ?? null,
    sourcePublishedAt: claim.sourcePublishedAt ?? null,
    observedAt: claim.observedAt ?? null,
    retrievedAt: claim.retrievedAt,
    locator: claim.locator ?? null,
    qualification: claim.qualification ?? null,
    subjects: claim.subjects,
  };
}

export function claimsExport(date: string) {
  return envelope('claims', date, {claims: [...catalog.claims.values()].map(claimRecord)});
}

function relationshipRecord(relationship: Relationship) {
  return {
    ...relationship,
    fromName: catalog.nameOf(relationship.from),
    toName: catalog.nameOf(relationship.to),
    note: relationship.note ?? null,
  };
}

export function relationshipsExport(date: string) {
  return envelope('relationships', date, {
    note: 'Editorial connections. Only EDI’s own dependencies (in each record’s EDI fields) change an EDI result.',
    relationships: catalog.relationships.map(relationshipRecord),
  });
}

/** Readable plain text of editorial Markdown: paragraphs, bullets, and tokens written out. */
function plainText(blocks: readonly Block[], date: string): string {
  const label = (token: TokenRef): string => {
    switch (token.kind) {
      case 'object':
      case 'subject':
        return catalog.nameOf(token.id);
      case 'grade': {
        const raw = catalog.rawOn(token.id, date);
        const value = token.scope === 'position' ? raw.position : raw.mechanism;
        return value ? `${levelLabel(value)} (EDI ${token.scope ?? 'mechanism'} result for ${catalog.nameOf(token.id)} on ${date})` : catalog.nameOf(token.id);
      }
      case 'claim':
        return `[${token.id}]`;
      case 'obs': {
        const observation = catalog.observations.get(token.id);
        if (!observation) return token.id;
        const when = observation.interval ? `${observation.interval.start} to ${observation.interval.end}` : (observation.asOf ?? '');
        return `${observation.value} ${observation.unit} (${when})`;
      }
    }
  };
  const block = (b: Block): string => {
    switch (b.t) {
      case 'p':
      case 'h3':
        return inlineText(b.c, label);
      case 'ul':
      case 'ol':
        return b.items.map((item, i) => `${b.t === 'ol' ? `${i + 1}.` : '-'} ${item.map(block).join(' ')}`).join('\n');
      case 'quote':
        return b.c.map(block).join('\n\n');
      case 'pre':
        return b.v;
      case 'table':
        return [b.head, ...b.rows].map(row => row.map(cell => inlineText(cell, label)).join(' | ')).join('\n');
      case 'hr':
        return '';
    }
  };
  return blocks.map(block).filter(Boolean).join('\n\n');
}

function storyRecord(story: StoryRecord, date: string, origin: string) {
  const data = story.data;
  return {
    id: story.id,
    slug: story.slug,
    title: data.title,
    dek: data.dek,
    thesis: data.thesis,
    url: absolute(origin, paths.story(DEFAULT_LOCALE, story.slug)),
    collections: data.collections,
    objectIds: data.objectIds,
    contextualSubjectIds: data.contextualSubjectIds,
    outcome: data.outcome,
    ethereumContribution: data.ethereumContribution,
    controlBoundary: data.controlBoundary,
    claimIds: data.claimIds,
    observationIds: data.observationIds,
    relationshipIds: data.relationshipIds,
    reviewedAt: data.reviewedAt,
    text: {
      intro: plainText(story.body.intro, date),
      sections: story.body.sections.map(section => ({heading: section.heading, text: plainText(section.blocks, date)})),
    },
  };
}

export function storiesExport(date: string, origin: string) {
  return envelope('stories', date, {stories: catalog.stories.map(story => storyRecord(story, date, origin))});
}

export function objectExport(object: ObjectRecord, date: string, origin: string) {
  const entity = object.entity;
  const editorial = object.editorial;
  const observations = catalog.observationsAbout(object.id);
  const relationships = catalog.relationshipsOf(object.id);
  const claimIds = new Set([...catalog.claimsAbout(object.id).map(claim => claim.id), ...observations.flatMap(o => o.sourceClaimIds), ...relationships.flatMap(r => r.sourceClaimIds)]);
  return envelope('object', date, {
    record: directoryRecord(object, date, origin),
    edi: {
      scope: entity.scope,
      reason: entity.reason,
      controls: entity.controls,
      limits: entity.limits ?? [],
      dependencies: entity.dependencies,
      dependents: dependentsOf(object.id),
      aliases: entity.aliases,
      evidenceUrls: entity.evidenceUrls.map(url => safeEvidenceUrl(url)).filter((url): url is string => url !== null),
      reviewedAt: entity.reviewedAt,
      reviewCadence: entity.reviewCadence,
      nextReviewAt: entity.nextReviewAt,
      immutableIdentity: entity.immutableIdentity ?? null,
      positionReview: entity.positionReview ? {status: entity.positionReview.status, reason: entity.positionReview.reason, nextReviewAt: entity.positionReview.nextReviewAt} : null,
    },
    editorial: editorial
      ? {
          contentStatus: editorial.data.contentStatus,
          capability: editorial.data.capability ?? null,
          authority: editorial.data.authority ?? null,
          economicTags: editorial.data.economicTags,
          officialLinks: editorial.data.officialLinks,
          editorialReviewedAt: editorial.data.editorialReviewedAt,
          sections: editorial.body.sections.map(section => ({heading: section.heading, text: plainText(section.blocks, date)})),
        }
      : null,
    observations: observations.map(observationRecord),
    claims: [...claimIds].flatMap(id => {
      const claim = catalog.claims.get(id);
      return claim ? [claimRecord(claim)] : [];
    }),
    relationships: relationships.map(relationshipRecord),
    stories: catalog.storiesWith(object.id).map(story => ({id: story.id, title: story.data.title, url: absolute(origin, paths.story(DEFAULT_LOCALE, story.slug))})),
  });
}
