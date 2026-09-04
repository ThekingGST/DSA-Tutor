import type { TimelineStoryboard, TimelineStep, CallFrameEntity } from '../types/timeline.ts';
import { PRESET_SCENARIOS } from '../mock/presetScenarios.ts';

// =========================================================================
// 1. SECOND MAXIMUM ELEMENT STORYBOARD
// =========================================================================
export function createDynamicSecondMaxStoryboard(
  rawNums: number[],
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Find second maximum number in array'
): TimelineStoryboard {
  const nums = rawNums.length >= 2 ? [...rawNums] : [10, 2, 6, 20, 3, 6, 4, 5];

  const code =
    lang === 'typescript'
      ? `function findSecondMax(arr: number[]): number | null {
  if (arr.length < 2) return null;
  let firstMax = Math.max(arr[0], arr[1]);
  let secondMax = Math.min(arr[0], arr[1]);

  for (let i = 2; i < arr.length; i++) {
    const x = arr[i];
    if (x > firstMax) {
      secondMax = firstMax;
      firstMax = x;
    } else if (x > secondMax && x !== firstMax) {
      secondMax = x;
    }
  }
  return secondMax;
}`
      : lang === 'cpp'
      ? `#include <vector>
#include <algorithm>
#include <climits>

int findSecondMax(const std::vector<int>& arr) {
    if (arr.size() < 2) return INT_MIN;
    int firstMax = std::max(arr[0], arr[1]);
    int secondMax = std::min(arr[0], arr[1]);

    for (size_t i = 2; i < arr.size(); i++) {
        int x = arr[i];
        if (x > firstMax) {
            secondMax = firstMax;
            firstMax = x;
        } else if (x > secondMax && x != firstMax) {
            secondMax = x;
        }
    }
    return secondMax;
}`
      : `def find_second_maximum(arr: list[int]) -> int | None:
    if len(arr) < 2:
        return None
    first_max = max(arr[0], arr[1])
    second_max = min(arr[0], arr[1])

    for i in range(2, len(arr)):
        x = arr[i]
        if x > first_max:
            second_max = first_max
            first_max = x
        elif x > second_max and x != first_max:
            second_max = x
            
    return second_max`;

  let firstMax = Math.max(nums[0], nums[1]);
  let secondMax = Math.min(nums[0], nums[1]);

  const steps: TimelineStep[] = [
    {
      id: 'step-0',
      stepNumber: 0,
      codeLine: 4,
      title: 'Initialize First & Second Max',
      narration: `Initialize from first two elements: first_max = ${firstMax}, second_max = ${secondMax}. Loop scans index i from 2 to ${nums.length - 1}.`,
      variables: { first_max: firstMax, second_max: secondMax, i: 1 },
      mutations: [
        { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 1 } },
        { type: 'array', action: { kind: 'highlight-slots', indices: [0, 1], state: 'sorted' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'first_max', value: firstMax, color: 'mint' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'second_max', value: secondMax, color: 'amber' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'i', value: 1, color: 'indigo' } },
      ],
    },
  ];

  for (let i = 2; i < nums.length; i++) {
    const x = nums[i];
    const prevFirst = firstMax;
    const prevSec = secondMax;

    if (x > firstMax) {
      secondMax = firstMax;
      firstMax = x;
      steps.push({
        id: `step-${i - 1}`,
        stepNumber: i - 1,
        codeLine: 9,
        title: `New First Max at Index ${i}`,
        narration: `arr[${i}] (${x}) > first_max (${prevFirst}). Previous first_max becomes second_max (${prevFirst}), and first_max is updated to ${x}!`,
        variables: { first_max: firstMax, second_max: secondMax, i, [`arr[${i}]`]: x },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: i } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [i], state: 'sorted' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'first_max', value: firstMax, color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'second_max', value: secondMax, color: 'amber' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'i', value: i, color: 'indigo' } },
          {
            type: 'loop',
            action: {
              kind: 'update-loop',
              iteration: i - 1,
              conditionText: `arr[${i}] (${x}) > first_max (${prevFirst})`,
            },
          },
        ],
      });
    } else if (x > secondMax && x !== firstMax) {
      secondMax = x;
      steps.push({
        id: `step-${i - 1}`,
        stepNumber: i - 1,
        codeLine: 12,
        title: `New Second Max at Index ${i}`,
        narration: `arr[${i}] (${x}) is between second_max (${prevSec}) and first_max (${firstMax}). Updated second_max to ${x}!`,
        variables: { first_max: firstMax, second_max: secondMax, i, [`arr[${i}]`]: x },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: i } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [i], state: 'active' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'first_max', value: firstMax, color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'second_max', value: secondMax, color: 'amber' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'i', value: i, color: 'indigo' } },
          {
            type: 'loop',
            action: {
              kind: 'update-loop',
              iteration: i - 1,
              conditionText: `arr[${i}] (${x}) > second_max (${prevSec})`,
            },
          },
        ],
      });
    } else {
      steps.push({
        id: `step-${i - 1}`,
        stepNumber: i - 1,
        codeLine: 8,
        title: `Compare Index ${i}`,
        narration: `arr[${i}] (${x}) is neither > first_max (${firstMax}) nor > second_max (${secondMax}). Maxima remain unchanged.`,
        variables: { first_max: firstMax, second_max: secondMax, i, [`arr[${i}]`]: x },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: i } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [i], state: 'comparing' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'i', value: i, color: 'indigo' } },
          {
            type: 'loop',
            action: {
              kind: 'update-loop',
              iteration: i - 1,
              conditionText: `arr[${i}] (${x}) <= second_max (${secondMax})`,
            },
          },
        ],
      });
    }
  }

  // Final Step: Completion
  steps.push({
    id: `step-${nums.length - 1}`,
    stepNumber: nums.length - 1,
    codeLine: 15,
    title: 'Second Maximum Found',
    narration: `Finished scan across all ${nums.length} elements. The second maximum element is ${secondMax} (largest element is ${firstMax}).`,
    variables: { first_max: firstMax, second_max: secondMax, i: nums.length },
    mutations: [
      {
        type: 'array',
        action: {
          kind: 'highlight-slots',
          indices: nums.map((_, idx) => idx),
          state: 'default',
        },
      },
      {
        type: 'array',
        action: {
          kind: 'highlight-slots',
          indices: [nums.indexOf(secondMax)],
          state: 'active',
        },
      },
      {
        type: 'array',
        action: {
          kind: 'highlight-slots',
          indices: [nums.indexOf(firstMax)],
          state: 'sorted',
        },
      },
      {
        type: 'loop',
        action: {
          kind: 'update-loop',
          iteration: nums.length - 1,
          conditionText: 'Scan Complete',
          isComplete: true,
        },
      },
    ],
  });

  return {
    id: 'procedural-find-second-max',
    title: 'Find Second Maximum Element',
    badge: 'Array Traversal',
    language: lang,
    fileName: lang === 'python' ? 'second_max.py' : lang === 'typescript' ? 'second_max.ts' : 'second_max.cpp',
    code,
    initialPrompt: rawPrompt,
    chatExplanation: `Here's an optimal single-pass O(n) solution to find the second maximum element in [${nums.join(', ')}]. I've generated the code and loaded the array, first_max, second_max variable cards, and loop tracker onto your workspace. Step through to observe how both maxima update.`,
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'arr',
        values: [...nums],
        pointers: { i: 1 },
        highlights: { 0: 'sorted', 1: 'sorted' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        first_max: { name: 'first_max', value: Math.max(nums[0], nums[1]), color: 'mint' },
        second_max: { name: 'second_max', value: Math.min(nums[0], nums[1]), color: 'amber' },
        i: { name: 'i', value: 1, color: 'indigo' },
      },
      loop: {
        header: `for i in range(2, len(arr))`,
        conditionText: `i < ${nums.length}`,
        currentIteration: 1,
        totalIterations: Math.max(1, nums.length - 2),
        isComplete: false,
        variableName: 'i',
        iterationPills: nums.slice(2).map((_, idx) => `i = ${idx + 2}`),
      },
    },
    steps,
  };
}

// =========================================================================
// 2. FIND MAXIMUM ELEMENT STORYBOARD
// =========================================================================
export function createDynamicFindMaxStoryboard(
  nums: number[],
  lang: 'python' | 'typescript' | 'cpp',
  rawPrompt: string
): TimelineStoryboard {
  const code =
    lang === 'typescript'
      ? `function findMax(arr: number[]): number {
  let maxVal = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > maxVal) {
      maxVal = arr[i];
    }
  }
  return maxVal;
}`
      : lang === 'cpp'
      ? `int findMax(const std::vector<int>& arr) {
    int maxVal = arr[0];
    for (size_t i = 1; i < arr.size(); i++) {
        if (arr[i] > maxVal) {
            maxVal = arr[i];
        }
    }
    return maxVal;
}`
      : `def find_max(arr: list[int]) -> int:
    max_val = arr[0]
    for i in range(1, len(arr)):
        if arr[i] > max_val:
            max_val = arr[i]
    return max_val`;

  let currentMax = nums[0];
  const steps: TimelineStep[] = [
    {
      id: 'step-0',
      stepNumber: 0,
      codeLine: 2,
      title: 'Initialize Maximum',
      narration: `Set initial max_val to arr[0] (${nums[0]}). Scanning index i will iterate from 1 to ${nums.length - 1}.`,
      variables: { max_val: nums[0], i: 0, 'arr[0]': nums[0] },
      mutations: [
        { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 0 } },
        { type: 'array', action: { kind: 'highlight-slots', indices: [0], state: 'active' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'max_val', value: nums[0], color: 'mint' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'i', value: 0, color: 'indigo' } },
      ],
    },
  ];

  for (let i = 1; i < nums.length; i++) {
    const isNewMax = nums[i] > currentMax;
    if (isNewMax) {
      currentMax = nums[i];
    }
    steps.push({
      id: `step-${i}`,
      stepNumber: i,
      codeLine: isNewMax ? 4 : 3,
      title: isNewMax ? `New Max at Index ${i}` : `Compare Index ${i}`,
      narration: isNewMax
        ? `arr[${i}] (${nums[i]}) > previous max. Update max_val to ${nums[i]}!`
        : `arr[${i}] (${nums[i]}) <= current max_val (${currentMax}). Keep max_val unchanged.`,
      variables: { max_val: currentMax, i, [`arr[${i}]`]: nums[i] },
      mutations: [
        { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: i } },
        {
          type: 'array',
          action: {
            kind: 'highlight-slots',
            indices: [i],
            state: isNewMax ? 'sorted' : 'comparing',
          },
        },
        { type: 'variable', action: { kind: 'set-variable', name: 'max_val', value: currentMax, color: 'mint' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'i', value: i, color: 'indigo' } },
        {
          type: 'loop',
          action: {
            kind: 'update-loop',
            iteration: i,
            conditionText: `i < ${nums.length} (arr[${i}] = ${nums[i]})`,
            isComplete: i === nums.length - 1,
          },
        },
      ],
    });
  }

  steps.push({
    id: `step-${nums.length}`,
    stepNumber: nums.length,
    codeLine: 6,
    title: 'Scan Complete',
    narration: `Finished scanning all ${nums.length} elements. The maximum element in the array is ${currentMax}.`,
    variables: { max_val: currentMax, i: nums.length },
    mutations: [
      { type: 'array', action: { kind: 'highlight-slots', indices: nums.map((_, idx) => idx), state: 'default' } },
      { type: 'array', action: { kind: 'highlight-slots', indices: [nums.indexOf(currentMax)], state: 'sorted' } },
      { type: 'loop', action: { kind: 'update-loop', iteration: nums.length, conditionText: 'Loop Complete', isComplete: true } },
    ],
  });

  return {
    id: 'procedural-find-max',
    title: 'Find Maximum Element',
    badge: 'Array Traversal',
    language: lang,
    fileName: lang === 'python' ? 'find_max.py' : lang === 'typescript' ? 'find_max.ts' : 'find_max.cpp',
    code,
    initialPrompt: rawPrompt,
    chatExplanation: `Here's an optimal solution to find the maximum element in [${nums.join(', ')}]. I've generated the code and loaded the array, max_val variable card, and loop tracker onto your workspace. Step through to observe each comparison.`,
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'arr',
        values: [...nums],
        pointers: { i: 0 },
        highlights: { 0: 'active' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        max_val: { name: 'max_val', value: nums[0], color: 'mint' },
        i: { name: 'i', value: 0, color: 'indigo' },
      },
      loop: {
        header: `for i in range(1, len(arr))`,
        conditionText: `i < ${nums.length}`,
        currentIteration: 1,
        totalIterations: Math.max(1, nums.length - 1),
        isComplete: false,
        variableName: 'i',
        iterationPills: nums.slice(1).map((_, idx) => `i = ${idx + 1}`),
      },
    },
    steps,
  };
}

// =========================================================================
// 3. FIND MINIMUM ELEMENT STORYBOARD
// =========================================================================
export function createDynamicFindMinStoryboard(
  nums: number[],
  lang: 'python' | 'typescript' | 'cpp',
  rawPrompt: string
): TimelineStoryboard {
  const code =
    lang === 'typescript'
      ? `function findMin(arr: number[]): number {
  let minVal = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < minVal) {
      minVal = arr[i];
    }
  }
  return minVal;
}`
      : `def find_min(arr: list[int]) -> int:
    min_val = arr[0]
    for i in range(1, len(arr)):
        if arr[i] < min_val:
            min_val = arr[i]
    return min_val`;

  let currentMin = nums[0];
  const steps: TimelineStep[] = [
    {
      id: 'step-0',
      stepNumber: 0,
      codeLine: 2,
      title: 'Initialize Minimum',
      narration: `Set initial min_val to arr[0] (${nums[0]}). Scanning index i iterates from 1 to ${nums.length - 1}.`,
      variables: { min_val: nums[0], i: 0 },
      mutations: [
        { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 0 } },
        { type: 'array', action: { kind: 'highlight-slots', indices: [0], state: 'active' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'min_val', value: nums[0], color: 'mint' } },
      ],
    },
  ];

  for (let i = 1; i < nums.length; i++) {
    const isNewMin = nums[i] < currentMin;
    if (isNewMin) {
      currentMin = nums[i];
    }
    steps.push({
      id: `step-${i}`,
      stepNumber: i,
      codeLine: isNewMin ? 4 : 3,
      title: isNewMin ? `New Min at Index ${i}` : `Compare Index ${i}`,
      narration: isNewMin
        ? `arr[${i}] (${nums[i]}) < previous min. Update min_val to ${nums[i]}!`
        : `arr[${i}] (${nums[i]}) >= current min_val (${currentMin}). Keep min_val unchanged.`,
      variables: { min_val: currentMin, i },
      mutations: [
        { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: i } },
        { type: 'array', action: { kind: 'highlight-slots', indices: [i], state: isNewMin ? 'sorted' : 'comparing' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'min_val', value: currentMin, color: 'mint' } },
      ],
    });
  }

  steps.push({
    id: `step-${nums.length}`,
    stepNumber: nums.length,
    codeLine: 6,
    title: 'Scan Complete',
    narration: `Finished scan. The minimum element is ${currentMin}.`,
    variables: { min_val: currentMin, i: nums.length },
    mutations: [
      { type: 'array', action: { kind: 'highlight-slots', indices: [nums.indexOf(currentMin)], state: 'sorted' } },
    ],
  });

  return {
    id: 'procedural-find-min',
    title: 'Find Minimum Element',
    badge: 'Array Traversal',
    language: lang,
    fileName: lang === 'python' ? 'find_min.py' : 'find_min.ts',
    code,
    initialPrompt: rawPrompt,
    chatExplanation: `Found minimum element in [${nums.join(', ')}]. Result is ${currentMin}.`,
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'arr',
        values: [...nums],
        pointers: { i: 0 },
        highlights: { 0: 'active' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        min_val: { name: 'min_val', value: nums[0], color: 'mint' },
        i: { name: 'i', value: 0, color: 'indigo' },
      },
    },
    steps,
  };
}

// =========================================================================
// 4. FIND SECOND MINIMUM STORYBOARD
// =========================================================================
export function createDynamicSecondMinStoryboard(
  rawNums: number[],
  lang: 'python' | 'typescript' | 'cpp',
  rawPrompt: string
): TimelineStoryboard {
  const nums = rawNums.length >= 2 ? [...rawNums] : [15, 3, 7, 2, 9];

  let firstMin = Math.min(nums[0], nums[1]);
  let secondMin = Math.max(nums[0], nums[1]);

  const steps: TimelineStep[] = [
    {
      id: 'step-0',
      stepNumber: 0,
      codeLine: 4,
      title: 'Initialize Minima',
      narration: `Initialize: first_min = ${firstMin}, second_min = ${secondMin}.`,
      variables: { first_min: firstMin, second_min: secondMin, i: 1 },
      mutations: [
        { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 1 } },
        { type: 'variable', action: { kind: 'set-variable', name: 'first_min', value: firstMin, color: 'mint' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'second_min', value: secondMin, color: 'amber' } },
      ],
    },
  ];

  for (let i = 2; i < nums.length; i++) {
    const x = nums[i];
    if (x < firstMin) {
      secondMin = firstMin;
      firstMin = x;
    } else if (x < secondMin && x !== firstMin) {
      secondMin = x;
    }
    steps.push({
      id: `step-${i - 1}`,
      stepNumber: i - 1,
      codeLine: 8,
      title: `Scan Index ${i}`,
      narration: `Checking arr[${i}] = ${x}. first_min = ${firstMin}, second_min = ${secondMin}.`,
      variables: { first_min: firstMin, second_min: secondMin, i },
      mutations: [
        { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: i } },
        { type: 'variable', action: { kind: 'set-variable', name: 'first_min', value: firstMin, color: 'mint' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'second_min', value: secondMin, color: 'amber' } },
      ],
    });
  }

  steps.push({
    id: `step-${nums.length - 1}`,
    stepNumber: nums.length - 1,
    codeLine: 14,
    title: 'Second Minimum Found',
    narration: `Finished scan. Second minimum is ${secondMin} (first minimum is ${firstMin}).`,
    variables: { first_min: firstMin, second_min: secondMin, i: nums.length },
    mutations: [
      { type: 'array', action: { kind: 'highlight-slots', indices: [nums.indexOf(secondMin)], state: 'active' } },
      { type: 'array', action: { kind: 'highlight-slots', indices: [nums.indexOf(firstMin)], state: 'sorted' } },
    ],
  });

  return {
    id: 'procedural-find-second-min',
    title: 'Find Second Minimum Element',
    badge: 'Array Traversal',
    language: lang,
    fileName: lang === 'python' ? 'second_min.py' : 'second_min.ts',
    code: `def find_second_minimum(arr: list[int]) -> int | None:\n    if len(arr) < 2:\n        return None\n    first_min = min(arr[0], arr[1])\n    second_min = max(arr[0], arr[1])\n    for i in range(2, len(arr)):\n        if arr[i] < first_min:\n            second_min = first_min\n            first_min = arr[i]\n        elif arr[i] < second_min and arr[i] != first_min:\n            second_min = arr[i]\n    return second_min`,
    initialPrompt: rawPrompt,
    chatExplanation: `Found second minimum element in [${nums.join(', ')}]. Result is ${secondMin}.`,
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'arr',
        values: [...nums],
        pointers: { i: 1 },
        highlights: { 0: 'sorted', 1: 'sorted' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        first_min: { name: 'first_min', value: Math.min(nums[0], nums[1]), color: 'mint' },
        second_min: { name: 'second_min', value: Math.max(nums[0], nums[1]), color: 'amber' },
        i: { name: 'i', value: 1, color: 'indigo' },
      },
    },
    steps,
  };
}

// =========================================================================
// 5. TWO SUM / TWO POINTERS STORYBOARD
// =========================================================================
export function createDynamicTwoSumStoryboard(
  rawNums: number[],
  target: number,
  lang: 'python' | 'typescript' | 'cpp',
  rawPrompt: string
): TimelineStoryboard {
  const nums = rawNums.length >= 2 ? [...rawNums] : [2, 7, 11, 15];
  let left = 0;
  let right = nums.length - 1;

  const steps: TimelineStep[] = [
    {
      id: 'step-0',
      stepNumber: 0,
      codeLine: 2,
      title: 'Initialize Left and Right Pointers',
      narration: `Set left = 0 (arr[0]=${nums[left]}) and right = ${right} (arr[${right}]=${nums[right]}). Target sum is ${target}.`,
      variables: { target, left, right, sum: nums[left] + nums[right] },
      mutations: [
        { type: 'array', action: { kind: 'move-pointer', name: 'left', toIndex: left } },
        { type: 'array', action: { kind: 'move-pointer', name: 'right', toIndex: right } },
        { type: 'array', action: { kind: 'highlight-slots', indices: [left, right], state: 'comparing' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'target', value: target, color: 'amber' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'sum', value: nums[left] + nums[right], color: 'mint' } },
      ],
    },
  ];

  let stepIdx = 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) {
      steps.push({
        id: `step-${stepIdx++}`,
        stepNumber: steps.length,
        codeLine: 5,
        title: 'Target Pair Found!',
        narration: `arr[${left}] (${nums[left]}) + arr[${right}] (${nums[right]}) == ${target}! Pair indices found: [${left}, ${right}].`,
        variables: { target, left, right, sum },
        mutations: [
          { type: 'array', action: { kind: 'highlight-slots', indices: [left, right], state: 'sorted' } },
        ],
      });
      break;
    } else if (sum < target) {
      left++;
      steps.push({
        id: `step-${stepIdx++}`,
        stepNumber: steps.length,
        codeLine: 7,
        title: 'Sum < Target: Advance Left',
        narration: `Sum (${sum}) < target (${target}). Increment left to index ${left} (${nums[left]}).`,
        variables: { target, left, right, sum: nums[left] + nums[right] },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'left', toIndex: left } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [left, right], state: 'comparing' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'sum', value: nums[left] + nums[right], color: 'mint' } },
        ],
      });
    } else {
      right--;
      steps.push({
        id: `step-${stepIdx++}`,
        stepNumber: steps.length,
        codeLine: 9,
        title: 'Sum > Target: Decrement Right',
        narration: `Sum (${sum}) > target (${target}). Decrement right to index ${right} (${nums[right]}).`,
        variables: { target, left, right, sum: nums[left] + nums[right] },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'right', toIndex: right } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [left, right], state: 'comparing' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'sum', value: nums[left] + nums[right], color: 'mint' } },
        ],
      });
    }
  }

  return {
    id: 'procedural-two-sum',
    title: 'Two Sum (Two Pointers)',
    badge: 'Two Pointers',
    language: lang,
    fileName: lang === 'python' ? 'two_sum.py' : 'two_sum.ts',
    code: `def two_sum(numbers: list[int], target: int) -> list[int]:\n    left, right = 0, len(numbers) - 1\n    while left < right:\n        curr_sum = numbers[left] + numbers[right]\n        if curr_sum == target:\n            return [left, right]\n        elif curr_sum < target:\n            left += 1\n        else:\n            right -= 1\n    return []`,
    initialPrompt: rawPrompt,
    chatExplanation: `Solved Two Sum on [${nums.join(', ')}] with target ${target} using two pointers.`,
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'numbers',
        values: [...nums],
        pointers: { left: 0, right: nums.length - 1 },
        highlights: { 0: 'comparing', [nums.length - 1]: 'comparing' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        target: { name: 'target', value: target, color: 'amber' },
        sum: { name: 'sum', value: nums[0] + nums[nums.length - 1], color: 'mint' },
      },
    },
    steps,
  };
}

// =========================================================================
// 6. LINKED LIST MIDDLE NODE (TORTOISE & HARE)
// =========================================================================
export function createDynamicLinkedListMiddleStoryboard(
  rawNums: number[],
  lang: 'python' | 'typescript' | 'cpp',
  rawPrompt: string
): TimelineStoryboard {
  const nums = rawNums.length >= 3 ? [...rawNums] : [10, 20, 30, 40, 50];
  const nodes: Record<string, any> = {};
  for (let i = 0; i < nums.length; i++) {
    const id = `node_${i + 1}`;
    const nextId = i < nums.length - 1 ? `node_${i + 2}` : null;
    nodes[id] = {
      id,
      value: nums[i],
      nextId,
      pointers: i === 0 ? ['slow', 'fast'] : [],
    };
  }

  const steps: TimelineStep[] = [
    {
      id: 'step-0',
      stepNumber: 0,
      codeLine: 2,
      title: 'Initialize Slow & Fast Pointers',
      narration: `Both slow and fast pointers start at head (${nums[0]}).`,
      variables: { slow: nums[0], fast: nums[0] },
      mutations: [
        { type: 'linked-list', action: { kind: 'set-node-pointers', nodeId: 'node_1', pointers: ['slow', 'fast'] } },
      ],
    },
  ];

  let slowIdx = 0;
  let fastIdx = 0;
  let stepCount = 1;

  while (fastIdx < nums.length - 1 && fastIdx + 1 < nums.length) {
    slowIdx += 1;
    fastIdx = Math.min(fastIdx + 2, nums.length - 1);
    const slowId = `node_${slowIdx + 1}`;
    const fastId = `node_${fastIdx + 1}`;

    steps.push({
      id: `step-${stepCount++}`,
      stepNumber: steps.length,
      codeLine: 5,
      title: `Step ${stepCount - 1}: Advance Pointers`,
      narration: `Slow advances 1 node to ${nums[slowIdx]}. Fast advances 2 nodes to ${nums[fastIdx]}.`,
      variables: { slow: nums[slowIdx], fast: nums[fastIdx] },
      mutations: [
        { type: 'linked-list', action: { kind: 'set-node-pointers', nodeId: `node_${slowIdx}`, pointers: [] } },
        { type: 'linked-list', action: { kind: 'set-node-pointers', nodeId: slowId, pointers: ['slow'] } },
        { type: 'linked-list', action: { kind: 'set-node-pointers', nodeId: fastId, pointers: ['fast'] } },
      ],
    });

    if (fastIdx >= nums.length - 2) break;
  }

  // Final Step: Middle Node Found
  const midId = `node_${slowIdx + 1}`;
  steps.push({
    id: `step-${stepCount}`,
    stepNumber: steps.length,
    codeLine: 7,
    title: 'Middle Node Found!',
    narration: `Fast reached the end of the list. Slow is at the middle node: ${nums[slowIdx]}!`,
    variables: { middle_node: nums[slowIdx] },
    mutations: [
      { type: 'linked-list', action: { kind: 'set-node-pointers', nodeId: midId, pointers: ['slow', 'mid'] } },
    ],
  });

  return {
    id: 'procedural-linked-list-middle',
    title: 'Find Middle Node of Linked List',
    badge: 'Fast & Slow Pointers',
    language: lang,
    fileName: lang === 'python' ? 'middle_node.py' : 'middle_node.ts',
    code: `def find_middle_node(head: ListNode) -> ListNode:\n    slow = head\n    fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n    return slow`,
    initialPrompt: rawPrompt,
    chatExplanation: `Found middle node of linked list (${nums.join(' -> ')}). Middle node is ${nums[slowIdx]}.`,
    initialState: {
      linkedListNodes: nodes,
      treeNodes: {},
      variables: {
        slow: { name: 'slow', value: nums[0], color: 'mint' },
        fast: { name: 'fast', value: nums[0], color: 'indigo' },
      },
    },
    steps,
  };
}

// =========================================================================
// 7. BST SEARCH STORYBOARD
// =========================================================================
export function createDynamicBstSearchStoryboard(
  target: number = 35,
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Search key in BST'
): TimelineStoryboard {
  const treeNodes: Record<string, any> = {
    node_50: { id: 'node_50', value: 50, leftId: 'node_30', rightId: 'node_70', parentId: null, highlight: 'default' },
    node_30: { id: 'node_30', value: 30, leftId: 'node_20', rightId: 'node_40', parentId: 'node_50', highlight: 'default' },
    node_70: { id: 'node_70', value: 70, leftId: 'node_60', rightId: 'node_80', parentId: 'node_50', highlight: 'default' },
    node_20: { id: 'node_20', value: 20, leftId: null, rightId: null, parentId: 'node_30', highlight: 'default' },
    node_40: { id: 'node_40', value: 40, leftId: null, rightId: null, parentId: 'node_30', highlight: 'default' },
    node_60: { id: 'node_60', value: 60, leftId: null, rightId: null, parentId: 'node_70', highlight: 'default' },
    node_80: { id: 'node_80', value: 80, leftId: null, rightId: null, parentId: 'node_70', highlight: 'default' },
  };

  const steps: TimelineStep[] = [
    {
      id: 'step-0',
      stepNumber: 0,
      codeLine: 2,
      title: `Search ${target} at Root (50)`,
      narration: `Start at root node 50. Compare target key ${target} with 50.`,
      variables: { target, curr: 50 },
      mutations: [
        { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'node_50', state: 'active' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'curr', value: 50, color: 'mint' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'target', value: target, color: 'amber' } },
      ],
    },
    {
      id: 'step-1',
      stepNumber: 1,
      codeLine: 4,
      title: `${target} < 50: Traverse Left`,
      narration: `Since ${target} < 50, move to left child node 30.`,
      variables: { target, curr: 30 },
      mutations: [
        { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'node_50', state: 'comparing' } },
        { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'node_30', state: 'active' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'curr', value: 30, color: 'mint' } },
      ],
    },
    {
      id: 'step-2',
      stepNumber: 2,
      codeLine: 6,
      title: `${target} > 30: Traverse Right`,
      narration: `Since ${target} > 30, move to right child node 40.`,
      variables: { target, curr: 40 },
      mutations: [
        { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'node_30', state: 'comparing' } },
        { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'node_40', state: target === 40 ? 'sorted' : 'active' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'curr', value: 40, color: 'mint' } },
      ],
    },
    {
      id: 'step-3',
      stepNumber: 3,
      codeLine: 8,
      title: 'Search Complete',
      narration: target === 40
        ? `Node with key ${target} successfully found!`
        : `Key ${target} is not in tree. Node 40 is a leaf node.`,
      variables: { target, result: target === 40 ? 'Found' : 'Not Found' },
      mutations: [
        { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'node_40', state: target === 40 ? 'sorted' : 'default' } },
      ],
    },
  ];

  return {
    id: 'procedural-bst-search',
    title: `BST Search (Key ${target})`,
    badge: 'Binary Search Tree',
    language: lang,
    fileName: lang === 'python' ? 'bst_search.py' : 'bst_search.ts',
    code: `def search_bst(root: TreeNode | None, target: int) -> TreeNode | None:\n    curr = root\n    while curr and curr.val != target:\n        if target < curr.val:\n            curr = curr.left\n        else:\n            curr = curr.right\n    return curr`,
    initialPrompt: rawPrompt,
    chatExplanation: `Visualized BST search for key ${target}. Stepped through tree branching comparisons.`,
    initialState: {
      linkedListNodes: {},
      treeNodes,
      variables: {
        target: { name: 'target', value: target, color: 'amber' },
        curr: { name: 'curr', value: 50, color: 'mint' },
      },
    },
    steps,
  };
}

// =========================================================================
// 8. BST FIND MINIMUM STORYBOARD
// =========================================================================
export function createDynamicBstFindMinStoryboard(
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Find minimum in BST'
): TimelineStoryboard {
  const treeNodes: Record<string, any> = {
    node_50: { id: 'node_50', value: 50, leftId: 'node_30', rightId: 'node_70', parentId: null, highlight: 'default' },
    node_30: { id: 'node_30', value: 30, leftId: 'node_20', rightId: 'node_40', parentId: 'node_50', highlight: 'default' },
    node_70: { id: 'node_70', value: 70, leftId: 'node_60', rightId: 'node_80', parentId: 'node_50', highlight: 'default' },
    node_20: { id: 'node_20', value: 20, leftId: null, rightId: null, parentId: 'node_30', highlight: 'default' },
    node_40: { id: 'node_40', value: 40, leftId: null, rightId: null, parentId: 'node_30', highlight: 'default' },
    node_60: { id: 'node_60', value: 60, leftId: null, rightId: null, parentId: 'node_70', highlight: 'default' },
    node_80: { id: 'node_80', value: 80, leftId: null, rightId: null, parentId: 'node_70', highlight: 'default' },
  };

  const steps: TimelineStep[] = [
    {
      id: 'step-0',
      stepNumber: 0,
      codeLine: 2,
      title: 'Start at Root Node (50)',
      narration: 'In a BST, all smaller values are in the left subtree. Start at root 50 and traverse left.',
      variables: { curr: 50 },
      mutations: [
        { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'node_50', state: 'active' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'curr', value: 50, color: 'mint' } },
      ],
    },
    {
      id: 'step-1',
      stepNumber: 1,
      codeLine: 3,
      title: 'Traverse Left to Node (30)',
      narration: 'Move to left child node 30.',
      variables: { curr: 30 },
      mutations: [
        { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'node_50', state: 'comparing' } },
        { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'node_30', state: 'active' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'curr', value: 30, color: 'mint' } },
      ],
    },
    {
      id: 'step-2',
      stepNumber: 2,
      codeLine: 3,
      title: 'Traverse Left to Node (20)',
      narration: 'Move to left child node 20. Node 20 has no left child: it is the leftmost node in the tree!',
      variables: { curr: 20 },
      mutations: [
        { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'node_30', state: 'comparing' } },
        { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'node_20', state: 'sorted' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'curr', value: 20, color: 'mint' } },
      ],
    },
    {
      id: 'step-3',
      stepNumber: 3,
      codeLine: 5,
      title: 'Minimum Found: 20',
      narration: 'Leftmost node reached. The minimum key in the BST is 20.',
      variables: { min_key: 20 },
      mutations: [
        { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'node_20', state: 'sorted' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'min_key', value: 20, color: 'mint' } },
      ],
    },
  ];

  return {
    id: 'procedural-bst-find-min',
    title: 'Find Minimum in BST',
    badge: 'Binary Search Tree',
    language: lang,
    fileName: lang === 'python' ? 'bst_find_min.py' : 'bst_find_min.ts',
    code: `def find_min_bst(root: TreeNode) -> int:\n    curr = root\n    while curr.left:\n        curr = curr.left\n    return curr.val`,
    initialPrompt: rawPrompt,
    chatExplanation: 'Found minimum node in BST by traversing to the leftmost child. Minimum is 20.',
    initialState: {
      linkedListNodes: {},
      treeNodes,
      variables: {
        curr: { name: 'curr', value: 50, color: 'mint' },
      },
    },
    steps,
  };
}

// =========================================================================
// 9. PRESET DELEGATES: BST Insert, Reverse List, QuickSort, BubbleSort
// =========================================================================
export function createDynamicBstInsertStoryboard(
  lang: 'python' | 'typescript' | 'cpp',
  rawPrompt: string
): TimelineStoryboard {
  const s = PRESET_SCENARIOS[2];
  return {
    ...s,
    language: lang,
    initialPrompt: rawPrompt,
    chatExplanation: "Here's a Binary Search Tree insertion algorithm. I've generated the code and rendered the deterministic in-order tree layout with dynamic connectors.",
  };
}

export function createDynamicReverseListStoryboard(
  _nums: number[],
  lang: 'python' | 'typescript' | 'cpp',
  rawPrompt: string
): TimelineStoryboard {
  const s = PRESET_SCENARIOS[1];
  return {
    ...s,
    language: lang,
    initialPrompt: rawPrompt,
    chatExplanation: "Here's an in-place solution for Reversing a Singly Linked List with dynamic pointer rewiring (prev, curr, next).",
  };
}

export function createDynamicQuickSortStoryboard(
  _nums: number[],
  lang: 'python' | 'typescript' | 'cpp',
  rawPrompt: string
): TimelineStoryboard {
  const s = PRESET_SCENARIOS[0];
  return {
    ...s,
    language: lang,
    initialPrompt: rawPrompt,
    chatExplanation: "Here's an in-place QuickSort partition solution with dual-pointer array visualization (i, j, and pivot).",
  };
}

export function createDynamicBinarySearchStoryboard(
  rawNums: number[],
  target: number = 42,
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Binary search on sorted array'
): TimelineStoryboard {
  const nums = rawNums.length >= 3 ? [...rawNums].sort((a, b) => a - b) : [3, 8, 15, 23, 42, 57, 88];
  const low = 0;
  const high = nums.length - 1;
  const mid = Math.floor((low + high) / 2);

  const code =
    lang === 'typescript'
      ? `function binarySearch(nums: number[], target: number): number {\n  let low = 0, high = nums.length - 1;\n  while (low <= high) {\n    const mid = Math.floor((low + high) / 2);\n    if (nums[mid] === target) return mid;\n    else if (nums[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;\n}`
      : `def binary_search(nums: list[int], target: int) -> int:\n    low, high = 0, len(nums) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1`;

  const steps: TimelineStep[] = [
    {
      id: 'step-0',
      stepNumber: 0,
      codeLine: 2,
      title: 'Initialize Binary Search Bounds',
      narration: `Set search bounds: low = 0 (${nums[0]}), high = ${high} (${nums[high]}). Mid is index ${mid} (${nums[mid]}). Target is ${target}.`,
      variables: { target, low, mid, high, 'nums[mid]': nums[mid] },
      mutations: [
        { type: 'array', action: { kind: 'move-pointer', name: 'low', toIndex: low } },
        { type: 'array', action: { kind: 'move-pointer', name: 'mid', toIndex: mid } },
        { type: 'array', action: { kind: 'move-pointer', name: 'high', toIndex: high } },
        { type: 'array', action: { kind: 'highlight-slots', indices: [mid], state: 'active' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'target', value: target, color: 'amber' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'low', value: low, color: 'indigo' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'mid', value: mid, color: 'purple' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'high', value: high, color: 'indigo' } },
      ],
    },
    {
      id: 'step-1',
      stepNumber: 1,
      codeLine: 4,
      title: 'Compare nums[mid] with Target',
      narration: `Checking nums[${mid}] (${nums[mid]}) vs target (${target}).`,
      variables: { target, low, mid, high, 'nums[mid]': nums[mid] },
      mutations: [
        { type: 'array', action: { kind: 'highlight-slots', indices: [mid], state: nums[mid] === target ? 'sorted' : 'comparing' } },
      ],
    },
    {
      id: 'step-2',
      stepNumber: 2,
      codeLine: 5,
      title: 'Search Step Complete',
      narration: nums.includes(target)
        ? `Target ${target} located at index ${nums.indexOf(target)}!`
        : `Binary search completed.`,
      variables: { target, result: nums.indexOf(target) },
      mutations: [
        { type: 'array', action: { kind: 'highlight-slots', indices: [nums.indexOf(target)].filter((i) => i >= 0), state: 'sorted' } },
      ],
    },
  ];

  return {
    id: 'procedural-binary-search',
    title: 'Binary Search',
    badge: 'Divide & Conquer',
    language: lang,
    fileName: lang === 'python' ? 'binary_search.py' : 'binary_search.ts',
    code,
    initialPrompt: rawPrompt,
    chatExplanation: `Visualized binary search on [${nums.join(', ')}] with target ${target}.`,
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'nums',
        values: [...nums],
        pointers: { low, mid, high },
        highlights: { [mid]: 'active' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        target: { name: 'target', value: target, color: 'amber' },
        low: { name: 'low', value: low, color: 'indigo' },
        mid: { name: 'mid', value: mid, color: 'purple' },
        high: { name: 'high', value: high, color: 'indigo' },
      },
    },
    steps,
  };
}

export function createDynamicBubbleSortStoryboard(
  rawNums: number[],
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Bubble sort array'
): TimelineStoryboard {
  const nums = rawNums.length >= 2 ? [...rawNums] : [5, 1, 4, 2, 8];
  return {
    id: 'procedural-bubble-sort',
    title: 'Bubble Sort Pass',
    badge: 'Sorting',
    language: lang,
    fileName: lang === 'python' ? 'bubble_sort.py' : 'bubble_sort.ts',
    code: `def bubble_sort(arr: list[int]):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]`,
    initialPrompt: rawPrompt,
    chatExplanation: `Visualized bubble sort on [${nums.join(', ')}].`,
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'arr',
        values: [...nums],
        pointers: { j: 0 },
        highlights: { 0: 'comparing', 1: 'comparing' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        j: { name: 'j', value: 0, color: 'indigo' },
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 4,
        title: 'Compare Adjacent Elements',
        narration: `Comparing arr[0] (${nums[0]}) and arr[1] (${nums[1]}).`,
        variables: { j: 0 },
        mutations: [
          { type: 'array', action: { kind: 'highlight-slots', indices: [0, 1], state: 'comparing' } },
        ],
      },
      {
        id: 'step-1',
        stepNumber: 1,
        codeLine: 5,
        title: 'Swap Elements if Needed',
        narration: nums[0] > nums[1] ? `Swapped ${nums[0]} and ${nums[1]}.` : `No swap needed.`,
        variables: { j: 0 },
        mutations: [
          nums[0] > nums[1]
            ? { type: 'array', action: { kind: 'swap-slots', indexA: 0, indexB: 1 } }
            : { type: 'array', action: { kind: 'highlight-slots', indices: [0, 1], state: 'sorted' } },
        ],
      },
      {
        id: 'step-2',
        stepNumber: 2,
        codeLine: 6,
        title: 'Pass Complete',
        narration: 'First bubble sort pass finished.',
        variables: { status: 'Pass Complete' },
        mutations: [
          { type: 'array', action: { kind: 'highlight-slots', indices: [nums.length - 1], state: 'sorted' } },
        ],
      },
    ],
  };
}

export function createDynamicForLoopStoryboard(
  rawNums: number[],
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Explain how this for loop works'
): TimelineStoryboard {
  const nums = rawNums.length >= 2 ? [...rawNums] : [10, 20, 30, 40];
  return {
    id: 'procedural-for-loop',
    title: 'For Loop Execution Walkthrough',
    badge: 'Loop Mechanics',
    language: lang,
    fileName: lang === 'python' ? 'loop.py' : 'loop.ts',
    code: `def process_loop(arr: list[int]) -> int:\n    total = 0\n    for i in range(len(arr)):\n        total += arr[i]\n    return total`,
    initialPrompt: rawPrompt,
    chatExplanation: `Here's an interactive step-by-step walkthrough of how this for loop operates.`,
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'arr',
        values: [...nums],
        pointers: { i: 0 },
        highlights: { 0: 'active' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        total: { name: 'total', value: 0, color: 'mint' },
        i: { name: 'i', value: 0, color: 'indigo' },
      },
      loop: {
        header: 'for i in range(len(arr))',
        conditionText: `i < ${nums.length} (True)`,
        currentIteration: 0,
        totalIterations: nums.length,
        isComplete: false,
        variableName: 'i',
        iterationPills: nums.map((_, idx) => `i = ${idx}`),
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 2,
        title: 'Loop Initialization',
        narration: 'Initialize accumulator variable total to 0. Loop index i starts at 0.',
        variables: { total: 0, i: 0 },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 0 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [0], state: 'active' } },
        ],
      },
      {
        id: 'step-1',
        stepNumber: 1,
        codeLine: 4,
        title: 'Add arr[0] to total',
        narration: `Add arr[0] (${nums[0]}) to total.`,
        variables: { total: nums[0], i: 0 },
        mutations: [
          { type: 'variable', action: { kind: 'set-variable', name: 'total', value: nums[0], color: 'mint' } },
        ],
      },
      {
        id: 'step-2',
        stepNumber: 2,
        codeLine: 5,
        title: 'Loop Complete',
        narration: 'Loop iteration finished.',
        variables: { total: nums.reduce((a, b) => a + b, 0), i: nums.length },
        mutations: [
          { type: 'loop', action: { kind: 'update-loop', iteration: nums.length, conditionText: 'Complete', isComplete: true } },
        ],
      },
    ],
  };
}

export function createDynamicReverseArrayStoryboard(
  rawNums: number[],
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Reverse array'
): TimelineStoryboard {
  const nums = rawNums.length >= 2 ? [...rawNums] : [1, 2, 3, 4, 5];
  const code =
    lang === 'typescript'
      ? `function reverseArray(arr: number[]): void {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    [arr[left], arr[right]] = [arr[right], arr[left]];
    left++;
    right--;
  }
}`
      : lang === 'cpp'
      ? `void reverseArray(std::vector<int>& arr) {
    int left = 0, right = arr.size() - 1;
    while (left < right) {
        std::swap(arr[left], arr[right]);
        left++;
        right--;
    }
}`
      : `def reverse_array(arr: list[int]) -> None:
    left, right = 0, len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1`;

  const working = [...nums];
  let left = 0;
  let right = working.length - 1;

  const steps: TimelineStep[] = [
    {
      id: 'step-0',
      stepNumber: 0,
      codeLine: 2,
      title: 'Initialize Left and Right Pointers',
      narration: `Set left pointer to index 0 (${nums[0]}) and right pointer to index ${right} (${nums[right]}).`,
      variables: { left, right },
      mutations: [
        { type: 'array', action: { kind: 'move-pointer', name: 'left', toIndex: left } },
        { type: 'array', action: { kind: 'move-pointer', name: 'right', toIndex: right } },
        { type: 'array', action: { kind: 'highlight-slots', indices: [left, right], state: 'active' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'left', value: left, color: 'indigo' } },
        { type: 'variable', action: { kind: 'set-variable', name: 'right', value: right, color: 'purple' } },
      ],
    },
  ];

  let stepCount = 1;
  while (left < right) {
    // Swap step
    const temp = working[left];
    working[left] = working[right];
    working[right] = temp;

    steps.push({
      id: `step-${stepCount++}`,
      stepNumber: stepCount - 1,
      codeLine: 4,
      title: `Swap Indices [${left}] and [${right}]`,
      narration: `Swap arr[${left}] (${working[right]}) with arr[${right}] (${working[left]}). Advance left to ${left + 1} and right to ${right - 1}.`,
      variables: { left, right },
      mutations: [
        { type: 'array', action: { kind: 'swap-slots', indexA: left, indexB: right } },
        { type: 'array', action: { kind: 'highlight-slots', indices: [left, right], state: 'swapped' } },
      ],
    });

    left++;
    right--;

    if (left <= right) {
      steps.push({
        id: `step-${stepCount++}`,
        stepNumber: stepCount - 1,
        codeLine: 3,
        title: `Advance Pointers: left = ${left}, right = ${right}`,
        narration:
          left < right
            ? `Pointers advanced to left = ${left} (${working[left]}) and right = ${right} (${working[right]}).`
            : `Pointers met at middle index ${left}. Array reversal complete.`,
        variables: { left, right },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'left', toIndex: Math.min(left, working.length - 1) } },
          { type: 'array', action: { kind: 'move-pointer', name: 'right', toIndex: Math.max(0, right) } },
          { type: 'variable', action: { kind: 'set-variable', name: 'left', value: left, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'right', value: right, color: 'purple' } },
        ],
      });
    }
  }

  // Final step
  steps.push({
    id: `step-${stepCount}`,
    stepNumber: stepCount,
    codeLine: 6,
    title: 'Array Reversal Complete',
    narration: `Successfully reversed the array in-place to [${working.join(', ')}].`,
    variables: { left, right },
    mutations: [
      {
        type: 'array',
        action: {
          kind: 'highlight-slots',
          indices: working.map((_, idx) => idx),
          state: 'sorted',
        },
      },
    ],
  });

  return {
    id: 'procedural-reverse-array',
    title: 'Reverse Array In-Place',
    badge: 'Two Pointers',
    language: lang,
    fileName: lang === 'python' ? 'reverse_array.py' : lang === 'typescript' ? 'reverse_array.ts' : 'reverse_array.cpp',
    code,
    initialPrompt: rawPrompt,
    chatExplanation: `Here's an optimal two-pointer solution to reverse the array in-place.`,
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'arr',
        values: [...nums],
        pointers: { left: 0, right: nums.length - 1 },
        highlights: { 0: 'active', [nums.length - 1]: 'active' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        left: { name: 'left', value: 0, color: 'indigo' },
        right: { name: 'right', value: nums.length - 1, color: 'purple' },
      },
    },
    steps,
  };
}

// =========================================================================
// 15. DEDICATED STACK STORYBOARD
// =========================================================================
export function createDynamicStackStoryboard(
  items: (number | string)[],
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Create a stack'
): TimelineStoryboard {
  const finalItems = items.length > 0 ? [...items] : [10, 20, 30, 40];
  const initialItems = finalItems.length > 1 ? finalItems.slice(0, -1) : [...finalItems];
  const lastItem = finalItems[finalItems.length - 1];

  return {
    id: 'procedural-stack-push',
    title: 'Stack Operations (LIFO)',
    badge: 'Stack',
    language: lang,
    fileName: lang === 'python' ? 'stack.py' : 'stack.ts',
    code: `class Stack:\n    def __init__(self):\n        self.items = [${initialItems.join(', ')}]\n    def push(self, val):\n        self.items.append(val)  # Pushed ${lastItem} to TOP\n    def pop(self):\n        return self.items.pop() if self.items else None`,
    initialPrompt: rawPrompt,
    chatExplanation: `Created stack with items [${initialItems.join(', ')}], and pushed ${lastItem} to the top.`,
    initialState: {
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        top: { name: 'top', value: String(lastItem), color: 'amber' },
        size: { name: 'size', value: finalItems.length, color: 'mint' },
      },
      stack: {
        id: 'dsa-main-stack',
        name: 'stack',
        items: [...finalItems],
        maxCapacity: 8,
        currentOperation: 'push',
      },
      array: {
        id: 'dsa-main-array',
        name: 'stack',
        values: finalItems.map((x) => (typeof x === 'number' ? x : 0)),
        pointers: { top: Math.max(0, finalItems.length - 1) },
        highlights: { [Math.max(0, finalItems.length - 1)]: 'active' },
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 2,
        title: 'Stack Initialized',
        narration: `Stack initialized with ${initialItems.length} elements.`,
        variables: { size: initialItems.length, top: String(initialItems[initialItems.length - 1]) },
        mutations: [],
      },
      {
        id: 'step-1',
        stepNumber: 1,
        codeLine: 5,
        title: `Push ${lastItem} to Top`,
        narration: `Pushed ${lastItem} onto top of the stack. Current size is ${finalItems.length}.`,
        variables: { size: finalItems.length, top: String(lastItem) },
        mutations: [
          { type: 'stack', action: { kind: 'peek-stack' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'top', value: String(lastItem), color: 'amber' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'size', value: finalItems.length, color: 'mint' } },
        ],
      },
    ],
  };
}

// =========================================================================
// 16. CIRCULAR QUEUE STORYBOARD
// =========================================================================
export function createDynamicCircularQueueStoryboard(
  items: (number | string)[],
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Create a circular queue'
): TimelineStoryboard {
  const raw = items.length > 0 ? items : [10, 20, 30];
  const cap = 5;
  const queueItems: (number | string | null)[] = Array.from({ length: cap }, (_, i) => raw[i] ?? null);

  return {
    id: 'procedural-circular-queue',
    title: 'Circular Queue (Ring Buffer)',
    badge: 'Circular Queue',
    language: lang,
    fileName: lang === 'python' ? 'circular_queue.py' : 'circular_queue.ts',
    code: `class CircularQueue:\n    def __init__(self, k = ${cap}):\n        self.queue = [None] * k\n        self.front = 0\n        self.rear = ${raw.length - 1}\n        self.k = k\n    def enqueue(self, val):\n        self.rear = (self.rear + 1) % self.k\n        self.queue[self.rear] = val`,
    initialPrompt: rawPrompt,
    chatExplanation: `Created circular queue with capacity ${cap} and wrap-around modulo pointers.`,
    initialState: {
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        front: { name: 'front', value: 0, color: 'mint' },
        rear: { name: 'rear', value: raw.length - 1, color: 'purple' },
        capacity: { name: 'capacity', value: cap, color: 'indigo' },
      },
      queue: {
        id: 'dsa-main-queue',
        name: 'Circular Queue',
        items: queueItems,
        front: 0,
        rear: raw.length - 1,
        capacity: cap,
        isCircular: true,
        currentOperation: 'idle',
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 2,
        title: 'Circular Queue Initialized',
        narration: `Circular buffer initialized with capacity ${cap}. Front is at 0 and rear is at ${raw.length - 1}.`,
        variables: { front: 0, rear: raw.length - 1, capacity: cap },
        mutations: [],
      },
    ],
  };
}

// =========================================================================
// 17. DOUBLY LINKED LIST REVERSAL STORYBOARD
// =========================================================================
export function createDynamicReverseDoublyLinkedListStoryboard(
  rawNums: number[],
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Reverse doubly linked list'
): TimelineStoryboard {
  const nums = rawNums.length >= 2 ? rawNums : [10, 20, 30];
  const nodeDict: Record<string, any> = {};

  nums.forEach((val, idx) => {
    const id = `node-${idx + 1}`;
    nodeDict[id] = {
      id,
      value: val,
      nextId: idx < nums.length - 1 ? `node-${idx + 2}` : null,
      prevId: idx > 0 ? `node-${idx}` : null,
      pointers: idx === 0 ? ['head'] : idx === nums.length - 1 ? ['tail'] : [],
    };
  });

  return {
    id: 'procedural-reverse-doubly-linked-list',
    title: 'Reverse Doubly Linked List',
    badge: 'Doubly Linked List',
    language: lang,
    fileName: lang === 'python' ? 'reverse_dll.py' : 'reverse_dll.ts',
    code: `def reverse_doubly_linked_list(head):\n    curr = head\n    temp = None\n    while curr:\n        temp = curr.prev\n        curr.prev = curr.next\n        curr.next = temp\n        curr = curr.prev\n    return temp.prev if temp else head`,
    initialPrompt: rawPrompt,
    chatExplanation: `Here's an in-place reversal of a Doubly Linked List by swapping prev and next pointers.`,
    initialState: {
      linkedListNodes: nodeDict,
      treeNodes: {},
      variables: {
        curr: { name: 'curr', value: 'node-1', color: 'indigo' },
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 2,
        title: 'Initialize Reversal Pointers',
        narration: 'Set curr to head node. We iterate through the list swapping prev and next pointers of each node.',
        variables: { curr: 'node-1' },
        mutations: [],
      },
    ],
  };
}

// =========================================================================
// 18. CIRCULAR LINKED LIST STORYBOARD
// =========================================================================
export function createDynamicCircularLinkedListStoryboard(
  rawItems: (number | string)[],
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Create a circular linked list'
): TimelineStoryboard {
  const items = rawItems.length >= 2 ? rawItems : [1, 2, 3, 4];
  const nodeDict: Record<string, any> = {};

  items.forEach((val, idx) => {
    const id = `node-${idx + 1}`;
    nodeDict[id] = {
      id,
      value: val,
      nextId: idx < items.length - 1 ? `node-${idx + 2}` : `node-1`,
      isCircular: idx === items.length - 1,
      pointers: idx === 0 ? ['head'] : idx === items.length - 1 ? ['tail'] : [],
    };
  });

  return {
    id: 'procedural-circular-linked-list',
    title: 'Circular Linked List',
    badge: 'Circular Linked List',
    language: lang,
    fileName: lang === 'python' ? 'circular_list.py' : 'circular_list.ts',
    code: `class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n# Tail node links directly back to head forming a closed cycle`,
    initialPrompt: rawPrompt,
    chatExplanation: `Created circular linked list where tail node links directly back to head node without terminating at NULL.`,
    initialState: {
      linkedListNodes: nodeDict,
      treeNodes: {},
      variables: {
        head: { name: 'head', value: String(items[0]), color: 'indigo' },
        tail: { name: 'tail', value: String(items[items.length - 1]), color: 'purple' },
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 2,
        title: 'Circular Linked List Created',
        narration: `Circular linked list created with ${items.length} nodes. Tail points back to head.`,
        variables: { head: String(items[0]), tail: String(items[items.length - 1]) },
        mutations: [],
      },
    ],
  };
}

// =========================================================================
// 19. AVL TREE INSERTION & ROTATION STORYBOARD
// =========================================================================
export function createDynamicAvlTreeStoryboard(
  _val: number = 25,
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Insert 25 into AVL tree'
): TimelineStoryboard {
  return {
    id: 'procedural-avl-tree',
    title: 'AVL Tree Self-Balancing Insertion',
    badge: 'AVL Tree',
    language: lang,
    fileName: lang === 'python' ? 'avl_tree.py' : 'avl_tree.ts',
    code: `def insert(node, key):\n    if not node: return Node(key)\n    # Calculate balance_factor = height(left) - height(right)\n    # If balance_factor > 1: perform Right Rotation (LL)\n    # If balance_factor < -1: perform Left Rotation (RR)`,
    initialPrompt: rawPrompt,
    chatExplanation: `Demonstrating AVL self-balancing insertion with balance factor detection and rotation.`,
    initialState: {
      linkedListNodes: {},
      treeNodes: {
        '30': { id: '30', value: 30, leftId: '20', rightId: '40', parentId: null, highlight: 'default', height: 2, balanceFactor: 0 },
        '20': { id: '20', value: 20, leftId: '10', rightId: null, parentId: '30', highlight: 'default', height: 2, balanceFactor: 1 },
        '10': { id: '10', value: 10, leftId: null, rightId: null, parentId: '20', highlight: 'default', height: 1, balanceFactor: 0 },
        '40': { id: '40', value: 40, leftId: null, rightId: null, parentId: '30', highlight: 'default', height: 1, balanceFactor: 0 },
      },
      variables: {
        balance_factor: { name: 'balance_factor', value: '+1', color: 'mint' },
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 2,
        title: 'Insert Key into AVL Tree',
        narration: 'Insert node into BST position and calculate balance factors along the ancestor path.',
        variables: { balance_factor: '+1' },
        mutations: [],
      },
      {
        id: 'step-1',
        stepNumber: 1,
        codeLine: 4,
        title: 'Right Rotation to Restore Balance',
        narration: 'Balance factor restored to 0 via rotation.',
        variables: { balance_factor: '0' },
        mutations: [
          { type: 'variable', action: { kind: 'set-variable', name: 'balance_factor', value: '0', color: 'mint' } },
        ],
      },
    ],
  };
}

// =========================================================================
// 20. MIN HEAP DUAL REPRESENTATION STORYBOARD
// =========================================================================
export function createDynamicMinHeapStoryboard(
  rawNums: number[] = [],
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Build a min heap'
): TimelineStoryboard {
  const nums = rawNums && rawNums.length >= 3 ? rawNums : [10, 20, 30, 40, 50];

  return {
    id: 'procedural-min-heap',
    title: 'Min Heap (Tree & Array Dual View)',
    badge: 'Binary Heap',
    language: lang,
    fileName: lang === 'python' ? 'min_heap.py' : 'min_heap.ts',
    code: `def heapify(arr, n, i):\n    smallest = i\n    left = 2 * i + 1\n    right = 2 * i + 2\n    if left < n and arr[left] < arr[smallest]: smallest = left\n    if right < n and arr[right] < arr[smallest]: smallest = right\n    if smallest != i: arr[i], arr[smallest] = arr[smallest], arr[i]`,
    initialPrompt: rawPrompt,
    chatExplanation: `Visualizing Min Heap with synchronized tree nodes and array indices (left = 2i+1, right = 2i+2).`,
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'heap_arr',
        values: [...nums],
        pointers: { root: 0 },
        highlights: { 0: 'active' },
      },
      linkedListNodes: {},
      treeNodes: {
        'h-0': { id: 'h-0', value: nums[0], leftId: 'h-1', rightId: 'h-2', parentId: null, highlight: 'active', heapIndex: 0 },
        'h-1': { id: 'h-1', value: nums[1], leftId: nums.length > 3 ? 'h-3' : null, rightId: nums.length > 4 ? 'h-4' : null, parentId: 'h-0', highlight: 'default', heapIndex: 1 },
        'h-2': { id: 'h-2', value: nums[2], leftId: null, rightId: null, parentId: 'h-0', highlight: 'default', heapIndex: 2 },
      },
      variables: {
        min_elem: { name: 'min_elem', value: nums[0], color: 'mint' },
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 2,
        title: 'Heapify Root Element',
        narration: `Min heap property satisfied: parent arr[0] (${nums[0]}) is smaller than all children.`,
        variables: { min_elem: nums[0] },
        mutations: [],
      },
    ],
  };
}

// =========================================================================
// 21. GRAPH & DIJKSTRA STORYBOARD
// =========================================================================
export function createDynamicDijkstraStoryboard(
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Dijkstra shortest path'
): TimelineStoryboard {
  return {
    id: 'procedural-dijkstra',
    title: "Dijkstra's Shortest Path Algorithm",
    badge: 'Graph Algorithm',
    language: lang,
    fileName: lang === 'python' ? 'dijkstra.py' : 'dijkstra.ts',
    code: `import heapq\ndef dijkstra(graph, start):\n    dist = {node: float('inf') for node in graph}\n    dist[start] = 0\n    pq = [(0, start)]\n    while pq:\n        d, u = heapq.heappop(pq)\n        for v, weight in graph[u]:\n            if dist[u] + weight < dist[v]:\n                dist[v] = dist[u] + weight\n                heapq.heappush(pq, (dist[v], v))\n    return dist`,
    initialPrompt: rawPrompt,
    chatExplanation: `Visualizing Dijkstra's algorithm with weighted graph edges, distance variables, and priority queue exploration.`,
    initialState: {
      linkedListNodes: {},
      treeNodes: {},
      graph: {
        id: 'main-graph',
        name: 'Weighted Network',
        nodes: {
          A: { id: 'A', label: 'A', x: 80, y: 80, distance: 0, visited: true, highlight: 'active' },
          B: { id: 'B', label: 'B', x: 260, y: 80, distance: 5, visited: false },
          C: { id: 'C', label: 'C', x: 80, y: 240, distance: 2, visited: false },
          D: { id: 'D', label: 'D', x: 260, y: 240, distance: '∞', visited: false },
        },
        edges: [
          { id: 'e-AB', from: 'A', to: 'B', weight: 5, directed: false },
          { id: 'e-AC', from: 'A', to: 'C', weight: 2, directed: false },
          { id: 'e-CD', from: 'C', to: 'D', weight: 4, directed: false },
          { id: 'e-BD', from: 'B', to: 'D', weight: 3, directed: false },
        ],
      },
      variables: {
        current: { name: 'current', value: 'A', color: 'indigo' },
        dist_A: { name: 'dist_A', value: 0, color: 'mint' },
        dist_C: { name: 'dist_C', value: 2, color: 'amber' },
        dist_B: { name: 'dist_B', value: 5, color: 'amber' },
        dist_D: { name: 'dist_D', value: '∞', color: 'purple' },
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 4,
        title: 'Start Dijkstra at Source Node A',
        narration: 'Set distance to source A = 0 and all other nodes to infinity.',
        variables: { current: 'A', dist_A: 0 },
        mutations: [],
      },
    ],
  };
}

// =========================================================================
// 22. BFS & DFS STORYBOARD (REUSES QUEUE / STACK)
// =========================================================================
export function createDynamicBfsStoryboard(
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Run BFS on graph'
): TimelineStoryboard {
  return {
    id: 'procedural-bfs',
    title: 'Breadth-First Search (BFS)',
    badge: 'Graph Traversal',
    language: lang,
    fileName: lang === 'python' ? 'bfs.py' : 'bfs.ts',
    code: `from collections import deque\ndef bfs(graph, start):\n    visited = set([start])\n    queue = deque([start])\n    while queue:\n        node = queue.popleft()\n        for neighbor in graph[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(neighbor)`,
    initialPrompt: rawPrompt,
    chatExplanation: `BFS exploration using Queue component for the frontier and visited sets.`,
    initialState: {
      linkedListNodes: {},
      treeNodes: {},
      graph: {
        id: 'bfs-graph',
        name: 'Graph',
        nodes: {
          A: { id: 'A', label: 'A', x: 80, y: 80, visited: true, highlight: 'active' },
          B: { id: 'B', label: 'B', x: 240, y: 80, visited: false },
          C: { id: 'C', label: 'C', x: 80, y: 220, visited: false },
        },
        edges: [
          { id: 'e-1', from: 'A', to: 'B' },
          { id: 'e-2', from: 'A', to: 'C' },
        ],
      },
      queue: {
        id: 'bfs-queue',
        name: 'BFS Queue',
        items: ['A', 'B', 'C'],
        front: 0,
        rear: 2,
      },
      variables: {
        visited: { name: 'visited', value: '{A, B, C}', color: 'mint' },
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 4,
        title: 'Enqueue Start Node',
        narration: 'Push start node into the BFS queue and mark visited.',
        variables: { visited: '{A}' },
        mutations: [],
      },
    ],
  };
}

export function createDynamicDfsStoryboard(
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Run DFS on graph'
): TimelineStoryboard {
  return {
    id: 'procedural-dfs',
    title: 'Depth-First Search (DFS)',
    badge: 'Graph Traversal',
    language: lang,
    fileName: lang === 'python' ? 'dfs.py' : 'dfs.ts',
    code: `def dfs(graph, node, visited=None):\n    if visited is None: visited = set()\n    visited.add(node)\n    for neighbor in graph[node]:\n        if neighbor not in visited:\n            dfs(graph, neighbor, visited)`,
    initialPrompt: rawPrompt,
    chatExplanation: `DFS exploration using Stack component for active path back-tracking.`,
    initialState: {
      linkedListNodes: {},
      treeNodes: {},
      graph: {
        id: 'dfs-graph',
        name: 'Graph',
        nodes: {
          A: { id: 'A', label: 'A', x: 80, y: 80, visited: true, highlight: 'active' },
          B: { id: 'B', label: 'B', x: 240, y: 80, visited: false },
          C: { id: 'C', label: 'C', x: 80, y: 220, visited: false },
        },
        edges: [
          { id: 'e-1', from: 'A', to: 'B' },
          { id: 'e-2', from: 'A', to: 'C' },
        ],
      },
      stack: {
        id: 'dfs-stack',
        name: 'DFS Call Stack',
        items: ['A'],
      },
      variables: {
        visited: { name: 'visited', value: '{A}', color: 'mint' },
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 3,
        title: 'Visit Node A',
        narration: 'Push node A onto traversal stack.',
        variables: { visited: '{A}' },
        mutations: [],
      },
    ],
  };
}

// =========================================================================
// 23. SLIDING WINDOW STORYBOARD
// =========================================================================
export function createDynamicSlidingWindowStoryboard(
  rawNums: number[] = [],
  k: number = 3,
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Sliding window max sum'
): TimelineStoryboard {
  const nums = rawNums && rawNums.length >= k ? rawNums : [2, 1, 5, 1, 3, 2];
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += nums[i];

  return {
    id: 'procedural-sliding-window',
    title: 'Sliding Window (Subarray Size k)',
    badge: 'Sliding Window',
    language: lang,
    fileName: lang === 'python' ? 'sliding_window.py' : 'sliding_window.ts',
    code: `def max_sub_array_of_size_k(k, arr):\n    max_sum = 0\n    window_sum = sum(arr[:k])\n    for window_end in range(k, len(arr)):\n        window_sum += arr[window_end] - arr[window_end - k]\n        max_sum = max(max_sum, window_sum)\n    return max_sum`,
    initialPrompt: rawPrompt,
    chatExplanation: `Visualizing sliding window of fixed size ${k} maintaining a running windowSum.`,
    initialState: {
      array: {
        id: 'dsa-main-array',
        name: 'arr',
        values: [...nums],
        pointers: { left: 0, right: k - 1 },
        highlights: { 0: 'active', 1: 'active', 2: 'active' },
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        window_sum: { name: 'window_sum', value: windowSum, color: 'mint' },
        k: { name: 'k', value: k, color: 'indigo' },
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 3,
        title: `Initialize Window [0..${k - 1}]`,
        narration: `Compute initial window sum for first ${k} elements: ${windowSum}.`,
        variables: { window_sum: windowSum },
        mutations: [],
      },
    ],
  };
}

// =========================================================================
// 24. DYNAMIC PROGRAMMING & RECURSION STORYBOARDS
// =========================================================================
export function createDynamicDpStoryboard(
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = '0/1 Knapsack DP'
): TimelineStoryboard {
  return {
    id: 'procedural-dp-table',
    title: 'Dynamic Programming (0/1 Knapsack)',
    badge: 'Dynamic Programming',
    language: lang,
    fileName: lang === 'python' ? 'knapsack_dp.py' : 'knapsack_dp.ts',
    code: `def knapsack(weights, values, W):\n    n = len(weights)\n    dp = [[0] * (W + 1) for _ in range(n + 1)]\n    for i in range(1, n + 1):\n        for w in range(1, W + 1):\n            if weights[i-1] <= w:\n                dp[i][w] = max(values[i-1] + dp[i-1][w-weights[i-1]], dp[i-1][w])\n            else:\n                dp[i][w] = dp[i-1][w]\n    return dp[n][W]`,
    initialPrompt: rawPrompt,
    chatExplanation: `Visualizing 2D Dynamic Programming table with state dependencies and optimal subproblem caching.`,
    initialState: {
      linkedListNodes: {},
      treeNodes: {},
      dpTable: {
        id: 'main-dp',
        name: 'Knapsack DP Table',
        rows: ['item 0', 'item 1', 'item 2'],
        cols: ['w=0', 'w=1', 'w=2', 'w=3'],
        cells: [
          [0, 0, 0, 0],
          [0, 10, 10, 10],
          [0, 10, 15, 25],
        ],
        activeCell: { row: 2, col: 3 },
      },
      variables: {
        'dp[2][3]': { name: 'dp[2][3]', value: 25, color: 'mint' },
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 5,
        title: 'Calculate Optimal Substructure',
        narration: 'Compute dp[i][w] by taking maximum of including or excluding item.',
        variables: { 'dp[2][3]': 25 },
        mutations: [],
      },
    ],
  };
}

export function createDynamicRecursionStoryboard(
  n: number = 4,
  lang: 'python' | 'typescript' | 'cpp' = 'python',
  rawPrompt: string = 'Factorial recursion'
): TimelineStoryboard {
  const targetN = Math.max(1, Math.min(n || 4, 7));
  const frames: CallFrameEntity[] = [];
  const stackItems: string[] = [];
  for (let i = targetN; i >= 1; i--) {
    frames.push({
      id: `f-${i}`,
      functionName: `fact(${i})`,
      args: { n: i },
      returnValue: i === 1 ? 1 : undefined,
      status: i === 1 ? 'returning' : 'active',
    });
    stackItems.push(`fact(${i})`);
  }

  return {
    id: 'procedural-recursion',
    title: `Recursion Call Stack (Factorial ${targetN})`,
    badge: 'Recursion',
    language: lang,
    fileName: lang === 'python' ? 'factorial.py' : 'factorial.ts',
    code: `def factorial(n):\n    if n <= 1: return 1\n    return n * factorial(n - 1)  # Push call frame`,
    initialPrompt: rawPrompt,
    chatExplanation: `Visualizing recursive function calls with active call-stack frames and returns.`,
    initialState: {
      linkedListNodes: {},
      treeNodes: {},
      callStack: {
        id: 'main-call-stack',
        frames,
      },
      stack: {
        id: 'dsa-main-stack',
        name: 'Call Stack',
        items: stackItems,
      },
      variables: {
        active_frame: { name: 'active_frame', value: 'fact(1)', color: 'mint' },
      },
    },
    steps: [
      {
        id: 'step-0',
        stepNumber: 0,
        codeLine: 2,
        title: 'Base Case Reached: fact(1)',
        narration: 'Base case n=1 reached. Begins unwinding call stack by returning 1.',
        variables: { active_frame: 'fact(1)' },
        mutations: [],
      },
    ],
  };
}


