import type { TimelineStoryboard } from '../types/timeline.ts';
import {
  createDynamicSecondMaxStoryboard,
  createDynamicFindMaxStoryboard,
  createDynamicSecondMinStoryboard,
  createDynamicFindMinStoryboard,
  createDynamicTwoSumStoryboard,
  createDynamicLinkedListMiddleStoryboard,
  createDynamicBstSearchStoryboard,
  createDynamicBstFindMinStoryboard,
  createDynamicBstInsertStoryboard,
  createDynamicReverseListStoryboard,
  createDynamicQuickSortStoryboard,
  createDynamicBinarySearchStoryboard,
  createDynamicBubbleSortStoryboard,
  createDynamicForLoopStoryboard,
  createDynamicReverseArrayStoryboard,
  createDynamicStackStoryboard,
  createDynamicCircularQueueStoryboard,
  createDynamicReverseDoublyLinkedListStoryboard,
  createDynamicCircularLinkedListStoryboard,
  createDynamicAvlTreeStoryboard,
  createDynamicMinHeapStoryboard,
  createDynamicDijkstraStoryboard,
  createDynamicBfsStoryboard,
  createDynamicDfsStoryboard,
  createDynamicSlidingWindowStoryboard,
  createDynamicDpStoryboard,
  createDynamicRecursionStoryboard,
} from './dynamicAlgorithmStoryboards.ts';

export type DsaStructureType =
  | 'array'
  | 'linked-list'
  | 'doubly-linked-list'
  | 'circular-linked-list'
  | 'tree'
  | 'stack'
  | 'queue'
  | 'circular-queue'
  | 'graph'
  | 'hash-table'
  | 'heap'
  | 'variable';

export type DsaAlgorithmType =
  | 'find-max'
  | 'find-second-max'
  | 'find-min'
  | 'find-second-min'
  | 'two-sum'
  | 'binary-search'
  | 'bubble-sort'
  | 'reverse-array'
  | 'quicksort'
  | 'reverse-linked-list'
  | 'reverse-doubly-linked-list'
  | 'linked-list-middle'
  | 'bst-insert'
  | 'bst-search'
  | 'bst-find-min'
  | 'avl-insert'
  | 'heapify'
  | 'dijkstra'
  | 'bfs'
  | 'dfs'
  | 'sliding-window'
  | 'dynamic-programming'
  | 'recursion-factorial'
  | 'for-loop-traversal'
  | 'linear-search';

export type DsaIntent =
  | {
      kind: 'create-structure';
      structureType: DsaStructureType;
      name?: string;
      values?: (number | string)[];
      rawPrompt: string;
    }
  | {
      kind: 'solve-algorithm';
      algorithm: DsaAlgorithmType;
      inputArray?: number[];
      target?: number;
      rawPrompt: string;
    }
  | {
      kind: 'general-query';
      rawPrompt: string;
    };

/**
 * Extracts numbers from text in flexible formats:
 * - [10, 6, 8, 9, 10] or [10,6,8,9,10]
 * - {10, 6, 8, 9, 10}
 * - 10, 6, 8, 9, 10
 */
export function extractNumbers(text: string): number[] {
  // 1. Bracket format: [10, 6, 8, 9, 10]
  const bracketMatch = text.match(/\[([\d\s,.-]+)\]/);
  if (bracketMatch) {
    const nums = bracketMatch[1]
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map(Number)
      .filter((n) => !isNaN(n));
    if (nums.length > 0) return nums;
  }

  // 2. Curly brace format: {10, 6, 8, 9, 10}
  const braceMatch = text.match(/\{([\d\s,.-]+)\}/);
  if (braceMatch) {
    const nums = braceMatch[1]
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map(Number)
      .filter((n) => !isNaN(n));
    if (nums.length > 0) return nums;
  }

  // 3. Comma-separated numbers after keyword: array 10, 6, 8, 9, 10
  const commaMatch = text.match(/(?:array|elements|values|nodes|with|of|on)?\s*(-?\d+(?:\s*,\s*-?\d+)+)/i);
  if (commaMatch) {
    const nums = commaMatch[1]
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map(Number)
      .filter((n) => !isNaN(n));
    if (nums.length > 0) return nums;
  }

  return [];
}

/**
 * Extracts elements for stacks/queues (supports numbers or alphanumeric characters: A, B, C or 1, 2, 3)
 */
export function extractElements(text: string): (number | string)[] {
  let elems: (number | string)[] = [];

  // 1. Check bracket match first to isolate the initial collection
  const bracketMatch = text.match(/\[([^\]]+)\]/);
  if (bracketMatch) {
    elems = bracketMatch[1]
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((tok) => {
        const n = Number(tok);
        return isNaN(n) ? tok : n;
      });
  } else {
    // 2. Try raw numbers
    const nums = extractNumbers(text);
    if (nums.length > 0) {
      elems = [...nums];
    } else {
      // 3. Look after keyword: with, containing, has, elements, of, :
      const keywordMatch = text.match(/(?:with|containing|elements|of|:)\s+([a-zA-Z0-9_\s,.-]+)$/i);
      if (keywordMatch) {
        const rawTokens = keywordMatch[1]
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !['and', 'items'].includes(s.toLowerCase()));

        if (rawTokens.length > 1 && (rawTokens[0].toLowerCase() === 'a' || rawTokens[0].toLowerCase() === 'an') && rawTokens[1].length > 1) {
          rawTokens.shift();
        }

        elems = rawTokens.map((tok) => {
          const n = Number(tok);
          return isNaN(n) ? tok : n;
        });
      }
    }
  }

  // 4. Check if prompt specifies an additional push/add/append
  const pushMatch = text.match(/(?:push|enqueue|append|add)\s+(-?\d+|[a-zA-Z0-9_]+)/i);
  if (pushMatch) {
    const rawVal = pushMatch[1];
    const val = !isNaN(Number(rawVal)) ? Number(rawVal) : rawVal;
    if (!elems.includes(val)) {
      elems.push(val);
    }
  }

  return elems;
}

/**
 * Parses user natural language query into a strongly typed DSA Intent IR.
 */
export function parseDsaIntent(prompt: string): DsaIntent {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  const embeddedNumbers = extractNumbers(p);

  // 0. NEW ADVANCED STRUCTURES & ALGORITHMS (HIGHEST SPECIFICITY)
  if (lower.includes('circular queue') || lower.includes('ring buffer')) {
    const elems = extractElements(p);
    return {
      kind: 'create-structure',
      structureType: 'circular-queue',
      values: elems.length > 0 ? elems : [10, 20, 30],
      rawPrompt: prompt,
    };
  }

  if (lower.includes('doubly') || lower.includes('dll')) {
    if (lower.includes('reverse')) {
      return {
        kind: 'solve-algorithm',
        algorithm: 'reverse-doubly-linked-list',
        inputArray: embeddedNumbers.length > 0 ? embeddedNumbers : undefined,
        rawPrompt: prompt,
      };
    }
    return {
      kind: 'create-structure',
      structureType: 'doubly-linked-list',
      values: embeddedNumbers.length > 0 ? embeddedNumbers : [10, 20, 30],
      rawPrompt: prompt,
    };
  }

  if (lower.includes('circular') && (lower.includes('list') || lower.includes('linked'))) {
    return {
      kind: 'create-structure',
      structureType: 'circular-linked-list',
      values: embeddedNumbers.length > 0 ? embeddedNumbers : [1, 2, 3, 4],
      rawPrompt: prompt,
    };
  }

  if (lower.includes('avl')) {
    const keyMatch = lower.match(/(?:insert|key|add)\s*(-?\d+)/i) || lower.match(/(-?\d+)/);
    const target = keyMatch ? Number(keyMatch[1]) : 25;
    return {
      kind: 'solve-algorithm',
      algorithm: 'avl-insert',
      target: isNaN(target) ? 25 : target,
      rawPrompt: prompt,
    };
  }

  if (lower.includes('heap') || lower.includes('priority queue') || lower.includes('heapify')) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'heapify',
      inputArray: embeddedNumbers.length > 0 ? embeddedNumbers : undefined,
      rawPrompt: prompt,
    };
  }

  if (lower.includes('dijkstra') || (lower.includes('shortest path') && !lower.includes('bfs'))) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'dijkstra',
      rawPrompt: prompt,
    };
  }

  if (lower.includes('bfs') || lower.includes('breadth-first') || lower.includes('breadth first')) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'bfs',
      rawPrompt: prompt,
    };
  }

  if (lower.includes('dfs') || lower.includes('depth-first') || lower.includes('depth first')) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'dfs',
      rawPrompt: prompt,
    };
  }

  if (lower.includes('sliding window') || lower.includes('max sum subarray')) {
    const kMatch = lower.match(/(?:size|k|window)\s*(?:of|=|:)?\s*(\d+)/i);
    const target = kMatch ? Number(kMatch[1]) : 3;
    return {
      kind: 'solve-algorithm',
      algorithm: 'sliding-window',
      inputArray: embeddedNumbers.length > 0 ? embeddedNumbers : undefined,
      target,
      rawPrompt: prompt,
    };
  }

  if (lower.includes('dynamic programming') || lower.includes('knapsack') || lower.includes(' dp') || lower.startsWith('dp')) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'dynamic-programming',
      rawPrompt: prompt,
    };
  }

  if (lower.includes('recursion') || lower.includes('factorial') || lower.includes('call stack')) {
    const nMatch = lower.match(/(?:factorial|n\s*=|n\s*is)\s*(\d+)/i) || lower.match(/(-?\d+)/);
    const target = nMatch ? Number(nMatch[1]) : 4;
    return {
      kind: 'solve-algorithm',
      algorithm: 'recursion-factorial',
      target: isNaN(target) ? 4 : target,
      rawPrompt: prompt,
    };
  }

  // 1. Check for Second Maximum BEFORE general Maximum
  const isSecondMax =
    lower.includes('second max') ||
    lower.includes('second-max') ||
    lower.includes('second largest') ||
    lower.includes('second-largest') ||
    lower.includes('second highest') ||
    lower.includes('second-highest') ||
    lower.includes('2nd max') ||
    lower.includes('2nd largest');

  if (isSecondMax) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'find-second-max',
      inputArray: embeddedNumbers.length > 0 ? embeddedNumbers : undefined,
      rawPrompt: prompt,
    };
  }

  // 2. Check for Second Minimum BEFORE general Minimum
  const isSecondMin =
    lower.includes('second min') ||
    lower.includes('second-min') ||
    lower.includes('second smallest') ||
    lower.includes('second-smallest') ||
    lower.includes('second lowest') ||
    lower.includes('2nd min') ||
    lower.includes('2nd smallest');

  if (isSecondMin) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'find-second-min',
      inputArray: embeddedNumbers.length > 0 ? embeddedNumbers : undefined,
      rawPrompt: prompt,
    };
  }

  // 3. Two Sum / Pair Sum
  const isTwoSum =
    lower.includes('two sum') ||
    lower.includes('2 sum') ||
    lower.includes('pair sum') ||
    (lower.includes('target') && (lower.includes('pair') || lower.includes('sum')));

  if (isTwoSum) {
    const targetMatch = lower.match(/(?:target|sum)\s*(?:is|=|:)?\s*(-?\d+)/);
    const target = targetMatch ? Number(targetMatch[1]) : 9;
    return {
      kind: 'solve-algorithm',
      algorithm: 'two-sum',
      inputArray: embeddedNumbers.length > 0 ? embeddedNumbers : undefined,
      target,
      rawPrompt: prompt,
    };
  }

  // 4. Linked List Middle Node (Tortoise & Hare)
  const isListMiddle =
    (lower.includes('middle') || lower.includes('mid node') || lower.includes('center')) &&
    (lower.includes('list') || lower.includes('linked') || lower.includes('->'));

  if (isListMiddle) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'linked-list-middle',
      inputArray: embeddedNumbers.length > 0 ? embeddedNumbers : undefined,
      rawPrompt: prompt,
    };
  }

  // 5. BST Operations: Insert, Find Min, Search
  const isBstContext = lower.includes('bst') || lower.includes('binary search tree') || lower.includes('tree');

  if (isBstContext) {
    // Check insert first so "Insert into binary search tree" doesn't falsely trigger "search"
    if (lower.includes('insert') || lower.includes('add') || lower.includes('build')) {
      return {
        kind: 'solve-algorithm',
        algorithm: 'bst-insert',
        rawPrompt: prompt,
      };
    }
    if (lower.includes('min') || lower.includes('smallest')) {
      return {
        kind: 'solve-algorithm',
        algorithm: 'bst-find-min',
        rawPrompt: prompt,
      };
    }
    if (
      lower.includes('find key') ||
      lower.includes('lookup') ||
      lower.startsWith('search') ||
      lower.includes(' search ') ||
      lower.includes('search for') ||
      lower.includes('search key') ||
      (lower.includes('search') && !lower.includes('binary search tree'))
    ) {
      const keyMatch = lower.match(/(?:search|find|lookup|key)\s*(?:key\s*)?(-?\d+)/);
      const target = keyMatch ? Number(keyMatch[1]) : 35;
      return {
        kind: 'solve-algorithm',
        algorithm: 'bst-search',
        target,
        rawPrompt: prompt,
      };
    }
  }

  // 6. General Maximum
  const hasMax =
    (lower.includes('max') || lower.includes('largest') || lower.includes('highest') || lower.includes('maximum')) &&
    !lower.startsWith('create variable') &&
    !lower.startsWith('set max') &&
    !lower.startsWith('set var max');

  if (hasMax) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'find-max',
      inputArray: embeddedNumbers.length > 0 ? embeddedNumbers : undefined,
      rawPrompt: prompt,
    };
  }

  // 7. General Minimum
  const hasMin =
    (lower.includes('min') || lower.includes('smallest') || lower.includes('lowest') || lower.includes('minimum')) &&
    !lower.startsWith('create variable') &&
    !lower.startsWith('set min');

  if (hasMin) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'find-min',
      inputArray: embeddedNumbers.length > 0 ? embeddedNumbers : undefined,
      rawPrompt: prompt,
    };
  }

  // 8. Binary Search
  if (lower.includes('binary search')) {
    const targetMatch =
      lower.match(/(?:target|key|find|for)\s*(?:is|=|:)?\s*(-?\d+)/) ||
      lower.match(/binary\s+search\s+(-?\d+)/);
    const target = targetMatch ? Number(targetMatch[1]) : undefined;
    return {
      kind: 'solve-algorithm',
      algorithm: 'binary-search',
      inputArray: embeddedNumbers.length > 0 ? embeddedNumbers : undefined,
      target,
      rawPrompt: prompt,
    };
  }

  // 9. Bubble Sort / Sort
  if (lower.includes('bubble sort') || (lower.includes('sort') && !lower.includes('quicksort'))) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'bubble-sort',
      inputArray: embeddedNumbers.length > 0 ? embeddedNumbers : undefined,
      rawPrompt: prompt,
    };
  }

  // 10. Reverse Array
  if (lower.includes('reverse') && lower.includes('array')) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'reverse-array',
      inputArray: embeddedNumbers.length > 0 ? embeddedNumbers : undefined,
      rawPrompt: prompt,
    };
  }

  // 11. QuickSort
  if (lower.includes('quicksort') || lower.includes('partition') || lower.includes('lomuto')) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'quicksort',
      inputArray: embeddedNumbers.length > 0 ? embeddedNumbers : undefined,
      rawPrompt: prompt,
    };
  }

  // 12. Reverse Linked List
  if (lower.includes('reverse') && (lower.includes('list') || lower.includes('linked'))) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'reverse-linked-list',
      rawPrompt: prompt,
    };
  }

  // 13. For loop / iteration traversal
  if (lower.includes('for loop') || lower.includes('iterate') || lower.includes('traversal')) {
    return {
      kind: 'solve-algorithm',
      algorithm: 'for-loop-traversal',
      inputArray: embeddedNumbers.length > 0 ? embeddedNumbers : undefined,
      rawPrompt: prompt,
    };
  }

  // 2. LINKED LIST CREATION: e.g. "Create a linked list: 10 -> 20 -> 30"
  if (lower.includes('->') || (lower.includes('linked list') && (embeddedNumbers.length > 0 || lower.includes('nodes')))) {
    const arrowTokens = p.match(/-?\d+(?:\s*->\s*-?\d+)+/);
    let vals: number[] = [];
    if (arrowTokens) {
      vals = arrowTokens[0]
        .split('->')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n));
    } else {
      vals = embeddedNumbers.length > 0 ? embeddedNumbers : [10, 20, 30];
    }
    return {
      kind: 'create-structure',
      structureType: 'linked-list',
      values: vals,
      rawPrompt: prompt,
    };
  }

  // 3. STACK CREATION: e.g. "Create a stack with 1, 2, 3"
  if (lower.includes('stack')) {
    const elems = extractElements(p);
    return {
      kind: 'create-structure',
      structureType: 'stack',
      values: elems.length > 0 ? elems : [1, 2, 3],
      rawPrompt: prompt,
    };
  }

  // 4. QUEUE CREATION: e.g. "Create a queue containing A, B, C"
  if (lower.includes('queue')) {
    const elems = extractElements(p);
    return {
      kind: 'create-structure',
      structureType: 'queue',
      values: elems.length > 0 ? elems : ['A', 'B', 'C'],
      rawPrompt: prompt,
    };
  }

  // 5. BINARY TREE CREATION: e.g. "Create a binary tree"
  if (lower.includes('tree') && !lower.includes('traversal')) {
    return {
      kind: 'create-structure',
      structureType: 'tree',
      values: embeddedNumbers.length > 0 ? embeddedNumbers : [50, 20, 70, 10, 30],
      rawPrompt: prompt,
    };
  }

  // 6. VARIABLE CREATION / ASSIGNMENT: e.g. "Set x = 10", "Create a variable x with value 10"
  const varMatch1 = lower.match(/(?:create\s+a?\s*variable|create\s+var|set\s+variable|set\s+var|set|var|let)\s+([a-zA-Z_]\w*)\s*(?:with\s+value\s*|=|to)\s*(.+)/i);
  if (varMatch1) {
    const name = varMatch1[1];
    let valStr = varMatch1[2].trim();
    const valNum = Number(valStr);
    const val = !isNaN(valNum) && valStr !== '' ? valNum : valStr;
    return {
      kind: 'create-structure',
      structureType: 'variable',
      name,
      values: [val],
      rawPrompt: prompt,
    };
  }

  // 7. ARRAY CREATION: e.g. "Create an array [10, 6, 8, 9, 10]", "arr = [10, 6, 8, 9, 10]", "Create an array of 5 elements"
  const isArrayIntent =
    lower.includes('array') ||
    lower.includes('arr') ||
    lower.startsWith('[') ||
    lower.startsWith('{') ||
    /^[a-zA-Z_]\w*\s*=\s*\[/.test(lower) ||
    lower.includes('code for creating array');

  if (isArrayIntent) {
    // Check "array of N elements"
    const sizeMatch = lower.match(/(?:array|arr)\s+(?:of|with|having)?\s*(\d+)\s*(?:elements|items|values|slots)?/i);
    if (sizeMatch && embeddedNumbers.length === 0) {
      const count = Math.min(Math.max(Number(sizeMatch[1]), 1), 16);
      const generated = Array.from({ length: count }, (_, i) => (i + 1) * 10);
      return {
        kind: 'create-structure',
        structureType: 'array',
        name: 'arr',
        values: generated,
        rawPrompt: prompt,
      };
    }

    if (embeddedNumbers.length > 0) {
      return {
        kind: 'create-structure',
        structureType: 'array',
        name: 'arr',
        values: embeddedNumbers,
        rawPrompt: prompt,
      };
    }

    // Default sample array if "create array" with no numbers specified
    return {
      kind: 'create-structure',
      structureType: 'array',
      name: 'arr',
      values: [10, 20, 30, 40, 50],
      rawPrompt: prompt,
    };
  }

  // 8. If standalone bracketed numbers: e.g. "[10, 6, 8, 9, 10]"
  if (embeddedNumbers.length > 0) {
    return {
      kind: 'create-structure',
      structureType: 'array',
      name: 'arr',
      values: embeddedNumbers,
      rawPrompt: prompt,
    };
  }

  return {
    kind: 'general-query',
    rawPrompt: prompt,
  };
}

/**
 * Builds a clean, executable TimelineStoryboard from a structured DSA Intent IR.
 */
export function buildStoryboardFromIntent(
  intent: DsaIntent,
  lang: 'python' | 'typescript' | 'cpp' = 'python'
): TimelineStoryboard {
  // 1. CREATE-STRUCTURE
  if (intent.kind === 'create-structure') {
    if (intent.structureType === 'array') {
      const nums = (intent.values || [10, 20, 30, 40, 50]).map(Number);
      const code =
        lang === 'typescript'
          ? `// Array declaration and initialization\nconst arr: number[] = [${nums.join(', ')}];\n\nconsole.log(\`Array created with \${arr.length} elements:\`, arr);`
          : lang === 'cpp'
          ? `// Array declaration and initialization\n#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> arr = {${nums.join(', ')}};\n    std::cout << "Array created with " << arr.size() << " elements" << std::endl;\n    return 0;\n}`
          : `# Array declaration and initialization\narr = [${nums.join(', ')}]\n\nprint(f"Array created with {len(arr)} elements: {arr}")`;

      return {
        id: `created-array-${Date.now()}`,
        title: 'Array Initialization',
        badge: 'Array Structure',
        language: lang,
        fileName: lang === 'python' ? 'array.py' : lang === 'typescript' ? 'array.ts' : 'array.cpp',
        code,
        initialPrompt: intent.rawPrompt,
        chatExplanation: `Created array with ${nums.length} elements: [${nums.join(', ')}]. I've generated the declaration code and rendered the array in your workspace. You can double-click slots to edit or add pointers directly on the canvas.`,
        initialState: {
          array: {
            id: 'dsa-main-array',
            name: intent.name || 'arr',
            values: [...nums],
            pointers: {},
            highlights: Object.fromEntries(nums.map((_, i) => [i, 'active' as const])),
          },
          linkedListNodes: {},
          treeNodes: {},
          variables: {
            length: { name: 'length', value: nums.length, color: 'indigo' },
          },
        },
        steps: [
          {
            id: 'step-0',
            stepNumber: 0,
            codeLine: 2,
            title: 'Array Created',
            narration: `Allocated array 'arr' with ${nums.length} elements: [${nums.join(', ')}].`,
            variables: { length: nums.length },
            mutations: [
              {
                type: 'array',
                action: {
                  kind: 'highlight-slots',
                  indices: nums.map((_, i) => i),
                  state: 'active',
                },
              },
            ],
          },
        ],
      };
    }

    if (intent.structureType === 'variable') {
      const varName = intent.name || 'x';
      const varVal = intent.values?.[0] ?? 10;
      const code =
        lang === 'typescript'
          ? `let ${varName} = ${varVal};\nconsole.log(\`${varName} = \${${varName}}\`);`
          : lang === 'cpp'
          ? `int ${varName} = ${varVal};\nstd::cout << "${varName} = " << ${varName} << std::endl;`
          : `${varName} = ${varVal}\nprint(f"${varName} = {${varName}}")`;

      return {
        id: `created-var-${Date.now()}`,
        title: `Variable ${varName}`,
        badge: 'Variable State',
        language: lang,
        fileName: lang === 'python' ? 'variables.py' : lang === 'typescript' ? 'variables.ts' : 'variables.cpp',
        code,
        initialPrompt: intent.rawPrompt,
        chatExplanation: `Set variable '${varName}' = ${varVal}. I've rendered the variable card in your workspace and loaded the assignment code.`,
        initialState: {
          linkedListNodes: {},
          treeNodes: {},
          variables: {
            [varName]: { name: varName, value: varVal, color: 'mint' },
          },
        },
        steps: [
          {
            id: 'step-0',
            stepNumber: 0,
            codeLine: 1,
            title: `Assign ${varName}`,
            narration: `Variable ${varName} is initialized to ${varVal}.`,
            variables: { [varName]: varVal },
            mutations: [
              {
                type: 'variable',
                action: { kind: 'set-variable', name: varName, value: varVal, color: 'mint' },
              },
            ],
          },
        ],
      };
    }

    if (intent.structureType === 'linked-list') {
      const nums = (intent.values || [10, 20, 30]).map(Number);
      const code =
        lang === 'typescript'
          ? `class ListNode {\n  val: number;\n  next: ListNode | null;\n  constructor(val: number, next: ListNode | null = null) {\n    this.val = val;\n    this.next = next;\n  }\n}\n\nconst head = ${nums.reduceRight((acc, n) => `new ListNode(${n}, ${acc})`, 'null')};`
          : lang === 'cpp'
          ? `struct ListNode {\n    int val;\n    ListNode* next;\n    ListNode(int x, ListNode* n = nullptr) : val(x), next(n) {}\n};\n\nListNode* head = new ListNode(${nums[0]});`
          : `class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\nhead = ListNode(${nums[0]})`;

      const nodes: Record<string, any> = {};
      for (let i = 0; i < nums.length; i++) {
        const id = `node_${i + 1}`;
        const nextId = i < nums.length - 1 ? `node_${i + 2}` : null;
        nodes[id] = {
          id,
          value: nums[i],
          nextId,
          pointers: i === 0 ? ['head'] : [],
        };
      }

      return {
        id: `created-linked-list-${Date.now()}`,
        title: 'Singly Linked List',
        badge: 'Linked List',
        language: lang,
        fileName: lang === 'python' ? 'linked_list.py' : lang === 'typescript' ? 'linked_list.ts' : 'linked_list.cpp',
        code,
        initialPrompt: intent.rawPrompt,
        chatExplanation: `Created linked list: ${nums.join(' -> ')} -> null. I've rendered the nodes with magnetic pointer links in the workspace.`,
        initialState: {
          linkedListNodes: nodes,
          treeNodes: {},
          variables: {
            head: { name: 'head', value: nums[0], color: 'mint' },
          },
        },
        steps: [
          {
            id: 'step-0',
            stepNumber: 0,
            codeLine: 1,
            title: 'Linked List Initialized',
            narration: `Constructed ${nums.length} linked nodes with head pointer at node ${nums[0]}.`,
            variables: { head: nums[0] },
            mutations: [],
          },
        ],
      };
    }

    if (intent.structureType === 'stack') {
      const items = intent.values || [1, 2, 3];
      return createDynamicStackStoryboard(items, lang, intent.rawPrompt);
    }

    if (intent.structureType === 'circular-queue') {
      const items = intent.values || [10, 20, 30];
      return createDynamicCircularQueueStoryboard(items, lang, intent.rawPrompt);
    }

    if (intent.structureType === 'circular-linked-list') {
      const nums = (intent.values || [1, 2, 3, 4]).map(Number);
      return createDynamicCircularLinkedListStoryboard(nums, lang, intent.rawPrompt);
    }

    if (intent.structureType === 'doubly-linked-list') {
      const nums = (intent.values || [10, 20, 30]).map(Number);
      return createDynamicReverseDoublyLinkedListStoryboard(nums, lang, intent.rawPrompt);
    }

    if (intent.structureType === 'queue') {
      const items = intent.values || ['A', 'B', 'C'];
      const nums = items.map((x) => (typeof x === 'number' ? x : 1));
      return {
        id: `created-queue-${Date.now()}`,
        title: 'Queue (FIFO)',
        badge: 'Queue',
        language: lang,
        fileName: lang === 'python' ? 'queue.py' : 'queue.ts',
        code: `queue = [${items.map((x) => JSON.stringify(x)).join(', ')}]\n# FIFO: Enqueue at rear, Dequeue from front`,
        initialPrompt: intent.rawPrompt,
        chatExplanation: `Created queue containing [${items.join(', ')}]. Rendered array with 'front' and 'rear' pointers.`,
        initialState: {
          array: {
            id: 'dsa-main-array',
            name: 'queue',
            values: nums,
            pointers: { front: 0, rear: Math.max(0, items.length - 1) },
            highlights: { 0: 'active', [Math.max(0, items.length - 1)]: 'sorted' },
          },
          linkedListNodes: {},
          treeNodes: {},
          variables: {
            front: { name: 'front', value: String(items[0]), color: 'mint' },
            rear: { name: 'rear', value: String(items[items.length - 1]), color: 'purple' },
          },
        },
        steps: [
          {
            id: 'step-0',
            stepNumber: 0,
            codeLine: 1,
            title: 'Queue Initialized',
            narration: `Queue initialized with front at index 0 and rear at index ${items.length - 1}.`,
            variables: { front: String(items[0]), rear: String(items[items.length - 1]) },
            mutations: [],
          },
        ],
      };
    }
  }

  // 2. SOLVE-ALGORITHM: Generate dynamic storyboard tailored to custom input array
  if (intent.kind === 'solve-algorithm') {
    switch (intent.algorithm) {
      case 'find-second-max': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [10, 2, 6, 20, 3, 6, 4, 5];
        return createDynamicSecondMaxStoryboard(nums, lang, intent.rawPrompt);
      }
      case 'find-max': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [12, 45, 19, 72, 33, 54, 8];
        return createDynamicFindMaxStoryboard(nums, lang, intent.rawPrompt);
      }
      case 'find-second-min': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [15, 3, 7, 2, 9];
        return createDynamicSecondMinStoryboard(nums, lang, intent.rawPrompt);
      }
      case 'find-min': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [8, 4, 12, 1, 9];
        return createDynamicFindMinStoryboard(nums, lang, intent.rawPrompt);
      }
      case 'two-sum': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [2, 7, 11, 15];
        const target = intent.target ?? 9;
        return createDynamicTwoSumStoryboard(nums, target, lang, intent.rawPrompt);
      }
      case 'linked-list-middle': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [10, 20, 30, 40, 50];
        return createDynamicLinkedListMiddleStoryboard(nums, lang, intent.rawPrompt);
      }
      case 'bst-search': {
        const target = intent.target ?? 35;
        return createDynamicBstSearchStoryboard(target, lang, intent.rawPrompt);
      }
      case 'bst-find-min': {
        return createDynamicBstFindMinStoryboard(lang, intent.rawPrompt);
      }
      case 'bst-insert': {
        return createDynamicBstInsertStoryboard(lang, intent.rawPrompt);
      }
      case 'reverse-linked-list': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [10, 20, 30];
        return createDynamicReverseListStoryboard(nums, lang, intent.rawPrompt);
      }
      case 'quicksort': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [10, 80, 30, 90, 40, 50, 70];
        return createDynamicQuickSortStoryboard(nums, lang, intent.rawPrompt);
      }
      case 'binary-search': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [3, 8, 15, 23, 42, 57, 88];
        const target = intent.target ?? 42;
        return createDynamicBinarySearchStoryboard(nums, target, lang, intent.rawPrompt);
      }
      case 'bubble-sort': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [5, 1, 4, 2, 8];
        return createDynamicBubbleSortStoryboard(nums, lang, intent.rawPrompt);
      }
      case 'for-loop-traversal': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [10, 20, 30, 40];
        return createDynamicForLoopStoryboard(nums, lang, intent.rawPrompt);
      }
      case 'reverse-array': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [1, 2, 3, 4, 5];
        return createDynamicReverseArrayStoryboard(nums, lang, intent.rawPrompt);
      }
      case 'reverse-doubly-linked-list': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [10, 20, 30];
        return createDynamicReverseDoublyLinkedListStoryboard(nums, lang, intent.rawPrompt);
      }
      case 'avl-insert': {
        const val = intent.target ?? 25;
        return createDynamicAvlTreeStoryboard(val, lang, intent.rawPrompt);
      }
      case 'heapify': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [50, 20, 30, 40, 25];
        return createDynamicMinHeapStoryboard(nums, lang, intent.rawPrompt);
      }
      case 'dijkstra': {
        return createDynamicDijkstraStoryboard(lang, intent.rawPrompt);
      }
      case 'bfs': {
        return createDynamicBfsStoryboard(lang, intent.rawPrompt);
      }
      case 'dfs': {
        return createDynamicDfsStoryboard(lang, intent.rawPrompt);
      }
      case 'sliding-window': {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [2, 1, 5, 1, 3, 2];
        const k = intent.target ?? 3;
        return createDynamicSlidingWindowStoryboard(nums, k, lang, intent.rawPrompt);
      }
      case 'dynamic-programming': {
        return createDynamicDpStoryboard(lang, intent.rawPrompt);
      }
      case 'recursion-factorial': {
        const n = intent.target ?? 4;
        return createDynamicRecursionStoryboard(n, lang, intent.rawPrompt);
      }
      default: {
        const nums = intent.inputArray && intent.inputArray.length > 0 ? intent.inputArray : [10, 6, 8, 9, 10];
        return createDynamicFindMaxStoryboard(nums, lang, intent.rawPrompt);
      }
    }
  }

  // Fallback default
  return createDynamicFindMaxStoryboard([10, 6, 8, 9, 10], lang, intent.rawPrompt);
}
