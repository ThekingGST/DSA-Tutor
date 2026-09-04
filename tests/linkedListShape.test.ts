import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LINKED_LIST_SHAPE_TYPE,
  LINKED_LIST_DEFAULT_PROPS,
  layoutLinkedList,
  connectNodes,
  updateNodeValue,
  setNodePointers,
} from '../src/canvas/shapes/linkedListLogic.ts';
import { applyCanvasMutation } from '../src/core/timelineReducer.ts';
import type { CanvasEntities, CanvasMutation, LinkedListNodeEntity } from '../src/types/timeline.ts';

test('Phase 4: Linked List Node Shape & Rewiring Tests', async (t) => {
  await t.test('Linked list default properties and shape type contract', () => {
    assert.equal(LINKED_LIST_SHAPE_TYPE, 'dsa-linked-node');
    assert.equal(LINKED_LIST_DEFAULT_PROPS.w, 160);
    assert.equal(LINKED_LIST_DEFAULT_PROPS.h, 110);
    assert.equal(LINKED_LIST_DEFAULT_PROPS.value, 1);
    assert.equal(LINKED_LIST_DEFAULT_PROPS.nextId, null);
    assert.deepEqual(LINKED_LIST_DEFAULT_PROPS.pointers, ['head']);
  });

  await t.test('layoutLinkedList calculates deterministic linear coordinates', () => {
    const nodes: Record<string, LinkedListNodeEntity> = {
      n1: { id: 'n1', value: 1, nextId: 'n2', pointers: ['head'] },
      n2: { id: 'n2', value: 2, nextId: 'n3', pointers: [] },
      n3: { id: 'n3', value: 3, nextId: null, pointers: ['tail'] },
    };

    const positions = layoutLinkedList(nodes, 100, 150, 200);

    assert.equal(positions['n1'].x, 100);
    assert.equal(positions['n1'].y, 150);
    assert.equal(positions['n2'].x, 300);
    assert.equal(positions['n2'].y, 150);
    assert.equal(positions['n3'].x, 500);
    assert.equal(positions['n3'].y, 150);
  });

  await t.test('connectNodes rewires pointer forwards, backwards, and to null', () => {
    const nodes: Record<string, LinkedListNodeEntity> = {
      n1: { id: 'n1', value: 1, nextId: 'n2', pointers: ['curr'] },
      n2: { id: 'n2', value: 2, nextId: null, pointers: [] },
    };

    // Detach n1.next to null (mid-air reversal step)
    const detached = connectNodes(nodes, 'n1', null);
    assert.equal(detached['n1'].nextId, null);
    assert.equal(nodes['n1'].nextId, 'n2', 'Original nodes dictionary must be immutable');

    // Rewire n2 backwards to n1
    const reversed = connectNodes(detached, 'n2', 'n1');
    assert.equal(reversed['n2'].nextId, 'n1');
  });

  await t.test('updateNodeValue updates display value immutably', () => {
    const nodes: Record<string, LinkedListNodeEntity> = {
      n1: { id: 'n1', value: 10, nextId: null, pointers: [] },
    };

    const updated = updateNodeValue(nodes, 'n1', 42);
    assert.equal(updated['n1'].value, 42);
    assert.equal(nodes['n1'].value, 10);
  });

  await t.test('setNodePointers assigns and slides pointers along the list', () => {
    const nodes: Record<string, LinkedListNodeEntity> = {
      n1: { id: 'n1', value: 1, nextId: 'n2', pointers: ['prev'] },
      n2: { id: 'n2', value: 2, nextId: null, pointers: [] },
    };

    const updated = setNodePointers(nodes, 'n2', ['curr', 'next']);
    assert.deepEqual(updated['n2'].pointers, ['curr', 'next']);
    assert.deepEqual(nodes['n2'].pointers, []);
  });

  await t.test('Dual manipulation parity: human direct rewiring vs AI timeline mutation', () => {
    const baseState: CanvasEntities = {
      linkedListNodes: {
        n1: { id: 'n1', value: 1, nextId: 'n2', pointers: ['curr'] },
        n2: { id: 'n2', value: 2, nextId: null, pointers: [] },
      },
      treeNodes: {},
      variables: {},
    };

    // 1. Human direct rewiring: detaches n1.next to null
    const humanNodes = connectNodes(baseState.linkedListNodes, 'n1', null);

    // 2. AI Timeline mutation via reducer
    const mutation: CanvasMutation = {
      type: 'linked-list',
      action: { kind: 'connect-nodes', fromId: 'n1', toId: null },
    };
    const aiState = applyCanvasMutation(baseState, mutation);

    // Assert parity
    assert.deepEqual(humanNodes, aiState.linkedListNodes);
  });
});
