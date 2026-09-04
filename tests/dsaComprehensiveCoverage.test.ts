import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDsaIntent, buildStoryboardFromIntent } from '../src/ai/dsaIntentParser.ts';
import { computeTimelineState } from '../src/core/timelineReducer.ts';

test('TDD: Comprehensive DSA Architecture & Multi-Structure Validation', async (t) => {
  // -------------------------------------------------------------
  // 1. STACK: Creation & Push
  // -------------------------------------------------------------
  await t.test('1. Stack: Intent parsing and timeline storyboard generation', () => {
    const prompt = 'Create a stack with [10, 20, 30] and push 40';
    const intent = parseDsaIntent(prompt);
    assert.equal(intent.kind, 'create-structure');
    if (intent.kind === 'create-structure') {
      assert.equal(intent.structureType, 'stack');
    }

    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.match(sb.title, /Stack/i);
    assert.ok(sb.initialState.stack);
    assert.deepEqual(sb.initialState.stack.items, [10, 20, 30, 40]);
    assert.equal(sb.initialState.stack.name, 'stack');
    assert.match(sb.code, /append|push|Stack/i);

    // Verify step folding
    for (let i = 0; i < sb.steps.length; i++) {
      const state = computeTimelineState(sb.initialState, sb.steps, i);
      assert.ok(state.stack);
    }
  });

  // -------------------------------------------------------------
  // 2. CIRCULAR QUEUE
  // -------------------------------------------------------------
  await t.test('2. Circular Queue: Intent parsing and circular wrap-around indicator', () => {
    const prompt = 'Create a circular queue with [10, 20, 30]';
    const intent = parseDsaIntent(prompt);
    assert.equal(intent.kind, 'create-structure');
    if (intent.kind === 'create-structure') {
      assert.equal(intent.structureType, 'circular-queue');
    }

    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.match(sb.title, /Circular Queue/i);
    assert.ok(sb.initialState.queue);
    assert.equal(sb.initialState.queue.isCircular, true);
    assert.equal(sb.initialState.queue.capacity, 5);
    assert.match(sb.code, /%/); // Modulo arithmetic
  });

  // -------------------------------------------------------------
  // 3. DOUBLY LINKED LIST
  // -------------------------------------------------------------
  await t.test('3. Doubly Linked List: Node prev and next pointers and reversal', () => {
    const prompt = 'Reverse this doubly linked list [10, 20, 30]';
    const intent = parseDsaIntent(prompt);
    assert.equal(intent.kind, 'solve-algorithm');
    if (intent.kind === 'solve-algorithm') {
      assert.equal(intent.algorithm, 'reverse-doubly-linked-list');
    }

    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.match(sb.title, /Doubly Linked List/i);
    const nodes = Object.values(sb.initialState.linkedListNodes);
    assert.ok(nodes.length >= 3);
    assert.ok(nodes[1].prevId !== undefined, 'Middle node must have prevId defined');
    assert.match(sb.code, /prev/);
    assert.match(sb.code, /next/);
  });

  // -------------------------------------------------------------
  // 4. CIRCULAR LINKED LIST
  // -------------------------------------------------------------
  await t.test('4. Circular Linked List: Tail loops back to head', () => {
    const prompt = 'Create a circular linked list with [1, 2, 3, 4]';
    const intent = parseDsaIntent(prompt);
    assert.equal(intent.kind, 'create-structure');
    if (intent.kind === 'create-structure') {
      assert.equal(intent.structureType, 'circular-linked-list');
    }

    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.match(sb.title, /Circular Linked List/i);
    const nodes = Object.values(sb.initialState.linkedListNodes);
    assert.equal(nodes.length, 4);
    const tail = nodes[3];
    assert.equal(tail.isCircular, true);
    assert.equal(tail.nextId, nodes[0].id);
  });

  // -------------------------------------------------------------
  // 5. AVL TREE (Rotations & Balance Factor)
  // -------------------------------------------------------------
  await t.test('5. AVL Tree: Height, Balance Factor, and Rotation step', () => {
    const prompt = 'Insert 25 into this AVL tree';
    const intent = parseDsaIntent(prompt);
    assert.equal(intent.kind, 'solve-algorithm');
    if (intent.kind === 'solve-algorithm') {
      assert.equal(intent.algorithm, 'avl-insert');
    }

    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.match(sb.title, /AVL/i);
    assert.ok(Object.keys(sb.initialState.treeNodes).length >= 3);
    assert.match(sb.code, /balance_factor|rotate|height/i);
    assert.ok(sb.steps.some((s) => s.title.toLowerCase().includes('rotat')));
  });

  // -------------------------------------------------------------
  // 6. HEAP (Min Heap / Max Heap Dual Representation)
  // -------------------------------------------------------------
  await t.test('6. Min Heap: Synchronized Tree and Array representations', () => {
    const prompt = 'Build a min heap with [50, 20, 30, 40, 25]';
    const intent = parseDsaIntent(prompt);
    assert.equal(intent.kind, 'solve-algorithm');
    if (intent.kind === 'solve-algorithm') {
      assert.equal(intent.algorithm, 'heapify');
    }

    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.match(sb.title, /Heap/i);
    assert.ok(sb.initialState.array, 'Heap must project array representation');
    assert.ok(Object.keys(sb.initialState.treeNodes).length > 0, 'Heap must project tree representation');
    assert.match(sb.code, /heapify|sift/i);
  });

  // -------------------------------------------------------------
  // 7. GRAPH & DIJKSTRA
  // -------------------------------------------------------------
  await t.test('7. Dijkstra Shortest Path: Graph with distance table and priority queue', () => {
    const prompt = 'Find the shortest path using Dijkstra';
    const intent = parseDsaIntent(prompt);
    assert.equal(intent.kind, 'solve-algorithm');
    if (intent.kind === 'solve-algorithm') {
      assert.equal(intent.algorithm, 'dijkstra');
    }

    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.match(sb.title, /Dijkstra/i);
    assert.ok(sb.initialState.graph, 'Must have Graph component');
    assert.ok(sb.initialState.variables['dist_A'] || sb.initialState.variables['current'], 'Must track distances');
    assert.match(sb.code, /dijkstra|min_dist|heap/i);
  });

  // -------------------------------------------------------------
  // 8. BFS & DFS GRAPH TRAVERSALS
  // -------------------------------------------------------------
  await t.test('8. BFS & DFS: Traversal with Queue / Stack reuse', () => {
    // BFS
    const bfsPrompt = 'Run BFS on this graph starting from A';
    const bfsIntent = parseDsaIntent(bfsPrompt);
    assert.equal(bfsIntent.kind, 'solve-algorithm');
    if (bfsIntent.kind === 'solve-algorithm') {
      assert.equal(bfsIntent.algorithm, 'bfs');
    }
    const bfsSb = buildStoryboardFromIntent(bfsIntent, 'python');
    assert.ok(bfsSb.initialState.graph);
    assert.ok(bfsSb.initialState.queue, 'BFS must reuse Queue component');

    // DFS
    const dfsPrompt = 'Run DFS on this graph starting from A';
    const dfsIntent = parseDsaIntent(dfsPrompt);
    assert.equal(dfsIntent.kind, 'solve-algorithm');
    if (dfsIntent.kind === 'solve-algorithm') {
      assert.equal(dfsIntent.algorithm, 'dfs');
    }
    const dfsSb = buildStoryboardFromIntent(dfsIntent, 'python');
    assert.ok(dfsSb.initialState.graph);
    assert.ok(dfsSb.initialState.stack, 'DFS must reuse Stack component');
  });

  // -------------------------------------------------------------
  // 9. SLIDING WINDOW
  // -------------------------------------------------------------
  await t.test('9. Sliding Window: Window bounds, windowSum, and movement', () => {
    const prompt = 'Find maximum sum subarray of size 3 using sliding window in [2, 1, 5, 1, 3, 2]';
    const intent = parseDsaIntent(prompt);
    assert.equal(intent.kind, 'solve-algorithm');
    if (intent.kind === 'solve-algorithm') {
      assert.equal(intent.algorithm, 'sliding-window');
      assert.deepEqual(intent.inputArray, [2, 1, 5, 1, 3, 2]);
    }

    const sb = buildStoryboardFromIntent(intent, 'python');
    assert.match(sb.title, /Sliding Window/i);
    assert.ok(sb.initialState.array);
    assert.ok(sb.initialState.variables['window_sum']);
    assert.match(sb.code, /window/i);
  });

  // -------------------------------------------------------------
  // 10. DYNAMIC PROGRAMMING & RECURSION
  // -------------------------------------------------------------
  await t.test('10. Dynamic Programming table & Recursion Call Stack', () => {
    // DP
    const dpPrompt = 'Solve 0/1 knapsack using dynamic programming';
    const dpIntent = parseDsaIntent(dpPrompt);
    assert.equal(dpIntent.kind, 'solve-algorithm');
    if (dpIntent.kind === 'solve-algorithm') {
      assert.equal(dpIntent.algorithm, 'dynamic-programming');
    }
    const dpSb = buildStoryboardFromIntent(dpIntent, 'python');
    assert.match(dpSb.title, /Dynamic Programming|DP/i);
    assert.match(dpSb.code, /dp\[/);

    // Recursion
    const recPrompt = 'Visualize recursion for factorial 4';
    const recIntent = parseDsaIntent(recPrompt);
    assert.equal(recIntent.kind, 'solve-algorithm');
    if (recIntent.kind === 'solve-algorithm') {
      assert.equal(recIntent.algorithm, 'recursion-factorial');
    }
    const recSb = buildStoryboardFromIntent(recIntent, 'python');
    assert.match(recSb.title, /Recursion|Factorial/i);
    assert.ok(recSb.initialState.stack || recSb.initialState.callStack);
  });
});
