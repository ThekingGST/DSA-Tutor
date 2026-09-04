import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTreeHeight,
  computeBalanceFactor,
  performRightRotation,
  performLeftRotation,
  traverseTreeInorder,
  traverseTreePreorder,
  traverseTreePostorder,
  traverseTreeLevelOrder,
  deleteBstNode,
  heapifySiftDown,
} from '../src/canvas/shapes/treeLayoutLogic.ts';
import type { TreeNodeEntity } from '../src/types/timeline.ts';

test('TDD: Advanced Tree Operations (BST, AVL Rotations, Traversal & Heap)', async (t) => {
  // Helper to build test BST:
  //         50
  //       /    \
  //     30      70
  //    /  \    /  \
  //   20  40  60  80
  const buildSampleTree = (): Record<string, TreeNodeEntity> => ({
    '50': { id: '50', value: 50, leftId: '30', rightId: '70', parentId: null, highlight: 'default' },
    '30': { id: '30', value: 30, leftId: '20', rightId: '40', parentId: '50', highlight: 'default' },
    '70': { id: '70', value: 70, leftId: '60', rightId: '80', parentId: '50', highlight: 'default' },
    '20': { id: '20', value: 20, leftId: null, rightId: null, parentId: '30', highlight: 'default' },
    '40': { id: '40', value: 40, leftId: null, rightId: null, parentId: '30', highlight: 'default' },
    '60': { id: '60', value: 60, leftId: null, rightId: null, parentId: '70', highlight: 'default' },
    '80': { id: '80', value: 80, leftId: null, rightId: null, parentId: '70', highlight: 'default' },
  });

  await t.test('1. Traversals: Inorder, Preorder, Postorder, Level-order', () => {
    const tree = buildSampleTree();
    
    // Inorder (Left -> Root -> Right): 20, 30, 40, 50, 60, 70, 80
    assert.deepEqual(traverseTreeInorder(tree, '50'), [20, 30, 40, 50, 60, 70, 80]);
    
    // Preorder (Root -> Left -> Right): 50, 30, 20, 40, 70, 60, 80
    assert.deepEqual(traverseTreePreorder(tree, '50'), [50, 30, 20, 40, 70, 60, 80]);
    
    // Postorder (Left -> Right -> Root): 20, 40, 30, 60, 80, 70, 50
    assert.deepEqual(traverseTreePostorder(tree, '50'), [20, 40, 30, 60, 80, 70, 50]);

    // Level-order (BFS): 50, 30, 70, 20, 40, 60, 80
    assert.deepEqual(traverseTreeLevelOrder(tree, '50'), [50, 30, 70, 20, 40, 60, 80]);
  });

  await t.test('2. Tree Height and Balance Factor computation', () => {
    const tree = buildSampleTree();
    assert.equal(computeTreeHeight(tree, '50'), 3);
    assert.equal(computeTreeHeight(tree, '20'), 1);
    assert.equal(computeBalanceFactor(tree, '50'), 0); // Balanced: 2 - 2 = 0
    
    // Imbalanced Tree (Left Heavy):
    //      30
    //     /
    //    20
    //   /
    //  10
    const leftHeavy: Record<string, TreeNodeEntity> = {
      '30': { id: '30', value: 30, leftId: '20', rightId: null, parentId: null, highlight: 'default' },
      '20': { id: '20', value: 20, leftId: '10', rightId: null, parentId: '30', highlight: 'default' },
      '10': { id: '10', value: 10, leftId: null, rightId: null, parentId: '20', highlight: 'default' },
    };
    assert.equal(computeTreeHeight(leftHeavy, '30'), 3);
    assert.equal(computeBalanceFactor(leftHeavy, '30'), 2); // bf = height(20) - 0 = 2 (imbalance detected)
  });

  await t.test('3. AVL Rotations: Right Rotation (LL) restores balance', () => {
    // Left heavy: 30 -> 20 -> 10. Rotating right at 30 should promote 20 to root with left 10, right 30
    const leftHeavy: Record<string, TreeNodeEntity> = {
      '30': { id: '30', value: 30, leftId: '20', rightId: null, parentId: null, highlight: 'default' },
      '20': { id: '20', value: 20, leftId: '10', rightId: null, parentId: '30', highlight: 'default' },
      '10': { id: '10', value: 10, leftId: null, rightId: null, parentId: '20', highlight: 'default' },
    };

    const balanced = performRightRotation(leftHeavy, '30');
    assert.equal(balanced['20'].parentId, null);
    assert.equal(balanced['20'].leftId, '10');
    assert.equal(balanced['20'].rightId, '30');
    assert.equal(balanced['30'].parentId, '20');
    assert.equal(balanced['30'].leftId, null);
    assert.equal(computeBalanceFactor(balanced, '20'), 0);
  });

  await t.test('4. AVL Rotations: Left Rotation (RR) restores balance', () => {
    // Right heavy: 10 -> 20 -> 30. Rotating left at 10 should promote 20 to root with left 10, right 30
    const rightHeavy: Record<string, TreeNodeEntity> = {
      '10': { id: '10', value: 10, leftId: null, rightId: '20', parentId: null, highlight: 'default' },
      '20': { id: '20', value: 20, leftId: null, rightId: '30', parentId: '10', highlight: 'default' },
      '30': { id: '30', value: 30, leftId: null, rightId: null, parentId: '20', highlight: 'default' },
    };

    const balanced = performLeftRotation(rightHeavy, '10');
    assert.equal(balanced['20'].parentId, null);
    assert.equal(balanced['20'].leftId, '10');
    assert.equal(balanced['20'].rightId, '30');
    assert.equal(balanced['10'].parentId, '20');
    assert.equal(balanced['10'].rightId, null);
    assert.equal(computeBalanceFactor(balanced, '20'), 0);
  });

  await t.test('5. BST Node Deletion (Leaf, 1-Child, 2-Children)', () => {
    const tree = buildSampleTree();

    // 5a. Delete Leaf (20)
    const afterLeaf = deleteBstNode(tree, 20);
    assert.equal(afterLeaf['20'], undefined);
    assert.equal(afterLeaf['30'].leftId, null);

    // 5b. Delete Node with 2 children (70 -> replaced by successor 80)
    const afterTwoChildren = deleteBstNode(tree, 70);
    assert.equal(afterTwoChildren['70'], undefined);
    assert.equal(afterTwoChildren['50'].rightId, '80');
    assert.equal(afterTwoChildren['80'].leftId, '60');
  });

  await t.test('6. Min Heap Sift Down synchronizes heap property and swaps', () => {
    // Array: [50, 20, 30, 40, 25] -> index 0 (50) violates min-heap property
    const heap = [50, 20, 30, 40, 25];
    const steps = heapifySiftDown(heap, 0);

    // After sift-down, smaller child 20 swaps with 50 -> [20, 50, 30, 40, 25]
    // Then 50 compares with children at 3 (40) and 4 (25) -> swaps with 25 -> [20, 25, 30, 40, 50]
    assert.ok(steps.length >= 2);
    const finalHeap = steps[steps.length - 1].heap;
    assert.equal(finalHeap[0], 20);
    assert.equal(finalHeap[1], 25);
  });
});
