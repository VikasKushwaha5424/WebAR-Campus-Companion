export const ARRIVAL_THRESHOLD = 2.0;

class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(item) {
    this.heap.push(item);
    this._siftUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._siftDown(0);
    }
    return top;
  }

  get size() {
    return this.heap.length;
  }

  _siftUp(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.heap[i].d >= this.heap[p].d) break;
      [this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
      i = p;
    }
  }

  _siftDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = (i << 1) + 1;
      const right = left + 1;
      if (left < n && this.heap[left].d < this.heap[smallest].d) smallest = left;
      if (right < n && this.heap[right].d < this.heap[smallest].d) smallest = right;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}

export function getNodeById(nodeId, nodes) {
  return nodes.find((n) => n.id === nodeId) || null;
}

export function buildAdjacencyList(edges, filterFn) {
  const adj = new Map();
  for (const e of edges) {
    if (filterFn && !filterFn(e)) continue;
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source).push({ node: e.target, distance: e.distance, edge: e });
    adj.get(e.target).push({ node: e.source, distance: e.distance, edge: e });
  }
  return adj;
}

export function findPath(startNodeId, endNodeId, edges, filterFn) {
  const adj = buildAdjacencyList(edges, filterFn);

  if (!adj.has(startNodeId)) return { path: [], totalDistance: 0 };
  if (!adj.has(endNodeId)) return { path: [], totalDistance: 0 };

  const dist = new Map();
  const prev = new Map();
  const visited = new Set();
  const pq = new MinHeap();

  for (const key of adj.keys()) {
    dist.set(key, Infinity);
    prev.set(key, null);
  }
  dist.set(startNodeId, 0);
  pq.push({ node: startNodeId, d: 0 });

  while (pq.size > 0) {
    const { node: u } = pq.pop();
    if (u === endNodeId) break;
    if (visited.has(u)) continue;
    visited.add(u);

    for (const { node: v, distance: w } of (adj.get(u) || [])) {
      if (visited.has(v)) continue;
      const alt = dist.get(u) + w;
      if (alt < dist.get(v)) {
        dist.set(v, alt);
        prev.set(v, u);
        pq.push({ node: v, d: alt });
      }
    }
  }

  if (dist.get(endNodeId) === Infinity) {
    return { path: [], totalDistance: 0 };
  }

  const path = [];
  let curr = endNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = prev.get(curr);
  }

  return { path, totalDistance: dist.get(endNodeId) };
}
