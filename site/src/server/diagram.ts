/**
 * Layout for small directed relationship diagrams, in the layered style:
 * nodes go in columns by longest path (sources on the left), an edge that
 * skips columns runs through a reserved lane in each column it crosses, and
 * columns are ordered to reduce crossings. Edges are curves labelled with
 * their type. Pure and deterministic: a story always draws the same figure.
 */

export const NODE_W = 172;
export const NODE_H = 76;
const LANE_H = 26;
const GAP_X = 164;
const GAP_Y = 26;
const PAD = 16;
const LABEL_H = 20;

export interface DiagramInputNode {
  id: string;
  name: string;
}

export interface DiagramInputEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  /** EDI dependency edges are drawn differently from editorial connections. */
  kind: 'editorial' | 'edi';
  /** Weaker evidence (announced, forecast, pilot, capability) is drawn dashed. */
  tentative?: boolean;
}

export interface DiagramNode {
  id: string;
  x: number;
  y: number;
  lines: string[];
}

export interface DiagramEdge extends DiagramInputEdge {
  path: string;
  labelX: number;
  labelY: number;
  labelW: number;
}

export interface Diagram {
  width: number;
  height: number;
  /** Number of columns, for sizing the figure. */
  columns: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

/** Wrap a name into at most two lines of about `max` characters. */
export function wrapName(name: string, max = 23): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of name.split(/\s+/)) {
    if (!current) current = word;
    else if (`${current} ${word}`.length <= max) current = `${current} ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  const clip = (line: string, limit: number) => (line.length > limit ? `${line.slice(0, limit - 1)}…` : line);
  if (lines.length <= 2) return lines.map(line => clip(line, max + 3));
  return [clip(lines[0], max + 3), clip(lines.slice(1).join(' '), max)];
}

interface Entry {
  id: string;
  /** Lanes reserve room for an edge crossing a column. */
  lane: boolean;
  height: number;
}

export function layoutDiagram(inputNodes: readonly DiagramInputNode[], inputEdges: readonly DiagramInputEdge[]): Diagram {
  const used = new Set(inputEdges.flatMap(edge => [edge.from, edge.to]));
  const nodes = inputNodes.filter(node => used.has(node.id));
  const index = new Map(nodes.map((node, i) => [node.id, i]));
  const edges = inputEdges.filter(edge => index.has(edge.from) && index.has(edge.to) && edge.from !== edge.to);

  // Longest-path layering. An edge that would close a cycle is drawn but ignored for layering.
  const state = new Map<string, 'visiting' | 'done'>();
  const forward = new Set<DiagramInputEdge>();
  const visit = (id: string) => {
    state.set(id, 'visiting');
    for (const edge of edges)
      if (edge.from === id && state.get(edge.to) !== 'visiting') {
        forward.add(edge);
        if (!state.has(edge.to)) visit(edge.to);
      }
    state.set(id, 'done');
  };
  for (const node of nodes) if (!state.has(node.id)) visit(node.id);
  const layer = new Map<string, number>(nodes.map(node => [node.id, 0]));
  for (let changed = true, guard = 0; changed && guard <= nodes.length; guard++) {
    changed = false;
    for (const edge of forward) {
      const next = layer.get(edge.from)! + 1;
      if (next > layer.get(edge.to)!) {
        layer.set(edge.to, next);
        changed = true;
      }
    }
  }
  const columnCount = Math.max(0, ...layer.values()) + 1;
  const columns: Entry[][] = Array.from({length: columnCount}, () => []);
  for (const node of nodes) columns[layer.get(node.id)!].push({id: node.id, lane: false, height: NODE_H});

  // Every forward edge becomes a chain of steps between adjacent columns, through lanes where it skips columns.
  const chains = new Map<DiagramInputEdge, string[]>();
  const steps: [string, string][] = [];
  for (const edge of edges) {
    if (!forward.has(edge)) continue;
    const chain = [edge.from];
    for (let l = layer.get(edge.from)! + 1; l < layer.get(edge.to)!; l++) {
      const lane = `lane:${edge.id}:${l}`;
      columns[l].push({id: lane, lane: true, height: LANE_H});
      chain.push(lane);
    }
    chain.push(edge.to);
    chains.set(edge, chain);
    for (let i = 1; i < chain.length; i++) steps.push([chain[i - 1], chain[i]]);
  }

  // Order each column by the mean position of its neighbours, sweeping both ways.
  const at = new Map<string, number>();
  const reindex = () => columns.forEach(column => column.forEach((entry, i) => at.set(entry.id, i)));
  reindex();
  const sweep = (direction: 'right' | 'left') => {
    const order = direction === 'right' ? columns.slice(1) : columns.slice(0, -1).reverse();
    for (const column of order) {
      const score = new Map(
        column.map(entry => {
          const neighbours = steps.filter(([a, b]) => (direction === 'right' ? b === entry.id : a === entry.id)).map(([a, b]) => (direction === 'right' ? a : b));
          const mean = neighbours.length ? neighbours.reduce((sum, n) => sum + at.get(n)!, 0) / neighbours.length : at.get(entry.id)!;
          return [entry.id, mean] as const;
        }),
      );
      column.sort((a, b) => score.get(a.id)! - score.get(b.id)! || (index.get(a.id) ?? 99) - (index.get(b.id) ?? 99));
      column.forEach((entry, i) => at.set(entry.id, i));
    }
  };
  for (let i = 0; i < 3; i++) {
    sweep('right');
    sweep('left');
  }

  // Coordinates: columns are centred vertically.
  const columnHeight = (column: Entry[]) => column.reduce((sum, entry) => sum + entry.height, 0) + GAP_Y * Math.max(0, column.length - 1);
  const inner = Math.max(NODE_H, ...columns.map(columnHeight));
  const box = new Map<string, {x: number; y: number; h: number}>();
  columns.forEach((column, l) => {
    let y = PAD + LABEL_H + (inner - columnHeight(column)) / 2;
    for (const entry of column) {
      box.set(entry.id, {x: PAD + l * (NODE_W + GAP_X), y, h: entry.height});
      y += entry.height + GAP_Y;
    }
  });

  const labels: {x: number; y: number; w: number}[] = [];
  const clash = (x: number, y: number, w: number) => labels.some(l => Math.abs(l.x - x) < (l.w + w) / 2 + 6 && Math.abs(l.y - y) < LABEL_H + 2);
  const curve = (x1: number, y1: number, x2: number, y2: number) => {
    const bend = Math.max(36, (x2 - x1) / 2);
    return `C${r(x1 + bend)},${r(y1)} ${r(x2 - bend)},${r(y2)} ${r(x2)},${r(y2)}`;
  };

  const drawn: DiagramEdge[] = edges.map(edge => {
    const labelW = Math.round(edge.label.length * 6.4 + 14);
    const chain = chains.get(edge);
    let path: string;
    let lx: number;
    let ly: number;
    if (chain) {
      const a = box.get(chain[0])!;
      let x = a.x + NODE_W;
      let y = a.y + NODE_H / 2;
      path = `M${r(x)},${r(y)}`;
      const lanes = chain.slice(1, -1).map(id => box.get(id)!);
      for (const lane of lanes) {
        const ly2 = lane.y + lane.h / 2;
        path += ` ${curve(x, y, lane.x, ly2)} L${r(lane.x + NODE_W)},${r(ly2)}`;
        x = lane.x + NODE_W;
        y = ly2;
      }
      const b = box.get(chain[chain.length - 1])!;
      path += ` ${curve(x, y, b.x - 2, b.y + NODE_H / 2)}`;
      if (lanes.length) {
        // Long edges carry their label on the straight run through the first column they cross.
        lx = lanes[0].x + NODE_W / 2;
        ly = lanes[0].y + lanes[0].h / 2;
      } else {
        lx = (a.x + NODE_W + b.x) / 2;
        ly = (a.y + b.y + NODE_H) / 2;
      }
    } else {
      // An edge against the flow (part of a cycle) loops underneath.
      const a = box.get(edge.from)!;
      const b = box.get(edge.to)!;
      const sx = a.x + NODE_W / 2;
      const sy = a.y + NODE_H;
      const ex = b.x + NODE_W / 2;
      const ey = b.y + NODE_H + 2;
      path = `M${r(sx)},${r(sy)} C${r(sx)},${r(sy + 56)} ${r(ex)},${r(ey + 56)} ${r(ex)},${r(ey)}`;
      lx = (sx + ex) / 2;
      ly = Math.max(sy, ey) + 42;
    }
    for (let step = 1; clash(lx, ly, labelW) && step < 8; step++) ly += (step % 2 ? 1 : -1) * step * (LABEL_H + 2);
    labels.push({x: lx, y: ly, w: labelW});
    return {...edge, path, labelX: r(lx), labelY: r(ly), labelW};
  });

  const realNodes: DiagramNode[] = nodes.map(node => {
    const b = box.get(node.id)!;
    return {id: node.id, x: r(b.x), y: r(b.y), lines: wrapName(node.name)};
  });
  const bottom = Math.max(PAD * 2 + LABEL_H + inner, ...drawn.map(edge => edge.labelY + LABEL_H / 2 + PAD));
  const top = Math.min(0, ...drawn.map(edge => edge.labelY - LABEL_H / 2 - 4));
  const shift = -top;
  if (shift) {
    for (const node of realNodes) node.y = r(node.y + shift);
    for (const edge of drawn) {
      edge.labelY = r(edge.labelY + shift);
      edge.path = edge.path.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${x},${r(Number(y) + shift)}`);
    }
  }
  return {
    width: PAD * 2 + columnCount * NODE_W + (columnCount - 1) * GAP_X,
    height: Math.ceil(bottom + shift),
    columns: columnCount,
    nodes: realNodes,
    edges: drawn,
  };
}

function r(value: number): number {
  return Math.round(value * 10) / 10;
}
