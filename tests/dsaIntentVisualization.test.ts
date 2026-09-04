import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDsaIntent, buildStoryboardFromIntent } from '../src/ai/dsaIntentParser.ts';
import { solveProblemWithAi } from '../src/ai/aiProblemSolver.ts';
import { computeTimelineState } from '../src/core/timelineReducer.ts';

test('TDD: Natural-Language → Structured DSA Intent & Visualization', async (t) => {
  // -------------------------------------------------------------
  // SLICE 1: Structured Intent Extraction (No fragile string checks)
  // -------------------------------------------------------------
  await t.test('parses array creation with standard bracket formatting', () => {
    const intent = parseDsaIntent('Create an array [10, 6, 8, 9, 10]');
    assert.equal(intent.kind, 'create-structure');
    if (intent.kind === 'create-structure') {
      assert.equal(intent.structureType, 'array');
      assert.deepEqual(intent.values, [10, 6, 8, 9, 10]);
    }
  });

  await t.test('parses array creation with flexible formatting: spacing, braces, assignments', () => {
    // Spaced and compact brackets
    const intent1 = parseDsaIntent('Create an array [1, 2, 3]');
    const intent2 = parseDsaIntent('Create an array [1,2,3]');
    assert.equal(intent1.kind, intent2.kind);
    if (intent1.kind === 'create-structure' && intent2.kind === 'create-structure') {
      assert.deepEqual(intent1.values, intent2.values);
      assert.equal(intent1.structureType, intent2.structureType);
    }

    // Variable assignment: arr = [10, 6, 8, 9, 10]
    const intent3 = parseDsaIntent('arr = [10, 6, 8, 9, 10]');
    assert.equal(intent3.kind, 'create-structure');
    if (intent3.kind === 'create-structure') {
      assert.equal(intent3.structureType, 'array');
      assert.deepEqual(intent3.values, [10, 6, 8, 9, 10]);
    }

    // Curly braces: {10, 6, 8, 9, 10}
    const intent4 = parseDsaIntent('create array {10, 6, 8, 9, 10}');
    assert.equal(intent4.kind, 'create-structure');
    if (intent4.kind === 'create-structure') {
      assert.deepEqual(intent4.values, [10, 6, 8, 9, 10]);
    }

    // Comma-separated list with keyword: array 10, 6, 8, 9, 10
    const intent5 = parseDsaIntent('array 10, 6, 8, 9, 10');
    assert.equal(intent5.kind, 'create-structure');
    if (intent5.kind === 'create-structure') {
      assert.deepEqual(intent5.values, [10, 6, 8, 9, 10]);
    }
  });

  await t.test('parses "Create an array of 5 elements"', () => {
    const intent = parseDsaIntent('Create an array of 5 elements');
    assert.equal(intent.kind, 'create-structure');
    if (intent.kind === 'create-structure') {
      assert.equal(intent.structureType, 'array');
      assert.equal(intent.values?.length, 5);
    }
  });

  await t.test('parses variable creation and assignments: "Set x = 10"', () => {
    const intent1 = parseDsaIntent('Set x = 10');
    assert.equal(intent1.kind, 'create-structure');
    if (intent1.kind === 'create-structure') {
      assert.equal(intent1.structureType, 'variable');
      assert.equal(intent1.name, 'x');
      assert.equal(intent1.values?.[0], 10);
    }

    const intent2 = parseDsaIntent('Create a variable x with value 10');
    assert.equal(intent2.kind, 'create-structure');
    if (intent2.kind === 'create-structure') {
      assert.equal(intent2.structureType, 'variable');
      assert.equal(intent2.name, 'x');
      assert.equal(intent2.values?.[0], 10);
    }
  });

  await t.test('parses linked list creation: "Create a linked list: 10 -> 20 -> 30"', () => {
    const intent = parseDsaIntent('Create a linked list: 10 -> 20 -> 30');
    assert.equal(intent.kind, 'create-structure');
    if (intent.kind === 'create-structure') {
      assert.equal(intent.structureType, 'linked-list');
      assert.deepEqual(intent.values, [10, 20, 30]);
    }
  });

  await t.test('parses stack and queue creations', () => {
    const stackIntent = parseDsaIntent('Create a stack with 1, 2, 3');
    assert.equal(stackIntent.kind, 'create-structure');
    if (stackIntent.kind === 'create-structure') {
      assert.equal(stackIntent.structureType, 'stack');
      assert.deepEqual(stackIntent.values, [1, 2, 3]);
    }

    const queueIntent = parseDsaIntent('Create a queue containing A, B, C');
    assert.equal(queueIntent.kind, 'create-structure');
    if (queueIntent.kind === 'create-structure') {
      assert.equal(queueIntent.structureType, 'queue');
      assert.deepEqual(queueIntent.values, ['A', 'B', 'C']);
    }
  });

  await t.test('parses DSA algorithm problems with embedded custom arrays', () => {
    // Find maximum with custom array
    const maxIntent = parseDsaIntent('Find the maximum element in [10,6,8,9,10]');
    assert.equal(maxIntent.kind, 'solve-algorithm');
    if (maxIntent.kind === 'solve-algorithm') {
      assert.equal(maxIntent.algorithm, 'find-max');
      assert.deepEqual(maxIntent.inputArray, [10, 6, 8, 9, 10]);
    }

    // Bubble sort with custom array
    const sortIntent = parseDsaIntent('Sort [10, 6, 8, 9, 10] using bubble sort');
    assert.equal(sortIntent.kind, 'solve-algorithm');
    if (sortIntent.kind === 'solve-algorithm') {
      assert.equal(sortIntent.algorithm, 'bubble-sort');
      assert.deepEqual(sortIntent.inputArray, [10, 6, 8, 9, 10]);
    }

    // Binary search with custom array
    const bsIntent = parseDsaIntent('Perform binary search on [10, 20, 30, 40]');
    assert.equal(bsIntent.kind, 'solve-algorithm');
    if (bsIntent.kind === 'solve-algorithm') {
      assert.equal(bsIntent.algorithm, 'binary-search');
      assert.deepEqual(bsIntent.inputArray, [10, 20, 30, 40]);
    }
  });

  // -------------------------------------------------------------
  // SLICE 2: Intent → Storyboard & Workspace Component Generation
  // -------------------------------------------------------------
  await t.test('builds accurate array storyboard from intent with executable code', () => {
    const intent = parseDsaIntent('Create an array [10, 6, 8, 9, 10]');
    const storyboard = buildStoryboardFromIntent(intent, 'python');

    assert.ok(storyboard.initialState.array);
    assert.deepEqual(storyboard.initialState.array?.values, [10, 6, 8, 9, 10]);
    assert.ok(storyboard.code.includes('arr = [10, 6, 8, 9, 10]'));
    assert.ok(storyboard.steps.length >= 1);
    assert.ok(storyboard.chatExplanation?.includes('[10, 6, 8, 9, 10]'));

    // Check folding
    const state = computeTimelineState(storyboard.initialState, storyboard.steps, 0);
    assert.ok(state.array);
    assert.deepEqual(state.array?.values, [10, 6, 8, 9, 10]);
  });

  await t.test('builds Find Maximum algorithm on custom array [10, 6, 8, 9, 10]', () => {
    const intent = parseDsaIntent('Find the maximum element in [10,6,8,9,10]');
    const storyboard = buildStoryboardFromIntent(intent, 'python');

    // Array contains exact custom numbers
    assert.ok(storyboard.initialState.array);
    assert.deepEqual(storyboard.initialState.array?.values, [10, 6, 8, 9, 10]);

    // Variables panel contains max and index tracker
    assert.ok(storyboard.initialState.variables['max_val'] || storyboard.initialState.variables['max']);
    assert.ok(storyboard.initialState.variables['i']);

    // Loop tracker exists
    assert.ok(storyboard.initialState.loop);

    // Timeline steps step through the elements and conclude with final max = 10
    const finalStepIdx = storyboard.steps.length - 1;
    const finalState = computeTimelineState(storyboard.initialState, storyboard.steps, finalStepIdx);
    const finalMax = finalState.variables['max_val']?.value ?? finalState.variables['max']?.value;
    assert.equal(finalMax, 10);
  });

  // -------------------------------------------------------------
  // SLICE 3: End-to-End Problem Solver Integration & Regression
  // -------------------------------------------------------------
  await t.test('solveProblemWithAi creates array on user request "Create an array [10, 6, 8, 9, 10]"', async () => {
    const result = await solveProblemWithAi('Create an array [10, 6, 8, 9, 10]', { language: 'python' });
    assert.ok(result.storyboard.initialState.array, 'Array must exist in initial state');
    assert.deepEqual(result.storyboard.initialState.array?.values, [10, 6, 8, 9, 10]);
    assert.ok(result.chatExplanation.includes('[10, 6, 8, 9, 10]'));
  });

  await t.test('solveProblemWithAi handles screenshot regression: "Clear all the code and just give me code for creating array[10,6,8,9,10]"', async () => {
    const result = await solveProblemWithAi(
      'Clear all the code and just give me code for creating array[10,6,8,9,10]',
      { language: 'python' }
    );
    assert.ok(result.storyboard.initialState.array, 'Array must be created');
    assert.deepEqual(result.storyboard.initialState.array?.values, [10, 6, 8, 9, 10]);
    assert.ok(result.storyboard.code.includes('arr = [10, 6, 8, 9, 10]'));
  });
});
