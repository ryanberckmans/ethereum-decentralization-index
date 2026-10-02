/**
 * Side-by-side comparison of up to four exact objects, drawn in the browser
 * by the compare island. Wide screens get a table whose header keeps every
 * object's name in view; phones show the chosen pair side by side; a
 * field-by-field layout serves enlarged text. Which layout shows is decided
 * by CSS from the width and the reader's choice. Figures line up only when
 * the comparison rules allow it (see model/compare.ts).
 */
import type {ReactNode} from 'react';
import {LIMITS, type Locale} from '../config.ts';
import type {Role} from '../content/vocab.ts';
import type {Messages} from '../i18n/en.ts';
import {fmt, formatDate, plural} from '../i18n/format.ts';
import {GradeBadge, ReviewNote, completenessLong} from './Grade.tsx';
import {CloseIcon} from './Icons.tsx';
import type {CompareObservation, CompareView, ObservationComparison, Reason} from '../model/compare.ts';
import {encodeValue} from '../model/query.ts';
import {completeness, KINDS, type DatedView, type Kind} from '../model/view-types.ts';
import {paths} from '../model/urls.ts';

export type CompareMessages = Pick<Messages, 'compare' | 'grade' | 'roles' | 'kinds' | 'kindsPlural' | 'common' | 'observation'> & {
  directory: Pick<Messages['directory'], 'networkUnrecorded' | 'compareFull'>;
};

/** One record as compared: its fields, and EDI's results for the reader's date. */
export interface CompareRecord {
  id: string;
  slug: string;
  name: string;
  kind: Kind;
  role?: Role;
  scope: string;
  /** Network names, Ethereum first. */
  networks: string[];
  controls: string[];
  limits: string[];
  reviewedAt: string;
  state: DatedView;
}

export interface ComparisonProps {
  locale: Locale;
  m: CompareMessages;
  records: CompareRecord[];
  observations: ObservationComparison<CompareObservation>;
  view: CompareView | null;
  /** Every record the add menu offers, by kind; those already compared are left out. */
  choices: readonly {id: string; name: string; kind: Kind}[];
}

interface Field {
  key: string;
  label: string;
  /** Editorial labels (metric names) are English. */
  editorial?: boolean;
  note?: string;
  cell: (record: CompareRecord, column: number) => ReactNode;
}

/** A compare address for these records in this layout. */
export function compareHref(locale: Locale, ids: readonly string[], view: CompareView | null): string {
  const query = [ids.length ? `ids=${ids.map(encodeValue).join(',')}` : '', view ? `view=${view}` : ''].filter(Boolean).join('&');
  return `${paths.compare(locale)}${query ? `?${query}` : ''}`;
}

function reasonText(reason: Reason, locale: Locale, m: CompareMessages): string {
  const r = m.compare.reasons;
  return reason.kind === 'dates' ? plural(reason.days, locale, r.dates) : r[reason.kind];
}

function ObservationLine({observation, m, lang, metric = true}: {observation: CompareObservation; m: CompareMessages; lang: string | undefined; metric?: boolean}) {
  const {view} = observation;
  return (
    <span className="compare-obs">
      <strong className="compare-obs-value" title={view.exact}>
        {view.value}
      </strong>
      {metric ? (
        <span className="compare-obs-metric" lang={lang}>
          {view.metric}
        </span>
      ) : null}
      <span className="compare-obs-when">
        {view.when}
        {view.multichain ? ` · ${m.observation.multichain}` : ''}
      </span>
    </span>
  );
}

function None({children}: {children: ReactNode}) {
  return <span className="muted">{children}</span>;
}

export function Comparison({locale, m, records, observations, view, choices}: ComparisonProps) {
  /** Editorial and EDI text is English. */
  const lang = locale === 'en' ? undefined : 'en';
  const ids = records.map(record => record.id);
  const href = (list: readonly string[], next: CompareView | null = view) => compareHref(locale, list, next);

  const fields: Field[] = [
    {
      key: 'role',
      label: m.compare.fields.role,
      cell: record => (record.role ? m.roles[record.role] : <None>{m.compare.unclassified}</None>),
    },
    {
      key: 'kind',
      label: m.compare.fields.kind,
      cell: record => (
        <>
          <strong className="compare-kind">{m.kinds[record.kind]}</strong>
          <span className="compare-scope" lang={lang}>
            {record.scope}
          </span>
        </>
      ),
    },
    {
      key: 'network',
      label: m.compare.fields.network,
      cell: record => (record.networks.length ? record.networks.join(m.common.listSeparator) : <None>{m.directory.networkUnrecorded}</None>),
    },
    {
      key: 'mechanism',
      label: m.compare.fields.mechanism,
      cell: ({state}) => (
        <span className="compare-grade">
          <GradeBadge grade={state.mechanism} m={m} />
          <span>{state.mechanism.short}</span>
          {completeness(state.mechanism) !== 'complete' ? <span className="muted">{completenessLong(state.mechanism, m)}</span> : null}
        </span>
      ),
    },
    {
      key: 'position',
      label: m.compare.fields.position,
      cell: ({state, kind}) =>
        state.position ? (
          <span className="compare-grade">
            <GradeBadge grade={state.position} m={m} scope={m.grade.position} />
            <span>{state.position.short}</span>
          </span>
        ) : kind === 'protocol' ? (
          <None>{m.grade.positionNotAssessed}</None>
        ) : (
          <None>{m.compare.notApplicable}</None>
        ),
    },
    {
      key: 'powers',
      label: m.compare.fields.powers,
      cell: record =>
        record.controls.length ? (
          <ul className="compare-list" lang={lang}>
            {record.controls.map(control => (
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
      cell: record =>
        record.limits.length ? (
          <ul className="compare-list" lang={lang}>
            {record.limits.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <None>{m.common.none}</None>
        ),
    },
    {
      key: 'review',
      label: m.compare.fields.review,
      cell: record => (
        <span className="compare-review">
          <span>{fmt(m.grade.reviewed, {date: formatDate(record.reviewedAt, locale)})}</span>
          <ReviewNote review={record.state.review} locale={locale} m={m} />
        </span>
      ),
    },
    ...observations.groups.map(
      (group): Field => ({
        key: `group-${group.group}`,
        label: group.metric ?? m.compare.groupLabel,
        editorial: group.metric !== undefined,
        note: group.comparable
          ? m.compare.comparable
          : fmt(m.compare.notComparable, {reasons: group.reasons.map(reason => reasonText(reason, locale, m)).join(m.compare.reasonSeparator)}),
        cell: (_record, column) => {
          const cell = group.cells[column];
          if (!cell.length) return <None>{m.compare.noObservations}</None>;
          return cell.length === 1 ? (
            <ObservationLine observation={cell[0]} m={m} lang={lang} metric={group.metric === undefined} />
          ) : (
            <ul className="compare-list compare-obs-list">
              {cell.map(observation => (
                <li key={observation.id}>
                  <ObservationLine observation={observation} m={m} lang={lang} />
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
      cell: (record, column) => {
        const list = observations.separate[column];
        return list.length ? (
          <ul className="compare-list compare-obs-list">
            {list.slice(0, 4).map(observation => (
              <li key={observation.id}>
                <ObservationLine observation={observation} m={m} lang={lang} />
              </li>
            ))}
            {list.length > 4 ? (
              <li>
                <a href={`${paths.object(locale, record.slug)}#observed`}>{fmt(m.compare.moreObservations, {count: list.length - 4})}</a>
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
    view !== 'stacked' && records.length >= 2 ? 'is-pairable' : '',
    records.length > 2 ? 'has-more' : '',
    records.length === 4 ? 'is-four' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const recordHead = (record: CompareRecord) => (
    <>
      <a className="compare-name" href={paths.object(locale, record.slug)}>
        {record.name}
      </a>
      <span className="compare-role">{record.role ? m.roles[record.role] : m.kinds[record.kind]}</span>
    </>
  );

  return (
    <>
      <div className="compare-tools">
        <div className="compare-selection">
          <h2 className="compare-tools-title">
            {m.compare.selection} <span className="muted">{fmt(m.compare.count, {count: records.length, max: LIMITS.compare})}</span>
          </h2>
          <ul className="chips">
            {records.map(record => (
              <li key={record.id} className="chip">
                <a href={paths.object(locale, record.slug)}>{record.name}</a>
                <a className="chip-remove" href={href(ids.filter(id => id !== record.id))} aria-label={fmt(m.compare.remove, {name: record.name})} title={m.compare.removeShort}>
                  <CloseIcon />
                </a>
              </li>
            ))}
          </ul>
          <p className="compare-back">
            <a href={`${paths.home(locale)}?compare=${ids.map(encodeValue).join(',')}`}>{m.compare.backToDirectory}</a>
          </p>
        </div>
        {records.length < LIMITS.compare ? (
          <form className="compare-add" method="get" action={paths.compare(locale)}>
            <input type="hidden" name="ids" value={ids.join(',')} />
            {view ? <input type="hidden" name="view" value={view} /> : null}
            <label htmlFor="compare-add">{m.compare.addLabel}</label>
            <div className="control-row">
              <select id="compare-add" name="add" className="select" required defaultValue="">
                <option value="">{m.compare.add}</option>
                {KINDS.map(kind => (
                  <optgroup key={kind} label={m.kindsPlural[kind]}>
                    {choices
                      .filter(choice => choice.kind === kind && !ids.includes(choice.id))
                      .map(choice => (
                        <option key={choice.id} value={choice.id}>
                          {choice.name}
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

      {records.length === 1 ? <p className="section-note">{m.compare.one}</p> : null}
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
        {records.length > 2 ? (
          <form className="compare-pair" method="get" action={paths.compare(locale)}>
            <input type="hidden" name="ids" value={ids.join(',')} />
            {view ? <input type="hidden" name="view" value={view} /> : null}
            <fieldset>
              <legend>{m.compare.pair}</legend>
              <p className="compare-pair-note">{fmt(m.compare.pairNote, {left: records[0].name, right: records[1].name, count: records.length})}</p>
              <div className="control-row">
                <label>
                  <span>{m.compare.left}</span>
                  <select name="left" className="select" defaultValue={ids[0]} key={`left-${ids.join(',')}`}>
                    {records.map(record => (
                      <option key={record.id} value={record.id}>
                        {record.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{m.compare.right}</span>
                  <select name="right" className="select" defaultValue={ids[1]} key={`right-${ids.join(',')}`}>
                    {records.map(record => (
                      <option key={record.id} value={record.id}>
                        {record.name}
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

        {records.length >= 2 ? (
          <div className="compare-pairbar" aria-hidden="true">
            {records.slice(0, 2).map(record => (
              <p key={record.id}>{recordHead(record)}</p>
            ))}
          </div>
        ) : null}

        <div className="compare-table-wrap">
          <table className={`compare-table cols-${records.length}`}>
            <caption className="sr-only">{m.compare.title}</caption>
            <thead>
              <tr>
                <td className="compare-corner" />
                {records.map((record, column) => (
                  <th scope="col" key={record.id} className={`c${column}`}>
                    {recordHead(record)}
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
                  {records.map((record, column) => (
                    <td key={record.id} className={`c${column}`}>
                      {field.cell(record, column)}
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
                {records.map((record, column) => (
                  <div key={record.id} className={`c${column}`}>
                    <dt>{record.name}</dt>
                    <dd>{field.cell(record, column)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
      <p className="section-note compare-noscore">{m.compare.noScore}</p>
    </>
  );
}
