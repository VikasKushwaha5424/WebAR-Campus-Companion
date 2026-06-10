import { describe, it, expect } from 'vitest';
import { findPath, buildAdjacencyList, getNodeById, ARRIVAL_THRESHOLD, MinHeap } from '../pathfinding';

const simpleNodes = [
  { id: 'a', label: 'A', type: 'anchor', lat: 0, lng: 0 },
  { id: 'b', label: 'B', type: 'anchor', lat: 0.0001, lng: 0 },
  { id: 'c', label: 'C', type: 'anchor', lat: 0.0002, lng: 0 },
  { id: 'd', label: 'D', type: 'anchor', lat: 0.0003, lng: 0 },
];

const simpleEdges = [
  { source: 'a', target: 'b', distance: 10, isStairs: false, requiresKeycard: false, hasRamp: true, hasElevator: false },
  { source: 'b', target: 'c', distance: 15, isStairs: false, requiresKeycard: false, hasRamp: true, hasElevator: false },
  { source: 'c', target: 'd', distance: 12, isStairs: false, requiresKeycard: false, hasRamp: true, hasElevator: false },
];

const edgesWithStairs = [
  ...simpleEdges,
  { source: 'a', target: 'd', distance: 50, isStairs: true, requiresKeycard: false, hasRamp: false, hasElevator: false },
];

const diamondEdges = [
  { source: 'a', target: 'b', distance: 10, isStairs: false, requiresKeycard: false, hasRamp: true, hasElevator: false },
  { source: 'a', target: 'c', distance: 20, isStairs: false, requiresKeycard: false, hasRamp: true, hasElevator: false },
  { source: 'b', target: 'd', distance: 10, isStairs: false, requiresKeycard: false, hasRamp: true, hasElevator: false },
  { source: 'c', target: 'd', distance: 5, isStairs: false, requiresKeycard: false, hasRamp: true, hasElevator: false },
];

const indoorEdges = [
  { source: 'entrance', target: 'corridor', distance: 5, isStairs: false, requiresKeycard: false, hasRamp: true, hasElevator: false },
  { source: 'corridor', target: 'lab1', distance: 8, isStairs: false, requiresKeycard: false, hasRamp: true, hasElevator: false },
  { source: 'corridor', target: 'stairs', distance: 15, isStairs: true, requiresKeycard: false, hasRamp: false, hasElevator: false },
  { source: 'corridor', target: 'faculty', distance: 8, isStairs: false, requiresKeycard: true, hasRamp: true, hasElevator: false },
  { source: 'corridor', target: 'restroom', distance: 20, isStairs: false, requiresKeycard: false, hasRamp: true, hasElevator: false },
  { source: 'stairs', target: 'floor1_lab', distance: 5, isStairs: true, requiresKeycard: false, hasRamp: false, hasElevator: false },
];

describe('ARRIVAL_THRESHOLD', () => {
  it('should be 2.0 meters', () => {
    expect(ARRIVAL_THRESHOLD).toBe(2.0);
  });
});

describe('getNodeById', () => {
  it('returns the correct node', () => {
    const node = getNodeById('b', simpleNodes);
    expect(node).not.toBeNull();
    expect(node.id).toBe('b');
    expect(node.label).toBe('B');
  });

  it('returns null for missing node', () => {
    expect(getNodeById('nonexistent', simpleNodes)).toBeNull();
  });

  it('returns null for empty list', () => {
    expect(getNodeById('a', [])).toBeNull();
  });

  it('returns null for null id', () => {
    expect(getNodeById(null, simpleNodes)).toBeNull();
  });
});

describe('MinHeap', () => {
  it('pops items in ascending order of d', () => {
    const h = new MinHeap();
    h.push({ node: 'a', d: 10 });
    h.push({ node: 'b', d: 5 });
    h.push({ node: 'c', d: 15 });
    h.push({ node: 'd', d: 1 });
    expect(h.pop().node).toBe('d');
    expect(h.pop().node).toBe('b');
    expect(h.pop().node).toBe('a');
    expect(h.pop().node).toBe('c');
  });

  it('returns null when popping empty heap', () => {
    const h = new MinHeap();
    expect(h.pop()).toBeNull();
  });

  it('reports correct size', () => {
    const h = new MinHeap();
    expect(h.size).toBe(0);
    h.push({ node: 'a', d: 1 });
    expect(h.size).toBe(1);
    h.pop();
    expect(h.size).toBe(0);
  });

  it('handles duplicate distances', () => {
    const h = new MinHeap();
    h.push({ node: 'a', d: 5 });
    h.push({ node: 'b', d: 5 });
    h.push({ node: 'c', d: 5 });
    const items = [];
    while (h.size > 0) items.push(h.pop().node);
    expect(items).toEqual(expect.arrayContaining(['a', 'b', 'c']));
    expect(items.length).toBe(3);
  });

  it('handles push after pop', () => {
    const h = new MinHeap();
    h.push({ node: 'a', d: 10 });
    h.push({ node: 'b', d: 1 });
    h.pop();
    h.push({ node: 'c', d: 5 });
    expect(h.pop().node).toBe('c');
    expect(h.pop().node).toBe('a');
    expect(h.pop()).toBeNull();
  });

  it('handles single element', () => {
    const h = new MinHeap();
    h.push({ node: 'a', d: 1 });
    expect(h.pop().node).toBe('a');
    expect(h.pop()).toBeNull();
  });
});

describe('buildAdjacencyList', () => {
  it('builds undirected edges', () => {
    const adj = buildAdjacencyList(simpleEdges);
    expect(adj.has('a')).toBe(true);
    expect(adj.has('d')).toBe(true);
    expect(adj.get('a').length).toBe(1);
    expect(adj.get('b').length).toBe(2);
    expect(adj.get('b')[0].node).toBe('a');
    expect(adj.get('b')[1].node).toBe('c');
  });

  it('respects filterFn', () => {
    const adj = buildAdjacencyList(edgesWithStairs, (e) => !e.isStairs);
    expect(adj.get('a').every((n) => n.edge.source === 'a' ? !n.edge.isStairs : true)).toBe(true);
  });

  it('returns empty map for empty edges', () => {
    const adj = buildAdjacencyList([]);
    expect(adj.size).toBe(0);
  });

  it('returns map with no entries when filter excludes all', () => {
    const adj = buildAdjacencyList(simpleEdges, () => false);
    expect(adj.size).toBe(0);
  });
});

describe('findPath', () => {
  it('finds the direct path between adjacent nodes', () => {
    const result = findPath('a', 'b', simpleEdges);
    expect(result.path).toEqual(['a', 'b']);
    expect(result.totalDistance).toBe(10);
  });

  it('finds the multi-node path', () => {
    const result = findPath('a', 'd', simpleEdges);
    expect(result.path).toEqual(['a', 'b', 'c', 'd']);
    expect(result.totalDistance).toBe(37);
  });

  it('returns empty path for disconnected nodes', () => {
    const result = findPath('a', 'nonexistent', simpleEdges);
    expect(result.path).toEqual([]);
    expect(result.totalDistance).toBe(0);
  });

  it('returns empty when start is not in graph', () => {
    const result = findPath('missing', 'b', simpleEdges);
    expect(result.path).toEqual([]);
  });

  it('finds shorter path and avoids filter-excluded edges', () => {
    const result = findPath('a', 'd', edgesWithStairs, (e) => !e.isStairs);
    expect(result.path).toEqual(['a', 'b', 'c', 'd']);
    expect(result.totalDistance).toBe(37);
  });

  it('returns empty path when filter excludes all', () => {
    const result = findPath('a', 'b', edgesWithStairs, () => false);
    expect(result.path).toEqual([]);
  });

  it('returns single-node path when start equals end', () => {
    const result = findPath('a', 'a', simpleEdges);
    expect(result.path).toEqual(['a']);
    expect(result.totalDistance).toBe(0);
  });

  it('picks shortest path in diamond graph', () => {
    const result = findPath('a', 'd', diamondEdges);
    expect(result.path).toEqual(['a', 'b', 'd']);
    expect(result.totalDistance).toBe(20);
  });

  it('noStairs filter avoids stair edges', () => {
    const result = findPath('entrance', 'floor1_lab', indoorEdges, (e) => !e.isStairs);
    expect(result.path).toEqual([]);
    expect(result.totalDistance).toBe(0);
  });

  it('noKeycard filter avoids keycard-required edges', () => {
    const result = findPath('entrance', 'faculty', indoorEdges, (e) => !e.requiresKeycard);
    expect(result.path).toEqual([]);
    expect(result.totalDistance).toBe(0);
  });

  it('wheelchair filter requires ramp or elevator', () => {
    const result = findPath('corridor', 'lab1', indoorEdges, (e) => e.hasRamp || e.hasElevator);
    expect(result.path).toEqual(['corridor', 'lab1']);
    expect(result.totalDistance).toBe(8);
  });

  it('wheelchair filter excludes stairs (no ramp, no elevator)', () => {
    const result = findPath('corridor', 'floor1_lab', indoorEdges, (e) => e.hasRamp || e.hasElevator);
    expect(result.path).toEqual([]);
  });

  it('combined filter works', () => {
    const result = findPath('entrance', 'stairs', indoorEdges, (e) => !e.isStairs && (e.hasRamp || e.hasElevator));
    expect(result.path).toEqual([]);
  });
});
