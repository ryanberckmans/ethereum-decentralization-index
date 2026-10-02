/**
 * Source numbering for one page. Sources are numbered in the order a reader
 * meets them, so the page registers everything it will show, top to bottom,
 * before rendering, and the sources list at the end uses the same numbers.
 */
import {blockTokens, type Block} from '../content/markdown.ts';

export class Citations {
  readonly #order = new Map<string, number>();

  add(id: string): number {
    let n = this.#order.get(id);
    if (n === undefined) {
      n = this.#order.size + 1;
      this.#order.set(id, n);
    }
    return n;
  }

  addAll(ids: Iterable<string>): void {
    for (const id of ids) this.add(id);
  }

  /** Claims cited with {{claim:…}} tokens in some Markdown blocks, in reading order. */
  addBlocks(blocks: readonly Block[] | undefined): void {
    if (blocks) for (const token of blockTokens(blocks)) if (token.kind === 'claim') this.add(token.id);
  }

  number(id: string): number | undefined {
    return this.#order.get(id);
  }

  get ids(): string[] {
    return [...this.#order.keys()];
  }

  get size(): number {
    return this.#order.size;
  }
}

/** Observations referenced with {{obs:…}} tokens, in reading order. */
export function observationTokens(blocks: readonly Block[] | undefined): string[] {
  return blocks ? blockTokens(blocks).flatMap(token => (token.kind === 'obs' ? [token.id] : [])) : [];
}
