/**
 * Validate editorial content against its schema and the EDI registry.
 *   npm run content:check                 # site/content
 *   npm run content:check -- docs/content-examples
 * Exits non-zero on errors; warnings are printed but do not fail.
 */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {registry} from 'ethereum-decentralization-index/registry';
import {loadContent} from '../src/content/load.ts';
import {validateContent} from '../src/content/validate.ts';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(site, process.argv[2] ?? 'content');
const buildDate = process.env.BUILD_DATE ?? new Date().toISOString().slice(0, 10);

const content = loadContent(root);
const issues = [...content.issues, ...validateContent(content, registry.entities, {buildDate})];
const errors = issues.filter(issue => issue.level === 'error');
for (const issue of issues) console.log(`${issue.level === 'error' ? 'error  ' : 'warning'} ${issue.file}: ${issue.message}`);
console.log(
  `${path.relative(site, root) || '.'}: ${content.objects.length} object files, ${content.stories.length} stories, ${content.claims.length} claims, ` +
    `${content.observations.length} observations, ${content.relationships.length} relationships, ${content.subjects.length} subjects; ` +
    `${errors.length} errors, ${issues.length - errors.length} warnings`,
);
process.exit(errors.length ? 1 : 0);
