import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESET_SCENARIOS } from '../src/mock/presetScenarios.ts';

test('Preset scenarios validation', async (t) => {
  await t.test('All 3 core presets exist', () => {
    assert.equal(PRESET_SCENARIOS.length, 3);
    const ids = PRESET_SCENARIOS.map(s => s.id);
    assert.ok(ids.includes('quicksort-partition'));
    assert.ok(ids.includes('reverse-linked-list'));
    assert.ok(ids.includes('bst-insert'));
  });

  await t.test('QuickSort partition scenario integrity', () => {
    const qs = PRESET_SCENARIOS.find(s => s.id === 'quicksort-partition')!;
    assert.ok(qs.code.length > 0);
    assert.equal(qs.steps.length, 6);
    
    // Check line numbers map to valid lines in code
    const lines = qs.code.split('\n');
    for (const step of qs.steps) {
      assert.ok(step.codeLine >= 1 && step.codeLine <= lines.length, `Invalid codeLine ${step.codeLine}`);
      assert.ok(step.narration.length > 0);
      assert.ok(Object.keys(step.variables).length > 0);
    }
  });

  await t.test('Reverse linked list scenario integrity', () => {
    const rll = PRESET_SCENARIOS.find(s => s.id === 'reverse-linked-list')!;
    assert.equal(rll.steps.length, 5);
    const lines = rll.code.split('\n');
    for (const step of rll.steps) {
      assert.ok(step.codeLine >= 1 && step.codeLine <= lines.length);
      assert.ok(step.narration.length > 0);
    }
  });

  await t.test('BST insert scenario integrity', () => {
    const bst = PRESET_SCENARIOS.find(s => s.id === 'bst-insert')!;
    assert.equal(bst.steps.length, 4);
    const lines = bst.code.split('\n');
    for (const step of bst.steps) {
      assert.ok(step.codeLine >= 1 && step.codeLine <= lines.length);
      assert.ok(step.narration.length > 0);
    }
  });
});
