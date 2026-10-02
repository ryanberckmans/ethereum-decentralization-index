/**
 * Renders the build-time Markdown tree. There is no innerHTML anywhere:
 * text is text, links were checked to be https at import, and tokens are
 * resolved by the page through `TokenContext`.
 */
import {Fragment, type ReactNode} from 'react';
import type {Block, Inline, TokenRef} from '../content/markdown.ts';

export interface TokenContext {
  render(token: TokenRef): ReactNode;
}

export function Inlines({nodes, ctx}: {nodes: readonly Inline[]; ctx: TokenContext}) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.t) {
          case 'text':
            return <Fragment key={index}>{node.v}</Fragment>;
          case 'em':
            return (
              <em key={index}>
                <Inlines nodes={node.c} ctx={ctx} />
              </em>
            );
          case 'strong':
            return (
              <strong key={index}>
                <Inlines nodes={node.c} ctx={ctx} />
              </strong>
            );
          case 'del':
            return (
              <del key={index}>
                <Inlines nodes={node.c} ctx={ctx} />
              </del>
            );
          case 'code':
            return <code key={index}>{node.v}</code>;
          case 'br':
            return <br key={index} />;
          case 'link':
            return (
              <a key={index} href={node.href} rel="noopener noreferrer">
                <Inlines nodes={node.c} ctx={ctx} />
              </a>
            );
          case 'token':
            return <Fragment key={index}>{ctx.render(node)}</Fragment>;
        }
      })}
    </>
  );
}

export function Blocks({blocks, ctx}: {blocks: readonly Block[]; ctx: TokenContext}) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.t) {
          case 'p':
            return (
              <p key={index}>
                <Inlines nodes={block.c} ctx={ctx} />
              </p>
            );
          case 'h3':
            return (
              <h3 key={index}>
                <Inlines nodes={block.c} ctx={ctx} />
              </h3>
            );
          case 'ul':
          case 'ol': {
            const List = block.t;
            return (
              <List key={index}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    {item.length === 1 && item[0].t === 'p' ? <Inlines nodes={item[0].c} ctx={ctx} /> : <Blocks blocks={item} ctx={ctx} />}
                  </li>
                ))}
              </List>
            );
          }
          case 'quote':
            return (
              <blockquote key={index}>
                <Blocks blocks={block.c} ctx={ctx} />
              </blockquote>
            );
          case 'pre':
            return (
              <pre key={index}>
                <code>{block.v}</code>
              </pre>
            );
          case 'table':
            return (
              <div key={index} className="compare-scroll">
                <table>
                  <thead>
                    <tr>
                      {block.head.map((cell, cellIndex) => (
                        <th key={cellIndex} scope="col">
                          <Inlines nodes={cell} ctx={ctx} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>
                            <Inlines nodes={cell} ctx={ctx} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'hr':
            return <hr key={index} />;
        }
      })}
    </>
  );
}
