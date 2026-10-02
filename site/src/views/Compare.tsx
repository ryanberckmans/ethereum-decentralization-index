/**
 * Side-by-side comparison of up to four exact objects. Wide screens get a
 * table whose header keeps every object's name in view; phones show the
 * chosen pair side by side; a field-by-field layout serves enlarged text.
 * Which layout shows is decided by CSS from the width and the reader's
 * choice, so the page works without script. Figures line up only when the
 * comparison rules allow it (see model/compare.ts).
 */
import type {ReactNode} from 'react';
import {LIMITS} from '../config.ts';
import type {Observation} from '../content/schema.ts';
import {fmt, formatDate, plural} from '../i18n/format.ts';
import {Dated} from '../components/Dated.tsx';
import {GradeBadge, ReviewNote, completenessLong} from '../components/Grade.tsx';
import {CloseIcon} from '../components/Icons.tsx';
import {compareObservations, type CompareView, type Reason} from '../model/compare.ts';
import {encodeValue} from '../model/query.ts';
import {completeness, KINDS} from '../model/view-types.ts';
import {paths} from '../model/urls.ts';
import {observationView} from '../model/views.ts';
import type {ObjectRecord} from '../model/catalog.ts';
import {catalog} from '../server/site.ts';
import {Crumbs, contentLang, datedFor, type PageEnv} from './Editorial.tsx';

interface Field {
  key: string;
  label: string;
  /** Editorial labels (metric names) are English. */
  editorial?: boolean;
  note?: string;
  cell: (object: ObjectRecord, column: number) => ReactNode;
}

/** Curated starting points; each is a set of exact EDI records. */
export const SUGGESTIONS: readonly (readonly string[])[] = [
  ['usdc', 'weth9'],
  ['native-eth', 'weth9'],
  ['uniswap-v2', 'uniswap-v3', 'uniswap-v4'],
  ['weth9', 'seaport-v1.6'],
  ['ethereum', 'base'],
  ['morpho-blue', 'aave-v4'],
];

function reasonText(reason: Reason, env: PageEnv): string {
  const r = env.m.compare.reasons;
  return reason.kind === 'dates' ? plural(reason.days, env.locale, r.dates) : r[reason.kind];
}

function ObservationLine({observation, env, metric = true}: {observation: Observation; env: PageEnv; metric?: boolean}) {
  const view = observationView(observation, env.locale, env.m);
  return (
    <span className="compare-obs">
      <strong className="compare-obs-value" title={view.exact}>
        {view.value}
      </strong>
      {metric ? (
        <span className="compare-obs-metric" lang={contentLang(env)}>
          {view.metric}
        </span>
      ) : null}
      <span className="compare-obs-when">
        {view.when}
        {view.multichain ? ` · ${env.m.observation.multichain}` : ''}
      </span>
    </span>
  );
}

function None({children}: {children: ReactNode}) {
  return <span className="muted">{children}</span>;
}

export function ComparePage({objects, unknown, truncated, view, env}: {objects: ObjectRecord[]; unknown: string[]; truncated: boolean; view: CompareView | null; env: PageEnv}) {
  const {m, locale} = env;
  const lang = contentLang(env);
  const ids = objects.map(object => object.id);
  const href = (list: readonly string[], next: CompareView | null = view) => {
    const query = [list.length ? `ids=${list.map(encodeValue).join(',')}` : '', next ? `view=${next}` : ''].filter(Boolean).join('&');
    return `${paths.compare(locale)}${query ? `?${query}` : ''}`;
  };
  const observations = compareObservations(ids, [...catalog.observations.values()]);

  const fields: Field[] = [
    {
      key: 'role',
      label: m.compare.fields.role,
      cell: object => (object.role ? m.roles[object.role] : <None>{m.compare.unclassified}</None>),
    },
    {
      key: 'kind',
      label: m.compare.fields.kind,
      cell: object => (
        <>
          <strong className="compare-kind">{m.kinds[object.kind]}</strong>
          <span className="compare-scope" lang={lang}>
            {object.entity.scope}
          </span>
        </>
      ),
    },
    {
      key: 'network',
      label: m.compare.fields.network,
      cell: object => (object.networks.length ? object.networks.map(id => catalog.nameOf(id)).join(m.common.listSeparator) : <None>{m.directory.networkUnrecorded}</None>),
    },
    {
      key: 'mechanism',
      label: m.compare.fields.mechanism,
      cell: object => (
        <Dated
          segments={datedFor(object.id, env)}
          render={value => (
            <span className="compare-grade">
              <GradeBadge grade={value.mechanism} m={m} />
              <span>{value.mechanism.short}</span>
              {completeness(value.mechanism) !== 'complete' ? <span className="muted">{completenessLong(value.mechanism, m)}</span> : null}
            </span>
          )}
        />
      ),
    },
    {
      key: 'position',
      label: m.compare.fields.position,
      cell: object => (
        <Dated
          segments={datedFor(object.id, env)}
          render={value =>
            value.position ? (
              <span className="compare-grade">
                <GradeBadge grade={value.position} m={m} scope={m.grade.position} />
                <span>{value.position.short}</span>
              </span>
            ) : object.kind === 'protocol' ? (
              <None>{m.grade.positionNotAssessed}</None>
            ) : (
              <None>{m.compare.notApplicable}</None>
            )
          }
        />
      ),
    },
    {
      key: 'powers',
      label: m.compare.fields.powers,
      cell: object =>
        object.entity.controls.length ? (
          <ul className="compare-list" lang={lang}>
            {object.entity.controls.map(control => (
              <li key={control}>{control}</li>
            ))}
          </ul>
        ) : (
          <None>{m.common.none}</None>
        ),
    },
    {
      key: 'limits',
      label: m.compare.fields.positionLimits,
      cell: object => {
        const items = [...(object.entity.limits ?? []), ...(object.entity.positionReview?.reason ? [object.entity.positionReview.reason] : [])];
        return items.length ? (
          <ul className="compare-list" lang={lang}>
            {items.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <None>{m.common.none}</None>
        );
      },
    },
    {
      key: 'review',
      label: m.compare.fields.review,
      cell: object => (
        <span className="compare-review">
          <span>{fmt(m.grade.reviewed, {date: formatDate(object.entity.reviewedAt, locale)})}</span>
          <Dated segments={datedFor(object.id, env)} render={value => <ReviewNote review={value.review} locale={locale} m={m} />} />
        </span>
      ),
    },
    ...observations.groups.map(
      (group): Field => ({
        key: `group-${group.group}`,
        label: group.metric ?? m.compare.groupLabel,
        editorial: group.metric !== undefined,
        note: group.comparable ? m.compare.comparable : fmt(m.compare.notComparable, {reasons: group.reasons.map(reason => reasonText(reason, env)).join(m.compare.reasonSeparator)}),
        cell: (_object, column) => {
          const cell = group.cells[column];
          if (!cell.length) return <None>{m.compare.noObservations}</None>;
          return cell.length === 1 ? (
            <ObservationLine observation={cell[0]} env={env} metric={group.metric === undefined} />
          ) : (
            <ul className="compare-list compare-obs-list">
              {cell.map(observation => (
                <li key={observation.id}>
                  <ObservationLine observation={observation} env={env} />
                </li>
              ))}
            </ul>
          );
        },
      }),
    ),
    {
      key: 'observations',
      label: observations.groups.length ? m.compare.otherObservations : m.compare.fields.observations,
      cell: (object, column) => {
        const list = observations.separate[column];
        return list.length ? (
          <ul className="compare-list compare-obs-list">
            {list.slice(0, 4).map(observation => (
              <li key={observation.id}>
                <ObservationLine observation={observation} env={env} />
              </li>
            ))}
            {list.length > 4 ? (
              <li>
                <a href={`${paths.object(locale, object.slug)}#observed`}>{fmt(m.compare.moreObservations, {count: list.length - 4})}</a>
              </li>
            ) : null}
          </ul>
        ) : (
          <None>{m.compare.noObservations}</None>
        );
      },
    },
  ];

  const bodyClass = [
    'compare-body',
    view === 'stacked' ? 'is-stacked' : 'is-tabular',
    view !== 'stacked' && objects.length >= 2 ? 'is-pairable' : '',
    objects.length > 2 ? 'has-more' : '',
    objects.length === 4 ? 'is-four' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const objectHead = (object: ObjectRecord) => (
    <>
      <a className="compare-name" href={paths.object(locale, object.slug)}>
        {object.name}
      </a>
      <span className="compare-role">{object.role ? m.roles[object.role] : m.kinds[object.kind]}</span>
    </>
  );

  return (
    <div className="shell compare">
      <header className="page-head">
        <Crumbs env={env} items={[{label: m.nav.directory, href: paths.home(locale)}, {label: m.compare.title}]} />
        <h1>{m.compare.title}</h1>
        <p className="lede">{m.compare.intro}</p>
      </header>

      {unknown.length ? (
        <p className="notice notice-warn" role="status">
          {fmt(m.compare.unknownIds, {ids: unknown.join(m.common.listSeparator)})}
        </p>
      ) : null}
      {truncated ? (
        <p className="notice notice-warn" role="status">
          {fmt(m.compare.tooMany, {max: LIMITS.compare})}
        </p>
      ) : null}

      <div className="compare-tools">
        {objects.length ? (
          <div className="compare-selection">
            <h2 className="compare-tools-title">
              {m.compare.selection} <span className="muted">{fmt(m.compare.count, {count: objects.length, max: LIMITS.compare})}</span>
            </h2>
            <ul className="chips">
              {objects.map(object => (
                <li key={object.id} className="chip">
                  <a href={paths.object(locale, object.slug)}>{object.name}</a>
                  <a className="chip-remove" href={href(ids.filter(id => id !== object.id))} aria-label={fmt(m.compare.remove, {name: object.name})} title={m.compare.removeShort}>
                    <CloseIcon />
                  </a>
                </li>
              ))}
            </ul>
            <p className="compare-back">
              <a href={`${paths.home(locale)}?compare=${ids.map(encodeValue).join(',')}`}>{m.compare.backToDirectory}</a>
            </p>
          </div>
        ) : null}
        {objects.length < LIMITS.compare ? (
          <form className="compare-add" method="get" action={paths.compare(locale)}>
            {ids.length ? <input type="hidden" name="ids" value={ids.join(',')} /> : null}
            {view ? <input type="hidden" name="view" value={view} /> : null}
            <label htmlFor="compare-add">{m.compare.addLabel}</label>
            <div className="control-row">
              <select id="compare-add" name="add" className="select" required>
                <option value="">{m.compare.add}</option>
                {KINDS.map(kind => (
                  <optgroup key={kind} label={m.kindsPlural[kind]}>
                    {catalog.objects
                      .filter(object => object.kind === kind && !ids.includes(object.id))
                      .sort((a, b) => a.name.localeCompare(b.name, 'en'))
                      .map(object => (
                        <option key={object.id} value={object.id}>
                          {object.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              <button type="submit" className="button">
                {m.compare.addButton}
              </button>
            </div>
          </form>
        ) : (
          <p className="muted compare-full">{fmt(m.directory.compareFull, {max: LIMITS.compare})}</p>
        )}
      </div>

      {objects.length ? (
        <>
          {objects.length === 1 ? <p className="section-note">{m.compare.one}</p> : null}
          <nav className="compare-views" aria-label={m.compare.viewLabel}>
            <span className="muted">{m.compare.viewLabel}</span>
            <a href={href(ids, null)} aria-current={view !== 'stacked' ? 'page' : undefined}>
              {m.compare.table}
            </a>
            <a href={href(ids, 'stacked')} aria-current={view === 'stacked' ? 'page' : undefined}>
              {m.compare.stacked}
            </a>
          </nav>
          <div className={bodyClass}>
            {objects.length > 2 ? (
              <form className="compare-pair" method="get" action={paths.compare(locale)}>
                <input type="hidden" name="ids" value={ids.join(',')} />
                {view ? <input type="hidden" name="view" value={view} /> : null}
                <fieldset>
                  <legend>{m.compare.pair}</legend>
                  <p className="compare-pair-note">{fmt(m.compare.pairNote, {left: objects[0].name, right: objects[1].name, count: objects.length})}</p>
                  <div className="control-row">
                    <label>
                      <span>{m.compare.left}</span>
                      <select name="left" className="select" defaultValue={ids[0]}>
                        {objects.map(object => (
                          <option key={object.id} value={object.id}>
                            {object.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>{m.compare.right}</span>
                      <select name="right" className="select" defaultValue={ids[1]}>
                        {objects.map(object => (
                          <option key={object.id} value={object.id}>
                            {object.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" className="button">
                      {m.compare.pairButton}
                    </button>
                  </div>
                </fieldset>
              </form>
            ) : null}

            {objects.length >= 2 ? (
              <div className="compare-pairbar" aria-hidden="true">
                {objects.slice(0, 2).map(object => (
                  <p key={object.id}>{objectHead(object)}</p>
                ))}
              </div>
            ) : null}

            <div className="compare-table-wrap">
              <table className={`compare-table cols-${objects.length}`}>
                <caption className="sr-only">{m.compare.title}</caption>
                <thead>
                  <tr>
                    <td className="compare-corner" />
                    {objects.map((object, column) => (
                      <th scope="col" key={object.id} className={`c${column}`}>
                        {objectHead(object)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.map(field => (
                    <tr key={field.key} className={field.key.startsWith('group-') ? 'is-group' : undefined}>
                      <th scope="row">
                        <span lang={field.editorial ? lang : undefined}>{field.label}</span>
                        {field.note ? <span className="compare-note">{field.note}</span> : null}
                      </th>
                      {objects.map((object, column) => (
                        <td key={object.id} className={`c${column}`}>
                          {field.cell(object, column)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="compare-stacked">
              {fields.map(field => (
                <section className={`compare-field${field.key.startsWith('group-') ? ' is-group' : ''}`} key={field.key}>
                  <h2 className="compare-field-title" lang={field.editorial ? lang : undefined}>
                    {field.label}
                  </h2>
                  {field.note ? <p className="compare-note">{field.note}</p> : null}
                  <dl>
                    {objects.map((object, column) => (
                      <div key={object.id} className={`c${column}`}>
                        <dt>{object.name}</dt>
                        <dd>{field.cell(object, column)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </div>
          <p className="section-note compare-noscore">{m.compare.noScore}</p>
        </>
      ) : (
        <section className="section" aria-labelledby="suggestions-title">
          <h2 id="suggestions-title">{m.compare.suggestions}</h2>
          <p className="section-note">{m.compare.empty}</p>
          <ul className="suggestions">
            {SUGGESTIONS.filter(set => set.every(id => catalog.object(id))).map(set => (
              <li key={set.join(',')}>
                <a href={href(set, null)}>
                  {set.map((id, i) => (
                    <span key={id}>
                      {i ? <span className="suggestion-and"> · </span> : null}
                      {catalog.nameOf(id)}
                    </span>
                  ))}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
