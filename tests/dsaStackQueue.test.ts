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

test('TDD: Stack & Queue Core Primitives and Timeline State Reducer', async (t) => {
  await t.test('1. Stack: Push operation appends element to top and updates currentOperation', () => {
    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      stack: {
        id: 'main-stack',
        name: 'Call Stack',
        items: [10, 20],
        maxCapacity: 5,
        currentOperation: undefined,
      },
    };

    const pushMutation: CanvasMutation = {
      type: 'stack',
      action: { kind: 'push-stack', value: 30 },
    };

    const next = applyCanvasMutation(initial, pushMutation);
    assert.deepEqual(next.stack?.items, [10, 20, 30]);
    assert.equal(next.stack?.currentOperation, 'push');
    assert.equal(next.stack?.items[next.stack.items.length - 1], 30);
    // Immutaibility guarantee
    assert.deepEqual(initial.stack?.items, [10, 20]);
  });

  await t.test('2. Stack: Pop operation removes top element and updates currentOperation', () => {
    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      stack: {
        id: 'main-stack',
        name: 'Stack',
        items: [10, 20, 30],
        currentOperation: 'push',
      },
    };

    const popMutation: CanvasMutation = {
      type: 'stack',
      action: { kind: 'pop-stack' },
    };

    const next = applyCanvasMutation(initial, popMutation);
    assert.deepEqual(next.stack?.items, [10, 20]);
    assert.equal(next.stack?.currentOperation, 'pop');
  });

  await t.test('3. Stack: Peek highlights top element without modifying stack items', () => {
    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      stack: {
        id: 'main-stack',
        name: 'Stack',
        items: [10, 20, 30],
      },
    };

    const peekMutation: CanvasMutation = {
      type: 'stack',
      action: { kind: 'peek-stack' },
    };

    const next = applyCanvasMutation(initial, peekMutation);
    assert.deepEqual(next.stack?.items, [10, 20, 30]);
    assert.equal(next.stack?.currentOperation, 'peek');
    assert.equal(next.stack?.highlights?.[2], 'active');
  });

  await t.test('4. Queue: Enqueue appends at rear and advances rear pointer', () => {
    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      queue: {
        id: 'main-queue',
        name: 'Queue',
        items: [10, 20],
        front: 0,
        rear: 1,
        capacity: 6,
        isCircular: false,
      },
    };

    const enqueueMutation: CanvasMutation = {
      type: 'queue',
      action: { kind: 'enqueue', value: 30 },
    };

    const next = applyCanvasMutation(initial, enqueueMutation);
    assert.deepEqual(next.queue?.items, [10, 20, 30]);
    assert.equal(next.queue?.rear, 2);
    assert.equal(next.queue?.front, 0);
    assert.equal(next.queue?.currentOperation, 'enqueue');
  });

  await t.test('5. Queue: Dequeue removes from front and advances front pointer', () => {
    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      queue: {
        id: 'main-queue',
        name: 'Queue',
        items: [10, 20, 30],
        front: 0,
        rear: 2,
        capacity: 6,
        isCircular: false,
      },
    };

    const dequeueMutation: CanvasMutation = {
      type: 'queue',
      action: { kind: 'dequeue' },
    };

    const next = applyCanvasMutation(initial, dequeueMutation);
    assert.equal(next.queue?.front, 1);
    assert.equal(next.queue?.currentOperation, 'dequeue');
  });

  await t.test('6. Circular Queue: Enqueue and Dequeue wrap around using modulo capacity', () => {
    const initial: CanvasEntities = {
      ...createEmptyCanvasEntities(),
      queue: {
        id: 'circ-queue',
        name: 'Circular Queue',
        items: [null, null, 30, 40, 50],
        front: 2,
        rear: 4,
        capacity: 5,
        isCircular: true,
      },
    };

    // Enqueue wrapping around to index 0: (4 + 1) % 5 = 0
    const wrapEnqueue: CanvasMutation = {
      type: 'queue',
      action: { kind: 'enqueue', value: 60 },
    };

    const next1 = applyCanvasMutation(initial, wrapEnqueue);
    assert.equal(next1.queue?.rear, 0);
    assert.equal(next1.queue?.items[0], 60);

    // Dequeue advances front from index 2 to 3
    const dequeue1: CanvasMutation = {
      type: 'queue',
      action: { kind: 'dequeue' },
    };
    const next2 = applyCanvasMutation(next1, dequeue1);
    assert.equal(next2.queue?.front, 3);
  });
});
