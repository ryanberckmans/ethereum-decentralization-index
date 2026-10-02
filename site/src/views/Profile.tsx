/**
 * An object profile: the opening (name, role, scope, live EDI assessment,
 * what it achieves and who retains authority), then what it enables, control
 * and dependencies, observed use, connections, and sources and identity.
 */
import {safeEvidenceUrl} from 'ethereum-decentralization-index';
import {EDI_LOCALE, PRODUCT} from '../config.ts';
import {andList, fmt, formatDate} from '../i18n/format.ts';
import {Dated} from '../components/Dated.tsx';
import {completeness} from '../model/view-types.ts';
import {GradeBadge, ReviewNote, completenessLong} from '../components/Grade.tsx';
import {CopyIcon, ExternalIcon, InfoIcon, StoryIcon} from '../components/Icons.tsx';
import {Blocks} from '../components/Markdown.tsx';
import {EXPORTS, explorerAddressUrl, paths, sourcifyUrl} from '../model/urls.ts';
import {chainName, datedView, mechanismSubject} from '../model/views.ts';
import {shortAddress} from '../model/address.ts';
import type {ProfileModel} from '../server/profile.ts';
import {catalog} from '../server/site.ts';
import {
  Crumbs,
  DatedGrade,
  ObjectLink,
  ObservationList,
  RelationshipList,
  SourcesList,
  contentLang,
  tokenContext,
  type PageEnv,
} from './Editorial.tsx';

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function textRecord(value: unknown): [string, string][] {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => (typeof item === 'string' ? [[key, item] as [string, string]] : []));
}

export function CopyButton({value, label, env}: {value: string; label: string; env: PageEnv}) {
  return (
    <button type="button" className="copy js-only" data-copy={value} data-copied={env.m.common.copied} aria-label={label}>
      <CopyIcon />
      <span data-copy-label="">{env.m.common.copy}</span>
    </button>
  );
}

function AssessmentPanel({model, env}: {model: ProfileModel; env: PageEnv}) {
  const {object, raw} = model;
  const {m, locale} = env;
  const subject = mechanismSubject(object.id);
  const segments = raw.map(segment => ({from: segment.from, value: {raw: segment.value, view: datedView(object.id, segment.value, locale)}}));
  return (
    <aside className="assessment-panel" aria-labelledby="assessment-title">
      <h2 id="assessment-title" className="eyebrow">
        {m.profile.assessmentTitle}
      </h2>
      <Dated
        block
        segments={segments}
        render={({raw: state, view}) => (
          <>
            <div className="assessment">
              <div className="assessment-row">
                <GradeBadge grade={view.mechanism} m={m} size="lg" scope={m.grade.mechanism} />
                <span className="grade-scope" aria-hidden="true">
                  {m.grade.mechanism}
                </span>
              </div>
              <p className="assessment-text">{view.mechanism.short}</p>
              {completeness(view.mechanism) !== 'complete' ? <p className="assessment-text">{completenessLong(view.mechanism, m)}</p> : null}
              <ReviewNote review={view.review} locale={locale} m={m} />
              <button
                type="button"
                className="explain js-only"
                data-guide={JSON.stringify({
                  value: state.mechanism,
                  subject,
                  name: object.name,
                  evidence: object.entity.evidenceUrls,
                  locale: EDI_LOCALE[locale],
                })}
              >
                <InfoIcon />
                {m.grade.explain}
              </button>
            </div>
            {view.position && state.position ? (
              <div className="assessment">
                <div className="assessment-row">
                  <GradeBadge grade={view.position} m={m} size="lg" scope={m.grade.position} />
                  <span className="grade-scope" aria-hidden="true">
                    {m.grade.position}
                  </span>
                </div>
                <p className="assessment-text">{view.position.short}</p>
                {view.positionReview ? <ReviewNote review={view.positionReview} locale={locale} m={m} scope="position" /> : null}
                <a className="panel-more" href="#control">
                  {m.profile.positionReason}
                </a>
              </div>
            ) : object.kind === 'protocol' ? (
              <p className="assessment-text muted">{m.grade.positionNotAssessed}</p>
            ) : null}
          </>
        )}
      />
      <p className="panel-links">
        <a className="no-js-only" href={`${paths.methodology(locale)}#spectrum`}>
          {m.profile.gradesExplained}
        </a>
        <a href="#sources">{m.profile.evidenceLink}</a>
        <a href={paths.compare(locale, [object.id])}>{m.profile.compareThis}</a>
      </p>
    </aside>
  );
}

function ControlSection({model, env}: {model: ProfileModel; env: PageEnv}) {
  const {object, path, dependents, sections, citations, listed} = model;
  const {m, locale} = env;
  const e = object.entity;
  const ctx = tokenContext(env, citations, listed);
  const dimensions = textRecord(e['dimensions']);
  const uncertainty = text(e['uncertainty']);
  const reviewBasis = text(e['reviewBasis']);
  const lang = contentLang(env);
  return (
    <section className="section" id="control" aria-labelledby="control-title">
      <h2 id="control-title">{m.profile.sections.control}</h2>
      {sections.control ? (
        <div className="prose control-prose" lang={lang}>
          <Blocks blocks={sections.control} ctx={ctx} />
        </div>
      ) : null}
      <div className="section-grid control-grid">
        <div className="control-facts">
          <h3>{m.profile.finding}</h3>
          <p lang={lang}>{e.reason}</p>
          <h3>{m.profile.controls}</h3>
          {e.controls.length ? (
            <ul className="controls-list" lang={lang}>
              {e.controls.map(control => (
                <li key={control}>{control}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">{m.common.none}</p>
          )}
          {e.limits?.length ? (
            <>
              <h3>{m.profile.limits}</h3>
              <ul className="controls-list" lang={lang}>
                {e.limits.map(limit => (
                  <li key={limit}>{limit}</li>
                ))}
              </ul>
            </>
          ) : null}
          {dimensions.length ? (
            <>
              <h3>{m.profile.dimensions}</h3>
              <dl className="facts" lang={lang}>
                {dimensions.map(([key, value]) => (
                  <div key={key} className="facts-row">
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}
          {uncertainty ? (
            <>
              <h3>{m.profile.uncertainty}</h3>
              <p lang={lang}>{uncertainty}</p>
            </>
          ) : null}
          {reviewBasis ? (
            <>
              <h3>{m.profile.reviewBasis}</h3>
              <p lang={lang}>{reviewBasis}</p>
            </>
          ) : null}
          <Dated
            block
            segments={model.raw}
            render={state =>
              state.mechanism.unresolved.length ? (
                <>
                  <h3>{m.profile.unresolvedItems}</h3>
                  <ul className="controls-list" lang={lang}>
                    {state.mechanism.unresolved.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null
            }
          />
        </div>
        <div className="control-path">
          <h3>{m.profile.path}</h3>
          {path.length > 1 ? (
            <>
              <ol className="path">
                {path.map(node => (
                  <li key={`${node.id}-${node.depth}`} className={`path-item depth-${Math.min(node.depth, 4)}${node.depth === 0 ? ' is-root' : ''}`}>
                    <span className="path-name">{node.depth === 0 ? catalog.object(node.id)?.name : <ObjectLink id={node.id} env={env} />}</span>
                    <DatedGrade id={node.id} env={env} size="sm" />
                    <span className="path-note" lang={lang}>
                      {catalog.object(node.id)?.entity.scope}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="path-help">{m.profile.pathNote}</p>
            </>
          ) : (
            <p className="muted">{m.profile.noDependencies}</p>
          )}
          {dependents.length ? (
            <>
              <h3>{m.profile.dependents}</h3>
              <ul className="dependents">
                {dependents.map(dependent => (
                  <li key={dependent.id}>
                    <ObjectLink id={dependent.id} env={env} /> <DatedGrade id={dependent.id} env={env} size="sm" />
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {object.entity.positionReview || object.entity.positionDependenciesUnreviewed ? (
            <>
              <h3>{m.profile.positionHeading}</h3>
              <Dated
                block
                segments={model.raw.map(segment => ({from: segment.from, value: {state: segment.value, view: datedView(object.id, segment.value, locale)}}))}
                render={({state, view}) =>
                  view.position && state.position ? (
                    <div className="position-block">
                      <p className="assessment-row">
                        <GradeBadge grade={view.position} m={m} scope={m.grade.position} />
                        <span className="grade-short">{view.position.short}</span>
                      </p>
                      {view.positionReview ? <ReviewNote review={view.positionReview} locale={locale} m={m} scope="position" /> : null}
                      {state.position.unresolved.length ? (
                        <ul className="controls-list" lang={lang}>
                          {state.position.unresolved.map(item => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null
                }
              />
              {object.entity.positionReview?.reason ? (
                <p>
                  <strong>
                    {m.profile.positionReason}
                    {m.common.labelSeparator}
                  </strong>
                  <span lang={lang}>{object.entity.positionReview.reason}</span>
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function IdentitySection({model, env}: {model: ProfileModel; env: PageEnv}) {
  const {object, citations} = model;
  const {m, locale} = env;
  const e = object.entity;
  const lang = contentLang(env);
  const ediAliases = e.aliases.filter(alias => alias !== e.id);
  const editorialAliases = (object.editorial?.data.aliases ?? []).filter(alias => !ediAliases.includes(alias));
  const proof = e.sourceProof;
  const evidence = [...new Set(e.evidenceUrls.map(url => safeEvidenceUrl(url)).filter((url): url is string => url !== null))];
  const links = object.editorial?.data.officialLinks ?? [];
  const edition = catalog.edition;
  return (
    <section className="section" id="sources" aria-labelledby="sources-title">
      <h2 id="sources-title">{m.profile.sections.sources}</h2>
      <div className="identity-grid">
        <div>
          <h3>{m.profile.identity}</h3>
          <dl className="facts">
            <div className="facts-row">
              <dt>{m.profile.recordId}</dt>
              <dd className="addr">
                <code>{e.id}</code>
                <CopyButton value={e.id} label={fmt(m.profile.copyAddress, {address: e.id})} env={env} />
              </dd>
            </div>
            <div className="facts-row">
              <dt>{m.profile.kind}</dt>
              <dd>{m.kinds[e.kind]}</dd>
            </div>
            <div className="facts-row">
              <dt>{m.profile.scope}</dt>
              <dd lang={lang}>{e.scope}</dd>
            </div>
            {ediAliases.length ? (
              <div className="facts-row">
                <dt>{m.profile.aliases}</dt>
                <dd>{ediAliases.join(m.common.listSeparator)}</dd>
              </div>
            ) : null}
            {editorialAliases.length ? (
              <div className="facts-row">
                <dt>{m.profile.alsoKnownAs}</dt>
                <dd lang={lang}>{editorialAliases.join(', ')}</dd>
              </div>
            ) : null}
            <div className="facts-row">
              <dt>{m.profile.reviewedAt}</dt>
              <dd>
                <time dateTime={e.reviewedAt}>{formatDate(e.reviewedAt, locale, 'long')}</time>
              </dd>
            </div>
            <div className="facts-row">
              <dt>{m.profile.cadence}</dt>
              <dd>{e.reviewCadence === 'permanent-D0' ? m.profile.cadencePermanent : m.profile.cadenceMonthly}</dd>
            </div>
            {e.reviewCadence !== 'permanent-D0' ? (
              <div className="facts-row">
                <dt>{m.profile.nextReview}</dt>
                <dd>
                  <Dated segments={model.raw} render={state => <ReviewNote review={state.review} locale={locale} m={m} />} />
                </dd>
              </div>
            ) : null}
            {e.immutableIdentity ? (
              <div className="facts-row">
                <dt>{m.profile.immutableIdentity}</dt>
                <dd lang={lang}>{e.immutableIdentity}</dd>
              </div>
            ) : null}
            <div className="facts-row">
              <dt>{m.profile.addresses}</dt>
              <dd>
                {object.deployments.length ? (
                  <ul className="list-plain addresses">
                    {object.deployments.map(deployment => {
                      const explorer = explorerAddressUrl(deployment.chainId, deployment.address);
                      return (
                        <li key={`${deployment.chainId}:${deployment.address}`} className="addr">
                          <span className="addr-chain">{chainName(deployment.chainId)}</span>
                          <code title={deployment.address}>{deployment.address}</code>
                          <CopyButton value={deployment.address} label={fmt(m.profile.copyAddress, {address: shortAddress(deployment.address)})} env={env} />
                          {explorer ? (
                            <a href={explorer} rel="noopener noreferrer" className="addr-link">
                              {m.profile.explorer}
                              <ExternalIcon />
                              <span className="sr-only"> ({m.common.external})</span>
                            </a>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <span className="muted">{m.profile.noAddress}</span>
                )}
              </dd>
            </div>
            {proof ? (
              <div className="facts-row">
                <dt>{m.profile.sourceProof}</dt>
                <dd>
                  <a href={sourcifyUrl(proof.chainId, proof.address)} rel="noopener noreferrer">
                    {fmt(m.profile.sourceProofText, {
                      contract: proof.contractName,
                      date: formatDate(proof.onchainCodeMatchedAt ?? proof.checkedAt, locale),
                      hash: proof.runtimeSha256.slice(0, 12),
                    })}
                  </a>
                  {proof.proxyDetected ? <span className="flag">{m.profile.proxy}</span> : null}
                </dd>
              </div>
            ) : null}
            <div className="facts-row">
              <dt>{m.profile.registry}</dt>
              <dd>
                {fmt(m.profile.registryText, {
                  date: formatDate(edition.ediRegistryDate, locale),
                  commit: edition.ediCommit === 'unknown' ? edition.ediCommit : edition.ediCommit.slice(0, 12),
                })}
              </dd>
            </div>
          </dl>
        </div>
        <div className="identity-links">
          <h3>{m.profile.evidence}</h3>
          {evidence.length ? (
            <ul className="link-list">
              {evidence.map(url => (
                <li key={url}>
                  <a href={url} rel="noopener noreferrer">
                    {new URL(url).hostname}
                    <span className="link-path">{new URL(url).pathname.replace(/\/$/, '').slice(0, 64)}</span>
                    <ExternalIcon />
                    <span className="sr-only"> ({m.common.external})</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{m.profile.noEvidence}</p>
          )}
          {links.length ? (
            <>
              <h3>{m.profile.officialLinks}</h3>
              <ul className="link-list" lang={lang}>
                {links.map(link => (
                  <li key={link.url}>
                    <a href={link.url} rel="noopener noreferrer">
                      {link.label}
                      <ExternalIcon />
                      <span className="sr-only"> ({m.common.external})</span>
                    </a>{' '}
                    <span className="muted">{fmt(m.profile.checked, {date: formatDate(link.checkedAt, locale)})}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="profile-exports">
            <a href={EXPORTS.object(object.slug)}>{m.profile.exportJson}</a>
            {object.editorial ? <span className="muted">{fmt(m.profile.editorialReviewed, {date: formatDate(object.editorial.data.editorialReviewedAt, locale)})}</span> : null}
          </p>
        </div>
      </div>
      <h3 className="sources-title">{m.profile.claims}</h3>
      {citations.size ? <SourcesList citations={citations} env={env} /> : <p className="muted">{m.profile.sourcesNone}</p>}
    </section>
  );
}

export function ProfilePage({model, env}: {model: ProfileModel; env: PageEnv}) {
  const {object, sections, citations, listed, observations, relationships, stories} = model;
  const {m, locale} = env;
  const data = object.editorial?.data;
  const ctx = tokenContext(env, citations, listed);
  const lang = contentLang(env);
  const kindLabel = m.kinds[object.kind];
  const networks = object.networks.map(id => catalog.object(id)?.name ?? id);
  const isToken = object.id.startsWith('token:');
  const kindQuery = `?kind=${object.kind}`;
  return (
    <article className="shell profile">
      <Crumbs
        env={env}
        items={[
          {label: m.nav.directory, href: paths.home(locale)},
          {label: m.kindsPlural[object.kind], href: `${paths.home(locale)}${kindQuery}`},
          {label: object.name},
        ]}
      />
      <header className="profile-head">
        <div className="profile-title">
          <p className="eyebrow">
            {kindLabel}
            {object.role ? ` · ${m.roles[object.role]}` : ''}
          </p>
          <h1>{object.name}</h1>
          <p className="lede" lang={lang}>
            {object.summary ?? object.entity.scope}
          </p>
          <p className="profile-kind">
            <span>{networks.length ? fmt(m.profile.onNetworks, {networks: andList(networks, locale)}) : m.profile.networkUnrecorded}</span>
            <span>
              <code>{object.id}</code>
            </span>
            <span className={object.edited ? 'flag flag-edited' : 'flag flag-basic'}>{object.edited ? m.directory.edited : m.directory.basic}</span>
          </p>
        </div>
        <AssessmentPanel model={model} env={env} />
        <div className="openers">
          {data?.capability ? (
            <div className="opener">
              <h2 className="eyebrow">{m.profile.capability}</h2>
              <p lang={lang}>{data.capability}</p>
            </div>
          ) : null}
          {data?.authority ? (
            <div className="opener">
              <h2 className="eyebrow">{m.profile.authority}</h2>
              <p lang={lang}>{data.authority}</p>
            </div>
          ) : null}
          {object.edited ? null : (
            <p className="notice">
              <InfoIcon />
              <span>{m.profile.basicNotice}</span>
            </p>
          )}
        </div>
      </header>

      <section className="section" id="enables" aria-labelledby="enables-title">
        <h2 id="enables-title">{m.profile.sections.enables}</h2>
        {isToken ? (
          <p className="notice">
            <InfoIcon />
            <span>{m.profile.tokenNote}</span>
          </p>
        ) : null}
        {sections.enables ? (
          <div className="prose" lang={lang}>
            <Blocks blocks={sections.enables} ctx={ctx} />
          </div>
        ) : (
          <p className="prose muted">{m.profile.noEnables}</p>
        )}
      </section>

      <ControlSection model={model} env={env} />

      <section className="section" id="observed" aria-labelledby="observed-title">
        <h2 id="observed-title">{m.profile.sections.observed}</h2>
        {sections.observed ? (
          <div className="prose" lang={lang}>
            <Blocks blocks={sections.observed} ctx={ctx} />
          </div>
        ) : null}
        {observations.length ? (
          <>
            <p className="section-note">{m.profile.observationsNote}</p>
            <ObservationList observations={observations} env={env} citations={citations} showSubject={o => o.subjectId !== object.id} />
          </>
        ) : (
          <p className="muted">{m.profile.noObservations}</p>
        )}
      </section>

      <section className="section" id="connections" aria-labelledby="connections-title">
        <h2 id="connections-title">{m.profile.sections.connections}</h2>
        <div className="related-grid">
          <div>
            <h3>{m.profile.relationships}</h3>
            {relationships.length ? (
              <>
                <RelationshipList relationships={relationships} env={env} citations={citations} perspective={object.id} />
                <p className="section-note">{m.profile.relationshipsNote}</p>
              </>
            ) : (
              <p className="muted">{m.profile.noConnections}</p>
            )}
          </div>
          <div>
            <h3>{m.profile.stories}</h3>
            {stories.length ? (
              <ul className="cards">
                {stories.map(story => (
                  <li className="card" key={story.id}>
                    <p className="eyebrow">
                      <StoryIcon /> {m.nav.stories}
                    </p>
                    <h4 className="card-title" lang={lang}>
                      <a href={paths.story(locale, story.slug)}>{story.data.title}</a>
                    </h4>
                    <p className="card-dek" lang={lang}>
                      {story.data.dek}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">{m.profile.notInStories}</p>
            )}
          </div>
        </div>
      </section>

      <IdentitySection model={model} env={env} />
      <p className="sr-only">{PRODUCT.indexName}</p>
    </article>
  );
}
