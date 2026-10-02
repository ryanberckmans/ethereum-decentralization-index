/**
 * The read model: canonical EDI identities joined to editorial records,
 * stories, claims, observations and relationships. Built once per Worker
 * isolate from the validated edition; nothing here evaluates EDI.
 *
 * @cc [label:product] canonical-edi-ownership
 * Every object is an EDI record, named by EDI. Editorial data adds a role,
 * summary, tags, aliases and links, but can never rename a record, merge two
 * records or attach an assessment to anything EDI did not assess.
 */
import {defaultObjectSlug, type CollectionId, type ContextSubject, type Observation, type Relationship, type Role, type SourceClaim} from '../content/schema.ts';
import type {ContentData, EditionBundle, EditionInfo, MarkdownBody, RawState, Segment} from './edition-types.ts';
import {deployments, entities, networksOf, type Deployment, type Entity, type Kind} from './registry.ts';

export type ObjectEditorialFile = ContentData['objects'][number];
export type StoryFile = ContentData['stories'][number];

export interface ObjectRecord {
  id: string;
  slug: string;
  entity: Entity;
  /** EDI's name for the record; editorial data never renames it. */
  name: string;
  kind: Kind;
  editorial?: ObjectEditorialFile;
  /** True for an edited profile; basic records show EDI's own description. */
  edited: boolean;
  role?: Role;
  summary?: string;
  /** Search aids: EDI aliases and curated editorial aliases. Never identities. */
  aliases: string[];
  tags: string[];
  /** EDI chain record IDs this object is recorded on; empty when EDI records none. */
  networks: string[];
  deployments: Deployment[];
  /** Stories that feature this object, in story order. */
  storyIds: string[];
  /** Position in the editor's order (0 first). */
  rank: number;
  timeline: Segment<RawState>[];
}

export interface StoryRecord {
  id: string;
  slug: string;
  file: string;
  data: StoryFile['data'];
  body: MarkdownBody;
  /** Position in the editor's story order. */
  rank: number;
}

export type Resolved<T> = {kind: 'found'; value: T} | {kind: 'redirect'; slug: string} | {kind: 'missing'};

export interface Catalog {
  edition: EditionInfo;
  objects: readonly ObjectRecord[];
  stories: readonly StoryRecord[];
  subjects: ReadonlyMap<string, ContextSubject>;
  claims: ReadonlyMap<string, SourceClaim>;
  observations: ReadonlyMap<string, Observation>;
  relationships: readonly Relationship[];
  collections: ReadonlyMap<CollectionId, ContentData['collections'][number]>;
  changes: ContentData['changes'];
  methodology: MarkdownBody | null;
  changeDates: readonly string[];
  registryDate: string;
  object(id: string): ObjectRecord | undefined;
  story(id: string): StoryRecord | undefined;
  resolveObject(slug: string): Resolved<ObjectRecord>;
  resolveStory(slug: string): Resolved<StoryRecord>;
  /** EDI's result for `id` on `date` (dates before the registry date use the registry date). */
  rawOn(id: string, date: string): RawState;
  /** Segments that apply from `date` onward; the first starts at `date`. */
  timelineFrom(id: string, date: string): Segment<RawState>[];
  observationsAbout(subjectId: string): Observation[];
  claimsAbout(subjectId: string): SourceClaim[];
  relationshipsOf(subjectId: string): Relationship[];
  storiesWith(subjectId: string): StoryRecord[];
  /** An EDI object or contextual subject's display name. */
  nameOf(subjectId: string): string;
}

export function segmentAt<T>(segments: readonly Segment<T>[], date: string): T {
  let current = segments[0].value;
  for (const segment of segments) if (segment.from <= date) current = segment.value;
  return current;
}

export function segmentsFrom<T>(segments: readonly Segment<T>[], date: string): Segment<T>[] {
  const out: Segment<T>[] = [{from: date, value: segmentAt(segments, date)}];
  for (const segment of segments) if (segment.from > date) out.push(segment);
  return out;
}

const collator = new Intl.Collator('en', {sensitivity: 'base', numeric: true});

export function createCatalog(bundle: EditionBundle): Catalog {
  const {content, assessments} = bundle;
  const editorialById = new Map(content.objects.map(object => [object.data.ediId, object]));

  // Story order: the two entrances, then each collection's curated order, then the rest by review date.
  const storyFiles = new Map(content.stories.map(story => [story.data.id, story]));
  const storyOrder: string[] = [];
  const pushStory = (id: string) => {
    if (storyFiles.has(id) && !storyOrder.includes(id)) storyOrder.push(id);
  };
  const d0 = content.collections.find(c => c.id === 'd0-in-use');
  const global = content.collections.find(c => c.id === 'global-economy');
  if (d0) pushStory(d0.entrance.storyId);
  if (global) pushStory(global.entrance.storyId);
  for (const collection of [d0, global]) for (const id of collection?.storyIds ?? []) pushStory(id);
  for (const story of [...content.stories].sort((a, b) => b.data.reviewedAt.localeCompare(a.data.reviewedAt) || a.data.id.localeCompare(b.data.id)))
    pushStory(story.data.id);

  const stories: StoryRecord[] = storyOrder.map((id, rank) => {
    const story = storyFiles.get(id)!;
    return {id, slug: story.data.slug ?? id, file: story.file, data: story.data, body: story.body, rank};
  });
  const storyById = new Map(stories.map(story => [story.id, story]));

  const storiesOfObject = new Map<string, string[]>();
  for (const story of stories)
    for (const id of story.data.objectIds) storiesOfObject.set(id, [...(storiesOfObject.get(id) ?? []), story.id]);

  // Editor's order: objects in stories (by story order), then edited profiles, then A to Z.
  const inStories: string[] = [];
  for (const story of stories) for (const id of story.data.objectIds) if (!inStories.includes(id)) inStories.push(id);
  const byName = (a: Entity, b: Entity) => collator.compare(a.name, b.name) || a.id.localeCompare(b.id);
  const edited = entities.filter(e => !inStories.includes(e.id) && editorialById.get(e.id)?.data.contentStatus === 'edited-profile').sort(byName);
  const rest = entities.filter(e => !inStories.includes(e.id) && !edited.includes(e)).sort(byName);
  const order = [...inStories, ...edited.map(e => e.id), ...rest.map(e => e.id)];
  const rankOf = new Map(order.map((id, index) => [id, index]));

  const objects: ObjectRecord[] = entities.map(subject => {
    const editorial = editorialById.get(subject.id);
    const data = editorial?.data;
    const aliases = [...new Set([...subject.aliases.filter(alias => alias !== subject.id), ...(data?.aliases ?? [])])];
    return {
      id: subject.id,
      slug: data?.slug ?? defaultObjectSlug(subject.id),
      entity: subject,
      name: subject.name,
      kind: subject.kind,
      ...(editorial ? {editorial} : {}),
      edited: data?.contentStatus === 'edited-profile',
      ...(data?.role ? {role: data.role} : {}),
      ...(data?.summary ? {summary: data.summary} : {}),
      aliases,
      tags: data?.economicTags ?? [],
      networks: networksOf(subject),
      deployments: deployments(subject),
      storyIds: storiesOfObject.get(subject.id) ?? [],
      rank: rankOf.get(subject.id) ?? order.length,
      timeline: assessments.records[subject.id],
    };
  });
  objects.sort((a, b) => a.rank - b.rank);
  const objectById = new Map(objects.map(object => [object.id, object]));
  const objectBySlug = new Map(objects.map(object => [object.slug, object]));
  const storyBySlug = new Map(stories.map(story => [story.slug, story]));

  const subjects = new Map(content.subjects.map(subject => [subject.id, subject]));
  const claims = new Map(content.claims.map(claim => [claim.id, claim]));
  const observations = new Map(content.observations.map(observation => [observation.id, observation]));
  const collections = new Map(content.collections.map(collection => [collection.id, collection]));

  function resolveObject(slug: string): Resolved<ObjectRecord> {
    const found = objectBySlug.get(slug);
    if (found) return {kind: 'found', value: found};
    const redirected = content.redirects.objects[slug];
    if (redirected && objectById.has(redirected)) return {kind: 'redirect', slug: objectById.get(redirected)!.slug};
    // A raw EDI ID (seaport-v1.6, token:uniswap) or the earlier `:` → `--` form keeps working.
    for (const candidate of [slug, slug.replace(/--/g, ':')]) {
      const object = objectById.get(candidate);
      if (object) return {kind: 'redirect', slug: object.slug};
    }
    return caseInsensitive(slug, resolveObject);
  }

  function resolveStory(slug: string): Resolved<StoryRecord> {
    const found = storyBySlug.get(slug);
    if (found) return {kind: 'found', value: found};
    const redirected = content.redirects.stories[slug];
    if (redirected && storyById.has(redirected)) return {kind: 'redirect', slug: storyById.get(redirected)!.slug};
    const byId = storyById.get(slug);
    if (byId) return {kind: 'redirect', slug: byId.slug};
    return caseInsensitive(slug, resolveStory);
  }

  /** Slugs and IDs are lower case and unencoded; a capital or an encoded colon redirects instead of failing. */
  function caseInsensitive<T>(slug: string, resolve: (slug: string) => Resolved<T & {slug: string}>): Resolved<T & {slug: string}> {
    let decoded = slug;
    try {
      decoded = decodeURIComponent(slug);
    } catch {
      // Malformed escapes are simply not found.
    }
    const lower = decoded.toLowerCase();
    if (lower === slug) return {kind: 'missing'};
    const resolved = resolve(lower);
    if (resolved.kind === 'found') return {kind: 'redirect', slug: resolved.value.slug};
    return resolved;
  }

  const relationshipIndex = new Map<string, Relationship[]>();
  for (const relationship of content.relationships)
    for (const end of [relationship.from, relationship.to]) relationshipIndex.set(end, [...(relationshipIndex.get(end) ?? []), relationship]);

  return {
    edition: bundle.edition,
    objects,
    stories,
    subjects,
    claims,
    observations,
    relationships: content.relationships,
    collections,
    changes: content.changes,
    methodology: content.methodology,
    changeDates: assessments.changeDates,
    registryDate: assessments.registryDate,
    object: id => objectById.get(id),
    story: id => storyById.get(id),
    resolveObject,
    resolveStory,
    rawOn(id, date) {
      const timeline = assessments.records[id];
      if (!timeline) throw new Error(`Not an EDI record: ${id}`);
      return segmentAt(timeline, date < assessments.registryDate ? assessments.registryDate : date);
    },
    timelineFrom(id, date) {
      const timeline = assessments.records[id];
      if (!timeline) throw new Error(`Not an EDI record: ${id}`);
      return segmentsFrom(timeline, date < assessments.registryDate ? assessments.registryDate : date);
    },
    observationsAbout: subjectId => content.observations.filter(observation => observation.subjectId === subjectId),
    claimsAbout: subjectId => content.claims.filter(claim => claim.subjects.includes(subjectId)),
    relationshipsOf: subjectId => relationshipIndex.get(subjectId) ?? [],
    storiesWith: subjectId =>
      stories.filter(story => story.data.objectIds.includes(subjectId) || story.data.contextualSubjectIds.includes(subjectId as never)),
    nameOf: subjectId => objectById.get(subjectId)?.name ?? subjects.get(subjectId)?.name ?? subjectId,
  };
}
