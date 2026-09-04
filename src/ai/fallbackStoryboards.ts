import type { TimelineStoryboard } from '../types/timeline.ts';
import { PRESET_SCENARIOS } from '../mock/presetScenarios.ts';
import { parseDsaIntent, buildStoryboardFromIntent } from './dsaIntentParser.ts';

/**
 * Procedurally generates complete, playable TimelineStoryboard objects
 * for common algorithm prompts. Guarantees 100% offline, zero-fail reliability.
 * Supports Python, TypeScript, and C++ matching workspace settings.
 */
export function generateProceduralStoryboard(
  prompt: string,
  targetLanguage: 'python' | 'typescript' | 'cpp' = 'python'
): TimelineStoryboard {
  const p = prompt.toLowerCase().trim();

  // 0. CHECK STRUCTURED DSA INTENT (Reliable Natural-Language Extraction)
  const intent = parseDsaIntent(prompt);
  if (intent.kind === 'create-structure' || intent.kind === 'solve-algorithm') {
    return buildStoryboardFromIntent(intent, targetLanguage);
  }

  // 1. MATCH GOLDEN PRESETS IF REQUESTED DIRECTLY
  if (p.includes('quicksort') || p.includes('partition') || p.includes('lomuto')) {
    const s = PRESET_SCENARIOS[0];
    return {
      id: s.id,
      title: s.title,
      badge: s.badge,
      language: targetLanguage,
      fileName: targetLanguage === 'python' ? 'quicksort.py' : targetLanguage === 'typescript' ? 'quicksort.ts' : 'quicksort.cpp',
      code: s.code,
      initialPrompt: prompt,
      initialState: s.initialState,
      steps: s.steps,
      chatExplanation: "Here's an in-place QuickSort partition solution. I've generated the code and added the dual-pointer array visualization (i, j, and pivot) to the workspace. You can step through each comparison and swap using the timeline.",
    };
  }

  if (p.includes('reverse') && (p.includes('list') || p.includes('linked'))) {
    const s = PRESET_SCENARIOS[1];
    return {
      id: s.id,
      title: s.title,
      badge: s.badge,
      language: targetLanguage,
      fileName: targetLanguage === 'python' ? 'reverse_list.py' : targetLanguage === 'typescript' ? 'reverse_list.ts' : 'reverse_list.cpp',
      code: s.code,
      initialPrompt: prompt,
      initialState: s.initialState,
      steps: s.steps,
      chatExplanation: "Here's an in-place solution for Reversing a Singly Linked List. I've generated the code and added the linked list nodes with dynamic pointer rewiring (prev, curr, next) to your workspace. You can step through each pointer reversal on the timeline.",
    };
  }

  if ((p.includes('bst') || p.includes('tree')) && (p.includes('insert') || p.includes('search'))) {
    const s = PRESET_SCENARIOS[2];
    return {
      id: s.id,
      title: s.title,
      badge: s.badge,
      language: targetLanguage,
      fileName: targetLanguage === 'python' ? 'bst_insert.py' : targetLanguage === 'typescript' ? 'bst_insert.ts' : 'bst_insert.cpp',
      code: s.code,
      initialPrompt: prompt,
      initialState: s.initialState,
      steps: s.steps,
      chatExplanation: "Here's a Binary Search Tree insertion algorithm. I've generated the code and rendered the deterministic in-order tree layout with dynamic connectors in your workspace. You can step through the search traversal and leaf attachment on the timeline.",
    };
  }

  // 2. EXPLAIN HOW THIS FOR LOOP WORKS
  if (p.includes('for loop') || p.includes('how this loop') || p.includes('loop work') || p.includes('explain loop')) {
    return createForLoopExplainerStoryboard(prompt, targetLanguage);
  }

  // 3. FIND MAXIMUM ELEMENT STORYBOARD
  if (p.includes('max') || p.includes('largest') || p.includes('find max')) {
    return createFindMaxStoryboard(prompt, targetLanguage);
  }

  // 4. BINARY SEARCH STORYBOARD
  if (p.includes('binary search')) {
    return createBinarySearchStoryboard(prompt, targetLanguage);
  }

  // 5. BUBBLE SORT STORYBOARD
  if (p.includes('bubble sort') || p.includes('sort')) {
    return createBubbleSortStoryboard(prompt, targetLanguage);
  }

  // 6. DEFAULT LINEAR SCAN STORYBOARD
  return createLinearSearchStoryboard(prompt, targetLanguage);
}

function createForLoopExplainerStoryboard(
  initialPrompt: string,
  lang: 'python' | 'typescript' | 'cpp'
): TimelineStoryboard {
  const code =
    lang === 'typescript'
      ? `function processLoop(arr: number[]): number {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
    console.log(\`i=\${i}, val=\${arr[i]}, total=\${total}\`);
  }
  return total;
}`
      : lang === 'cpp'
      ? `int processLoop(const std::vector<int>& arr) {
    int total = 0;
    for (int i = 0; i < arr.size(); i++) {
        total += arr[i];
        std::cout << "i=" << i << " val=" << arr[i] << std::endl;
    }
    return total;
}`
      : `def process_loop(arr: list[int]) -> int:
    total = 0
    for i in range(len(arr)):
        total += arr[i]
        print(f"i={i}, val={arr[i]}, total={total}")
    return total`;

  return {
    id: 'procedural-for-loop',
    title: 'For Loop Execution Walkthrough',
    badge: 'Loop Mechanics',
    language: lang,
    fileName: lang === 'python' ? 'loop.py' : lang === 'typescript' ? 'loop.ts' : 'loop.cpp',
    code,
    initialPrompt,
    chatExplanation: "Here's an interactive step-by-step walkthrough of how this for loop operates. I've generated the code and loaded the loop tracker, condition evaluator, array pointers, and variable state into the workspace. Step through to observe each iteration.",
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'arr',
        values: [10, 20, 30, 40],
        pointers: { i: 0 },
        highlights: { 0: 'active' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        total: { name: 'total', value: 0, color: 'mint' },
        i: { name: 'i', value: 0, color: 'indigo' },
        'arr[i]': { name: 'arr[i]', value: 10, color: 'purple' },
      },
      loop: {
        header: 'for i in range(len(arr))',
        conditionText: 'i < 4 (True)',
        currentIteration: 0,
        totalIterations: 4,
        isComplete: false,
        variableName: 'i',
        iterationPills: ['i = 0', 'i = 1', 'i = 2', 'i = 3', 'Loop Exit'],
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 2,
        title: 'Loop Initialization',
        narration: 'Initialize accumulator variable total to 0. Loop index i starts at 0.',
        variables: { total: 0, i: 0, 'arr[0]': 10 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 0 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [0], state: 'active' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'total', value: 0, color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'i', value: 0, color: 'indigo' } },
        ],
      },
      {
        id: 'step-1',
        stepNumber: 1,
        codeLine: 4,
        title: 'Iteration 0: Add arr[0]',
        narration: 'At iteration i = 0, condition 0 < 4 is True. We add arr[0] (10) to total: total becomes 10.',
        variables: { total: 10, i: 0, 'arr[i]': 10 },
        mutations: [
          { type: 'variable', action: { kind: 'set-variable', name: 'total', value: 10, color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'arr[i]', value: 10, color: 'purple' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 0, conditionText: 'i=0 < 4 (True)' } },
        ],
      },
      {
        id: 'step-2',
        stepNumber: 2,
        codeLine: 4,
        title: 'Iteration 1: Add arr[1]',
        narration: 'Loop index increments to i = 1. Condition 1 < 4 is True. Add arr[1] (20) to total: total becomes 30.',
        variables: { total: 30, i: 1, 'arr[i]': 20 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 1 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [1], state: 'active' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'total', value: 30, color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'i', value: 1, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'arr[i]', value: 20, color: 'purple' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 1, conditionText: 'i=1 < 4 (True)' } },
        ],
      },
      {
        id: 'step-3',
        stepNumber: 3,
        codeLine: 4,
        title: 'Iteration 2: Add arr[2]',
        narration: 'Index increments to i = 2. Add arr[2] (30) to total: total becomes 60.',
        variables: { total: 60, i: 2, 'arr[i]': 30 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 2 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [2], state: 'active' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'total', value: 60, color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'i', value: 2, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'arr[i]', value: 30, color: 'purple' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 2, conditionText: 'i=2 < 4 (True)' } },
        ],
      },
      {
        id: 'step-4',
        stepNumber: 4,
        codeLine: 4,
        title: 'Iteration 3: Add arr[3]',
        narration: 'Final element at index 3: add arr[3] (40) to total: total becomes 100.',
        variables: { total: 100, i: 3, 'arr[i]': 40 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 3 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [3], state: 'active' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'total', value: 100, color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'i', value: 3, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'arr[i]', value: 40, color: 'purple' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 3, conditionText: 'i=3 < 4 (True)' } },
        ],
      },
      {
        id: 'step-5',
        stepNumber: 5,
        codeLine: 6,
        title: 'Loop Termination & Return',
        narration: 'Index reaches 4. Condition 4 < 4 is False. The loop terminates and returns total = 100.',
        variables: { total: 100, status: 'Loop Terminated' },
        mutations: [
          { type: 'array', action: { kind: 'highlight-slots', indices: [0, 1, 2, 3], state: 'sorted' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 4, conditionText: 'i=4 < 4 (False -> Exit)', isComplete: true } },
          { type: 'variable', action: { kind: 'set-variable', name: 'status', value: 'Complete', color: 'mint' } },
        ],
      },
    ],
  };
}

function createFindMaxStoryboard(
  initialPrompt: string,
  lang: 'python' | 'typescript' | 'cpp'
): TimelineStoryboard {
  const code =
    lang === 'typescript'
      ? `function findMax(nums: number[]): number {
  let maxVal = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > maxVal) {
      maxVal = nums[i];
    }
  }
  return maxVal;
}`
      : lang === 'cpp'
      ? `int findMax(const std::vector<int>& nums) {
    int maxVal = nums[0];
    for (size_t i = 1; i < nums.size(); i++) {
        if (nums[i] > maxVal) {
            maxVal = nums[i];
        }
    }
    return maxVal;
}`
      : `def find_max(nums: list[int]) -> int:
    max_val = nums[0]
    for i in range(1, len(nums)):
        if nums[i] > max_val:
            max_val = nums[i]
    return max_val`;

  return {
    id: 'procedural-find-max',
    title: 'Find Maximum Element',
    badge: 'Array Scan',
    language: lang,
    fileName: lang === 'python' ? 'find_max.py' : lang === 'typescript' ? 'find_max.ts' : 'find_max.cpp',
    code,
    initialPrompt,
    chatExplanation: "Here's a solution finding the maximum element in an array. I've generated the code and added the array, pointers, and loop tracker to the workspace. You can step through each comparison on the timeline.",
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'nums',
        values: [14, 38, 20, 92, 53],
        pointers: { i: 0 },
        highlights: { 0: 'active' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        max_val: { name: 'max_val', value: 14, color: 'mint' },
        current: { name: 'nums[i]', value: 14, color: 'indigo' },
      },
      loop: {
        header: 'for i in range(1, len(nums))',
        conditionText: 'i < 5',
        currentIteration: 0,
        totalIterations: 4,
        isComplete: false,
        iterationPills: ['i = 1', 'i = 2', 'i = 3', 'i = 4', 'Exit'],
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 2,
        title: 'Initialize Maximum',
        narration: 'We initialize max_val with nums[0], which is 14.',
        variables: { max_val: 14, i: 0, 'nums[0]': 14 },
        mutations: [
          { type: 'array', action: { kind: 'highlight-slots', indices: [0], state: 'active' } },
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 0 } },
          { type: 'variable', action: { kind: 'set-variable', name: 'max_val', value: 14, color: 'mint' } },
        ],
      },
      {
        id: 'step-1',
        stepNumber: 1,
        codeLine: 4,
        title: 'Compare nums[1] with max_val',
        narration: 'At index 1, nums[1] is 38. Since 38 is greater than 14, we update max_val to 38.',
        variables: { max_val: 38, i: 1, 'nums[1]': 38 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 1 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [1], state: 'comparing' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'max_val', value: 38, color: 'mint' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 0, conditionText: 'nums[1] (38) > 14 (True)' } },
        ],
      },
      {
        id: 'step-2',
        stepNumber: 2,
        codeLine: 4,
        title: 'Compare nums[2] with max_val',
        narration: 'At index 2, nums[2] is 20. 20 is not greater than 38, so max_val remains 38.',
        variables: { max_val: 38, i: 2, 'nums[2]': 20 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 2 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [2], state: 'default' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 1, conditionText: 'nums[2] (20) > 38 (False)' } },
        ],
      },
      {
        id: 'step-3',
        stepNumber: 3,
        codeLine: 5,
        title: 'New Maximum Found at nums[3]',
        narration: 'At index 3, nums[3] is 92. Since 92 is greater than 38, we update max_val to 92.',
        variables: { max_val: 92, i: 3, 'nums[3]': 92 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 3 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [3], state: 'active' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'max_val', value: 92, color: 'mint' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 2, conditionText: 'nums[3] (92) > 38 (True)' } },
        ],
      },
      {
        id: 'step-4',
        stepNumber: 4,
        codeLine: 6,
        title: 'Return Global Maximum',
        narration: 'The loop finishes after checking index 4. The maximum value in the array is 92.',
        variables: { max_val: 92, status: 'Completed' },
        mutations: [
          { type: 'array', action: { kind: 'highlight-slots', indices: [3], state: 'sorted' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 4, conditionText: 'Loop Finished', isComplete: true } },
          { type: 'variable', action: { kind: 'set-variable', name: 'result', value: 92, color: 'mint' } },
        ],
      },
    ],
  };
}

function createBinarySearchStoryboard(
  initialPrompt: string,
  lang: 'python' | 'typescript' | 'cpp'
): TimelineStoryboard {
  const code =
    lang === 'typescript'
      ? `function binarySearch(nums: number[], target: number): number {
  let low = 0, high = nums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] === target) return mid;
    else if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`
      : lang === 'cpp'
      ? `int binarySearch(const std::vector<int>& nums, int target) {
    int low = 0, high = nums.size() - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`
      : `def binary_search(nums: list[int], target: int) -> int:
    low, high = 0, len(nums) - 1
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`;

  return {
    id: 'procedural-binary-search',
    title: 'Binary Search',
    badge: 'Divide & Conquer',
    language: lang,
    fileName: lang === 'python' ? 'binary_search.py' : lang === 'typescript' ? 'binary_search.ts' : 'binary_search.cpp',
    code,
    initialPrompt,
    chatExplanation: "Here's a solution using binary search. I've generated the code and added the required visualization to the workspace. You can step through the execution using the timeline.",
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'nums',
        values: [3, 8, 15, 23, 42, 57, 88],
        pointers: { low: 0, mid: 3, high: 6 },
        highlights: { 3: 'active' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        target: { name: 'target', value: 42, color: 'amber' },
        low: { name: 'low', value: 0, color: 'indigo' },
        mid: { name: 'mid', value: 3, color: 'purple' },
        high: { name: 'high', value: 6, color: 'indigo' },
      },
      loop: {
        header: 'while low <= high',
        conditionText: '0 <= 6 (True)',
        currentIteration: 0,
        totalIterations: 3,
        isComplete: false,
        iterationPills: ['Iter 1', 'Iter 2', 'Iter 3', 'Complete'],
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 2,
        title: 'Initialize Search Window',
        narration: 'We set low to 0 and high to 6. Our target is 42.',
        variables: { target: 42, low: 0, high: 6 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'low', toIndex: 0 } },
          { type: 'array', action: { kind: 'move-pointer', name: 'high', toIndex: 6 } },
        ],
      },
      {
        id: 'step-1',
        stepNumber: 1,
        codeLine: 4,
        title: 'Compute Midpoint',
        narration: 'mid is (0 + 6) // 2 = 3. nums[3] is 23. Since 23 is less than 42, we search the right half.',
        variables: { target: 42, low: 0, mid: 3, high: 6, 'nums[mid]': 23 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'mid', toIndex: 3 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [3], state: 'comparing' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 0, conditionText: '23 < 42 -> Go Right' } },
        ],
      },
      {
        id: 'step-2',
        stepNumber: 2,
        codeLine: 8,
        title: 'Adjust Low Pointer',
        narration: 'We update low to mid + 1 = 4. The new midpoint is (4 + 6) // 2 = 5.',
        variables: { target: 42, low: 4, mid: 5, high: 6, 'nums[mid]': 57 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'low', toIndex: 4 } },
          { type: 'array', action: { kind: 'move-pointer', name: 'mid', toIndex: 5 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [5], state: 'comparing' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 1, conditionText: '57 > 42 -> Go Left' } },
        ],
      },
      {
        id: 'step-3',
        stepNumber: 3,
        codeLine: 6,
        title: 'Target Found at Index 4',
        narration: 'high moves to 4. Now low, mid, and high all point to index 4. nums[4] is 42, matching our target!',
        variables: { target: 42, low: 4, mid: 4, high: 4, foundIndex: 4 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'high', toIndex: 4 } },
          { type: 'array', action: { kind: 'move-pointer', name: 'mid', toIndex: 4 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [4], state: 'sorted' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 2, conditionText: 'Target 42 Found!', isComplete: true } },
          { type: 'variable', action: { kind: 'set-variable', name: 'foundIndex', value: 4, color: 'mint' } },
        ],
      },
    ],
  };
}

function createBubbleSortStoryboard(
  initialPrompt: string,
  lang: 'python' | 'typescript' | 'cpp'
): TimelineStoryboard {
  const code =
    lang === 'typescript'
      ? `function bubbleSort(arr: number[]) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
}`
      : lang === 'cpp'
      ? `void bubbleSort(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                std::swap(arr[j], arr[j + 1]);
            }
        }
    }
}`
      : `def bubble_sort(arr: list[int]):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]`;

  return {
    id: 'procedural-bubble-sort',
    title: 'Bubble Sort Pass',
    badge: 'Sorting Algorithm',
    language: lang,
    fileName: lang === 'python' ? 'bubble_sort.py' : lang === 'typescript' ? 'bubble_sort.ts' : 'bubble_sort.cpp',
    code,
    initialPrompt,
    chatExplanation: "Here's a solution using bubble sort. I've generated the code and added the required array and adjacent element comparison visualization to the workspace. You can step through each comparison and swap using the timeline.",
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'arr',
        values: [45, 12, 85, 32],
        pointers: { j: 0 },
        highlights: { 0: 'comparing', 1: 'comparing' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        'arr[j]': { name: 'arr[j]', value: 45, color: 'indigo' },
        'arr[j+1]': { name: 'arr[j+1]', value: 12, color: 'purple' },
      },
      loop: {
        header: 'for j in range(0, n - i - 1)',
        conditionText: 'Compare adjacent pairs',
        currentIteration: 0,
        totalIterations: 3,
        isComplete: false,
        iterationPills: ['j = 0', 'j = 1', 'j = 2', 'Pass 1 Done'],
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 4,
        title: 'Compare arr[0] and arr[1]',
        narration: 'Comparing 45 and 12. Since 45 is greater than 12, they must swap.',
        variables: { j: 0, 'arr[0]': 45, 'arr[1]': 12 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'j', toIndex: 0 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [0, 1], state: 'comparing' } },
        ],
      },
      {
        id: 'step-1',
        stepNumber: 1,
        codeLine: 5,
        title: 'Swap arr[0] and arr[1]',
        narration: '45 and 12 swap positions.',
        variables: { j: 0, 'arr[0]': 12, 'arr[1]': 45 },
        mutations: [
          { type: 'array', action: { kind: 'swap-slots', indexA: 0, indexB: 1 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [0, 1], state: 'swapped' } },
        ],
      },
      {
        id: 'step-2',
        stepNumber: 2,
        codeLine: 4,
        title: 'Compare arr[1] and arr[2]',
        narration: 'Comparing 45 and 85. Since 45 is not greater than 85, no swap is needed.',
        variables: { j: 1, 'arr[1]': 45, 'arr[2]': 85 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'j', toIndex: 1 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [1, 2], state: 'comparing' } },
        ],
      },
      {
        id: 'step-3',
        stepNumber: 3,
        codeLine: 5,
        title: 'Compare & Swap arr[2] and arr[3]',
        narration: 'Comparing 85 and 32. 85 is greater than 32, so they swap.',
        variables: { j: 2, 'arr[2]': 32, 'arr[3]': 85 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'j', toIndex: 2 } },
          { type: 'array', action: { kind: 'swap-slots', indexA: 2, indexB: 3 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [3], state: 'sorted' } },
        ],
      },
    ],
  };
}

function createLinearSearchStoryboard(
  initialPrompt: string,
  lang: 'python' | 'typescript' | 'cpp'
): TimelineStoryboard {
  const code =
    lang === 'typescript'
      ? `function linearSearch(arr: number[], target: number): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}`
      : lang === 'cpp'
      ? `int linearSearch(const std::vector<int>& arr, int target) {
    for (size_t i = 0; i < arr.size(); i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}`
      : `def linear_search(arr: list[int], target: int) -> int:
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1`;

  return {
    id: 'procedural-linear-search',
    title: 'Linear Scan',
    badge: 'Search',
    language: lang,
    fileName: lang === 'python' ? 'linear_search.py' : lang === 'typescript' ? 'linear_search.ts' : 'linear_search.cpp',
    code,
    initialPrompt,
    chatExplanation: "Here's a solution using linear search. I've generated the code and added the scanning pointer and target tracking to the workspace. You can step through the execution using the timeline.",
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'arr',
        values: [10, 25, 30, 45, 60],
        pointers: { i: 0 },
        highlights: { 0: 'active' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        target: { name: 'target', value: 45, color: 'amber' },
        current: { name: 'arr[i]', value: 10, color: 'indigo' },
      },
      loop: {
        header: 'for i in range(len(arr))',
        conditionText: 'i < 5',
        currentIteration: 0,
        totalIterations: 4,
        isComplete: false,
        iterationPills: ['i = 0', 'i = 1', 'i = 2', 'i = 3', 'Found'],
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 2,
        title: 'Start Linear Search',
        narration: 'We scan through each element looking for target 45.',
        variables: { target: 45, i: 0 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 0 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [0], state: 'active' } },
        ],
      },
      {
        id: 'step-1',
        stepNumber: 1,
        codeLine: 3,
        title: 'Check Index 1 & 2',
        narration: 'arr[1] is 25 and arr[2] is 30. Neither equals 45, so the pointer continues advancing.',
        variables: { target: 45, i: 2 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 2 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [2], state: 'comparing' } },
        ],
      },
      {
        id: 'step-2',
        stepNumber: 2,
        codeLine: 4,
        title: 'Target Found at Index 3',
        narration: 'arr[3] is 45, which matches our target! We return index 3.',
        variables: { target: 45, i: 3, foundIndex: 3 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 3 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [3], state: 'sorted' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'foundIndex', value: 3, color: 'mint' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 3, conditionText: 'Target Found!', isComplete: true } },
        ],
      },
    ],
  };
}
