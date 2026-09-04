import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VARIABLE_CARDS_SHAPE_TYPE,
  VARIABLE_CARDS_DEFAULT_PROPS,
  entityMapToVariableItems,
  getVariableTheme,
  updateVariableInList,
  upsertVariableInList,
  removeVariableFromList,
  type VariableItem,
} from '../src/canvas/shapes/variableCardsLogic.ts';
import type { VariableCardEntity } from '../src/types/timeline.ts';
import { applyCanvasMutation } from '../src/core/timelineReducer.ts';

test('Phase 5: Variable Cards Shape & On-Canvas Logic Tests', async (t) => {
  await t.test('Variable cards default properties and shape type contract', () => {
    assert.equal(VARIABLE_CARDS_SHAPE_TYPE, 'dsa-variable-cards');
    assert.equal(VARIABLE_CARDS_DEFAULT_PROPS.w, 520);
    assert.equal(VARIABLE_CARDS_DEFAULT_PROPS.h, 175);
    assert.equal(VARIABLE_CARDS_DEFAULT_PROPS.title, 'vars');
    assert.equal(Array.isArray(VARIABLE_CARDS_DEFAULT_PROPS.variables), true);
    assert.ok(VARIABLE_CARDS_DEFAULT_PROPS.variables.length >= 3);
  });

  await t.test('entityMapToVariableItems converts entities and identifies changes', () => {
    const entities: Record<string, VariableCardEntity> = {
      max: { name: 'max', value: 20, color: 'mint' },
      secondMax: { name: 'secondMax', value: 15, color: 'mint' },
      i: { name: 'i', value: 2, color: 'indigo' },
    };

    // No changes
    const items1 = entityMapToVariableItems(entities);
    assert.equal(items1.length, 3);
    assert.equal(items1[0].name, 'max');
    assert.equal(items1[0].value, 20);
    assert.equal(items1[0].color, 'mint');
    assert.equal(items1[0].isUpdated, false);

    // With changedVars set
    const changed = new Set<string>(['max']);
    const items2 = entityMapToVariableItems(entities, changed);
    const maxItem = items2.find((v) => v.name === 'max');
    const iItem = items2.find((v) => v.name === 'i');
    assert.ok(maxItem);
    assert.equal(maxItem.isUpdated, true);
    assert.ok(iItem);
    assert.equal(iItem.isUpdated, false);
  });

  await t.test('getVariableTheme produces tailored styling for all semantic colors', () => {
    const mint = getVariableTheme('mint');
    assert.ok(mint.cardClass.includes('emerald'));

    const amber = getVariableTheme('amber');
    assert.ok(amber.cardClass.includes('amber'));

    const purple = getVariableTheme('purple');
    assert.ok(purple.cardClass.includes('purple'));

    const def = getVariableTheme();
    assert.ok(def.cardClass.includes('indigo'));
  });

  await t.test('updateVariableInList immutably updates variable value', () => {
    const initial: VariableItem[] = [
      { name: 'max', value: 10, color: 'mint' },
      { name: 'secondMax', value: 5, color: 'mint' },
    ];

    const updated = updateVariableInList(initial, 'max', 25);
    assert.notEqual(initial, updated);
    assert.equal(updated.find((v) => v.name === 'max')?.value, 25);
    assert.equal(updated.find((v) => v.name === 'max')?.isUpdated, true);
    assert.equal(initial.find((v) => v.name === 'max')?.value, 10);
  });

  await t.test('upsertVariableInList appends new and updates existing variable', () => {
    const initial: VariableItem[] = [{ name: 'pivot', value: 13, color: 'mint' }];

    // Append new
    const appended = upsertVariableInList(initial, {
      name: 'k',
      value: 4,
      color: 'indigo',
    });
    assert.equal(appended.length, 2);
    assert.equal(appended.find((v) => v.name === 'k')?.value, 4);

    // Update existing
    const updated = upsertVariableInList(appended, {
      name: 'pivot',
      value: 99,
      color: 'amber',
    });
    assert.equal(updated.length, 2);
    assert.equal(updated.find((v) => v.name === 'pivot')?.value, 99);
  });

  await t.test('removeVariableFromList immutably filters out target variable', () => {
    const initial: VariableItem[] = [
      { name: 'a', value: 1 },
      { name: 'b', value: 2 },
    ];
    const filtered = removeVariableFromList(initial, 'a');
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].name, 'b');
  });

  await t.test('Dual manipulation parity: human direct edit vs AI timeline mutation', () => {
    // 1. Initial state with max = 10
    const initialList: VariableItem[] = [{ name: 'max', value: 10, color: 'mint' }];

    // 2. Human direct manipulation on-canvas
    const humanEdited = updateVariableInList(initialList, 'max', 45);

    // 3. AI timeline reducer action
    const aiInitialEntities = {
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        max: { name: 'max', value: 10, color: 'mint' as const },
      },
    };
    const aiMutated = applyCanvasMutation(aiInitialEntities, {
      type: 'variable',
      action: {
        kind: 'set-variable',
        name: 'max',
        value: 45,
        color: 'mint',
      },
    });

    const aiItems = entityMapToVariableItems(aiMutated.variables);

    // Human direct manipulation value matches AI timeline mutation state
    assert.equal(humanEdited[0].value, aiItems[0].value);
    assert.equal(humanEdited[0].name, aiItems[0].name);
  });
});
