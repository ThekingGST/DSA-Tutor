import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESET_SCENARIOS } from '../src/mock/presetScenarios.ts';
import { computeTimelineState } from '../src/core/timelineReducer.ts';

test('Timeline state machine & playback logic', async (t) => {
  const scenario = PRESET_SCENARIOS[0]; // QuickSort (6 steps)
  const totalSteps = scenario.steps.length;

  await t.test('Initial step boundaries and clamping', () => {
    const clampStep = (idx: number) => Math.min(Math.max(idx, 0), totalSteps - 1);

    assert.equal(clampStep(0), 0);
    assert.equal(clampStep(-10), 0);
    assert.equal(clampStep(999), 5);
    assert.equal(clampStep(3), 3);
  });

  await t.test('Step next progression and terminal condition', () => {
    let currentIdx = 0;
    let isPlaying = true;

    const stepNext = () => {
      if (currentIdx < totalSteps - 1) {
        currentIdx += 1;
      } else {
        isPlaying = false;
      }
    };

    // Step 0 -> 1 -> 2 -> 3 -> 4 -> 5
    for (let i = 0; i < 5; i++) {
      stepNext();
      assert.equal(currentIdx, i + 1);
      assert.equal(isPlaying, true);
    }

    // Step 5 -> should not exceed 5 and should stop playing
    stepNext();
    assert.equal(currentIdx, 5);
    assert.equal(isPlaying, false);
  });

  await t.test('Step prev progression and lower bound', () => {
    let currentIdx = 4;
    const stepPrev = () => {
      if (currentIdx > 0) currentIdx -= 1;
    };

    stepPrev();
    assert.equal(currentIdx, 3);
    stepPrev();
    assert.equal(currentIdx, 2);
    stepPrev();
    assert.equal(currentIdx, 1);
    stepPrev();
    assert.equal(currentIdx, 0);
    stepPrev();
    assert.equal(currentIdx, 0); // bounded
  });

  await t.test('Arbitrary seek and deterministic state verification', () => {
    // Seek to step 2: swap arr[0], arr[1]
    const stateAt2 = computeTimelineState(scenario.initialState, scenario.steps, 2);
    assert.deepEqual(stateAt2.array!.values, [10, 29, 14, 37, 13]);

    // Seek to step 0
    const stateAt0 = computeTimelineState(scenario.initialState, scenario.steps, 0);
    assert.deepEqual(stateAt0.array!.values, [29, 10, 14, 37, 13]);

    // Seek back to step 2 should produce identical result
    const stateAt2Again = computeTimelineState(scenario.initialState, scenario.steps, 2);
    assert.deepEqual(stateAt2Again, stateAt2);

    // Seek to step 5 (final sorted pivot)
    const stateAt5 = computeTimelineState(scenario.initialState, scenario.steps, 5);
    assert.deepEqual(stateAt5.array!.values, [10, 13, 14, 37, 29]);
    assert.equal(stateAt5.array!.pointers['pivot'], 1);
  });

  await t.test('Speed calculation bounds', () => {
    const calcDelay = (speed: number) => Math.max(2400 / speed, 300);

    assert.equal(calcDelay(1), 2400);
    assert.equal(calcDelay(2), 1200);
    assert.equal(calcDelay(0.5), 4800);
    assert.equal(calcDelay(10), 300); // minimum bound
  });
});
