/**
 * Dated changes: editorial entries from changes.yaml, the EDI edition in use,
 * and the grade changes that this edition's review dates make on their own,
 * worked out with EDI's functions. A cached page keeps telling the truth:
 * the whole list is dated, so a change date that passes moves its entry from
 * "Coming up" to the history.
 */
import type {ReactNode} from 'react';
import {levelLabel} from 'ethereum-decentralization-index';
import {fmt, formatDate, plural} from '../i18n/format.ts';
import {Dated} from '../components/Dated.tsx';
import {GradeBadge} from '../components/Grade.tsx';
import {paths} from '../model/urls.ts';
import type {GradeView} from '../model/view-types.ts';
import {gradeView, mechanismSubject} from '../model/views.ts';
import {datedValues} from '../server/dated.ts';
import {catalog} from '../server/site.ts';
import {Crumbs, contentLang, isContextSubject, type PageEnv} from './Editorial.tsx';

interface ScheduledChange {
  id: string;
  scope: 'mechanism' | 'position';
  from: GradeView;
  to: GradeView;
}

interface ScheduledDay {
  date: string;
  changes: ScheduledChange[];
  /** Records whose review becomes overdue on this date without a grade change. */
  overdue: string[];
}

/** Every date after the registry date on which an EDI result changes, from the precomputed timelines. */
function scheduledChanges(env: PageEnv): ScheduledDay[] {
  const days = new Map<string, ScheduledDay>();
  for (const object of catalog.objects) {
    const timeline = catalog.timelineFrom(object.id, catalog.registryDate);
    for (let i = 1; i < timeline.length; i++) {
      const date = timeline[i].from;
      if (date <= catalog.registryDate) continue;
      const before = timeline[i - 1].value;
      const now = timeline[i].value;
      const day = days.get(date) ?? {date, changes: [], overdue: []};
      const changed = (a: typeof before.mechanism, b: typeof before.mechanism) => levelLabel(a) !== levelLabel(b) || a.status !== b.status;
      let graded = false;
      if (changed(before.mechanism, now.mechanism)) {
        day.changes.push({id: object.id, scope: 'mechanism', from: gradeView(before.mechanism, env.locale, mechanismSubject(object.id)), to: gradeView(now.mechanism, env.locale, mechanismSubject(object.id))});
        graded = true;
      }
      if (before.position && now.position && changed(before.position, now.position)) {
        day.changes.push({id: object.id, scope: 'position', from: gradeView(before.position, env.locale, 'position'), to: gradeView(now.position, env.locale, 'position')});
        graded = true;
      }
      if (!graded && !before.review.overdue && now.review.overdue) day.overdue.push(object.id);
      if (day.changes.length || day.overdue.length) days.set(date, day);
    }
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

interface HistoryEntry {
  date: string;
  kind: 'editorial' | 'correction' | 'edition' | 'policy' | 'scheduled';
  key: string;
  render: () => ReactNode;
}

function SubjectLinks({ids, env}: {ids: readonly string[]; env: PageEnv}) {
  if (!ids.length) return null;
  return (
    <span className="change-subjects">
      {ids.map((id, i) => {
        const object = catalog.object(id);
        const story = object ? undefined : catalog.story(id);
        const label = object?.name ?? story?.data.title ?? (isContextSubject(id) ? catalog.nameOf(id) : id);
        const href = object ? paths.object(env.locale, object.slug) : story ? paths.story(env.locale, story.slug) : undefined;
        return (
          <span key={id}>
            {i ? ', ' : ''}
            {href ? <a href={href}>{label}</a> : label}
          </span>
        );
      })}
    </span>
  );
}

function ScheduledList({day, env}: {day: ScheduledDay; env: PageEnv}) {
  const {m, locale} = env;
  const count = new Set(day.changes.map(change => change.id)).size;
  return (
    <>
      <p>
        {count ? plural(count, locale, m.changes.upcomingSummary) : null} {day.overdue.length ? plural(day.overdue.length, locale, m.changes.upcomingReview) : null}
      </p>
      {day.changes.length ? (
        <details className="change-details">
          <summary>{plural(count, locale, m.changes.showRecords)}</summary>
          <ul className="change-list">
            {day.changes.map(change => {
              const object = catalog.object(change.id)!;
              return (
                <li key={`${change.id}-${change.scope}`}>
                  <a href={paths.object(locale, object.slug)}>{object.name}</a>
                  <span className="change-scope">{m.changes.scope[change.scope]}</span>
                  <span className="change-grades">
                    <GradeBadge grade={change.from} m={m} size="sm" />
                    <span className="sr-only"> {m.changes.becomes} </span>
                    <span aria-hidden="true" className="change-arrow">
                      →
                    </span>
                    <GradeBadge grade={change.to} m={m} size="sm" />
                  </span>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
    </>
  );
}

export function ChangesPage({env}: {env: PageEnv}) {
  const {m, locale, date} = env;
  const lang = contentLang(env);
  const edition = catalog.edition;
  const all = scheduledChanges(env);
  const segments = datedValues(date, on => ({on, upcoming: all.filter(day => day.date > on), passed: all.filter(day => day.date <= on)}));

  const fixed: HistoryEntry[] = [
    ...catalog.changes.map((change, i) => ({
      date: change.date,
      kind: change.kind,
      key: `change-${i}`,
      render: () => (
        <>
          <span lang={lang}>{change.summary}</span> <SubjectLinks ids={change.subjects} env={env} />
        </>
      ),
    })),
    {
      date: edition.ediRegistryDate,
      kind: 'edition',
      key: 'edition',
      render: () => (
        <>
          {fmt(m.changes.ediEdition, {date: formatDate(edition.ediRegistryDate, locale)})}{' '}
          <span className="change-hash">{fmt(m.changes.ediEditionHash, {hash: edition.ediRegistrySha256.slice(0, 16)})}</span>
        </>
      ),
    },
    {
      date: edition.ediPolicyDate,
      kind: 'policy',
      key: 'policy',
      render: () => fmt(m.changes.ediPolicy, {date: formatDate(edition.ediPolicyDate, locale)}),
    },
  ];

  return (
    <div className="shell changes">
      <header className="page-head">
        <Crumbs env={env} items={[{label: m.nav.directory, href: paths.home(locale)}, {label: m.changes.title}]} />
        <h1>{m.changes.title}</h1>
        <p className="lede">{m.changes.intro}</p>
      </header>
      <Dated
        block
        segments={segments}
        render={({upcoming, passed}) => {
          const history: HistoryEntry[] = [
            ...fixed,
            ...passed.map(
              (day): HistoryEntry => ({
                date: day.date,
                kind: 'scheduled',
                key: `scheduled-${day.date}`,
                render: () => <ScheduledList day={day} env={env} />,
              }),
            ),
          ].sort((a, b) => b.date.localeCompare(a.date));
          return (
            <>
              <section className="section" aria-labelledby="upcoming-title">
                <h2 id="upcoming-title">{m.changes.upcoming}</h2>
                {upcoming.length ? (
                  <>
                    <ol className="timeline">
                      {upcoming.map(day => (
                        <li key={day.date}>
                          <time dateTime={day.date}>{formatDate(day.date, locale)}</time>
                          <div className="timeline-body">
                            <ScheduledList day={day} env={env} />
                          </div>
                        </li>
                      ))}
                    </ol>
                    <p className="section-note">{m.changes.upcomingNote}</p>
                  </>
                ) : (
                  <p className="muted">{m.changes.upcomingNone}</p>
                )}
              </section>
              <section className="section" aria-labelledby="history-title">
                <h2 id="history-title">{m.changes.history}</h2>
                <ol className="timeline">
                  {history.map(entry => (
                    <li key={entry.key}>
                      <time dateTime={entry.date}>{formatDate(entry.date, locale)}</time>
                      <div className="timeline-body">
                        <span className={`change-kind is-${entry.kind}`}>{entry.kind === 'scheduled' ? m.changes.kinds.edition : m.changes.kinds[entry.kind]}</span>
                        <div>{entry.render()}</div>
                      </div>
                    </li>
                  ))}
                </ol>
                {catalog.changes.length ? null : <p className="section-note">{m.changes.none}</p>}
              </section>
            </>
          );
        }}
      />
    </div>
  );
}
