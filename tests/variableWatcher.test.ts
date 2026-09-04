import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeVariableWatchList,
  inferVariableType,
  getVariableBadgeColor,
} from '../src/core/variableWatcherLogic.ts';

test('Phase 5: Variable Watcher Logic Tests', async (t) => {
  await t.test('inferVariableType identifies types properly', () => {
    assert.equal(inferVariableType(42), 'number');
    assert.equal(inferVariableType('100'), 'number');
    assert.equal(inferVariableType('True'), 'boolean');
    assert.equal(inferVariableType('False'), 'boolean');
    assert.equal(inferVariableType('Node(1)'), 'node');
    assert.equal(inferVariableType('null'), 'node');
    assert.equal(inferVariableType('hello'), 'string');
  });

  await t.test('getVariableBadgeColor prioritizes change highlight and semantics', () => {
    assert.equal(getVariableBadgeColor('i', false), 'indigo');
    assert.equal(getVariableBadgeColor('i', true), 'amber'); // changed
    assert.equal(getVariableBadgeColor('pivot', false), 'mint');
    assert.equal(getVariableBadgeColor('head', false), 'purple');
  });

  await t.test('computeVariableWatchList detects delta changes across timeline steps', () => {
    const prev = {
      i: -1,
      j: 0,
      pivot: 13,
    };
    const current = {
      i: 0, // changed
      j: 1, // changed
      pivot: 13, // unchanged
    };

    const watchList = computeVariableWatchList(current, prev);
    assert.equal(watchList.length, 3);

    const iVar = watchList.find((v) => v.name === 'i');
    assert.ok(iVar);
    assert.equal(iVar.currentValue, 0);
    assert.equal(iVar.previousValue, -1);
    assert.equal(iVar.hasChanged, true);
    assert.equal(iVar.badgeColor, 'amber');

    const pivotVar = watchList.find((v) => v.name === 'pivot');
    assert.ok(pivotVar);
    assert.equal(pivotVar.currentValue, 13);
    assert.equal(pivotVar.hasChanged, false);
    assert.equal(pivotVar.badgeColor, 'mint');
  });

  await t.test('computeVariableWatchList orders pointers and indices first', () => {
    const vars = {
      'arr[j]': 29,
      j: 0,
      secondMax: 5,
      i: -1,
      pivot: 13,
    };

    const watchList = computeVariableWatchList(vars, {});
    const names = watchList.map((v) => v.name);
    // Special pointers i, j, pivot should appear before complex expressions
    const iIdx = names.indexOf('i');
    const jIdx = names.indexOf('j');
    const arrJIdx = names.indexOf('arr[j]');
    assert.ok(iIdx < arrJIdx, 'pointer i should precede arr[j]');
    assert.ok(jIdx < arrJIdx, 'pointer j should precede arr[j]');
  });
});
