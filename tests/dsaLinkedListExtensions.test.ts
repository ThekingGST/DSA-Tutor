import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyCanvasEntities,
  applyCanvasMutation,
} from '../src/core/timelineReducer.ts';
import type {
  CanvasEntities,
  CanvasMutation,
  LinkedListNodeEntity,
} from '../src/types/timeline.ts';

test('TDD: Doubly & Circular Linked List Core Primitives and Reducer', async (t) => {
  await t.test('1. Doubly Linked List node creation supports prevId and nextId', () => {
    const nodeA: LinkedListNodeEntity = {
      id: 'node-a',
      value: 10,
      nextId: 'node-b',
      prevId: null,
      pointers: ['head'],
    };
    const nodeB: LinkedListNodeEntity = {
      id: 'node-b',
      value: 20,
      nextId: null,
      prevId: 'node-a',
      pointers: ['tail'],
    };

    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      linkedListNodes: {
        'node-a': nodeA,
        'node-b': nodeB,
      },
    };

    assert.equal(initial.linkedListNodes['node-a'].nextId, 'node-b');
    assert.equal(initial.linkedListNodes['node-b'].prevId, 'node-a');
    assert.equal(initial.linkedListNodes['node-a'].prevId, null);
  });

  await t.test('2. Doubly Linked List bi-directional connection mutation', () => {
    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      linkedListNodes: {
        'node-1': { id: 'node-1', value: 10, nextId: null, prevId: null, pointers: ['head'] },
        'node-2': { id: 'node-2', value: 20, nextId: null, prevId: null, pointers: [] },
      },
    };

    const connectDoubly: CanvasMutation = {
      type: 'linked-list',
      action: { kind: 'connect-doubly', fromId: 'node-1', toId: 'node-2' },
    };

    const next = applyCanvasMutation(initial, connectDoubly);
    assert.equal(next.linkedListNodes['node-1'].nextId, 'node-2');
    assert.equal(next.linkedListNodes['node-2'].prevId, 'node-1');
  });

  await t.test('3. Circular Linked List tail links back to head with isCircular flag', () => {
    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      linkedListNodes: {
        'node-1': { id: 'node-1', value: 10, nextId: 'node-2', pointers: ['head'] },
        'node-2': { id: 'node-2', value: 20, nextId: 'node-3', pointers: [] },
        'node-3': { id: 'node-3', value: 30, nextId: null, pointers: ['tail'] },
      },
    };

    const connectCircular: CanvasMutation = {
      type: 'linked-list',
      action: { kind: 'connect-circular', tailId: 'node-3', headId: 'node-1' },
    };

    const next = applyCanvasMutation(initial, connectCircular);
    assert.equal(next.linkedListNodes['node-3'].nextId, 'node-1');
    assert.equal(next.linkedListNodes['node-3'].isCircular, true);
  });
});
