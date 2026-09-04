import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDsaIntent, buildStoryboardFromIntent } from '../src/ai/dsaIntentParser.ts';
import { solveProblemWithAi } from '../src/ai/aiProblemSolver.ts';
import { computeTimelineState } from '../src/core/timelineReducer.ts';

test('TDD: Multi-Case DSA Intent, Code & Visualization Validation', async (t) => {
  // -------------------------------------------------------------
  // TEST CASE 1: Second Maximum Understanding & Visualization
  // Prompt: "How to find second maximum number in an array[10,2,6,20,3,6,4,5]"
  // -------------------------------------------------------------
  await t.test('1. Correctly understands and solves Second Maximum with custom array', async () => {
    const prompt = 'How to find second maximum number in an array[10,2,6,20,3,6,4,5]';
    const intent = parseDsaIntent(prompt);

    // Assert Intent Classification
    assert.equal(intent.kind, 'solve-algorithm');
    if (intent.kind === 'solve-algorithm') {
      assert.equal(intent.algorithm, 'find-second-max');
      assert.deepEqual(intent.inputArray, [10, 2, 6, 20, 3, 6, 4, 5]);
    }

    // Assert Storyboard Build
    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.match(sb.title.toLowerCase(), /second\s*max/);
    assert.equal(sb.initialState.array?.values.length, 8);
    assert.deepEqual(sb.initialState.array?.values, [10, 2, 6, 20, 3, 6, 4, 5]);

    // Check Apt Variables: MUST track both first_max and second_max
    assert.ok(sb.initialState.variables['first_max'] || sb.initialState.variables['max1'], 'Must track first max');
    assert.ok(sb.initialState.variables['second_max'] || sb.initialState.variables['max2'], 'Must track second max');

    // Check Apt Code
    assert.match(sb.code, /second_max/);
    assert.match(sb.code, /for\s+i/);

    // Check Apt Visualization Steps & Reducer State Integrity
    const finalState = computeTimelineState(sb.initialState, sb.steps, sb.steps.length - 1);
    const finalSecondMax = finalState.variables['second_max']?.value ?? finalState.variables['max2']?.value;
    const finalFirstMax = finalState.variables['first_max']?.value ?? finalState.variables['max1']?.value;

    assert.equal(finalFirstMax, 20, 'First max must be 20');
    assert.equal(finalSecondMax, 10, 'Second max must be 10');
  });

  // -------------------------------------------------------------
  // TEST CASE 2: Find Minimum & Second Minimum Elements
  // -------------------------------------------------------------
  await t.test('2. Correctly understands and visualizes Minimum and Second Minimum', async () => {
    // 2a. Find Minimum
    const minPrompt = 'Find minimum element in [8, 4, 12, 1, 9]';
    const minIntent = parseDsaIntent(minPrompt);
    assert.equal(minIntent.kind, 'solve-algorithm');
    if (minIntent.kind === 'solve-algorithm') {
      assert.equal(minIntent.algorithm, 'find-min');
      assert.deepEqual(minIntent.inputArray, [8, 4, 12, 1, 9]);
    }
    const minSb = buildStoryboardFromIntent(minIntent, 'python');
    const minFinalState = computeTimelineState(minSb.initialState, minSb.steps, minSb.steps.length - 1);
    assert.equal(minFinalState.variables['min_val']?.value, 1);

    // 2b. Find Second Minimum
    const secMinPrompt = 'Find second smallest element in [15, 3, 7, 2, 9]';
    const secMinIntent = parseDsaIntent(secMinPrompt);
    assert.equal(secMinIntent.kind, 'solve-algorithm');
    if (secMinIntent.kind === 'solve-algorithm') {
      assert.equal(secMinIntent.algorithm, 'find-second-min');
      assert.deepEqual(secMinIntent.inputArray, [15, 3, 7, 2, 9]);
    }
    const secMinSb = buildStoryboardFromIntent(secMinIntent, 'python');
    const secMinFinalState = computeTimelineState(secMinSb.initialState, secMinSb.steps, secMinSb.steps.length - 1);
    assert.equal(secMinFinalState.variables['second_min']?.value, 3);
  });

  // -------------------------------------------------------------
  // TEST CASE 3: Two Sum / Two Pointers
  // -------------------------------------------------------------
  await t.test('3. Two sum / pair sum algorithm with target', async () => {
    const prompt = 'Two sum on sorted array [2, 7, 11, 15] with target 9';
    const intent = parseDsaIntent(prompt);
    assert.equal(intent.kind, 'solve-algorithm');
    if (intent.kind === 'solve-algorithm') {
      assert.equal(intent.algorithm, 'two-sum');
      assert.deepEqual(intent.inputArray, [2, 7, 11, 15]);
      assert.equal(intent.target, 9);
    }
    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.ok(sb.initialState.array?.pointers['left'] !== undefined || sb.initialState.array?.pointers['i'] !== undefined);
    assert.match(sb.code, /target/);
  });

  // -------------------------------------------------------------
  // TEST CASE 4: Linked List Middle (Tortoise & Hare)
  // -------------------------------------------------------------
  await t.test('4. Find middle node of linked list', async () => {
    const prompt = 'Find the middle of linked list 10 -> 20 -> 30 -> 40 -> 50';
    const intent = parseDsaIntent(prompt);
    assert.equal(intent.kind, 'solve-algorithm');
    if (intent.kind === 'solve-algorithm') {
      assert.equal(intent.algorithm, 'linked-list-middle');
    }
    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.ok(Object.keys(sb.initialState.linkedListNodes).length >= 5);
    assert.match(sb.code, /slow/);
    assert.match(sb.code, /fast/);
  });

  // -------------------------------------------------------------
  // TEST CASE 5: BST Search & Find Minimum
  // -------------------------------------------------------------
  await t.test('5. BST Search and BST Find Minimum', async () => {
    // 5a. Search in BST
    const searchPrompt = 'Search key 35 in binary search tree';
    const searchIntent = parseDsaIntent(searchPrompt);
    assert.equal(searchIntent.kind, 'solve-algorithm');
    if (searchIntent.kind === 'solve-algorithm') {
      assert.equal(searchIntent.algorithm, 'bst-search');
      assert.equal(searchIntent.target, 35);
    }
    const searchSb = buildStoryboardFromIntent(searchIntent, 'python');
    assert.ok(Object.keys(searchSb.initialState.treeNodes).length > 0);
    assert.match(searchSb.title, /Search/i);

    // 5b. Find Minimum in BST
    const minPrompt = 'Find minimum key in BST';
    const minIntent = parseDsaIntent(minPrompt);
    assert.equal(minIntent.kind, 'solve-algorithm');
    if (minIntent.kind === 'solve-algorithm') {
      assert.equal(minIntent.algorithm, 'bst-find-min');
    }
    const minSb = buildStoryboardFromIntent(minIntent, 'python');
    assert.ok(Object.keys(minSb.initialState.treeNodes).length > 0);
  });

  // -------------------------------------------------------------
  // TEST CASE 6: solveProblemWithAi End-to-End
  // -------------------------------------------------------------
  await t.test('6. solveProblemWithAi generates apt code, title, and visualization for second maximum', async () => {
    const result = await solveProblemWithAi('How to find second maximum number in an array[10,2,6,20,3,6,4,5]');
    assert.match(result.storyboard.title, /Second Maximum/i);
    assert.equal(result.storyboard.initialState.array?.values.length, 8);
    assert.ok(result.storyboard.initialState.variables['second_max'], 'Must have second_max variable');
    assert.match(result.storyboard.code, /second_max/);
    assert.match(result.chatExplanation, /second maximum/i);
  });

  // -------------------------------------------------------------
  // TEST CASE 7: Phrasing flexibility: "second largest in array[5, 1, 9, 3, 7]"
  // -------------------------------------------------------------
  await t.test('7. Phrasing "second largest" works with compact array formatting', () => {
    const intent = parseDsaIntent('Find second largest in array[5, 1, 9, 3, 7]');
    assert.equal(intent.kind, 'solve-algorithm');
    if (intent.kind === 'solve-algorithm') {
      assert.equal(intent.algorithm, 'find-second-max');
      assert.deepEqual(intent.inputArray, [5, 1, 9, 3, 7]);
    }
    const sb = buildStoryboardFromIntent(intent, 'python');
    const finalState = computeTimelineState(sb.initialState, sb.steps, sb.steps.length - 1);
    assert.equal(finalState.variables['second_max']?.value, 7);
    assert.equal(finalState.variables['first_max']?.value, 9);
  });

  // -------------------------------------------------------------
  // TEST CASE 8: Multi-Language Code Aptness for Second Maximum (Python, TS, C++)
  // -------------------------------------------------------------
  await t.test('8. Multi-language code generation for Second Maximum', () => {
    const intent = parseDsaIntent('Find second maximum in [10, 2, 6, 20]');
    
    // Python
    const pySb = buildStoryboardFromIntent(intent, 'python');
    assert.match(pySb.code, /def find_second_maximum/);
    assert.equal(pySb.fileName, 'second_max.py');

    // TypeScript
    const tsSb = buildStoryboardFromIntent(intent, 'typescript');
    assert.match(tsSb.code, /function findSecondMax/);
    assert.match(tsSb.code, /arr:\s*number\[\]/);
    assert.equal(tsSb.fileName, 'second_max.ts');

    // C++
    const cppSb = buildStoryboardFromIntent(intent, 'cpp');
    assert.match(cppSb.code, /int findSecondMax/);
    assert.match(cppSb.code, /std::vector<int>/);
    assert.equal(cppSb.fileName, 'second_max.cpp');
  });

  // -------------------------------------------------------------
  // TEST CASE 9: Reverse Linked List Storyboard
  // -------------------------------------------------------------
  await t.test('9. Reverse Singly Linked List code & visualization', () => {
    const intent = parseDsaIntent('Reverse a linked list');
    assert.equal(intent.kind, 'solve-algorithm');
    if (intent.kind === 'solve-algorithm') {
      assert.equal(intent.algorithm, 'reverse-linked-list');
    }
    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.match(sb.title, /Reverse/i);
    assert.ok(Object.keys(sb.initialState.linkedListNodes).length >= 3);
    assert.match(sb.code, /prev/);
    assert.match(sb.code, /curr/);
  });

  // -------------------------------------------------------------
  // TEST CASE 10: Stack & Queue Apt Visuals and Code
  // -------------------------------------------------------------
  await t.test('10. Stack (LIFO) and Queue (FIFO) apt visualization and code', () => {
    // Stack
    const stackIntent = parseDsaIntent('Create a stack with [10, 20, 30]');
    const stackSb = buildStoryboardFromIntent(stackIntent, 'python');
    assert.equal(stackSb.initialState.array?.name, 'stack');
    assert.deepEqual(stackSb.initialState.array?.values, [10, 20, 30]);
    assert.equal(stackSb.initialState.array?.pointers['top'], 2);

    // Queue
    const queueIntent = parseDsaIntent('Create a queue containing [100, 200, 300]');
    const queueSb = buildStoryboardFromIntent(queueIntent, 'python');
    assert.equal(queueSb.initialState.array?.name, 'queue');
    assert.deepEqual(queueSb.initialState.array?.values, [100, 200, 300]);
    assert.equal(queueSb.initialState.array?.pointers['front'], 0);
    assert.equal(queueSb.initialState.array?.pointers['rear'], 2);
  });

  // -------------------------------------------------------------
  // TEST CASE 11: In-Place Reverse Array Validation
  // -------------------------------------------------------------
  await t.test('11. In-place Reverse Array two-pointer visualization and code aptness', () => {
    const prompt = 'Reverse array [1, 3, 5, 7, 9]';
    const intent = parseDsaIntent(prompt);
    assert.equal(intent.kind, 'solve-algorithm');
    if (intent.kind === 'solve-algorithm') {
      assert.equal(intent.algorithm, 'reverse-array');
      assert.deepEqual(intent.inputArray, [1, 3, 5, 7, 9]);
    }

    const sb = buildStoryboardFromIntent(intent, 'typescript');
    assert.match(sb.title, /Reverse Array/i);
    assert.match(sb.code, /reverseArray/);
    assert.match(sb.code, /while\s*\(left\s*<\s*right\)/);
    assert.ok(sb.initialState.array?.pointers['left'] !== undefined);
    assert.ok(sb.initialState.array?.pointers['right'] !== undefined);

    // Verify timeline state folds correctly to completely reversed array
    const finalState = computeTimelineState(sb.initialState, sb.steps, sb.steps.length - 1);
    assert.deepEqual(finalState.array?.values, [9, 7, 5, 3, 1]);
  });

  // -------------------------------------------------------------
  // TEST CASE 12: BST Insert Tree Structure & Monotonic Coordinates
  // -------------------------------------------------------------
  await t.test('12. BST Insert Tree Structure and deterministic layout', () => {
    const prompt = 'Insert 45 into binary search tree';
    const intent = parseDsaIntent(prompt);
    assert.equal(intent.kind, 'solve-algorithm');
    if (intent.kind === 'solve-algorithm') {
      assert.equal(intent.algorithm, 'bst-insert');
    }

    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.match(sb.title, /BST|Binary Search Tree/i);
    assert.ok(Object.keys(sb.initialState.treeNodes).length >= 3);
    assert.match(sb.code, /insert|bst/i);

    // Verify all steps fold without error
    for (let i = 0; i < sb.steps.length; i++) {
      const state = computeTimelineState(sb.initialState, sb.steps, i);
      assert.ok(Object.keys(state.treeNodes).length > 0);
    }
  });

  // -------------------------------------------------------------
  // TEST CASE 13: Binary Search Custom Target & Bounds Validation
  // -------------------------------------------------------------
  await t.test('13. Binary Search with custom target and pointers aptness', () => {
    const prompt = 'Binary search 23 in [2, 5, 8, 12, 16, 23, 38, 56, 72]';
    const intent = parseDsaIntent(prompt);
    assert.equal(intent.kind, 'solve-algorithm');
    if (intent.kind === 'solve-algorithm') {
      assert.equal(intent.algorithm, 'binary-search');
      assert.equal(intent.target, 23);
    }

    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.equal(sb.id, 'procedural-binary-search');
    assert.match(sb.code, /def binary_search/);
    assert.ok(sb.initialState.array?.pointers['low'] !== undefined);
    assert.ok(sb.initialState.array?.pointers['mid'] !== undefined);
    assert.ok(sb.initialState.array?.pointers['high'] !== undefined);

    const finalState = computeTimelineState(sb.initialState, sb.steps, sb.steps.length - 1);
    assert.equal(finalState.variables['target']?.value, 23);
  });

  // -------------------------------------------------------------
  // TEST CASE 14: Bubble Sort Pass Validation
  // -------------------------------------------------------------
  await t.test('14. Bubble Sort pass and comparison visualization', () => {
    const prompt = 'Bubble sort [64, 34, 25, 12, 22]';
    const intent = parseDsaIntent(prompt);
    assert.equal(intent.kind, 'solve-algorithm');
    if (intent.kind === 'solve-algorithm') {
      assert.equal(intent.algorithm, 'bubble-sort');
      assert.deepEqual(intent.inputArray, [64, 34, 25, 12, 22]);
    }

    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.equal(sb.id, 'procedural-bubble-sort');
    assert.match(sb.title, /Bubble Sort/i);
    assert.match(sb.code, /for\s+i/);
    assert.ok(sb.steps.length >= 3);
  });

  // -------------------------------------------------------------
  // TEST CASE 15: Exact User Query Full Pipeline Verification
  // -------------------------------------------------------------
  await t.test('15. Exact user prompt "How to find second maximum number in an array[10,2,6,20,3,6,4,5]"', async () => {
    const prompt = 'How to find second maximum number in an array[10,2,6,20,3,6,4,5]';
    const result = await solveProblemWithAi(prompt, { language: 'python' });

    assert.equal(result.algorithmTitle, 'Find Second Maximum Element');
    assert.equal(result.identifiedLanguage, 'python');
    assert.match(result.storyboard.code, /def find_second_maximum/);
    assert.ok(!result.storyboard.code.includes('min_val'), 'Code should not be for min or simple max');
    assert.deepEqual(result.storyboard.initialState.array?.values, [10, 2, 6, 20, 3, 6, 4, 5]);

    // Check step-by-step playback
    const midStep = computeTimelineState(result.storyboard.initialState, result.storyboard.steps, 3);
    assert.ok(midStep.variables['first_max']);
    assert.ok(midStep.variables['second_max']);

    const finalStep = computeTimelineState(result.storyboard.initialState, result.storyboard.steps, result.storyboard.steps.length - 1);
    assert.equal(finalStep.variables['first_max']?.value, 20);
    assert.equal(finalStep.variables['second_max']?.value, 10);
  });
});

