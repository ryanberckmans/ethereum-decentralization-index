/**
 * A story: the claim, its outcome and evidence state, what Ethereum
 * contributes, the control boundary, then the five sections, the connections
 * as a diagram and a list, the observations and the numbered sources.
 */
import {fmt, formatDate} from '../i18n/format.ts';
import {paths} from '../model/urls.ts';
import {Blocks} from '../components/Markdown.tsx';
import {ReviewNote} from '../components/Grade.tsx';
import {Dated} from '../components/Dated.tsx';
import type {StoryModel} from '../server/story.ts';
import {catalog} from '../server/site.ts';
import {RelationshipDiagram} from './Diagram.tsx';
import {
  Crumbs,
  DatedGrade,
  EvidenceTag,
  ObjectLink,
  ObservationList,
  RelationshipList,
  SourcesList,
  contentLang,
  datedFor,
  tokenContext,
  type PageEnv,
} from './Editorial.tsx';

export function StoryPage({model, env}: {model: StoryModel; env: PageEnv}) {
  const {story, sections, observations, relationships, citations} = model;
  const {m, locale} = env;
  const data = story.data;
  const lang = contentLang(env);
  const listed = new Set(observations.map(o => o.id));
  const ctx = tokenContext(env, citations, listed);
  return (
    <article className="shell story">
      <Crumbs env={env} items={[{label: m.nav.stories, href: paths.stories(locale)}, {label: data.title}]} />
      <header className="story-head">
        <p className="eyebrow story-collections">
          {data.collections.map((id, i) => (
            <span key={id}>
              {i ? ' · ' : ''}
              <a href={paths.collection(locale, id)}>{catalog.collections.get(id)?.title ?? m.collections[id]}</a>
            </span>
          ))}
        </p>
        <h1 lang={lang}>{data.title}</h1>
        <p className="lede" lang={lang}>
          {data.dek}
        </p>
        <p className="story-meta">
          <span>{fmt(m.story.reviewed, {date: formatDate(data.reviewedAt, locale, 'long')})}</span>
          <a href="#sources">{fmt(m.story.sourcesCount, {count: citations.size})}</a>
        </p>
      </header>

      <section className="story-glance" aria-labelledby="glance-title">
        <h2 id="glance-title" className="sr-only">
          {m.story.glance}
        </h2>
        <blockquote className="thesis">
          <p className="eyebrow">{m.story.thesis}</p>
          <p lang={lang}>{data.thesis}</p>
        </blockquote>
        <div className="story-facts">
          <div className="story-fact">
            <h3 className="eyebrow">{m.story.outcome}</h3>
            <p className="story-fact-tags">
              <span className="mechanism-tag">{m.mechanisms[data.outcome.mechanism]}</span>
              <EvidenceTag state={data.outcome.state} env={env} />
            </p>
            <p lang={lang}>{data.outcome.statement}</p>
          </div>
          <div className="story-fact">
            <h3 className="eyebrow">{m.story.contribution}</h3>
            <p lang={lang}>{data.ethereumContribution}</p>
          </div>
          <div className="story-fact">
            <h3 className="eyebrow">{m.story.boundary}</h3>
            <p lang={lang}>{data.controlBoundary}</p>
          </div>
        </div>
      </section>

      <div className="story-layout">
        <aside className="story-aside" aria-labelledby="objects-title">
          <h2 id="objects-title" className="eyebrow">
            {m.story.objects}
          </h2>
          <ul className="list-plain">
            {data.objectIds.map(id => {
              const object = catalog.object(id);
              if (!object) return null;
              return (
                <li className="object-mini" key={id}>
                  <span className="object-mini-name">
                    <ObjectLink id={id} env={env} />
                  </span>
                  <DatedGrade id={id} env={env} size="sm" />
                  <span className="object-mini-line">
                    {object.role ? m.roles[object.role] : m.kinds[object.kind]}
                    {' · '}
                    <Dated segments={datedFor(id, env)} render={view => view.mechanism.short} />
                  </span>
                  <span className="object-mini-line">
                    <Dated segments={datedFor(id, env)} render={view => <ReviewNote review={view.review} locale={locale} m={m} short />} />
                  </span>
                </li>
              );
            })}
          </ul>
          {data.contextualSubjectIds.length ? (
            <>
              <h2 className="eyebrow aside-title">{m.story.context}</h2>
              <p className="aside-note">{m.story.contextNote}</p>
              <ul className="list-plain">
                {data.contextualSubjectIds.map(id => {
                  const subject = catalog.subjects.get(id);
                  if (!subject) return null;
                  return (
                    <li className="object-mini is-context" key={id}>
                      <span className="object-mini-name" lang={lang}>
                        {subject.name}
                      </span>
                      <span className="not-assessed">{m.subjects[subject.kind]}</span>
                      <span className="object-mini-line" lang={lang}>
                        {subject.description}
                      </span>
                      {subject.ethereumRelation === 'outside-ethereum' ? <span className="object-mini-line obs-warn">{m.subjects.outsideEthereum}</span> : null}
                      {subject.relatedEdiId ? (
                        <span className="object-mini-line">{fmt(m.subjects.relatedRecord, {name: catalog.nameOf(subject.relatedEdiId)})}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
          <p className="aside-links">
            {data.collections.map(id => (
              <a key={id} href={paths.collection(locale, id)}>
                {fmt(m.story.inCollection, {collection: catalog.collections.get(id)?.title ?? m.collections[id]})}
              </a>
            ))}
            <a href={paths.compare(locale, data.objectIds.slice(0, 4))}>{m.compare.title}</a>
          </p>
        </aside>
        <div className="story-main">
          {model.intro.length ? (
            <div className="prose story-intro" lang={lang}>
              <Blocks blocks={model.intro} ctx={ctx} />
            </div>
          ) : null}
          {sections.map(section => (
            <section className="story-section" key={section.key} aria-labelledby={`section-${section.key}`}>
              <h2 id={`section-${section.key}`}>{m.story.sections[section.key]}</h2>
              <div className="prose" lang={lang}>
                <Blocks blocks={section.blocks} ctx={ctx} />
              </div>
            </section>
          ))}
        </div>
      </div>
      <div className="story-after">
        {relationships.length ? (
          <section className="story-section" aria-labelledby="connections-title">
            <h2 id="connections-title">{m.story.diagram}</h2>
            <RelationshipDiagram id={`diagram-${story.id}`} relationships={relationships} objectIds={data.objectIds} env={env} />
            <h3 className="list-title">{m.story.diagramText}</h3>
            <RelationshipList relationships={relationships} env={env} citations={citations} />
            <p className="section-note">{m.profile.relationshipsNote}</p>
          </section>
        ) : null}

        {observations.length ? (
          <section className="story-section" aria-labelledby="observations-title">
            <h2 id="observations-title">{m.story.observations}</h2>
            <p className="section-note">{m.profile.observationsNote}</p>
            <ObservationList observations={observations} env={env} citations={citations} showSubject={() => true} />
          </section>
        ) : null}

        <section className="story-section" id="sources" aria-labelledby="sources-title">
          <h2 id="sources-title">{m.story.sources}</h2>
          <SourcesList citations={citations} env={env} />
        </section>
      </div>
    </article>
  );
}

/** A story card for indexes and collections. */
export function StoryCard({storyId, env, headingLevel = 3}: {storyId: string; env: PageEnv; headingLevel?: 2 | 3}) {
  const story = catalog.story(storyId);
  if (!story) return null;
  const {m, locale} = env;
  const lang = contentLang(env);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <li className="card story-card">
      <p className="eyebrow">
        {story.data.collections.map(id => catalog.collections.get(id)?.title ?? m.collections[id]).join(' · ')}
      </p>
      <Heading className="card-title" lang={lang}>
        <a href={paths.story(locale, story.slug)}>{story.data.title}</a>
      </Heading>
      <p className="card-dek" lang={lang}>
        {story.data.dek}
      </p>
      <p className="card-objects">
        {story.data.objectIds.map(id => (
          <span key={id} className="card-object">
            {catalog.nameOf(id)} <DatedGrade id={id} env={env} size="sm" />
          </span>
        ))}
      </p>
      <p className="card-meta">
        <span className="mechanism-tag">{m.mechanisms[story.data.outcome.mechanism]}</span>
        <EvidenceTag state={story.data.outcome.state} env={env} />
      </p>
    </li>
  );
}

