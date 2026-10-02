/**
 * A story's connections as a small directed diagram. The figure is
 * decorative structure over the same data as the relationship list that
 * follows it, which is the accessible and phone-friendly form.
 */
import type {Relationship} from '../content/schema.ts';
import {plural} from '../i18n/format.ts';
import {gradeClass} from '../components/Grade.tsx';
import {paths} from '../model/urls.ts';
import {layoutDiagram, NODE_H, NODE_W, type DiagramInputEdge} from '../server/diagram.ts';
import {catalog} from '../server/site.ts';
import {datedFor, isContextSubject, type PageEnv} from './Editorial.tsx';

const TENTATIVE = new Set(['announced', 'forecast', 'pilot', 'capability']);

export function RelationshipDiagram({id, relationships, objectIds, env}: {id: string; relationships: readonly Relationship[]; objectIds: readonly string[]; env: PageEnv}) {
  const {m, locale} = env;
  // EDI's own dependency edges between the story's objects are drawn too, in their own style.
  const ediEdges: DiagramInputEdge[] = objectIds.flatMap(from =>
    (catalog.object(from)?.entity.dependencies ?? [])
      .filter(to => objectIds.includes(to))
      .map(to => ({id: `edi-${from}-${to}`, from, to, label: m.relationships['edi-dependency'], kind: 'edi' as const})),
  );
  const editorial: DiagramInputEdge[] = relationships.map(relationship => ({
    id: relationship.id,
    from: relationship.from,
    to: relationship.to,
    label: m.relationships[relationship.type],
    kind: 'editorial',
    tentative: TENTATIVE.has(relationship.state),
  }));
  const names = [...new Set([...relationships.flatMap(r => [r.from, r.to]), ...ediEdges.flatMap(e => [e.from, e.to])])];
  const diagram = layoutDiagram(
    names.map(name => ({id: name, name: catalog.nameOf(name)})),
    [...editorial, ...ediEdges],
  );
  if (!diagram.edges.length) return null;
  const kinds = new Set(diagram.edges.map(edge => (edge.kind === 'edi' ? 'edi' : edge.tentative ? 'tentative' : 'editorial')));
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  return (
    <figure className={`diagram cols-${Math.min(diagram.columns, 6)}`}>
      <div className="diagram-scroll">
        <svg width={diagram.width} height={diagram.height} viewBox={`0 0 ${diagram.width} ${diagram.height}`} role="group" aria-labelledby={titleId} aria-describedby={descId}>
          <title id={titleId}>{m.story.diagram}</title>
          <desc id={descId}>{plural(diagram.edges.length, locale, m.story.diagramDesc)}</desc>
          <defs>
            <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="d-arrow" />
            </marker>
            <marker id={`${id}-arrow-edi`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="d-arrow is-edi" />
            </marker>
          </defs>
          {diagram.edges.map(edge => (
            <path
              key={edge.id}
              d={edge.path}
              className={`d-edge${edge.kind === 'edi' ? ' is-edi' : ''}${edge.tentative ? ' is-announced' : ''}`}
              markerEnd={`url(#${id}-arrow${edge.kind === 'edi' ? '-edi' : ''})`}
            />
          ))}
          {diagram.edges.map(edge => (
            <g key={`${edge.id}-label`} className={`d-label${edge.kind === 'edi' ? ' is-edi' : ''}`}>
              <rect className="d-label-bg" x={edge.labelX - edge.labelW / 2} y={edge.labelY - 10} width={edge.labelW} height={20} rx={4} />
              <text x={edge.labelX} y={edge.labelY + 4} textAnchor="middle">
                {edge.label}
              </text>
            </g>
          ))}
          {diagram.nodes.map(node => {
            const context = isContextSubject(node.id);
            const object = context ? undefined : catalog.object(node.id);
            const subject = context ? catalog.subjects.get(node.id) : undefined;
            const body = (
              <>
                <rect width={NODE_W} height={NODE_H} rx={10} />
                {node.lines.map((line, i) => (
                  <text key={i} className="d-name" x={12} y={23 + i * 18}>
                    {line}
                  </text>
                ))}
                {object ? (
                  <>
                    <g data-dated-svg="">
                      {datedFor(object.id, env).map((segment, i) => (
                        <g key={segment.from} data-from={segment.from} visibility={i === 0 ? undefined : 'hidden'} className={gradeClass(segment.value.mechanism)}>
                          <rect className="d-chip" x={12} y={NODE_H - 28} width={44} height={20} rx={4} />
                          <text className="d-chip-text" x={34} y={NODE_H - 14} textAnchor="middle">
                            {segment.value.mechanism.label}
                          </text>
                        </g>
                      ))}
                    </g>
                    <text className="d-sub" x={64} y={NODE_H - 14}>
                      {m.kinds[object.kind]}
                    </text>
                  </>
                ) : (
                  <text className="d-sub" x={12} y={NODE_H - 14}>
                    {subject ? m.subjects[subject.kind] : m.subjects.notAssessed}
                  </text>
                )}
              </>
            );
            return (
              <g key={node.id} className={`d-node ${context ? 'is-context' : 'is-edi'}`} transform={`translate(${node.x} ${node.y})`}>
                {object ? (
                  <a href={paths.object(locale, object.slug)} aria-label={object.name}>
                    {body}
                  </a>
                ) : (
                  body
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="diagram-key">
        <span className="key-item">
          <svg width="28" height="16" aria-hidden="true">
            <rect x="1" y="1" width="26" height="14" rx="3" className="key-node" />
          </svg>
          {m.story.keyRecord}
        </span>
        <span className="key-item">
          <svg width="28" height="16" aria-hidden="true">
            <rect x="1" y="1" width="26" height="14" rx="3" className="key-node is-context" />
          </svg>
          {m.subjects.notAssessed}
        </span>
        {kinds.has('editorial') ? (
          <span className="key-item">
            <svg width="28" height="10" aria-hidden="true">
              <path d="M1,5 H27" className="d-edge" />
            </svg>
            {m.story.keyEditorial}
          </span>
        ) : null}
        {kinds.has('tentative') ? (
          <span className="key-item">
            <svg width="28" height="10" aria-hidden="true">
              <path d="M1,5 H27" className="d-edge is-announced" />
            </svg>
            {m.story.keyTentative}
          </span>
        ) : null}
        {kinds.has('edi') ? (
          <span className="key-item">
            <svg width="28" height="10" aria-hidden="true">
              <path d="M1,5 H27" className="d-edge is-edi" />
            </svg>
            {m.story.keyEdi}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
