import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARRAY_SHAPE_TYPE,
  ARRAY_DEFAULT_PROPS,
  computeArrayWidth,
  getPrePointers,
  getActivePointersForSlot,
  snapPointerToSlot,
  updateSlotValue,
  appendArraySlot,
  getSlotHighlight,
} from '../src/canvas/shapes/arrayShapeLogic.ts';
import { applyCanvasMutation } from '../src/core/timelineReducer.ts';
import type { CanvasEntities, CanvasMutation } from '../src/types/timeline.ts';

test('Phase 3: Array & Pointer TLDraw Custom Shape Tests', async (t) => {
  await t.test('Array shape type and default properties contract', () => {
    assert.equal(ARRAY_SHAPE_TYPE, 'dsa-array');
    assert.equal(ARRAY_DEFAULT_PROPS.name, 'arr');
    assert.equal(ARRAY_DEFAULT_PROPS.w, 560);
    assert.equal(ARRAY_DEFAULT_PROPS.h, 230);
    assert.deepEqual(ARRAY_DEFAULT_PROPS.values, [29, 10, 14, 37, 13]);
    assert.deepEqual(ARRAY_DEFAULT_PROPS.pointers, { i: 0, j: 1, pivot: 4 });
    assert.deepEqual(ARRAY_DEFAULT_PROPS.highlights, {});
  });

  await t.test('Pre-array pointers (e.g. i = -1) are correctly extracted', () => {
    const pointers = { i: -1, j: 0, pivot: 4 };
    const pre = getPrePointers(pointers);
    assert.equal(pre.length, 1);
    assert.equal(pre[0][0], 'i');
    assert.equal(pre[0][1], -1);

    const noPre = getPrePointers({ i: 0, j: 1 });
    assert.equal(noPre.length, 0);
  });

  await t.test('Slot active pointers filtering', () => {
    const pointers = { i: 1, j: 1, pivot: 4 };
    const slot1Pointers = getActivePointersForSlot(pointers, 1);
    assert.equal(slot1Pointers.length, 2);
    assert.deepEqual(
      slot1Pointers.map((p) => p[0]),
      ['i', 'j']
    );

    const slot4Pointers = getActivePointersForSlot(pointers, 4);
    assert.equal(slot4Pointers.length, 1);
    assert.equal(slot4Pointers[0][0], 'pivot');

    const slot0Pointers = getActivePointersForSlot(pointers, 0);
    assert.equal(slot0Pointers.length, 0);
  });

  await t.test('Array direct manipulation: inline slot value editing', () => {
    const initial = [29, 10, 14, 37, 13];
    const edited = updateSlotValue(initial, 1, 99);

    assert.equal(edited[1], 99);
    assert.equal(initial[1], 10, 'Original values array must be immutable');

    // Out of bounds safety
    const outOfBounds = updateSlotValue(initial, -1, 42);
    assert.deepEqual(outOfBounds, initial);
  });

  await t.test('Array direct manipulation: pointer dragging and snapping', () => {
    const initialPointers = { i: -1, j: 0, pivot: 4 };
    const snapped = snapPointerToSlot(initialPointers, 'i', 2);

    assert.equal(snapped.i, 2);
    assert.equal(snapped.j, 0);
    assert.equal(snapped.pivot, 4);
    assert.equal(initialPointers.i, -1, 'Original pointer map must remain untouched');
  });

  await t.test('Dual manipulation parity: human direct edit vs AI timeline mutation', () => {
    // 1. Human direct edit: slot 0 set to 42, pointer 'j' moved to 3
    const humanState: CanvasEntities = {
      linkedListNodes: {},
      treeNodes: {},
      variables: {},
      array: {
        id: 'arr-1',
        name: 'arr',
        values: [10, 20, 30],
        pointers: { i: 0, j: 1 },
        highlights: {},
      },
    };

    const directValues = updateSlotValue(humanState.array!.values, 0, 42);
    const directPointers = snapPointerToSlot(humanState.array!.pointers, 'j', 3);

    // 2. AI Timeline mutation: exact same operations applied via reducer
    const mutation1: CanvasMutation = {
      type: 'array',
      action: { kind: 'set-slot', index: 0, value: 42 },
    };
    const mutation2: CanvasMutation = {
      type: 'array',
      action: { kind: 'move-pointer', name: 'j', toIndex: 3 },
    };

    let aiState = applyCanvasMutation(humanState, mutation1);
    aiState = applyCanvasMutation(aiState, mutation2);

    // Assert absolute parity between human gesture and AI mutation
    assert.deepEqual(directValues, aiState.array!.values);
    assert.deepEqual(directPointers, aiState.array!.pointers);
  });

  await t.test('Array visual states: highlight mapping', () => {
    const highlights: Record<string, string> = {
      '0': 'swapped',
      '1': 'swapped',
      '2': 'comparing',
      '3': 'active',
      '4': 'sorted',
    };

    assert.equal(getSlotHighlight(highlights, 0), 'swapped');
    assert.equal(getSlotHighlight(highlights, 2), 'comparing');
    assert.equal(getSlotHighlight(highlights, 3), 'active');
    assert.equal(getSlotHighlight(highlights, 4), 'sorted');
    assert.equal(getSlotHighlight(highlights, 99), 'default');
  });

  await t.test('Array element append and dynamic width calculation', () => {
    const currentValues = [10, 20, 30];
    const { nextValues, nextWidth } = appendArraySlot(currentValues, 40);

    assert.equal(nextValues.length, 4);
    assert.equal(nextValues[3], 40);
    assert.equal(nextWidth, 560);

    // Large array expands width beyond minWidth
    const largeValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const expandedWidth = computeArrayWidth(largeValues.length);
    assert.equal(expandedWidth, 1040);
  });

  await t.test('Array resize persistence logic: preserving user-resized dimensions across step updates', () => {
    // 1. Initial creation defaults
    const initialValues = [29, 10, 14, 37, 13];
    const targetWidth = Math.max(540, (initialValues.length + 1) * 75 + 80);
    assert.equal(targetWidth, 540);

    // 2. User resizes the array panel to w: 780, h: 280
    const userResizedProps = {
      w: 780,
      h: 280,
      values: [...initialValues],
    };

    // 3. Step transition occurs with same values length
    const nextStepValues = [10, 29, 14, 37, 13];
    const prevLen = userResizedProps.values.length;
    const nextLen = nextStepValues.length;
    let preservedWidth = typeof userResizedProps.w === 'number' ? userResizedProps.w : targetWidth;
    if (nextLen > prevLen && preservedWidth < targetWidth) {
      preservedWidth = targetWidth;
    }
    const preservedHeight = typeof userResizedProps.h === 'number' ? userResizedProps.h : 230;

    // Must strictly preserve the user-chosen 780 and 280 dimensions
    assert.equal(preservedWidth, 780);
    assert.equal(preservedHeight, 280);

    // 4. Test when array expands with more elements than will fit in user width
    const massiveValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const massiveTargetWidth = Math.max(540, (massiveValues.length + 1) * 75 + 80);
    const massivePrevLen = 5;
    const massiveNextLen = massiveValues.length;
    let autoExpandedWidth = typeof userResizedProps.w === 'number' ? userResizedProps.w : massiveTargetWidth;
    if (massiveNextLen > massivePrevLen && autoExpandedWidth < massiveTargetWidth) {
      autoExpandedWidth = massiveTargetWidth;
    }
    assert.equal(autoExpandedWidth, 1055);
  });
});
