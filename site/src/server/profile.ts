/**
 * Everything an object profile shows, gathered in reading order so sources
 * are numbered as a reader meets them.
 */
import type {Block} from '../content/markdown.ts';
import {OBJECT_SECTIONS, type Observation, type Relationship} from '../content/schema.ts';
import type {ObjectRecord, StoryRecord} from '../model/catalog.ts';
import type {RawState, Segment} from '../model/edition-types.ts';
import {dependentsOf, entity} from '../model/registry.ts';
import {Citations, observationTokens} from './citations.ts';
import {catalog} from './site.ts';

export interface PathNode {
  id: string;
  /** 0 for the object itself. */
  depth: number;
}

export interface ProfileModel {
  object: ObjectRecord;
  /** EDI's raw results from the evaluation date on. */
  raw: Segment<RawState>[];
  sections: {enables?: Block[]; control?: Block[]; observed?: Block[]};
  observations: Observation[];
  /** Observations listed on the page (inline values link to them). */
  listed: Set<string>;
  relationships: Relationship[];
  stories: StoryRecord[];
  /** The EDI dependency tree, depth first, starting with the object. */
  path: PathNode[];
  dependents: ObjectRecord[];
  citations: Citations;
}

function observationDate(observation: Observation): string {
  return observation.asOf ?? observation.interval?.end ?? '';
}

/** EDI's dependency tree for control, depth first. A record already on the branch is not repeated. */
export function dependencyPath(id: string): PathNode[] {
  const out: PathNode[] = [];
  const visit = (current: string, depth: number, branch: readonly string[]) => {
    out.push({id: current, depth});
    for (const dependency of entity(current)?.dependencies ?? [])
      if (!branch.includes(dependency) && entity(dependency)) visit(dependency, depth + 1, [...branch, dependency]);
  };
  visit(id, 0, [id]);
  return out;
}

export function profileModel(object: ObjectRecord, date: string): ProfileModel {
  const body = object.editorial?.body;
  const section = (heading: string) => body?.sections.find(s => s.heading === heading)?.blocks;
  const sections = {
    enables: section(OBJECT_SECTIONS.enables),
    control: section(OBJECT_SECTIONS.control),
    observed: section(OBJECT_SECTIONS.observed),
  };

  // Observations: the ones the text uses, in reading order, then the rest about this object, newest first.
  const inline = [...observationTokens(sections.enables), ...observationTokens(sections.control), ...observationTokens(sections.observed)];
  const about = catalog
    .observationsAbout(object.id)
    .sort((a, b) => observationDate(b).localeCompare(observationDate(a)) || a.metric.localeCompare(b.metric));
  const ids = [...new Set([...inline, ...about.map(o => o.id)])];
  const observations = ids.map(id => catalog.observations.get(id)).filter((o): o is Observation => o !== undefined);

  const relationships = [...catalog.relationshipsOf(object.id)];
  const stories = catalog.storiesWith(object.id);

  // Number sources in page order: enables, control in context, observed use, observations, connections.
  const citations = new Citations();
  citations.addBlocks(sections.enables);
  citations.addBlocks(sections.control);
  citations.addBlocks(sections.observed);
  for (const observation of observations) citations.addAll(observation.sourceClaimIds);
  for (const relationship of relationships) citations.addAll(relationship.sourceClaimIds);

  const dependents = dependentsOf(object.id)
    .map(id => catalog.object(id))
    .filter((o): o is ObjectRecord => o !== undefined)
    .sort((a, b) => a.rank - b.rank);

  return {
    object,
    raw: catalog.timelineFrom(object.id, date),
    sections,
    observations,
    listed: new Set(observations.map(o => o.id)),
    relationships,
    stories,
    path: dependencyPath(object.id),
    dependents,
    citations,
  };
}
