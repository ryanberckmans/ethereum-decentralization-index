/**
 * The methodology: EDI's own explanation of its grades (in EDI's words and
 * translations), the directory's editorial rules, coverage counts computed
 * from EDI for the reading date, the three clocks and the correction route.
 * Editorial prose from content/methodology.md replaces the built-in text of a
 * section when present.
 */
import type {ReactNode} from 'react';
import {assessment, displayedLevel, locales as ediLocales, type DLevel} from 'ethereum-decentralization-index';
import {EDI_LOCALE, PRODUCT} from '../config.ts';
import {METHODOLOGY_SECTIONS} from '../content/schema.ts';
import {EVIDENCE_STATES} from '../content/vocab.ts';
import type {Block} from '../content/markdown.ts';
import {fmt, formatCount, formatDate, plural, type Plural} from '../i18n/format.ts';
import {Blocks} from '../components/Markdown.tsx';
import {Dated} from '../components/Dated.tsx';
import {GradeBadge} from '../components/Grade.tsx';
import {paths} from '../model/urls.ts';
import {gradeView} from '../model/views.ts';
import {Citations} from '../server/citations.ts';
import {datedValues} from '../server/dated.ts';
import {catalog} from '../server/site.ts';
import {Crumbs, EvidenceTag, contentLang, SourcesList, tokenContext, type PageEnv} from './Editorial.tsx';

const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const satisfies readonly DLevel[];

interface Coverage {
  complete: number;
  partial: number;
  unknown: number;
  permanent: number;
  /** Per displayed level: complete grades, and partial grades whose known floor is that level. */
  levels: {complete: number; floor: number}[];
}

function coverageOn(date: string): Coverage {
  const coverage: Coverage = {complete: 0, partial: 0, unknown: 0, permanent: 0, levels: LEVELS.map(() => ({complete: 0, floor: 0}))};
  for (const object of catalog.objects) {
    const raw = catalog.rawOn(object.id, date);
    const level = displayedLevel(raw.mechanism);
    if (raw.review.permanent) coverage.permanent++;
    if (level === null) coverage.unknown++;
    else if (raw.mechanism.status === 'assessed') {
      coverage.complete++;
      coverage.levels[level].complete++;
    } else {
      coverage.partial++;
      coverage.levels[level].floor++;
    }
  }
  return coverage;
}

/** Editorial sections from methodology.md, by key. */
function editorialSections(): Partial<Record<keyof typeof METHODOLOGY_SECTIONS, Block[]>> {
  const out: Partial<Record<keyof typeof METHODOLOGY_SECTIONS, Block[]>> = {};
  const sections = catalog.methodology?.sections ?? [];
  for (const [key, heading] of Object.entries(METHODOLOGY_SECTIONS) as [keyof typeof METHODOLOGY_SECTIONS, string][]) {
    const section = sections.find(candidate => candidate.heading === heading);
    if (section?.blocks.length) out[key] = section.blocks;
  }
  return out;
}

function Section({id, title, children}: {id: string; title: string; children: ReactNode}) {
  return (
    <section className="section method-section" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {children}
    </section>
  );
}

function Paragraphs({items}: {items: readonly string[]}) {
  return (
    <div className="prose">
      {items.map(item => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}

export function MethodologyPage({env}: {env: PageEnv}) {
  const {m, locale, date} = env;
  const edi = ediLocales[EDI_LOCALE[locale]] ?? ediLocales.en;
  const lang = contentLang(env);
  const editorial = editorialSections();
  const citations = new Citations();
  for (const blocks of Object.values(editorial)) citations.addBlocks(blocks);
  const ctx = tokenContext(env, citations);
  const prose = (blocks: Block[] | undefined, fallback: readonly string[]) =>
    blocks ? (
      <div className="prose" lang={lang}>
        <Blocks blocks={blocks} ctx={ctx} />
      </div>
    ) : (
      <Paragraphs items={fallback} />
    );
  const coverage = datedValues(date, coverageOn);
  const edition = catalog.edition;
  const s = m.methodology.sections;
  const toc: [string, string][] = [
    ['meaning', s.meaning],
    ['spectrum', s.spectrum],
    ['scopes', s.scopes],
    ['inclusion', s.inclusion],
    ['success', s.success],
    ['figures', s.figures],
    ['coverage', s.coverage],
    ['dates', s.dates],
    ['corrections', s.corrections],
  ];
  const guide: [string, string][] = [
    [edi.foundationTitle, edi.foundationBody],
    [edi.dependencyTitle, edi.dependencyBody],
    [edi.unknownTitle, edi.unknownBody],
    [edi.judgmentTitle, edi.judgmentBody],
  ];
  const stats = (value: Coverage): [number, Plural][] => [
    [catalog.objects.length, m.methodology.coverageRecords],
    [value.complete, m.methodology.coverageComplete],
    [value.partial, m.methodology.coveragePartial],
    [value.unknown, m.methodology.coverageUnknown],
    [value.permanent, m.methodology.coveragePermanent],
    [catalog.objects.filter(object => object.deployments.length).length, m.methodology.coverageAddresses],
    [catalog.objects.filter(object => object.edited).length, m.methodology.coverageEdited],
    [catalog.stories.length, m.methodology.coverageStories],
    [catalog.observations.size, m.methodology.coverageObservations],
    [catalog.claims.size, m.methodology.coverageClaims],
  ];
  /** A coverage figure: the number set large, the rest of the phrase as its label, in either order. */
  const count = (forms: Plural, n: number) => {
    const text = plural(n, locale, forms);
    const number = formatCount(n, locale);
    const at = text.indexOf(number);
    if (at < 0) return <span className="stat-label">{text}</span>;
    const before = text.slice(0, at).trim();
    const after = text.slice(at + number.length).trim();
    return (
      <>
        {before ? <span className="stat-label">{before}</span> : null}
        <strong className="stat-n">{number}</strong>
        {after ? <span className="stat-label">{after}</span> : null}
      </>
    );
  };

  return (
    <div className="shell methodology">
      <header className="page-head">
        <Crumbs env={env} items={[{label: m.nav.directory, href: paths.home(locale)}, {label: m.methodology.title}]} />
        <h1>{m.methodology.title}</h1>
        <p className="lede">{m.methodology.lede}</p>
      </header>

      <div className="method-layout">
        <nav className="method-toc" aria-labelledby="toc-title">
          <h2 id="toc-title" className="aside-title">
            {m.methodology.contents}
          </h2>
          <ol>
            {toc.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`}>{label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="method-main">
          <Section id="meaning" title={s.meaning}>
            <p className="method-question">{edi.guideQuestion}</p>
            <div className="prose">
              <p>{edi.guideIntro}</p>
            </div>
            <ul className="guide-cards">
              {guide.map(([title, body]) => (
                <li key={title} className="guide-card">
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
            </ul>
            <p className="section-note">
              {m.methodology.fromEdi} · <a href={PRODUCT.repository}>{PRODUCT.indexName}</a>
            </p>
            <div className="prose">
              <p>{m.methodology.authority}</p>
            </div>
            {editorial.meaning ? prose(editorial.meaning, []) : null}
          </Section>

          <Section id="spectrum" title={s.spectrum}>
            <Dated
              block
              segments={coverage}
              render={value => (
                <>
                  <ol className="spectrum">
                    {LEVELS.map(level => {
                      const tier = edi.tiers[level];
                      const counts = value.levels[level];
                      return (
                        <li key={level}>
                          <span className="spectrum-badge">
                            <GradeBadge grade={gradeView(assessment(level), locale)} m={m} />
                          </span>
                          <span className="spectrum-short">{tier.label}</span>
                          <span className="spectrum-def">{tier.definition}</span>
                          <span className="spectrum-count">
                            {counts.complete || counts.floor ? (
                              <>
                                {counts.complete ? <span>{plural(counts.complete, locale, m.methodology.levelComplete)}</span> : null}
                                {counts.floor ? <span>{plural(counts.floor, locale, m.methodology.levelFloor)}</span> : null}
                              </>
                            ) : (
                              <span className="muted">{m.methodology.levelNone}</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  <p className="section-note">
                    {fmt(m.methodology.spectrumNote, {date: formatDate(date, locale)})} {plural(value.unknown, locale, m.methodology.unknownCount)}
                  </p>
                </>
              )}
            />
          </Section>

          <Section id="scopes" title={s.scopes}>
            <Paragraphs items={m.methodology.scopes} />
          </Section>

          <Section id="inclusion" title={s.inclusion}>
            {prose(editorial.inclusion, m.methodology.inclusion)}
          </Section>

          <Section id="success" title={s.success}>
            {prose(editorial.success, m.methodology.success)}
            <p className="method-lead">{m.methodology.evidenceStates}</p>
            <dl className="evidence-states">
              {EVIDENCE_STATES.map(state => (
                <div key={state}>
                  <dt>
                    <EvidenceTag state={state} env={env} />
                  </dt>
                  <dd>{m.evidenceHelp[state]}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="figures" title={s.figures}>
            <Paragraphs items={m.methodology.figures} />
            <p className="method-link">
              <a href={paths.compare(locale)}>{m.methodology.compareLink}</a>
            </p>
          </Section>

          <Section id="coverage" title={s.coverage}>
            <Dated
              block
              segments={coverage}
              render={value => (
                <>
                  <ul className="stat-grid">
                    {stats(value).map(([n, forms]) => (
                      <li key={forms.other} className="stat">
                        {count(forms, n)}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            />
            <p className="section-note">
              {fmt(m.methodology.coverageOn, {date: formatDate(date, locale)})} {m.methodology.coverageNote}
            </p>
            {editorial.coverage ? prose(editorial.coverage, []) : null}
          </Section>

          <Section id="dates" title={s.dates}>
            <div className="prose">
              <p>{m.methodology.clocks}</p>
              <ol>
                <li>{m.methodology.datesEdi}</li>
                <li>{m.methodology.datesObservations}</li>
                <li>{m.methodology.datesEditorial}</li>
              </ol>
            </div>
            {editorial.dates ? prose(editorial.dates, []) : null}
            <h3>{m.methodology.edition}</h3>
            <dl className="facts edition-facts">
              <div className="facts-row">
                <dt>{m.methodology.editionId}</dt>
                <dd>
                  <code>{edition.id}</code>
                </dd>
              </div>
              <div className="facts-row">
                <dt>{m.methodology.evaluated}</dt>
                <dd>
                  <time dateTime={date} data-evaluated-text="" data-template="{date}">
                    {formatDate(date, locale)}
                  </time>{' '}
                  (UTC)
                </dd>
              </div>
              <div className="facts-row">
                <dt>{m.methodology.registryDate}</dt>
                <dd>{formatDate(edition.ediRegistryDate, locale)}</dd>
              </div>
              <div className="facts-row">
                <dt>{m.methodology.policyDate}</dt>
                <dd>{formatDate(edition.ediPolicyDate, locale)}</dd>
              </div>
              <div className="facts-row">
                <dt>{m.methodology.rubric}</dt>
                <dd>{edition.ediRubricVersion}</dd>
              </div>
              <div className="facts-row">
                <dt>{m.methodology.commit}</dt>
                <dd>
                  {edition.ediCommit === 'unknown' ? (
                    <code>{edition.ediCommit}</code>
                  ) : (
                    <a href={`${PRODUCT.repository}/tree/${edition.ediCommit}`}>
                      <code>{edition.ediCommit.slice(0, 12)}</code>
                    </a>
                  )}
                </dd>
              </div>
              {edition.observedThrough ? (
                <div className="facts-row">
                  <dt>{m.methodology.observedThrough}</dt>
                  <dd>{formatDate(edition.observedThrough, locale)}</dd>
                </div>
              ) : null}
              <div className="facts-row">
                <dt>{m.methodology.builtAt}</dt>
                <dd>{formatDate(edition.builtAt.slice(0, 10), locale)}</dd>
              </div>
            </dl>
          </Section>

          <Section id="corrections" title={s.corrections}>
            {prose(editorial.corrections, m.methodology.corrections)}
            <ul className="link-list">
              <li>
                <a href={`${PRODUCT.repository}/issues`}>{m.methodology.reportIssue}</a>
              </li>
              <li>
                <a href={paths.changes(locale)}>{m.methodology.changesLink}</a>
              </li>
            </ul>
          </Section>

          {citations.size ? (
            <section className="section" id="sources" aria-labelledby="sources-title">
              <h2 id="sources-title">{m.story.sources}</h2>
              <SourcesList citations={citations} env={env} />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
