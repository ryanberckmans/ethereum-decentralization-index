/**
 * The data page: every export with what it holds, the rules for using the
 * figures and grades, and the files for agents and crawlers.
 */
import {PRODUCT} from '../config.ts';
import {fmt} from '../i18n/format.ts';
import {AGENT_FILES, EXPORTS, paths} from '../model/urls.ts';
import {SCHEMA_VERSION} from '../server/exports.ts';
import {catalog} from '../server/site.ts';
import {Crumbs, type PageEnv} from './Editorial.tsx';

export function DataPage({env}: {env: PageEnv}) {
  const {m, locale} = env;
  const d = m.data;
  const example = catalog.object('weth9') ?? catalog.objects[0];
  const files: {key: keyof typeof d.items; links: [string, 'json' | 'csv'][]; count?: number}[] = [
    {key: 'edition', links: [[EXPORTS.edition, 'json']]},
    {key: 'directory', links: [[EXPORTS.directoryJson, 'json'], [EXPORTS.directoryCsv, 'csv']], count: catalog.objects.length},
    {key: 'observations', links: [[EXPORTS.observationsJson, 'json'], [EXPORTS.observationsCsv, 'csv']], count: catalog.observations.size},
    {key: 'claims', links: [[EXPORTS.claimsJson, 'json']], count: catalog.claims.size},
    {key: 'relationships', links: [[EXPORTS.relationshipsJson, 'json']], count: catalog.relationships.length},
    {key: 'stories', links: [[EXPORTS.storiesJson, 'json']], count: catalog.stories.length},
    {key: 'object', links: example ? [[EXPORTS.object(example.slug), 'json']] : []},
  ];
  return (
    <div className="shell data-page">
      <header className="page-head">
        <Crumbs env={env} items={[{label: m.nav.directory, href: paths.home(locale)}, {label: d.title}]} />
        <h1>{d.title}</h1>
        <p className="lede">{d.intro}</p>
      </header>

      <section className="section" aria-labelledby="files-title">
        <h2 id="files-title">
          {d.files} <span className="muted data-schema">{fmt(d.schema, {version: SCHEMA_VERSION})}</span>
        </h2>
        <ul className="data-list">
          {files.map(file => {
            const [title, description] = d.items[file.key];
            return (
              <li key={file.key}>
                <h3 className="data-title">{title}</h3>
                <p>{fmt(description, {count: file.count ?? 0})}</p>
                <p className="data-links">
                  {file.links.map(([href, format]) => (
                    <a key={href} href={href} className="data-link">
                      <span className="data-format">{d.format[format]}</span>
                      <code>{href}</code>
                    </a>
                  ))}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="section" aria-labelledby="rules-title">
        <h2 id="rules-title">{d.rules}</h2>
        <ul className="prose-list">
          {d.rulesItems.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="agents-title">
        <h2 id="agents-title">{d.agents}</h2>
        <ul className="data-list">
          {([
            ['llms', AGENT_FILES.llms],
            ['agentsMd', AGENT_FILES.agents],
            ['sitemap', AGENT_FILES.sitemap],
          ] as const).map(([key, href]) => {
            const [title, description] = d.agentsItems[key];
            return (
              <li key={key}>
                <h3 className="data-title">
                  <a href={href}>{title}</a>
                </h3>
                <p>{description}</p>
              </li>
            );
          })}
        </ul>
        <p className="section-note">
          {d.upstream} <a href={PRODUCT.repository}>{m.footer.source}</a>
        </p>
      </section>
    </div>
  );
}
