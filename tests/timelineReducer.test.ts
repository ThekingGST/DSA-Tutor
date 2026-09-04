import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyCanvasEntities,
  cloneCanvasEntities,
  applyCanvasMutation,
  computeTimelineState,
} from '../src/core/timelineReducer.ts';
import { PRESET_SCENARIOS } from '../src/mock/presetScenarios.ts';
import type { CanvasEntities, CanvasMutation } from '../src/types/timeline.ts';

test('timelineReducer core tests', async (t) => {
  await t.test('createEmptyCanvasEntities returns clean structure', () => {
    const empty = createEmptyCanvasEntities();
    assert.deepEqual(empty.linkedListNodes, {});
    assert.deepEqual(empty.treeNodes, {});
    assert.deepEqual(empty.variables, {});
    assert.equal(empty.array, undefined);
  });

  await t.test('cloneCanvasEntities is a deep clone (immutable guarantee)', () => {
    const original: CanvasEntities = {
      array: {
        id: 'test-arr',
        name: 'test',
        values: [10, 20, 30],
        pointers: { i: 0 },
        highlights: { 0: 'active' },
      },
      linkedListNodes: {
        n1: { id: 'n1', value: 1, nextId: null, pointers: ['head'] },
      },
      treeNodes: {
        t1: { id: 't1', value: 50, leftId: null, rightId: null, parentId: null, highlight: 'default' },
      },
      variables: {
        max: { name: 'max', value: 30, color: 'mint' },
      },
    };

    const cloned = cloneCanvasEntities(original);
    assert.deepEqual(cloned, original);

    // Mutate cloned and ensure original is untouched
    cloned.array!.values[0] = 999;
    cloned.array!.pointers['i'] = 2;
    cloned.variables['max'].value = 999;
    cloned.linkedListNodes['n1'].pointers.push('tail');

    assert.equal(original.array!.values[0], 10);
    assert.equal(original.array!.pointers['i'], 0);
    assert.equal(original.variables['max'].value, 30);
    assert.equal(original.linkedListNodes['n1'].pointers.length, 1);
  });

  await t.test('applyCanvasMutation - array slot swap and pointer move', () => {
    const base: CanvasEntities = {
      array: {
        id: 'arr',
        name: 'arr',
        values: [29, 10, 14],
        pointers: { i: -1, j: 0 },
        highlights: {},
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {},
    };

    // Swap slots 0 and 1
    const swapMutation: CanvasMutation = {
      type: 'array',
      action: { kind: 'swap-slots', indexA: 0, indexB: 1 },
    };
    const swapped = applyCanvasMutation(base, swapMutation);
    assert.deepEqual(swapped.array!.values, [10, 29, 14]);

    // Move pointer i to 0
    const movePointerMutation: CanvasMutation = {
      type: 'array',
      action: { kind: 'move-pointer', name: 'i', toIndex: 0 },
    };
    const moved = applyCanvasMutation(swapped, movePointerMutation);
    assert.equal(moved.array!.pointers['i'], 0);
  });

  await t.test('applyCanvasMutation - variable set and remove', () => {
    const base = createEmptyCanvasEntities();
    const setVarMutation: CanvasMutation = {
      type: 'variable',
      action: { kind: 'set-variable', name: 'max', value: 42, color: 'mint' },
    };
    const withVar = applyCanvasMutation(base, setVarMutation);
    assert.equal(withVar.variables['max'].value, 42);
    assert.equal(withVar.variables['max'].color, 'mint');

    const removeVarMutation: CanvasMutation = {
      type: 'variable',
      action: { kind: 'remove-variable', name: 'max' },
    };
    const withoutVar = applyCanvasMutation(withVar, removeVarMutation);
    assert.equal(withoutVar.variables['max'], undefined);
  });

  await t.test('applyCanvasMutation - linked list rewiring', () => {
    const base: CanvasEntities = {
      linkedListNodes: {
        n1: { id: 'n1', value: 1, nextId: 'n2', pointers: ['curr'] },
        n2: { id: 'n2', value: 2, nextId: null, pointers: [] },
      },
      treeNodes: {},
      variables: {},
    };

    // Rewire n1 to point to null (reversal)
    const rewireMutation: CanvasMutation = {
      type: 'linked-list',
      action: { kind: 'connect-nodes', fromId: 'n1', toId: null },
    };
    const rewired = applyCanvasMutation(base, rewireMutation);
    assert.equal(rewired.linkedListNodes['n1'].nextId, null);
  });

  await t.test('applyCanvasMutation - tree node insertion', () => {
    const base: CanvasEntities = {
      linkedListNodes: {},
      treeNodes: {
        root: { id: 'root', value: 50, leftId: null, rightId: null, parentId: null, highlight: 'default' },
      },
      variables: {},
    };

    const insertMutation: CanvasMutation = {
      type: 'bst',
      action: { kind: 'insert-tree-node', nodeId: 'child_left', value: 30, parentId: 'root', branch: 'left' },
    };
    const inserted = applyCanvasMutation(base, insertMutation);
    assert.ok(inserted.treeNodes['child_left']);
    assert.equal(inserted.treeNodes['child_left'].value, 30);
    assert.equal(inserted.treeNodes['root'].leftId, 'child_left');
  });

  await t.test('computeTimelineState - QuickSort full scenario deterministic fold', () => {
    const qs = PRESET_SCENARIOS.find((s) => s.id === 'quicksort-partition')!;
    
    // Initial state: [29, 10, 14, 37, 13]
    const state0 = computeTimelineState(qs.initialState, qs.steps, 0);
    assert.deepEqual(state0.array!.values, [29, 10, 14, 37, 13]);
    assert.equal(state0.variables['pivot']?.value, 13);

    // Step 2 (3rd step, index 2): swap arr[0] and arr[1]
    const state2 = computeTimelineState(qs.initialState, qs.steps, 2);
    assert.deepEqual(state2.array!.values, [10, 29, 14, 37, 13]);
    assert.equal(state2.array!.pointers['i'], 0);
    assert.equal(state2.array!.pointers['j'], 1);

    // Step 5 (final step): pivot swapped into place
    const stateFinal = computeTimelineState(qs.initialState, qs.steps, 5);
    assert.deepEqual(stateFinal.array!.values, [10, 13, 14, 37, 29]);
    assert.equal(stateFinal.array!.pointers['pivot'], 1);

    // Time-travel scrubbing test: scrub backward from final to step 0
    const stateBackTo0 = computeTimelineState(qs.initialState, qs.steps, 0);
    assert.deepEqual(stateBackTo0.array!.values, [29, 10, 14, 37, 13]);

    // Out of bounds safety
    const stateNeg = computeTimelineState(qs.initialState, qs.steps, -5);
    assert.deepEqual(stateNeg.array!.values, [29, 10, 14, 37, 13]);

    const stateOverflow = computeTimelineState(qs.initialState, qs.steps, 999);
    assert.deepEqual(stateOverflow.array!.values, stateFinal.array!.values);
  });
});
