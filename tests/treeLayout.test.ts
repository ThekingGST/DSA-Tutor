import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TREE_NODE_SHAPE_TYPE,
  TREE_NODE_DEFAULT_PROPS,
  findTreeRootId,
  layoutTree,
  insertTreeNode,
} from '../src/canvas/shapes/treeLayoutLogic.ts';
import { applyCanvasMutation } from '../src/core/timelineReducer.ts';
import type { CanvasEntities, CanvasMutation, TreeNodeEntity } from '../src/types/timeline.ts';

test('Phase 4: BST Node Shape & Deterministic Tree Layout Tests', async (t) => {
  await t.test('Tree node default properties and shape type contract', () => {
    assert.equal(TREE_NODE_SHAPE_TYPE, 'dsa-tree-node');
    assert.equal(TREE_NODE_DEFAULT_PROPS.w, 70);
    assert.equal(TREE_NODE_DEFAULT_PROPS.h, 70);
    assert.equal(TREE_NODE_DEFAULT_PROPS.value, 50);
    assert.equal(TREE_NODE_DEFAULT_PROPS.leftId, null);
    assert.equal(TREE_NODE_DEFAULT_PROPS.rightId, null);
    assert.equal(TREE_NODE_DEFAULT_PROPS.parentId, null);
    assert.equal(TREE_NODE_DEFAULT_PROPS.highlight, 'default');
  });

  await t.test('findTreeRootId correctly identifies the tree root', () => {
    const tree: Record<string, TreeNodeEntity> = {
      n30: { id: 'n30', value: 30, leftId: null, rightId: null, parentId: 'n50', highlight: 'default' },
      n50: { id: 'n50', value: 50, leftId: 'n30', rightId: 'n70', parentId: null, highlight: 'default' },
      n70: { id: 'n70', value: 70, leftId: null, rightId: null, parentId: 'n50', highlight: 'default' },
    };

    assert.equal(findTreeRootId(tree), 'n50');
    assert.equal(findTreeRootId({}), null);
  });

  await t.test('layoutTree computes monotonic horizontal ordering without edge crossing', () => {
    // Binary Search Tree: Root 50, Left 30, Right 70, Left-Right 40
    const tree: Record<string, TreeNodeEntity> = {
      n50: { id: 'n50', value: 50, leftId: 'n30', rightId: 'n70', parentId: null, highlight: 'default' },
      n30: { id: 'n30', value: 30, leftId: null, rightId: 'n40', parentId: 'n50', highlight: 'default' },
      n70: { id: 'n70', value: 70, leftId: null, rightId: null, parentId: 'n50', highlight: 'default' },
      n40: { id: 'n40', value: 40, leftId: null, rightId: null, parentId: 'n30', highlight: 'default' },
    };

    const { positions, connectors } = layoutTree(tree, 'n50', 100, 50, 100, 90);

    // In-order traversal order: n30 (rank 0), n40 (rank 1), n50 (rank 2), n70 (rank 3)
    assert.ok(positions['n30'].x < positions['n40'].x, 'n30 must be to the left of n40');
    assert.ok(positions['n40'].x < positions['n50'].x, 'n40 must be to the left of n50');
    assert.ok(positions['n50'].x < positions['n70'].x, 'n50 must be to the left of n70');

    // Depths
    assert.equal(positions['n50'].depth, 0);
    assert.equal(positions['n30'].depth, 1);
    assert.equal(positions['n70'].depth, 1);
    assert.equal(positions['n40'].depth, 2);

    // Connectors: 3 edges (50->30, 50->70, 30->40)
    assert.equal(connectors.length, 3);
    const leftChildConnector = connectors.find((c) => c.fromId === 'n50' && c.toId === 'n30');
    assert.ok(leftChildConnector);
    assert.equal(leftChildConnector?.branch, 'left');

    const rightChildConnector = connectors.find((c) => c.fromId === 'n50' && c.toId === 'n70');
    assert.ok(rightChildConnector);
    assert.equal(rightChildConnector?.branch, 'right');
  });

  await t.test('insertTreeNode attaches node and maintains tree integrity', () => {
    const tree: Record<string, TreeNodeEntity> = {
      n50: { id: 'n50', value: 50, leftId: 'n30', rightId: null, parentId: null, highlight: 'default' },
      n30: { id: 'n30', value: 30, leftId: null, rightId: null, parentId: 'n50', highlight: 'default' },
    };

    // Insert 35 as right child of 30
    const updatedTree = insertTreeNode(tree, 'n35', 35, 'n30', 'right');

    assert.ok(updatedTree['n35']);
    assert.equal(updatedTree['n35'].value, 35);
    assert.equal(updatedTree['n35'].parentId, 'n30');
    assert.equal(updatedTree['n30'].rightId, 'n35');

    // Re-layout tree after insertion
    const { positions } = layoutTree(updatedTree, 'n50', 100, 50, 100, 90);
    assert.ok(positions['n30'].x < positions['n35'].x);
    assert.ok(positions['n35'].x < positions['n50'].x);
  });

  await t.test('Dual manipulation parity: human node insertion vs AI timeline reducer', () => {
    const baseState: CanvasEntities = {
      linkedListNodes: {},
      treeNodes: {
        n50: { id: 'n50', value: 50, leftId: 'n30', rightId: null, parentId: null, highlight: 'default' },
        n30: { id: 'n30', value: 30, leftId: null, rightId: null, parentId: 'n50', highlight: 'default' },
      },
      variables: {},
    };

    // 1. Direct function
    const directTree = insertTreeNode(baseState.treeNodes, 'n35', 35, 'n30', 'right');

    // 2. Reducer mutation
    const mutation: CanvasMutation = {
      type: 'bst',
      action: { kind: 'insert-tree-node', nodeId: 'n35', value: 35, parentId: 'n30', branch: 'right' },
    };
    const aiState = applyCanvasMutation(baseState, mutation);

    assert.deepEqual(directTree['n35'].value, aiState.treeNodes['n35'].value);
    assert.equal(directTree['n30'].rightId, aiState.treeNodes['n30'].rightId);
  });
});
