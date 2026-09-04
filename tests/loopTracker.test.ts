import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOOP_TRACKER_SHAPE_TYPE,
  LOOP_TRACKER_DEFAULT_PROPS,
  getPillStatus,
  calculateLoopProgress,
  advanceLoopIteration,
  stepLoopIteration,
  formatConditionEvaluation,
  entityToLoopShapeProps,
} from '../src/canvas/shapes/loopTrackerLogic.ts';
import type { LoopTrackerEntity } from '../src/types/timeline.ts';

test('Phase 5: Loop Tracker Logic Tests', async (t) => {
  await t.test('Loop tracker default properties and shape type contract', () => {
    assert.equal(LOOP_TRACKER_SHAPE_TYPE, 'dsa-loop-tracker');
    assert.equal(LOOP_TRACKER_DEFAULT_PROPS.currentIteration, 0);
    assert.equal(LOOP_TRACKER_DEFAULT_PROPS.totalIterations, 4);
    assert.equal(LOOP_TRACKER_DEFAULT_PROPS.isComplete, false);
    assert.equal(LOOP_TRACKER_DEFAULT_PROPS.iterationPills.length, 4);
  });

  await t.test('getPillStatus correctly reflects pending, active, and completed iterations', () => {
    // Current iteration 1 of 4, not complete
    assert.equal(getPillStatus(0, 1, false), 'completed');
    assert.equal(getPillStatus(1, 1, false), 'active');
    assert.equal(getPillStatus(2, 1, false), 'pending');
    assert.equal(getPillStatus(3, 1, false), 'pending');

    // Completed loop
    assert.equal(getPillStatus(0, 4, true), 'completed');
    assert.equal(getPillStatus(1, 4, true), 'completed');
    assert.equal(getPillStatus(2, 4, true), 'completed');
    assert.equal(getPillStatus(3, 4, true), 'completed');
  });

  await t.test('calculateLoopProgress accurately calculates percentage', () => {
    assert.equal(calculateLoopProgress(0, 4, false), 0);
    assert.equal(calculateLoopProgress(1, 4, false), 25);
    assert.equal(calculateLoopProgress(2, 4, false), 50);
    assert.equal(calculateLoopProgress(3, 4, false), 75);
    assert.equal(calculateLoopProgress(4, 4, false), 100);
    assert.equal(calculateLoopProgress(2, 4, true), 100); // Complete overrides
  });

  await t.test('advanceLoopIteration and stepLoopIteration apply bounds safety', () => {
    const loop: LoopTrackerEntity = {
      header: 'for j in range(low, high)',
      conditionText: 'j < 4',
      currentIteration: 1,
      totalIterations: 4,
      isComplete: false,
    };

    // Step next
    const next = stepLoopIteration(loop, 'next');
    assert.equal(next.currentIteration, 2);
    assert.equal(next.isComplete, false);

    // Step prev
    const prev = stepLoopIteration(loop, 'prev');
    assert.equal(prev.currentIteration, 0);

    // Step beyond upper bound
    const over = advanceLoopIteration(loop, 10, 'Finished');
    assert.equal(over.currentIteration, 4);
    assert.equal(over.isComplete, true);
    assert.equal(over.conditionText, 'Finished');

    // Step below lower bound
    const under = advanceLoopIteration(loop, -5);
    assert.equal(under.currentIteration, 0);
  });

  await t.test('formatConditionEvaluation creates readable condition strings and states', () => {
    const falseCond = formatConditionEvaluation(29, '<=', 13, false);
    assert.equal(falseCond.text, '29 <= 13 ➔ False');
    assert.equal(falseCond.evalState, 'false');

    const trueCond = formatConditionEvaluation(10, '<=', 13, true);
    assert.equal(trueCond.text, '10 <= 13 ➔ True');
    assert.equal(trueCond.evalState, 'true');
  });

  await t.test('entityToLoopShapeProps converts entity into render props accurately', () => {
    const entity: LoopTrackerEntity = {
      header: 'while (curr !== null)',
      conditionText: 'curr = Node(2) !== null (True)',
      currentIteration: 1,
      totalIterations: 4,
      isComplete: false,
      iterationPills: ['Node(1)', 'Node(2)', 'Node(3)', 'Node(4)'],
    };

    const props = entityToLoopShapeProps(entity);
    assert.equal(props.header, 'while (curr !== null)');
    assert.equal(props.currentIteration, 1);
    assert.equal(props.evalState, 'true');
    assert.deepEqual(props.iterationPills, ['Node(1)', 'Node(2)', 'Node(3)', 'Node(4)']);
  });
});
