import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyCanvasEntities,
  applyCanvasMutation,
} from '../src/core/timelineReducer.ts';
import type {
  CanvasEntities,
  CanvasMutation,
  GraphEntity,
} from '../src/types/timeline.ts';

test('TDD: Graph Primitives, BFS, DFS, and Dijkstra State Simulation', async (t) => {
  // Sample Weighted Graph:
  //       5
  //   A ────── B
  //   │        │
  //  2│        │3
  //   │        │
  //   C ────── D
  //       4
  const buildSampleGraph = (): GraphEntity => ({
    id: 'main-graph',
    name: 'Weighted Network',
    nodes: {
      A: { id: 'A', label: 'A', x: 80, y: 80, distance: 0, visited: false },
      B: { id: 'B', label: 'B', x: 260, y: 80, distance: '∞', visited: false },
      C: { id: 'C', label: 'C', x: 80, y: 240, distance: '∞', visited: false },
      D: { id: 'D', label: 'D', x: 260, y: 240, distance: '∞', visited: false },
    },
    edges: [
      { id: 'e-AB', from: 'A', to: 'B', weight: 5, directed: false },
      { id: 'e-AC', from: 'A', to: 'C', weight: 2, directed: false },
      { id: 'e-CD', from: 'C', to: 'D', weight: 4, directed: false },
      { id: 'e-BD', from: 'B', to: 'D', weight: 3, directed: false },
    ],
  });

  await t.test('1. Graph Mutation: Highlight node and update distance for Dijkstra', () => {
    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      graph: buildSampleGraph(),
    };

    // Relax edge A -> C (weight 2): update C distance to 2 and highlight
    const relaxMutation: CanvasMutation = {
      type: 'graph',
      action: {
        kind: 'highlight-graph-node',
        nodeId: 'C',
        state: 'active',
        distance: 2,
        visited: true,
      },
    };

    const next = applyCanvasMutation(initial, relaxMutation);
    assert.equal(next.graph?.nodes['C'].distance, 2);
    assert.equal(next.graph?.nodes['C'].visited, true);
    assert.equal(next.graph?.nodes['C'].highlight, 'active');
  });

  await t.test('2. Graph Mutation: Highlight edge during relaxation', () => {
    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      graph: buildSampleGraph(),
    };

    const edgeMutation: CanvasMutation = {
      type: 'graph',
      action: { kind: 'highlight-graph-edge', edgeId: 'e-AC', state: 'active' },
    };

    const next = applyCanvasMutation(initial, edgeMutation);
    const edge = next.graph?.edges.find((e) => e.id === 'e-AC');
    assert.equal(edge?.highlight, 'active');
  });

  await t.test('3. Reusable Primitives Integration: BFS drives Graph + Queue simultaneously', () => {
    // BFS uses both GraphEntity and QueueEntity
    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      graph: buildSampleGraph(),
      queue: {
        id: 'bfs-queue',
        name: 'BFS Frontier Queue',
        items: ['A'],
        front: 0,
        rear: 0,
      },
    };

    // Step: Dequeue A, enqueue neighbors B and C
    const stepMutations: CanvasMutation[] = [
      { type: 'queue', action: { kind: 'dequeue' } },
      { type: 'queue', action: { kind: 'enqueue', value: 'B' } },
      { type: 'queue', action: { kind: 'enqueue', value: 'C' } },
      { type: 'graph', action: { kind: 'highlight-graph-node', nodeId: 'A', state: 'visited', visited: true } },
    ];

    let state = initial;
    for (const m of stepMutations) {
      state = applyCanvasMutation(state, m);
    }

    assert.equal(state.graph?.nodes['A'].visited, true);
    assert.deepEqual(state.queue?.items, ['A', 'B', 'C']);
    assert.equal(state.queue?.front, 1); // Points to B
    assert.equal(state.queue?.rear, 2);  // Points to C
  });
});
