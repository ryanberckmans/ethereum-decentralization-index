/**
 * Everything a story page shows, in reading order, with sources numbered as
 * a reader meets them.
 */
import type {Block} from '../content/markdown.ts';
import {STORY_SECTIONS, type Observation, type Relationship} from '../content/schema.ts';
import type {StoryRecord} from '../model/catalog.ts';
import {Citations} from './citations.ts';
import {catalog} from './site.ts';

export type StorySectionKey = keyof typeof STORY_SECTIONS;

export interface StoryModel {
  story: StoryRecord;
  intro: Block[];
  sections: {key: StorySectionKey; blocks: Block[]}[];
  observations: Observation[];
  relationships: Relationship[];
  citations: Citations;
}

export function storyModel(story: StoryRecord): StoryModel {
  const sections = (Object.entries(STORY_SECTIONS) as [StorySectionKey, string][]).flatMap(([key, heading]) => {
    const section = story.body.sections.find(s => s.heading === heading);
    return section ? [{key, blocks: section.blocks}] : [];
  });
  const observations = story.data.observationIds.map(id => catalog.observations.get(id)).filter((o): o is Observation => o !== undefined);
  const relationships = story.data.relationshipIds
    .map(id => catalog.relationships.find(relationship => relationship.id === id))
    .filter((r): r is Relationship => r !== undefined);

  const citations = new Citations();
  citations.addBlocks(story.body.intro);
  for (const section of sections) citations.addBlocks(section.blocks);
  for (const relationship of relationships) citations.addAll(relationship.sourceClaimIds);
  for (const observation of observations) citations.addAll(observation.sourceClaimIds);
  // Sources the story lists but does not cite in its text still appear, after the cited ones.
  citations.addAll(story.data.claimIds);

  return {story, intro: story.body.intro, sections, observations, relationships, citations};
}
