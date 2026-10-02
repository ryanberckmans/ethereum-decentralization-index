/**
 * Markdown for editorial content, parsed at build time into a small,
 * serializable tree that React renders without innerHTML.
 *
 * @cc [label:security] safe-editorial-markdown
 * Raw HTML, images, footnotes and non-https links are rejected rather than
 * rendered. Editorial text can only reference directory data through
 * validated tokens; nothing in content executes.
 */
import {fromMarkdown} from 'mdast-util-from-markdown';
import {gfmFromMarkdown} from 'mdast-util-gfm';
import {gfm} from 'micromark-extension-gfm';
import type {Nodes, PhrasingContent, RootContent} from 'mdast';
import {isSafeHttpsUrl} from './schema.ts';

export type TokenKind = 'object' | 'grade' | 'subject' | 'claim' | 'obs';
export interface TokenRef {
  kind: TokenKind;
  id: string;
  scope?: 'mechanism' | 'position';
}
export type Inline =
  | {t: 'text'; v: string}
  | {t: 'em'; c: Inline[]}
  | {t: 'strong'; c: Inline[]}
  | {t: 'del'; c: Inline[]}
  | {t: 'code'; v: string}
  | {t: 'br'}
  | {t: 'link'; href: string; c: Inline[]}
  | ({t: 'token'} & TokenRef);
export type Block =
  | {t: 'p'; c: Inline[]}
  | {t: 'h3'; c: Inline[]}
  | {t: 'ul' | 'ol'; items: Block[][]}
  | {t: 'quote'; c: Block[]}
  | {t: 'pre'; v: string}
  | {t: 'table'; head: Inline[][]; rows: Inline[][][]}
  | {t: 'hr'};
export interface Section {
  heading: string;
  blocks: Block[];
}
export interface ParsedMarkdown {
  /** Blocks before the first H2. */
  intro: Block[];
  sections: Section[];
  tokens: TokenRef[];
  /** Hard errors: the content must not be published. */
  errors: string[];
  /** Literal grade mentions such as "D0" outside tokens. */
  literalGrades: string[];
}

const TOKEN = /\{\{([a-z]+):([^{}\s]+)\}\}/g;
const TOKEN_KINDS = new Set<TokenKind>(['object', 'grade', 'subject', 'claim', 'obs']);
const LITERAL_GRADE = /(?:≥\s?|>=\s?)?\bD(?:[0-9]|\?)(?![0-9a-zA-Z])/g;

export function parseMarkdown(source: string): ParsedMarkdown {
  const errors: string[] = [];
  const tokens: TokenRef[] = [];
  const literalGrades: string[] = [];
  let tree;
  try {
    tree = fromMarkdown(source, {extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()]});
  } catch (error) {
    return {intro: [], sections: [], tokens, errors: [`Unparseable Markdown: ${(error as Error).message}`], literalGrades};
  }

  const where = (node: Nodes) => (node.position ? `line ${node.position.start.line}` : 'unknown line');

  const splitText = (value: string, node: Nodes): Inline[] => {
    const out: Inline[] = [];
    let last = 0;
    for (const match of value.matchAll(TOKEN)) {
      const kind = match[1] as TokenKind;
      let before = value.slice(last, match.index);
      // A citation attaches to the word before it, like a footnote mark.
      if (kind === 'claim') {
        before = before.replace(/\s+$/, '');
        const previous = out[out.length - 1];
        if (!before && previous?.t === 'text') previous.v = previous.v.replace(/\s+$/, '');
      }
      if (before) out.push(textInline(before));
      last = match.index + match[0].length;
      let id = match[2];
      if (!TOKEN_KINDS.has(kind)) {
        errors.push(`Unknown token {{${match[1]}:…}} at ${where(node)}`);
        continue;
      }
      let scope: TokenRef['scope'];
      if (kind === 'grade') {
        const scoped = /^(.*):(mechanism|position)$/.exec(id);
        if (scoped) {
          id = scoped[1];
          scope = scoped[2] as TokenRef['scope'];
        }
      }
      const ref: TokenRef = scope ? {kind, id, scope} : {kind, id};
      tokens.push(ref);
      out.push({t: 'token', ...ref});
    }
    const rest = value.slice(last);
    if (rest) out.push(textInline(rest));
    if (/\{\{|\}\}/.test(value.replace(TOKEN, ''))) errors.push(`Malformed token near "${value.slice(0, 40)}" at ${where(node)}`);
    return out;
  };
  const textInline = (value: string): Inline => {
    for (const match of value.matchAll(LITERAL_GRADE)) literalGrades.push(match[0]);
    return {t: 'text', v: value};
  };

  const inline = (nodes: PhrasingContent[]): Inline[] =>
    nodes.flatMap((node): Inline[] => {
      switch (node.type) {
        case 'text':
          return splitText(node.value, node);
        case 'emphasis':
          return [{t: 'em', c: inline(node.children)}];
        case 'strong':
          return [{t: 'strong', c: inline(node.children)}];
        case 'delete':
          return [{t: 'del', c: inline(node.children)}];
        case 'inlineCode':
          return [{t: 'code', v: node.value}];
        case 'break':
          return [{t: 'br'}];
        case 'link':
          if (!isSafeHttpsUrl(node.url)) {
            errors.push(`Link must be an absolute https:// URL (got "${node.url.slice(0, 80)}") at ${where(node)}`);
            return inline(node.children);
          }
          return [{t: 'link', href: node.url, c: inline(node.children)}];
        case 'html':
          errors.push(`Raw HTML is not allowed at ${where(node)}`);
          return [];
        case 'image':
        case 'imageReference':
          errors.push(`Images are not supported in editorial Markdown at ${where(node)}`);
          return [];
        case 'footnoteReference':
          errors.push(`Use {{claim:…}} tokens instead of footnotes at ${where(node)}`);
          return [];
        case 'linkReference':
          errors.push(`Use inline https links instead of reference links at ${where(node)}`);
          return inline(node.children);
        default:
          errors.push(`Unsupported Markdown (${(node as Nodes).type}) at ${where(node as Nodes)}`);
          return [];
      }
    });

  const block = (node: RootContent): Block[] => {
    switch (node.type) {
      case 'paragraph':
        return [{t: 'p', c: inline(node.children)}];
      case 'heading':
        if (node.depth === 3) return [{t: 'h3', c: inline(node.children)}];
        errors.push(`Only ## sections and ### subheadings are allowed (found level ${node.depth}) at ${where(node)}`);
        return [];
      case 'list':
        return [{t: node.ordered ? 'ol' : 'ul', items: node.children.map(item => item.children.flatMap(block))}];
      case 'blockquote':
        return [{t: 'quote', c: node.children.flatMap(block)}];
      case 'code':
        return [{t: 'pre', v: node.value}];
      case 'thematicBreak':
        return [{t: 'hr'}];
      case 'table': {
        const [head, ...rows] = node.children;
        return [{
          t: 'table',
          head: head ? head.children.map(cell => inline(cell.children)) : [],
          rows: rows.map(row => row.children.map(cell => inline(cell.children))),
        }];
      }
      case 'html':
        errors.push(`Raw HTML is not allowed at ${where(node)}`);
        return [];
      case 'definition':
      case 'footnoteDefinition':
        errors.push(`Definitions and footnotes are not supported at ${where(node)}`);
        return [];
      default:
        errors.push(`Unsupported Markdown (${node.type}) at ${where(node)}`);
        return [];
    }
  };

  const intro: Block[] = [];
  const sections: Section[] = [];
  for (const node of tree.children) {
    if (node.type === 'heading' && node.depth === 2) {
      const heading = node.children.map(child => ('value' in child ? child.value : '')).join('').trim();
      sections.push({heading, blocks: []});
      continue;
    }
    if (node.type === 'yaml') continue;
    const blocks = block(node);
    (sections.length ? sections[sections.length - 1].blocks : intro).push(...blocks);
  }
  return {intro, sections, tokens, errors, literalGrades};
}

/** Plain text of inline content, for meta descriptions and search. Tokens become their IDs. */
export function inlineText(nodes: readonly Inline[], label: (token: TokenRef) => string = token => token.id): string {
  return nodes
    .map(node => {
      switch (node.t) {
        case 'text':
        case 'code':
          return node.v;
        case 'br':
          return ' ';
        case 'token':
          return label(node);
        default:
          return inlineText(node.c, label);
      }
    })
    .join('');
}

export function blocksText(blocks: readonly Block[], label?: (token: TokenRef) => string): string {
  return blocks
    .map(block => {
      switch (block.t) {
        case 'p':
        case 'h3':
          return inlineText(block.c, label);
        case 'ul':
        case 'ol':
          return block.items.map(item => blocksText(item, label)).join(' ');
        case 'quote':
          return blocksText(block.c, label);
        case 'pre':
          return block.v;
        case 'table':
          return [...block.head, ...block.rows.flat()].map(cell => inlineText(cell, label)).join(' ');
        case 'hr':
          return '';
      }
    })
    .filter(Boolean)
    .join('\n');
}

/** Tokens in document order within some blocks (for citation numbering in display order). */
export function blockTokens(blocks: readonly Block[]): TokenRef[] {
  const out: TokenRef[] = [];
  const inline = (nodes: readonly Inline[]) => {
    for (const node of nodes) {
      if (node.t === 'token') out.push(node.scope ? {kind: node.kind, id: node.id, scope: node.scope} : {kind: node.kind, id: node.id});
      else if (node.t === 'em' || node.t === 'strong' || node.t === 'del' || node.t === 'link') inline(node.c);
    }
  };
  const walk = (list: readonly Block[]) => {
    for (const block of list) {
      switch (block.t) {
        case 'p':
        case 'h3':
          inline(block.c);
          break;
        case 'ul':
        case 'ol':
          for (const item of block.items) walk(item);
          break;
        case 'quote':
          walk(block.c);
          break;
        case 'table':
          for (const cell of [...block.head, ...block.rows.flat()]) inline(cell);
          break;
        default:
          break;
      }
    }
  };
  walk(blocks);
  return out;
}
