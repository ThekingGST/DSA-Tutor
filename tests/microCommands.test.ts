import test from 'node:test';
import assert from 'node:assert/strict';
import { executeMicroCommand } from '../src/ai/microCommands.ts';
import { createEmptyCanvasEntities } from '../src/core/timelineReducer.ts';

test('Phase 6: Micro-Commands Parser & Direct Mutation Tests', async (t) => {
  await t.test('Creates new array from prompt', () => {
    const init = createEmptyCanvasEntities();
    const res = executeMicroCommand('create array [10, 20, 30, 40]', init);

    assert.equal(res.isMicroCommand, true);
    assert.ok(res.nextState?.array);
    assert.deepEqual(res.nextState?.array?.values, [10, 20, 30, 40]);
    assert.match(res.message || '', /Created array with 4 elements/);
  });

  await t.test('Appends element to array', () => {
    const init = createEmptyCanvasEntities();
    init.array = {
      id: 'arr-1',
      name: 'arr',
      values: [5, 10],
      pointers: {},
      highlights: {},
    };

    const res = executeMicroCommand('append 99', init);
    assert.equal(res.isMicroCommand, true);
    assert.deepEqual(res.nextState?.array?.values, [5, 10, 99]);
  });

  await t.test('Sets variable card with semantic color', () => {
    const init = createEmptyCanvasEntities();
    const resMax = executeMicroCommand('set max = 42', init);
    assert.equal(resMax.isMicroCommand, true);
    assert.equal(resMax.nextState?.variables.max.value, 42);
    assert.equal(resMax.nextState?.variables.max.color, 'mint');

    const resPivot = executeMicroCommand('create variable pivot = 13', init);
    assert.equal(resPivot.isMicroCommand, true);
    assert.equal(resPivot.nextState?.variables.pivot.value, 13);
    assert.equal(resPivot.nextState?.variables.pivot.color, 'amber');
  });

  await t.test('Deletes variable card', () => {
    const init = createEmptyCanvasEntities();
    init.variables.temp = { name: 'temp', value: 99 };
    const res = executeMicroCommand('delete var temp', init);
    assert.equal(res.isMicroCommand, true);
    assert.equal(res.nextState?.variables.temp, undefined);
  });

  await t.test('Inserts tree nodes in BST structure', () => {
    let state = createEmptyCanvasEntities();
    // Root 50
    const res1 = executeMicroCommand('insert 50 into tree', state);
    assert.equal(res1.isMicroCommand, true);
    state = res1.nextState!;
    assert.ok(state.treeNodes['node-50']);

    // Left child 30
    const res2 = executeMicroCommand('insert 30 into tree', state);
    assert.equal(res2.isMicroCommand, true);
    state = res2.nextState!;
    assert.equal(state.treeNodes['node-50'].leftId, 'node-30');
    assert.equal(state.treeNodes['node-30'].parentId, 'node-50');

    // Right child 70
    const res3 = executeMicroCommand('tree insert 70', state);
    assert.equal(res3.isMicroCommand, true);
    state = res3.nextState!;
    assert.equal(state.treeNodes['node-50'].rightId, 'node-70');
  });

  await t.test('Creates singly linked list nodes', () => {
    const init = createEmptyCanvasEntities();
    const res = executeMicroCommand('create list [10, 20, 30]', init);
    assert.equal(res.isMicroCommand, true);
    const nodes = res.nextState?.linkedListNodes || {};
    assert.equal(Object.keys(nodes).length, 3);
    assert.equal(nodes['n1'].value, 10);
    assert.equal(nodes['n1'].nextId, 'n2');
    assert.equal(nodes['n2'].value, 20);
    assert.equal(nodes['n2'].nextId, 'n3');
    assert.equal(nodes['n3'].value, 30);
    assert.equal(nodes['n3'].nextId, null);
    assert.deepEqual(nodes['n1'].pointers, ['head']);
  });

  await t.test('Moves pointer and swaps slots', () => {
    const init = createEmptyCanvasEntities();
    init.array = {
      id: 'arr-1',
      name: 'arr',
      values: [100, 200, 300],
      pointers: { i: 0 },
      highlights: {},
    };

    // Move pointer
    const resMove = executeMicroCommand('move pointer i to 2', init);
    assert.equal(resMove.isMicroCommand, true);
    assert.equal(resMove.nextState?.array?.pointers.i, 2);

    // Swap slots
    const resSwap = executeMicroCommand('swap 0 2', init);
    assert.equal(resSwap.isMicroCommand, true);
    assert.deepEqual(resSwap.nextState?.array?.values, [300, 200, 100]);
    assert.equal(resSwap.nextState?.array?.highlights[0], 'swapped');
    assert.equal(resSwap.nextState?.array?.highlights[2], 'swapped');
  });

  await t.test('Returns false for macro or general prompts', () => {
    const init = createEmptyCanvasEntities();
    assert.equal(executeMicroCommand('find max element in array', init).isMicroCommand, false);
    assert.equal(executeMicroCommand('explain quicksort partition', init).isMicroCommand, false);
    assert.equal(executeMicroCommand('how does binary search work', init).isMicroCommand, false);
  });
});
