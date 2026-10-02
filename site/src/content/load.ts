/** Reads site/content/ into typed records. Pure Node; used by the build, the checker and tests. */
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {parse as parseYaml} from 'yaml';
import type {z} from 'zod';
import {parseMarkdown, type ParsedMarkdown} from './markdown.ts';
import {
  ChangesFile,
  ClaimsFile,
  CollectionsFile,
  FORBIDDEN_ASSESSMENT_KEYS,
  ObjectEditorialSchema,
  ObservationsFile,
  RedirectsSchema,
  RelationshipsFile,
  StorySchema,
  SubjectsFile,
  type ChangeEntry,
  type Collection,
  type ContextSubject,
  type ObjectEditorial,
  type Observation,
  type Redirects,
  type Relationship,
  type SourceClaim,
  type Story,
} from './schema.ts';

export interface Issue {
  level: 'error' | 'warning';
  file: string;
  message: string;
}
export interface ObjectFile {
  file: string;
  data: ObjectEditorial;
  body: ParsedMarkdown;
}
export interface StoryFile {
  file: string;
  data: Story;
  body: ParsedMarkdown;
}
export interface LoadedContent {
  root: string;
  objects: ObjectFile[];
  stories: StoryFile[];
  claims: SourceClaim[];
  observations: Observation[];
  relationships: Relationship[];
  subjects: ContextSubject[];
  collections: Collection[];
  changes: ChangeEntry[];
  redirects: Redirects;
  methodology: ParsedMarkdown | null;
  issues: Issue[];
}

const MAX_FILE_BYTES = 512 * 1024;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function readText(file: string, issues: Issue[], root: string): string | null {
  const size = readFileSync(file).byteLength;
  if (size > MAX_FILE_BYTES) {
    issues.push({level: 'error', file: path.relative(root, file), message: `File exceeds ${MAX_FILE_BYTES} bytes`});
    return null;
  }
  return readFileSync(file, 'utf8');
}

function yaml(source: string, file: string, issues: Issue[]): unknown {
  try {
    return parseYaml(source, {schema: 'core', uniqueKeys: true, maxAliasCount: 0, prettyErrors: true});
  } catch (error) {
    issues.push({level: 'error', file, message: `YAML: ${(error as Error).message.split('\n')[0]}`});
    return undefined;
  }
}

function zodIssues(error: z.ZodError, file: string, issues: Issue[], prefix = ''): void {
  for (const issue of error.issues) {
    const where = issue.path.length ? `${prefix}${issue.path.join('.')}: ` : prefix ? `${prefix}: ` : '';
    issues.push({level: 'error', file, message: `${where}${issue.message}`});
  }
}

function markdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, {withFileTypes: true})
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => path.join(dir, entry.name))
    .sort();
}

function loadYamlList<T>(root: string, name: string, schema: z.ZodType<T[]>, issues: Issue[]): T[] {
  const file = path.join(root, name);
  if (!existsSync(file)) return [];
  const source = readText(file, issues, root);
  if (source === null) return [];
  const value = yaml(source, name, issues);
  if (value === undefined || value === null) return [];
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  // Report each invalid entry with its ID when one is present.
  for (const issue of result.error.issues) {
    const [index, ...rest] = issue.path;
    const entry = Array.isArray(value) && typeof index === 'number' ? (value[index] as {id?: unknown}) : undefined;
    const label = entry && typeof entry.id === 'string' ? entry.id : index === undefined ? '' : `#${String(index)}`;
    issues.push({level: 'error', file: name, message: `${label}${rest.length ? `.${rest.join('.')}` : ''}: ${issue.message}`});
  }
  return [];
}

function loadFrontmatterFile(file: string, root: string, issues: Issue[]): {data: unknown; body: ParsedMarkdown} | null {
  const relative = path.relative(root, file);
  const source = readText(file, issues, root);
  if (source === null) return null;
  const match = FRONTMATTER.exec(source);
  if (!match) {
    issues.push({level: 'error', file: relative, message: 'Missing YAML frontmatter between --- lines'});
    return null;
  }
  const data = yaml(match[1], relative, issues);
  if (data === undefined) return null;
  const body = parseMarkdown(match[2]);
  for (const message of body.errors) issues.push({level: 'error', file: relative, message});
  return {data, body};
}

export function loadContent(root: string): LoadedContent {
  const issues: Issue[] = [];
  const objects: ObjectFile[] = [];
  for (const file of markdownFiles(path.join(root, 'objects'))) {
    const loaded = loadFrontmatterFile(file, root, issues);
    if (!loaded) continue;
    const relative = path.relative(root, file);
    if (loaded.data && typeof loaded.data === 'object') {
      const forbidden = FORBIDDEN_ASSESSMENT_KEYS.filter(key => key in (loaded.data as object));
      if (forbidden.length) {
        issues.push({level: 'error', file: relative, message: `${forbidden.join(', ')}: assessments, controls and review dates come from EDI and cannot be written in editorial frontmatter`});
        continue;
      }
    }
    const result = ObjectEditorialSchema.safeParse(loaded.data);
    if (!result.success) {
      zodIssues(result.error, relative, issues);
      continue;
    }
    objects.push({file: relative, data: result.data, body: loaded.body});
  }

  const stories: StoryFile[] = [];
  for (const file of markdownFiles(path.join(root, 'stories'))) {
    const loaded = loadFrontmatterFile(file, root, issues);
    if (!loaded) continue;
    const relative = path.relative(root, file);
    const result = StorySchema.safeParse(loaded.data);
    if (!result.success) {
      zodIssues(result.error, relative, issues);
      continue;
    }
    stories.push({file: relative, data: result.data, body: loaded.body});
  }

  let redirects: Redirects = {objects: {}, stories: {}};
  const redirectsFile = path.join(root, 'redirects.yaml');
  if (existsSync(redirectsFile)) {
    const source = readText(redirectsFile, issues, root);
    const value = source === null ? undefined : yaml(source, 'redirects.yaml', issues);
    if (value !== undefined && value !== null) {
      const result = RedirectsSchema.safeParse(value);
      if (result.success) redirects = result.data;
      else zodIssues(result.error, 'redirects.yaml', issues);
    }
  }

  let methodology: ParsedMarkdown | null = null;
  const methodologyFile = path.join(root, 'methodology.md');
  if (existsSync(methodologyFile)) {
    const source = readText(methodologyFile, issues, root);
    if (source !== null) {
      methodology = parseMarkdown(source.replace(FRONTMATTER, '$2'));
      for (const message of methodology.errors) issues.push({level: 'error', file: 'methodology.md', message});
    }
  }

  return {
    root,
    objects,
    stories,
    claims: loadYamlList(root, 'claims.yaml', ClaimsFile, issues),
    observations: loadYamlList(root, 'observations.yaml', ObservationsFile, issues),
    relationships: loadYamlList(root, 'relationships.yaml', RelationshipsFile, issues),
    subjects: loadYamlList(root, 'subjects.yaml', SubjectsFile, issues),
    collections: loadYamlList(root, 'collections.yaml', CollectionsFile, issues),
    changes: loadYamlList(root, 'changes.yaml', ChangesFile, issues),
    redirects,
    methodology,
    issues,
  };
}
