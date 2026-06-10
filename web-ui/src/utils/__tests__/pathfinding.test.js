import { describe, it, expect } from 'vitest';
import { findPath, buildAdjacencyList, getNodeById, ARRIVAL_THRESHOLD } from '../pathfinding';

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
});
