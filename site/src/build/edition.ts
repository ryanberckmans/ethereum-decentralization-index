/**
 * The edition importer. Runs in Node at build time (and in `astro dev`), never
 * in the browser.
 *
 * It validates editorial content against its schema and the EDI registry,
 * checks that the bundled EDI registry is the one its snapshot describes, and
 * records which repository commit the edition was built from. Any error stops
 * the build, so a failed import can never replace the last valid edition.
 *
 * @cc [label:product] last-valid-edition-survives
 * Invalid or unverifiable input fails the build instead of publishing a
 * partial edition. Missing editorial data stays missing: nothing is filled in.
 */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {registry} from 'ethereum-decentralization-index/registry';
import {rubric} from 'ethereum-decentralization-index';
import {loadContent, type Issue, type LoadedContent} from '../content/load.ts';
import {validateContent} from '../content/validate.ts';
import {assessmentTimelines} from '../model/assess.ts';
import type {ContentData, EditionBundle, EditionInfo} from '../model/edition-types.ts';

export const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const REPO_ROOT = path.resolve(SITE_ROOT, '..');
export const DEFAULT_CONTENT_DIR = path.join(SITE_ROOT, 'content');

/** Files the edition depends on, for watch mode. */
export function contentFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (current: string) => {
    if (!existsSync(current)) return;
    for (const entry of readdirSync(current, {withFileTypes: true})) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(md|ya?ml)$/.test(entry.name)) out.push(full);
    }
  };
  walk(dir);
  return out.sort();
}

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** The commit this edition is built from. GitHub Actions provides it; elsewhere, ask git. */
function repositoryCommit(): {commit: string; dirty: boolean} {
  const fromEnv = process.env.GITHUB_SHA;
  if (fromEnv && /^[0-9a-f]{40}$/.test(fromEnv)) return {commit: fromEnv, dirty: false};
  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
    const status = execFileSync('git', ['status', '--porcelain', '--', 'data', 'dist', 'site/content'], {cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
    if (/^[0-9a-f]{40}$/.test(commit)) return {commit, dirty: status.length > 0};
  } catch {
    // No git checkout (for example a source tarball): the edition says so.
  }
  return {commit: 'unknown', dirty: true};
}

export interface BuildEditionOptions {
  contentDir?: string;
  /** UTC calendar date used to reject future-dated editorial records. Defaults to today. */
  buildDate?: string;
  now?: Date;
}

export interface BuildEditionResult {
  bundle: EditionBundle;
  warnings: Issue[];
  files: string[];
}

export class EditionError extends Error {
  readonly issues: Issue[];
  constructor(issues: Issue[]) {
    super(`The edition is invalid and was not built:\n${issues.map(issue => `  ${issue.file}: ${issue.message}`).join('\n')}`);
    this.name = 'EditionError';
    this.issues = issues;
  }
}

function stripContent(content: LoadedContent): ContentData {
  const body = (value: LoadedContent['objects'][number]['body']) => ({intro: value.intro, sections: value.sections, tokens: value.tokens});
  return {
    objects: content.objects.map(object => ({file: object.file, data: object.data, body: body(object.body)})),
    stories: content.stories.map(story => ({file: story.file, data: story.data, body: body(story.body)})),
    claims: content.claims,
    observations: content.observations,
    relationships: content.relationships,
    subjects: content.subjects,
    collections: content.collections,
    changes: content.changes,
    redirects: content.redirects,
    methodology: content.methodology ? body(content.methodology) : null,
  };
}

export function buildEdition(options: BuildEditionOptions = {}): BuildEditionResult {
  const now = options.now ?? new Date();
  const buildDate = options.buildDate ?? now.toISOString().slice(0, 10);
  const contentDir = path.resolve(options.contentDir ?? process.env.EDI_CONTENT_DIR ?? DEFAULT_CONTENT_DIR);

  // The registry the site imports must be the registry its snapshot describes.
  const registryFile = path.join(REPO_ROOT, 'data', 'control-registry.json');
  const latestFile = path.join(REPO_ROOT, 'data', 'latest.json');
  const registryBytes = readFileSync(registryFile);
  const registryHash = sha256(registryBytes);
  const latest = JSON.parse(readFileSync(latestFile, 'utf8')) as {asOf?: string; registrySha256?: string; entityCount?: number};
  const issues: Issue[] = [];
  if (latest.registrySha256 !== registryHash)
    issues.push({level: 'error', file: '../data/latest.json', message: `registrySha256 ${String(latest.registrySha256)} does not match data/control-registry.json (${registryHash})`});
  if (latest.entityCount !== registry.entities.length)
    issues.push({level: 'error', file: '../data/latest.json', message: `entityCount ${String(latest.entityCount)} does not match the bundled registry (${registry.entities.length})`});
  // dist/registry imports data/control-registry.json directly, so this is the same data the site evaluates.
  const onDisk = JSON.parse(registryBytes.toString('utf8')) as {lastUpdatedAt: string};
  if (onDisk.lastUpdatedAt !== registry.lastUpdatedAt || latest.asOf !== registry.lastUpdatedAt)
    issues.push({level: 'error', file: '../data/latest.json', message: `Snapshot date ${String(latest.asOf)} does not match the registry date ${registry.lastUpdatedAt}`});

  const content = loadContent(contentDir);
  issues.push(...content.issues, ...validateContent(content, registry.entities, {buildDate}));
  const errors = issues.filter(issue => issue.level === 'error');
  if (errors.length) throw new EditionError(errors);

  const files = contentFiles(contentDir);
  const editorial = createHash('sha256');
  for (const file of files) {
    editorial.update(path.relative(contentDir, file));
    editorial.update('\0');
    editorial.update(readFileSync(file));
    editorial.update('\0');
  }
  const editorialRevision = editorial.digest('hex');
  const {commit, dirty} = repositoryCommit();

  const observationDates = content.observations.flatMap(o => [o.asOf, o.interval?.end].filter((d): d is string => !!d)).sort();
  const edition: EditionInfo = {
    schemaVersion: 1,
    id: `${registry.lastUpdatedAt}.${editorialRevision.slice(0, 8)}`,
    ediCommit: commit,
    ediCommitDirty: dirty,
    ediRegistrySha256: registryHash,
    ediRegistryDate: registry.lastUpdatedAt,
    ediPolicyDate: registry.policyUpdatedAt,
    ediRubricVersion: rubric.rubricVersion,
    editorialRevision,
    builtAt: now.toISOString(),
    ...(observationDates.length ? {observedThrough: observationDates[observationDates.length - 1]} : {}),
  };
  return {
    bundle: {edition, content: stripContent(content), assessments: assessmentTimelines()},
    warnings: issues.filter(issue => issue.level === 'warning'),
    files: [...files, registryFile, latestFile],
  };
}
