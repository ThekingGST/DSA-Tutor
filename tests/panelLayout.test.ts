import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PANEL_CONSTANTS,
  LINKED_LIST_PANEL_CONSTANTS,
  TREE_NODE_PANEL_CONSTANTS,
  calculateArrayPanelDimensions,
  calculateVarsPanelDimensions,
  calculateLoopPanelDimensions,
  calculateLinkedListNodeDimensions,
  calculateTreeNodeDimensions,
} from '../src/canvas/shapes/panelLayoutLogic.ts';

test('Panel Layout & Adaptive Dimension Solvers', async (t) => {
  await t.test('Consistent minimum constraints and padding tokens across all panels', () => {
    // Array, vars, for panels
    assert.equal(PANEL_CONSTANTS.MIN_WIDTH, 360);
    assert.equal(PANEL_CONSTANTS.MIN_HEIGHT, 180);
    assert.equal(PANEL_CONSTANTS.PADDING_X, 20);
    assert.equal(PANEL_CONSTANTS.PADDING_Y, 16);

    // Linked list node panels
    assert.equal(LINKED_LIST_PANEL_CONSTANTS.MIN_WIDTH, 180);
    assert.equal(LINKED_LIST_PANEL_CONSTANTS.MIN_HEIGHT, 134);
    assert.equal(LINKED_LIST_PANEL_CONSTANTS.PADDING_X, 16);
    assert.equal(LINKED_LIST_PANEL_CONSTANTS.PADDING_Y, 12);

    // Tree node panels
    assert.equal(TREE_NODE_PANEL_CONSTANTS.MIN_WIDTH, 76);
    assert.equal(TREE_NODE_PANEL_CONSTANTS.MIN_HEIGHT, 76);
    assert.equal(TREE_NODE_PANEL_CONSTANTS.PADDING, 8);
  });

  await t.test('Array panel adapts to content: small content respects min dimensions', () => {
    // 1 element array
    const smallDims = calculateArrayPanelDimensions(1);
    assert.ok(smallDims.w >= PANEL_CONSTANTS.MIN_WIDTH, 'Array width must be at least MIN_WIDTH');
    assert.ok(smallDims.h >= PANEL_CONSTANTS.MIN_HEIGHT, 'Array height must be at least MIN_HEIGHT');
    assert.equal(smallDims.w, 360);
    assert.equal(smallDims.h, 256); // Generous vertical space for pointers + slots + indices
  });

  await t.test('Array panel adapts to content: large content expands naturally', () => {
    // 10 elements array
    const largeDims = calculateArrayPanelDimensions(10);
    assert.ok(largeDims.w > PANEL_CONSTANTS.MIN_WIDTH, 'Array width must expand for 10 elements');
    // Total slots: 10 + 1 = 11. Width = 11 * 84 - 12 = 912 + padding (40) + buffer (48) = 1000
    assert.equal(largeDims.w, 1000);
    assert.equal(largeDims.h, 256);
  });

  await t.test('Variable cards panel adapts: small content stays compact with min dimensions', () => {
    // 1 variable
    const smallDims = calculateVarsPanelDimensions(1);
    assert.equal(smallDims.w, PANEL_CONSTANTS.MIN_WIDTH);
    assert.equal(smallDims.h, PANEL_CONSTANTS.MIN_HEIGHT);

    // 3 variables (1 row)
    const threeDims = calculateVarsPanelDimensions(3);
    assert.ok(threeDims.w >= PANEL_CONSTANTS.MIN_WIDTH);
    assert.equal(threeDims.h, PANEL_CONSTANTS.MIN_HEIGHT);
  });

  await t.test('Variable cards panel adapts: many variables expand in multiple rows with exact breathing space', () => {
    // 7 variables (e.g. Reverse Linked List Step 5)
    const sevenDims = calculateVarsPanelDimensions(7);
    assert.ok(sevenDims.w >= 540, '7 variables expands width');
    assert.equal(sevenDims.h, 240, '7 variables accommodates 3 rows comfortably');

    // 8 variables (2 rows of 4 or 3 rows)
    const eightDims = calculateVarsPanelDimensions(8);
    assert.ok(eightDims.w >= 520, '8 variables should give wide layout');
    assert.ok(eightDims.h >= 240, 'Height accommodates multiple rows');

    // 12 variables (4 rows)
    const twelveDims = calculateVarsPanelDimensions(12);
    assert.ok(twelveDims.h >= 240, '12 variables expand vertically');
  });

  await t.test('Loop tracker panel adapts: small loop stays clamped to min dimensions', () => {
    // 1 pill
    const smallLoop = calculateLoopPanelDimensions(1, 'for i in range(1)', 'i < 1');
    assert.equal(smallLoop.w, PANEL_CONSTANTS.MIN_WIDTH);
    assert.equal(smallLoop.h, 200);
  });

  await t.test('Loop tracker panel adapts: long condition or many pills expand width naturally', () => {
    // 8 pills
    const largePillsLoop = calculateLoopPanelDimensions(8, 'for k in range(0, 8)', 'k < 8');
    assert.ok(largePillsLoop.w > PANEL_CONSTANTS.MIN_WIDTH, '8 pills expand width beyond min');

    // Long condition expression
    const longCondLoop = calculateLoopPanelDimensions(
      3,
      'for index in complex_nested_generator()',
      'arr[mid].complexField <= targetVal.otherField'
    );
    assert.ok(longCondLoop.w > PANEL_CONSTANTS.MIN_WIDTH, 'Long condition expands width');
    assert.equal(longCondLoop.h, 200);
  });

  await t.test('Linked list node panel adapts: node without pointers is compact, with pointers has extra room', () => {
    // 0 pointer badges (e.g. Node 3)
    const noPointersNode = calculateLinkedListNodeDimensions(0, 3);
    assert.equal(noPointersNode.w, LINKED_LIST_PANEL_CONSTANTS.MIN_WIDTH);
    assert.equal(noPointersNode.h, LINKED_LIST_PANEL_CONSTANTS.MIN_HEIGHT); // 134
    assert.equal(noPointersNode.h, 134);

    // 1 pointer badge ('head')
    const smallNode = calculateLinkedListNodeDimensions(1, 1);
    assert.equal(smallNode.w, LINKED_LIST_PANEL_CONSTANTS.MIN_WIDTH);
    assert.equal(smallNode.h, 134); // Room for badge without touching border
  });


  await t.test('Linked list node panel adapts: multiple pointers expand width naturally', () => {
    // 4 pointers badges: 'prev', 'curr', 'next', 'tail'
    const multiPointersNode = calculateLinkedListNodeDimensions(4, 10);
    assert.ok(
      multiPointersNode.w > LINKED_LIST_PANEL_CONSTANTS.MIN_WIDTH,
      '4 pointer badges must expand node width to prevent clipping'
    );
    assert.ok(multiPointersNode.h >= LINKED_LIST_PANEL_CONSTANTS.MIN_HEIGHT);
  });

  await t.test('Linked list node panel adapts: long value string expands compartment width', () => {
    // Long value string: 'head_sentinel'
    const longValNode = calculateLinkedListNodeDimensions(1, 'head_sentinel');
    assert.ok(
      longValNode.w > LINKED_LIST_PANEL_CONSTANTS.MIN_WIDTH,
      'Long value string must expand node width'
    );
  });

  await t.test('Tree node panel adapts: small value respects minimum diameter', () => {
    // 2-digit number (e.g. 50)
    const smallTreeNode = calculateTreeNodeDimensions(50);
    assert.equal(smallTreeNode.w, TREE_NODE_PANEL_CONSTANTS.MIN_WIDTH);
    assert.equal(smallTreeNode.h, TREE_NODE_PANEL_CONSTANTS.MIN_HEIGHT);
  });

  await t.test('Tree node panel adapts: multi-digit values expand diameter cleanly', () => {
    // 4-digit number: 1024
    const largeTreeNode = calculateTreeNodeDimensions(1024);
    assert.ok(
      largeTreeNode.w > TREE_NODE_PANEL_CONSTANTS.MIN_WIDTH,
      '4-digit number must expand tree node diameter'
    );
    assert.equal(largeTreeNode.w, largeTreeNode.h, 'Tree node must maintain circular 1:1 aspect');
  });

  await t.test('User-resized dimensions are preserved across all panels unless content demands larger size', () => {
    // Array: User stretched panel to 600px
    const preservedArr = calculateArrayPanelDimensions(3, 600, 280);
    assert.equal(preservedArr.w, 600);
    assert.equal(preservedArr.h, 280);

    // Linked List: User stretched node to 240px
    const preservedList = calculateLinkedListNodeDimensions(1, 5, 240, 160);
    assert.equal(preservedList.w, 240);
    assert.equal(preservedList.h, 160);

    // Tree Node: User stretched node to 100px
    const preservedTree = calculateTreeNodeDimensions(25, 100, 100);
    assert.equal(preservedTree.w, 100);
    assert.equal(preservedTree.h, 100);

    // If array content grows beyond user's 600px (e.g. 10 elements needing 1000px)
    const expanded = calculateArrayPanelDimensions(10, 600, 280);
    assert.equal(expanded.w, 1000, 'Must automatically expand when content exceeds user resize');
    assert.equal(expanded.h, 280, 'User height preserved');
  });
});

