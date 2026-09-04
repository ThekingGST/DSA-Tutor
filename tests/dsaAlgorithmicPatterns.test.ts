import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyCanvasEntities,
  applyCanvasMutation,
} from '../src/core/timelineReducer.ts';
import type {
  CanvasEntities,
  CanvasMutation,
} from '../src/types/timeline.ts';

test('TDD: Algorithmic Patterns (Hash Table, DP Table, Call Stack & Sliding Window)', async (t) => {
  await t.test('1. Hash Table Chaining: Collision appends to bucket chain', () => {
    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      hashTable: {
        id: 'main-hash',
        name: 'Hash Map (Chaining)',
        collisionStrategy: 'chaining',
        buckets: [
          { index: 0, chain: [] },
          { index: 1, chain: [21] },
          { index: 2, chain: [] },
          { index: 3, chain: [] },
        ],
      },
    };

    // Insert 41 which hashes to index 1 (collision)
    const insertCollision: CanvasMutation = {
      type: 'hash-table',
      action: { kind: 'hash-insert', index: 1, value: 41, isCollision: true },
    };

    const next = applyCanvasMutation(initial, insertCollision);
    assert.deepEqual(next.hashTable?.buckets[1].chain, [21, 41]);
    assert.equal(next.hashTable?.buckets[1].isCollision, true);
  });

  await t.test('2. Dynamic Programming 2D Table: Cell update with dependencies', () => {
    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      dpTable: {
        id: 'main-dp',
        name: '0/1 Knapsack DP Table',
        rows: ['item 0', 'item 1', 'item 2'],
        cols: ['w=0', 'w=1', 'w=2', 'w=3'],
        cells: [
          [0, 0, 0, 0],
          [0, 10, 10, 10],
          [0, 0, 0, 0],
        ],
      },
    };

    // Compute cell (2, 2) by checking cell (1, 2) and (1, 0)
    const setCellMutation: CanvasMutation = {
      type: 'dp-table',
      action: {
        kind: 'set-dp-cell',
        row: 2,
        col: 2,
        value: 15,
        dependencies: [
          { row: 1, col: 2 },
          { row: 1, col: 0 },
        ],
      },
    };

    const next = applyCanvasMutation(initial, setCellMutation);
    assert.equal(next.dpTable?.cells[2][2], 15);
    assert.deepEqual(next.dpTable?.activeCell, { row: 2, col: 2 });
    assert.deepEqual(next.dpTable?.dependencyCells, [
      { row: 1, col: 2 },
      { row: 1, col: 0 },
    ]);
  });

  await t.test('3. Recursion Call Stack: Frame push, return value, and frame pop', () => {
    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      callStack: {
        id: 'rec-stack',
        frames: [
          { id: 'f-3', functionName: 'fact', args: { n: 3 }, status: 'active' },
        ],
      },
    };

    // Push frame fact(2)
    const pushFrame: CanvasMutation = {
      type: 'call-stack',
      action: {
        kind: 'push-call-frame',
        frame: { id: 'f-2', functionName: 'fact', args: { n: 2 }, status: 'active' },
      },
    };
    const next1 = applyCanvasMutation(initial, pushFrame);
    assert.equal(next1.callStack?.frames.length, 2);

    // Return value 2 from fact(2)
    const setReturn: CanvasMutation = {
      type: 'call-stack',
      action: { kind: 'set-frame-return', frameId: 'f-2', returnValue: 2 },
    };
    const next2 = applyCanvasMutation(next1, setReturn);
    assert.equal(next2.callStack?.frames[1].returnValue, 2);
    assert.equal(next2.callStack?.frames[1].status, 'returning');

    // Pop frame upon return
    const popFrame: CanvasMutation = {
      type: 'call-stack',
      action: { kind: 'pop-call-frame' },
    };
    const next3 = applyCanvasMutation(next2, popFrame);
    assert.equal(next3.callStack?.frames.length, 1);
  });
});
