/**
 * Cross-reference validation of editorial content against the EDI registry.
 *
 * @cc [label:product] canonical-edi-ownership
 * Editorial records may only point at EDI identities that exist exactly as
 * written. Aliases, tickers and brands are rejected as identities, and no
 * editorial file can introduce an EDI dependency edge.
 */
import type {Issue, LoadedContent} from './load.ts';
import type {TokenRef} from './markdown.ts';
import {
  COLLECTION_IDS,
  METHODOLOGY_SECTIONS,
  OBJECT_SECTIONS,
  STORY_SECTIONS,
  defaultObjectSlug,
  type EvidenceState,
} from './schema.ts';

export interface EdiIdentity {
  id: string;
  name: string;
  aliases: readonly string[];
}

/** Which claim states can support an outcome stated with a given state. */
const SUPPORTS: Record<EvidenceState, readonly EvidenceState[]> = {
  forecast: ['forecast', 'announced', 'capability', 'pilot', 'live', 'reported-adoption', 'reproduced-observation'],
  announced: ['announced', 'pilot', 'live', 'reported-adoption', 'reproduced-observation'],
  capability: ['capability', 'live', 'reported-adoption', 'reproduced-observation'],
  pilot: ['pilot', 'live', 'reported-adoption', 'reproduced-observation'],
  live: ['live', 'reported-adoption', 'reproduced-observation'],
  'reported-adoption': ['reported-adoption', 'reproduced-observation'],
  'reproduced-observation': ['reproduced-observation'],
};

export function validateContent(content: LoadedContent, entities: readonly EdiIdentity[], options: {buildDate: string}): Issue[] {
  const issues: Issue[] = [];
  const error = (file: string, message: string) => issues.push({level: 'error', file, message});
  const warn = (file: string, message: string) => issues.push({level: 'warning', file, message});

  const ediIds = new Set(entities.map(entity => entity.id));
  const aliasOf = new Map<string, string>();
  for (const entity of entities) for (const alias of entity.aliases) if (alias !== entity.id) aliasOf.set(alias, entity.id);
  const checkEdi = (file: string, id: string, what: string) => {
    if (ediIds.has(id)) return true;
    const canonical = aliasOf.get(id);
    error(file, canonical ? `${what} "${id}" is an alias; use the EDI ID "${canonical}"` : `${what} "${id}" is not in the EDI registry`);
    return false;
  };

  const subjects = new Map(content.subjects.map(subject => [subject.id, subject]));
  const checkSubject = (file: string, id: string, what: string) => {
    if (/^(org|product|deployment|network|ref):/.test(id)) {
      if (!subjects.has(id)) error(file, `${what} "${id}" is not defined in subjects.yaml`);
      return;
    }
    checkEdi(file, id, what);
  };
  const duplicates = (file: string, ids: readonly string[], what: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) error(file, `Duplicate ${what} "${id}"`);
      seen.add(id);
    }
  };
  const notFuture = (file: string, date: string | undefined, what: string) => {
    if (date && date > options.buildDate) error(file, `${what} ${date} is after the build date ${options.buildDate}`);
  };

  // Identities ---------------------------------------------------------------
  duplicates('subjects.yaml', content.subjects.map(s => s.id), 'subject ID');
  for (const subject of content.subjects) {
    if (ediIds.has(subject.id) || aliasOf.has(subject.id)) error('subjects.yaml', `${subject.id} collides with an EDI identity`);
    if (subject.relatedEdiId) checkEdi('subjects.yaml', subject.relatedEdiId, `${subject.id}.relatedEdiId`);
    if (subject.kind === 'deployment' && subject.chainId === undefined) warn('subjects.yaml', `${subject.id}: a deployment should name its chainId`);
  }

  const claims = new Map(content.claims.map(claim => [claim.id, claim]));
  duplicates('claims.yaml', content.claims.map(c => c.id), 'claim ID');
  for (const claim of content.claims) {
    for (const subject of claim.subjects) checkSubject('claims.yaml', subject, `${claim.id}.subjects`);
    notFuture('claims.yaml', claim.retrievedAt, `${claim.id}.retrievedAt`);
    notFuture('claims.yaml', claim.sourcePublishedAt, `${claim.id}.sourcePublishedAt`);
    if (claim.state !== 'forecast') notFuture('claims.yaml', claim.observedAt, `${claim.id}.observedAt`);
  }
  const checkClaims = (file: string, ids: readonly string[], what: string) => {
    for (const id of ids) if (!claims.has(id)) error(file, `${what} cites unknown claim "${id}"`);
  };

  const observations = new Map(content.observations.map(o => [o.id, o]));
  duplicates('observations.yaml', content.observations.map(o => o.id), 'observation ID');
  for (const observation of content.observations) {
    const where = `${observation.id}`;
    checkSubject('observations.yaml', observation.subjectId, `${where}.subjectId`);
    checkClaims('observations.yaml', observation.sourceClaimIds, where);
    notFuture('observations.yaml', observation.asOf, `${where}.asOf`);
    notFuture('observations.yaml', observation.interval?.end, `${where}.interval.end`);
    for (const input of observation.derivation?.inputObservationIds ?? [])
      if (!observations.has(input) || input === observation.id) error('observations.yaml', `${where}.derivation uses unknown observation "${input}"`);
    const cited = observation.sourceClaimIds.map(id => claims.get(id)).filter(claim => claim !== undefined);
    if (cited.length && !cited.some(claim => claim.subjects.includes(observation.subjectId)))
      warn('observations.yaml', `${where}: none of its source claims lists ${observation.subjectId} as a subject`);
    if (cited.some(claim => claim.state === 'forecast')) error('observations.yaml', `${where}: an observation cannot rest on a forecast`);
  }

  const relationships = new Map(content.relationships.map(r => [r.id, r]));
  duplicates('relationships.yaml', content.relationships.map(r => r.id), 'relationship ID');
  for (const relationship of content.relationships) {
    checkSubject('relationships.yaml', relationship.from, `${relationship.id}.from`);
    checkSubject('relationships.yaml', relationship.to, `${relationship.id}.to`);
    checkClaims('relationships.yaml', relationship.sourceClaimIds, relationship.id);
  }

  // Objects -------------------------------------------------------------------
  const liveObjectSlugs = new Map<string, string>();
  const objectFiles = new Map<string, string>();
  for (const entity of entities) liveObjectSlugs.set(defaultObjectSlug(entity.id), entity.id);
  for (const object of content.objects) {
    const {data, file, body} = object;
    if (!checkEdi(file, data.ediId, 'ediId')) continue;
    if (objectFiles.has(data.ediId)) error(file, `Second file for ${data.ediId} (first: ${objectFiles.get(data.ediId)})`);
    objectFiles.set(data.ediId, file);
    if (data.slug && data.slug !== defaultObjectSlug(data.ediId)) {
      const owner = liveObjectSlugs.get(data.slug);
      if (owner && owner !== data.ediId) error(file, `Slug "${data.slug}" already belongs to ${owner}`);
      liveObjectSlugs.set(data.slug, data.ediId);
    }
    const expected = `objects/${data.slug ?? defaultObjectSlug(data.ediId)}.md`;
    if (file !== expected) warn(file, `Name the file ${expected} so its slug is obvious`);
    notFuture(file, data.editorialReviewedAt, 'editorialReviewedAt');
    for (const link of data.officialLinks) notFuture(file, link.checkedAt, `officialLinks "${link.label}" checkedAt`);
    if (data.featuredObservationId) {
      const observation = observations.get(data.featuredObservationId);
      if (!observation) error(file, `featuredObservationId "${data.featuredObservationId}" is not in observations.yaml`);
      else if (observation.subjectId !== data.ediId) error(file, `featuredObservationId "${data.featuredObservationId}" is about ${observation.subjectId}, not ${data.ediId}`);
    }
    const allowed = new Set<string>(Object.values(OBJECT_SECTIONS));
    for (const section of body.sections) if (!allowed.has(section.heading)) error(file, `Unknown section "## ${section.heading}"; use ${[...allowed].map(h => `"## ${h}"`).join(', ')}`);
    if (body.intro.length) error(file, 'Text before the first ## section is not shown; move it into a section');
    if (data.contentStatus === 'edited-profile' && !body.sections.some(s => s.heading === OBJECT_SECTIONS.enables))
      error(file, `An edited profile needs a "## ${OBJECT_SECTIONS.enables}" section`);
    if (data.contentStatus === 'basic-record' && body.sections.length) warn(file, 'Basic records do not show profile sections; set contentStatus: edited-profile');
    checkTokens(file, body.tokens);
    literal(file, body.literalGrades);
  }

  // Stories --------------------------------------------------------------------
  const storyIds = new Map<string, string>();
  const storySlugs = new Map<string, string>();
  for (const story of content.stories) {
    const {data, file, body} = story;
    if (storyIds.has(data.id)) error(file, `Duplicate story ID "${data.id}" (also ${storyIds.get(data.id)})`);
    storyIds.set(data.id, file);
    const slug = data.slug ?? data.id;
    if (storySlugs.has(slug)) error(file, `Duplicate story slug "${slug}"`);
    storySlugs.set(slug, data.id);
    if (file !== `stories/${slug}.md`) warn(file, `Name the file stories/${slug}.md so its slug is obvious`);
    for (const id of data.objectIds) checkEdi(file, id, 'objectIds');
    duplicates(file, data.objectIds, 'object');
    for (const id of data.contextualSubjectIds) checkSubject(file, id, 'contextualSubjectIds');
    checkClaims(file, data.claimIds, 'claimIds');
    for (const id of data.observationIds) if (!observations.has(id)) error(file, `observationIds: unknown observation "${id}"`);
    for (const id of data.relationshipIds) if (!relationships.has(id)) error(file, `relationshipIds: unknown relationship "${id}"`);
    notFuture(file, data.reviewedAt, 'reviewedAt');
    const supporting = SUPPORTS[data.outcome.state];
    if (!data.claimIds.some(id => supporting.includes(claims.get(id)?.state as EvidenceState)))
      error(file, `outcome.state "${data.outcome.state}" needs a cited claim with state ${supporting.join(' or ')}`);
    const expected = Object.values(STORY_SECTIONS);
    const actual = body.sections.map(section => section.heading);
    if (actual.join('|') !== expected.join('|'))
      error(file, `Story sections must be exactly ${expected.map(h => `"## ${h}"`).join(', ')} in order (found ${actual.map(h => `"## ${h}"`).join(', ') || 'none'})`);
    for (const section of body.sections) if (!section.blocks.length) error(file, `Section "## ${section.heading}" is empty`);
    if (body.intro.length) error(file, 'Text before "## Before" is not shown; move it into a section');
    checkTokens(file, body.tokens);
    for (const token of body.tokens) {
      if (token.kind === 'claim' && !data.claimIds.includes(token.id)) error(file, `{{claim:${token.id}}} is cited in the body but missing from claimIds`);
      if (token.kind === 'obs' && !data.observationIds.includes(token.id)) error(file, `{{obs:${token.id}}} is used in the body but missing from observationIds`);
    }
    literal(file, body.literalGrades);
  }

  // Collections ------------------------------------------------------------------
  duplicates('collections.yaml', content.collections.map(c => c.id), 'collection');
  for (const collection of content.collections) {
    const storyOf = (id: string) => content.stories.find(story => story.data.id === id);
    const entrance = storyOf(collection.entrance.storyId);
    if (!entrance) error('collections.yaml', `${collection.id}.entrance: unknown story "${collection.entrance.storyId}"`);
    else if (!entrance.data.collections.includes(collection.id)) error('collections.yaml', `${collection.id}.entrance: story "${entrance.data.id}" is not in this collection`);
    for (const id of collection.storyIds) {
      const story = storyOf(id);
      if (!story) error('collections.yaml', `${collection.id}.storyIds: unknown story "${id}"`);
      else if (!story.data.collections.includes(collection.id)) error('collections.yaml', `${collection.id}.storyIds: story "${id}" does not list this collection`);
    }
    for (const id of collection.objectIds) checkEdi('collections.yaml', id, `${collection.id}.objectIds`);
  }
  for (const id of COLLECTION_IDS)
    if (content.stories.some(story => story.data.collections.includes(id)) && !content.collections.some(c => c.id === id))
      warn('collections.yaml', `Stories name the ${id} collection, but collections.yaml does not define it`);

  // Methodology, changes, redirects ------------------------------------------------------------
  if (content.methodology) {
    const headings = new Set(content.methodology.sections.map(section => section.heading));
    for (const heading of Object.values(METHODOLOGY_SECTIONS)) if (!headings.has(heading)) error('methodology.md', `Missing section "## ${heading}"`);
    checkTokens('methodology.md', content.methodology.tokens);
  }
  for (const change of content.changes) {
    notFuture('changes.yaml', change.date, 'date');
    for (const subject of change.subjects) {
      const known = ediIds.has(subject) || subjects.has(subject) || storyIds.has(subject) || claims.has(subject) || observations.has(subject) || relationships.has(subject);
      if (!known) error('changes.yaml', `${change.date}: unknown subject "${subject}"`);
    }
  }
  for (const [old, target] of Object.entries(content.redirects.objects)) {
    if (!checkEdi('redirects.yaml', target, `objects.${old}`)) continue;
    if (liveObjectSlugs.has(old)) error('redirects.yaml', `objects.${old} is a live slug and cannot redirect`);
  }
  for (const [old, target] of Object.entries(content.redirects.stories)) {
    if (!storyIds.has(target)) error('redirects.yaml', `stories.${old}: unknown story "${target}"`);
    if (storySlugs.has(old)) error('redirects.yaml', `stories.${old} is a live slug and cannot redirect`);
  }

  // Unused records are allowed but usually a mistake.
  const usedClaims = new Set<string>([
    ...content.stories.flatMap(story => [...story.data.claimIds]),
    ...content.observations.flatMap(o => o.sourceClaimIds),
    ...content.relationships.flatMap(r => r.sourceClaimIds),
    ...content.objects.flatMap(o => o.body.tokens.filter(t => t.kind === 'claim').map(t => t.id)),
  ]);
  for (const claim of content.claims) if (!usedClaims.has(claim.id)) warn('claims.yaml', `${claim.id} is not cited anywhere`);

  return issues;

  function checkTokens(file: string, tokens: readonly TokenRef[]) {
    for (const token of tokens) {
      switch (token.kind) {
        case 'object':
        case 'grade':
          checkEdi(file, token.id, `{{${token.kind}:…}}`);
          break;
        case 'subject':
          if (!subjects.has(token.id)) error(file, `{{subject:${token.id}}} is not defined in subjects.yaml`);
          break;
        case 'claim':
          if (!claims.has(token.id)) error(file, `{{claim:${token.id}}} is not in claims.yaml`);
          break;
        case 'obs':
          if (!observations.has(token.id)) error(file, `{{obs:${token.id}}} is not in observations.yaml`);
          break;
      }
    }
  }
  function literal(file: string, grades: readonly string[]) {
    if (grades.length)
      warn(file, `Literal grade text (${[...new Set(grades)].join(', ')}); prefer {{grade:<id>}} so the text follows EDI when an assessment changes`);
  }
}
