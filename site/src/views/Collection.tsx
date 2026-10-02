/**
 * The two editorial collections. "D0 in use" lists every complete D0
 * mechanism from EDI for the evaluation date (and each later change date),
 * then its stories; "The global economy on Ethereum" shows its stories and
 * featured objects at every D level. Neither certifies safety or success.
 */
import type {CollectionId} from '../content/vocab.ts';
import {fmt, formatDate, plural} from '../i18n/format.ts';
import {Dated} from '../components/Dated.tsx';
import {GradeBadge, ReviewNote} from '../components/Grade.tsx';
import {KINDS, type Kind} from '../model/view-types.ts';
import {paths} from '../model/urls.ts';
import {datedView} from '../model/views.ts';
import {completeD0, datedValues} from '../server/dated.ts';
import {catalog} from '../server/site.ts';
import {Crumbs, DatedGrade, contentLang, type PageEnv} from './Editorial.tsx';
import {StoryCard} from './Story.tsx';

function ObjectRow({id, date, env}: {id: string; date: string; env: PageEnv}) {
  const object = catalog.object(id);
  if (!object) return null;
  const {m, locale} = env;
  const view = datedView(id, catalog.rawOn(id, date), locale);
  return (
    <li className="object-row">
      <p className="object-row-name">
        <a href={paths.object(locale, object.slug)}>{object.name}</a>
        <span className="object-row-kind">{object.role ? m.roles[object.role] : m.kinds[object.kind]}</span>
      </p>
      <p className={`object-row-summary${object.summary ? '' : ' is-edi'}`} lang={contentLang(env)}>
        {object.summary ?? object.entity.scope}
      </p>
      <p className="object-row-grade">
        <GradeBadge grade={view.mechanism} m={m} size="sm" />
        <ReviewNote review={view.review} locale={locale} m={m} short />
      </p>
    </li>
  );
}

function D0Listing({env}: {env: PageEnv}) {
  const {m, locale, date} = env;
  const segments = datedValues(date, completeD0).map(segment => ({from: segment.from, value: {date: segment.from, ids: segment.value}}));
  return (
    <section className="section" aria-labelledby="d0-title">
      <h2 id="d0-title">{m.collections.d0Listed}</h2>
      <Dated
        block
        segments={segments}
        render={({date: on, ids}) => {
          const byKind = new Map<Kind, string[]>(KINDS.map(kind => [kind, ids.filter(id => catalog.object(id)?.kind === kind)]));
          return (
            <>
              <p className="section-note">
                {fmt(m.collections.d0ListedNote, {date: formatDate(on, locale)})} {plural(ids.length, locale, m.collections.d0ListedCount)}
              </p>
              {KINDS.map(kind =>
                byKind.get(kind)!.length ? (
                  <div key={kind} className="object-group">
                    <h3 className="group-heading">{m.kindsPlural[kind]}</h3>
                    <ul className="object-rows">
                      {byKind.get(kind)!.map(id => (
                        <ObjectRow key={id} id={id} date={on} env={env} />
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
            </>
          );
        }}
      />
    </section>
  );
}

export function CollectionPage({id, env}: {id: CollectionId; env: PageEnv}) {
  const {m, locale} = env;
  const collection = catalog.collections.get(id);
  const lang = contentLang(env);
  const title = collection?.title ?? m.collections[id];
  const storyIds = (collection?.storyIds ?? []).filter(storyId => catalog.story(storyId));
  const extra = catalog.stories.filter(story => story.data.collections.includes(id) && !storyIds.includes(story.id)).map(story => story.id);
  const stories = [...storyIds, ...extra];
  const featured = id === 'global-economy' ? (collection?.objectIds ?? []).filter(objectId => catalog.object(objectId)) : [];
  return (
    <div className="shell collection">
      <header className="page-head">
        <Crumbs env={env} items={[{label: m.nav.stories, href: paths.stories(locale)}, {label: title}]} />
        <p className="eyebrow">{id === 'd0-in-use' ? m.collections['d0-in-use'] : m.collections['global-economy']}</p>
        <h1 lang={lang}>{title}</h1>
        {collection ? (
          <p className="lede" lang={lang}>
            {collection.dek}
          </p>
        ) : null}
      </header>
      {collection ? (
        <div className="prose collection-intro" lang={lang}>
          {collection.intro.split(/\n{2,}/).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      <section className="section" aria-labelledby="stories-title">
        <h2 id="stories-title">{m.collections.storiesHeading}</h2>
        {stories.length ? (
          <ul className="cards cards-3">
            {stories.map(storyId => (
              <StoryCard key={storyId} storyId={storyId} env={env} />
            ))}
          </ul>
        ) : (
          <p className="muted">{m.collections.noStories}</p>
        )}
      </section>

      {id === 'd0-in-use' ? <D0Listing env={env} /> : null}

      {featured.length ? (
        <section className="section" aria-labelledby="featured-title">
          <h2 id="featured-title">{m.collections.objectsHeading}</h2>
          <ul className="object-rows">
            {featured.map(objectId => {
              const object = catalog.object(objectId)!;
              return (
                <li className="object-row" key={objectId}>
                  <p className="object-row-name">
                    <a href={paths.object(locale, object.slug)}>{object.name}</a>
                    <span className="object-row-kind">{object.role ? m.roles[object.role] : m.kinds[object.kind]}</span>
                  </p>
                  <p className={`object-row-summary${object.summary ? '' : ' is-edi'}`} lang={lang}>
                    {object.summary ?? object.entity.scope}
                  </p>
                  <p className="object-row-grade">
                    <DatedGrade id={objectId} env={env} size="sm" />
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
