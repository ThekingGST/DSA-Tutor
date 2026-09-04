import test from 'node:test';
import assert from 'node:assert/strict';
import { generateProceduralStoryboard } from '../src/ai/fallbackStoryboards.ts';
import { computeTimelineState } from '../src/core/timelineReducer.ts';

test('Phase 6: Procedural Fallback Storyboards Tests', async (t) => {
  await t.test('Generates Find Maximum storyboard and executes timeline fold', () => {
    const sb = generateProceduralStoryboard('find max element in array');
    assert.equal(sb.id, 'procedural-find-max');
    assert.equal(sb.title, 'Find Maximum Element');
    assert.ok(sb.steps.length >= 4);
    assert.ok(sb.initialState.array);
    assert.ok(sb.initialState.loop);

    // Verify timeline state folds cleanly across all steps
    for (let i = 0; i < sb.steps.length; i++) {
      const state = computeTimelineState(sb.initialState, sb.steps, i);
      assert.ok(state.variables['max_val']);
    }
  });

  await t.test('Generates Binary Search storyboard', () => {
    const sb = generateProceduralStoryboard('how does binary search work on sorted array');
    assert.equal(sb.id, 'procedural-binary-search');
    assert.equal(sb.title, 'Binary Search');
    assert.ok(sb.steps.length >= 3);
    assert.ok(sb.initialState.array?.pointers.mid !== undefined);
  });

  await t.test('Generates Bubble Sort storyboard', () => {
    const sb = generateProceduralStoryboard('visualize bubble sort');
    assert.equal(sb.id, 'procedural-bubble-sort');
    assert.equal(sb.title, 'Bubble Sort Pass');
    assert.ok(sb.steps.length >= 3);
  });

  await t.test('Matches preset Golden Demos when requested', () => {
    const qs = generateProceduralStoryboard('run quicksort partition demo');
    assert.equal(qs.id, 'quicksort-partition');

    const rll = generateProceduralStoryboard('reverse linked list');
    assert.equal(rll.id, 'reverse-linked-list');

    const bst = generateProceduralStoryboard('insert into bst');
    assert.equal(bst.id, 'bst-insert');
  });
});
