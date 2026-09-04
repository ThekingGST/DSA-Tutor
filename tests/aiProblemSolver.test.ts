import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTargetLanguage, solveProblemWithAi } from '../src/ai/aiProblemSolver.ts';
import { computeTimelineState } from '../src/core/timelineReducer.ts';

test('AI Problem Solver: Language Resolution & End-to-End Problem Solving', async (t) => {
  await t.test('resolveTargetLanguage correctly detects language from prompt', () => {
    assert.equal(resolveTargetLanguage('Reverse a linked list in TypeScript', 'python'), 'typescript');
    assert.equal(resolveTargetLanguage('How does binary search work in C++?', 'python'), 'cpp');
    assert.equal(resolveTargetLanguage('Binary search in cpp', 'python'), 'cpp');
    assert.equal(resolveTargetLanguage('Find max element in python', 'typescript'), 'python');
    assert.equal(resolveTargetLanguage('Solve two sum in js', 'cpp'), 'typescript');
  });

  await t.test('resolveTargetLanguage falls back to workspace default when unspecified', () => {
    assert.equal(resolveTargetLanguage('Reverse a linked list', 'python'), 'python');
    assert.equal(resolveTargetLanguage('How does binary search work?', 'typescript'), 'typescript');
    assert.equal(resolveTargetLanguage('Find the maximum element in this array', 'cpp'), 'cpp');
    assert.equal(resolveTargetLanguage('Explain how this for loop works'), 'python');
  });

  await t.test('solveProblemWithAi solves "Reverse a linked list"', async () => {
    const res = await solveProblemWithAi('Reverse a linked list', { language: 'python' });
    assert.equal(res.source, 'fallback');
    assert.equal(res.identifiedLanguage, 'python');
    assert.ok(res.algorithmTitle.toLowerCase().includes('linked list'));
    assert.ok(res.chatExplanation.length > 10);
    assert.ok(res.storyboard.steps.length >= 3);
    assert.ok(Object.keys(res.storyboard.initialState.linkedListNodes).length > 0);

    // Verify timeline state folds cleanly across all steps
    for (let i = 0; i < res.storyboard.steps.length; i++) {
      const state = computeTimelineState(res.storyboard.initialState, res.storyboard.steps, i);
      assert.ok(Object.keys(state.linkedListNodes).length > 0);
    }
  });

  await t.test('solveProblemWithAi solves "How does binary search work?" in TypeScript', async () => {
    const res = await solveProblemWithAi('How does binary search work?', { language: 'typescript' });
    assert.equal(res.identifiedLanguage, 'typescript');
    assert.ok(res.algorithmTitle.toLowerCase().includes('binary search'));
    assert.ok(res.storyboard.code.includes('function') || res.storyboard.code.includes('number[]'));
    assert.ok(res.storyboard.initialState.array);
    assert.ok(res.chatExplanation.includes('binary search') || res.chatExplanation.includes('Binary Search'));

    // Check step folding
    for (let i = 0; i < res.storyboard.steps.length; i++) {
      const state = computeTimelineState(res.storyboard.initialState, res.storyboard.steps, i);
      assert.ok(state.array);
    }
  });

  await t.test('solveProblemWithAi solves "Find the maximum element in this array" in C++', async () => {
    const res = await solveProblemWithAi('Find the maximum element in this array', { language: 'cpp' });
    assert.equal(res.identifiedLanguage, 'cpp');
    assert.ok(res.algorithmTitle.toLowerCase().includes('max'));
    assert.ok(res.storyboard.code.includes('int ') || res.storyboard.code.includes('vector'));
    assert.ok(res.storyboard.initialState.array);

    // Initial state has max_val variable
    assert.ok(res.storyboard.initialState.variables['max_val']);
    assert.ok(res.chatExplanation.includes('Maximum Element') || res.chatExplanation.includes('max'));
  });

  await t.test('solveProblemWithAi solves "Explain how this for loop works"', async () => {
    const res = await solveProblemWithAi('Explain how this for loop works', { language: 'python' });
    assert.equal(res.storyboard.id, 'procedural-for-loop');
    assert.ok(res.storyboard.initialState.loop);
    assert.equal(res.storyboard.initialState.loop?.variableName, 'i');
    assert.ok(res.storyboard.initialState.array);
    assert.ok(res.storyboard.initialState.variables['total']);
    assert.ok(res.chatExplanation.includes('for loop') || res.chatExplanation.includes('loop'));

    // Check step folding
    for (let i = 0; i < res.storyboard.steps.length; i++) {
      const state = computeTimelineState(res.storyboard.initialState, res.storyboard.steps, i);
      assert.ok(state.loop);
      assert.ok(state.variables['total']);
    }
  });
});
