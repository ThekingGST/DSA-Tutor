import type { PresetScenario } from '../types/studio';

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'quicksort-partition',
    name: 'QuickSort Partition',
    title: 'QuickSort Partition',
    badge: 'Array & Two Pointers',
    language: 'python',
    fileName: 'quicksort.py',
    initialPrompt: 'Explain Lomuto partition on array [29, 10, 14, 37, 13] with pivot 13',
    code: `def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1`,
    initialState: {
      array: {
        id: 'arr-qs',
        name: 'arr',
        values: [29, 10, 14, 37, 13],
        pointers: {},
        highlights: {},
      },
      linkedListNodes: {},
      treeNodes: {},
      variables: {
        max: { name: 'max', value: 13, color: 'mint' },
        secondMax: { name: 'secondMax', value: 5, color: 'mint' },
      },
      loop: {
        header: 'for j in range(low, high)',
        conditionText: 'j < 4 (Evaluating low..high)',
        currentIteration: 0,
        totalIterations: 4,
        isComplete: false,
        variableName: 'j',
        iterationPills: ['j = 0', 'j = 1', 'j = 2', 'j = 3'],
      },
    },
    steps: [
      {
        id: 'qs-step-1',
        stepNumber: 0,
        codeLine: 2,
        title: 'Choose Pivot & Initialize Pointers',
        narration: 'We pick pivot = arr[high] (13). Pointer i starts at low - 1 (-1), and pointer j will scan the array.',
        variables: {
          pivot: 13,
          i: -1,
          j: 0,
          'arr[high]': 13,
        },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'pivot', toIndex: 4 } },
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: -1 } },
          { type: 'array', action: { kind: 'move-pointer', name: 'j', toIndex: 0 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [4], state: 'active' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'pivot', value: 13, color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'i', value: -1, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'j', value: 0, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'arr[high]', value: 13, color: 'indigo' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 0, conditionText: 'j = 0 < 4 (Initializing loop)' } },
        ],
      },
      {
        id: 'qs-step-2',
        stepNumber: 1,
        codeLine: 5,
        title: 'Compare arr[j=0] with Pivot',
        narration: 'arr[0] is 29. Since 29 > 13, it stays on the right side of partition. Pointer i remains at -1.',
        variables: {
          pivot: 13,
          i: -1,
          j: 0,
          'arr[j]': 29,
          '29 <= 13': 'False',
        },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'j', toIndex: 0 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [0, 4], state: 'comparing' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'arr[j]', value: 29, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: '29 <= 13', value: 'False', color: 'amber' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 0, conditionText: 'arr[0]=29 <= 13 (False)' } },
        ],
      },
      {
        id: 'qs-step-3',
        stepNumber: 2,
        codeLine: 7,
        title: 'Match Found: Swap arr[i] and arr[j]',
        narration: 'arr[1] is 10, which is <= 13! We increment i to 0 and swap arr[0] (29) with arr[1] (10).',
        variables: {
          pivot: 13,
          i: 0,
          j: 1,
          'arr[j]': 10,
          '10 <= 13': 'True (Swap!)',
        },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'j', toIndex: 1 } },
          { type: 'array', action: { kind: 'move-pointer', name: 'i', toIndex: 0 } },
          { type: 'array', action: { kind: 'swap-slots', indexA: 0, indexB: 1 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [0, 1], state: 'swapped' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'i', value: 0, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'j', value: 1, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'arr[j]', value: 10, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: '10 <= 13', value: 'True (Swap!)', color: 'mint' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 1, conditionText: 'arr[1]=10 <= 13 (True ➔ Swap!)' } },
        ],
      },
      {
        id: 'qs-step-4',
        stepNumber: 3,
        codeLine: 5,
        title: 'Compare arr[j=2] with Pivot',
        narration: 'arr[2] is 14. Since 14 > 13, no swap occurs. j advances to index 3.',
        variables: {
          pivot: 13,
          i: 0,
          j: 2,
          'arr[j]': 14,
          '14 <= 13': 'False',
        },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'j', toIndex: 2 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [2, 4], state: 'comparing' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'j', value: 2, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'arr[j]', value: 14, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: '14 <= 13', value: 'False', color: 'amber' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 2, conditionText: 'arr[2]=14 <= 13 (False)' } },
        ],
      },
      {
        id: 'qs-step-5',
        stepNumber: 4,
        codeLine: 5,
        title: 'Compare arr[j=3] with Pivot',
        narration: 'arr[3] is 37. Since 37 > 13, no swap occurs. Scanning loop completes.',
        variables: {
          pivot: 13,
          i: 0,
          j: 3,
          'arr[j]': 37,
          '37 <= 13': 'False',
        },
        mutations: [
          { type: 'array', action: { kind: 'move-pointer', name: 'j', toIndex: 3 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [3, 4], state: 'comparing' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'j', value: 3, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'arr[j]', value: 37, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: '37 <= 13', value: 'False', color: 'amber' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 3, conditionText: 'arr[3]=37 <= 13 (False)' } },
        ],
      },
      {
        id: 'qs-step-6',
        stepNumber: 5,
        codeLine: 8,
        title: 'Place Pivot into Sorted Position',
        narration: 'Finally, swap arr[i+1] (arr[1]=29) with arr[high] (arr[4]=13). The pivot 13 is now permanently in its sorted position!',
        variables: {
          pivot: 13,
          pivot_index: 1,
          status: 'Partition complete',
        },
        mutations: [
          { type: 'array', action: { kind: 'swap-slots', indexA: 1, indexB: 4 } },
          { type: 'array', action: { kind: 'move-pointer', name: 'pivot', toIndex: 1 } },
          { type: 'array', action: { kind: 'highlight-slots', indices: [1], state: 'sorted' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'pivot_index', value: 1, color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'status', value: 'Partition complete', color: 'mint' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 4, conditionText: 'Loop Complete (j=4 >= high)', isComplete: true } },
        ],
      },
    ],
  },
  {
    id: 'reverse-linked-list',
    name: 'Reverse Singly Linked List',
    title: 'Reverse Singly Linked List',
    badge: 'Pointers & Wires',
    language: 'typescript',
    fileName: 'reverse_list.ts',
    initialPrompt: 'Show mid-air pointer reversal on linked list: 1 -> 2 -> 3 -> 4 -> null',
    code: `function reverseList(head: ListNode | null): ListNode | null {
    let prev: ListNode | null = null;
    let curr: ListNode | null = head;
    while (curr !== null) {
        let next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}`,
    initialState: {
      linkedListNodes: {
        n1: { id: 'n1', value: 1, nextId: 'n2', pointers: ['curr'] },
        n2: { id: 'n2', value: 2, nextId: 'n3', pointers: [] },
        n3: { id: 'n3', value: 3, nextId: 'n4', pointers: [] },
        n4: { id: 'n4', value: 4, nextId: null, pointers: [] },
      },
      treeNodes: {},
      variables: {
        prev: { name: 'prev', value: 'null', color: 'mint' },
        curr: { name: 'curr', value: 'Node(1)', color: 'mint' },
      },
      loop: {
        header: 'while (curr !== null)',
        conditionText: 'curr = Node(1) !== null (True)',
        currentIteration: 0,
        totalIterations: 4,
        isComplete: false,
        variableName: 'curr',
        iterationPills: ['Node(1)', 'Node(2)', 'Node(3)', 'Node(4)'],
      },
    },
    steps: [
      {
        id: 'rll-step-1',
        stepNumber: 0,
        codeLine: 2,
        title: 'Initialize prev and curr Pointers',
        narration: 'We set prev to null and curr to the head of the list (Node 1).',
        variables: {
          prev: 'null',
          curr: 'Node(1)',
          'curr.val': 1,
        },
        mutations: [
          { type: 'linked-list', action: { kind: 'set-node-pointers', nodeId: 'n1', pointers: ['curr'] } },
          { type: 'variable', action: { kind: 'set-variable', name: 'prev', value: 'null', color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'curr', value: 'Node(1)', color: 'indigo' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 0, conditionText: 'curr = Node(1) !== null (True)' } },
        ],
      },
      {
        id: 'rll-step-2',
        stepNumber: 1,
        codeLine: 5,
        title: 'Store Next Pointer Before Breaking Link',
        narration: 'Save next = curr.next (Node 2) so we do not lose reference to the rest of the list.',
        variables: {
          prev: 'null',
          curr: 'Node(1)',
          next: 'Node(2)',
        },
        mutations: [
          { type: 'linked-list', action: { kind: 'set-node-pointers', nodeId: 'n2', pointers: ['next'] } },
          { type: 'variable', action: { kind: 'set-variable', name: 'next', value: 'Node(2)', color: 'purple' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 0, conditionText: 'next = curr.next (Node 2)' } },
        ],
      },
      {
        id: 'rll-step-3',
        stepNumber: 2,
        codeLine: 6,
        title: 'Mid-Air Rewire: curr.next = prev',
        narration: 'Detach Node 1\'s next arrow and rewire it backwards to prev (null). The first link is now reversed!',
        variables: {
          'curr.next': 'prev (null)',
          curr: 'Node(1)',
          action: 'Rewired pointer backwards',
        },
        mutations: [
          { type: 'linked-list', action: { kind: 'connect-nodes', fromId: 'n1', toId: null } },
          { type: 'variable', action: { kind: 'set-variable', name: 'curr.next', value: 'prev (null)', color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'action', value: 'Rewired pointer backwards', color: 'mint' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 0, conditionText: 'curr.next = prev (Rewired Node 1)' } },
        ],
      },
      {
        id: 'rll-step-4',
        stepNumber: 3,
        codeLine: 7,
        title: 'Slide prev and curr Forward',
        narration: 'Advance prev to curr (Node 1), then advance curr to next (Node 2). Ready for next node reversal.',
        variables: {
          prev: 'Node(1)',
          curr: 'Node(2)',
          next: 'Node(3)',
        },
        mutations: [
          { type: 'linked-list', action: { kind: 'set-node-pointers', nodeId: 'n1', pointers: ['prev'] } },
          { type: 'linked-list', action: { kind: 'set-node-pointers', nodeId: 'n2', pointers: ['curr'] } },
          { type: 'variable', action: { kind: 'set-variable', name: 'prev', value: 'Node(1)', color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'curr', value: 'Node(2)', color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'next', value: 'Node(3)', color: 'purple' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 1, conditionText: 'curr = Node(2) !== null (True)' } },
        ],
      },
      {
        id: 'rll-step-5',
        stepNumber: 4,
        codeLine: 10,
        title: 'Traversal Complete: Return New Head',
        narration: 'curr is now null. prev points to Node 4, which is the new head of our fully reversed list!',
        variables: {
          newHead: 'Node(4)',
          status: 'List fully reversed',
        },
        mutations: [
          { type: 'linked-list', action: { kind: 'set-node-pointers', nodeId: 'n4', pointers: ['prev', 'newHead'] } },
          { type: 'variable', action: { kind: 'set-variable', name: 'newHead', value: 'Node(4)', color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'status', value: 'List fully reversed', color: 'mint' } },
          { type: 'loop', action: { kind: 'update-loop', iteration: 4, conditionText: 'curr is null (Loop Finished)', isComplete: true } },
        ],
      },
    ],
  },
  {
    id: 'bst-insert',
    name: 'BST Insert & Traversal',
    title: 'BST Insert & Traversal',
    badge: 'Tree Auto-Layout',
    language: 'typescript',
    fileName: 'bst_insert.ts',
    initialPrompt: 'Insert value 35 into Binary Search Tree with root 50',
    code: `function insertBST(root: TreeNode | null, val: number): TreeNode {
    if (!root) return new TreeNode(val);
    if (val < root.val) {
        root.left = insertBST(root.left, val);
    } else {
        root.right = insertBST(root.right, val);
    }
    return root;
}`,
    initialState: {
      linkedListNodes: {},
      treeNodes: {
        n50: { id: 'n50', value: 50, leftId: 'n30', rightId: 'n70', parentId: null, highlight: 'default' },
        n30: { id: 'n30', value: 30, leftId: null, rightId: 'n40', parentId: 'n50', highlight: 'default' },
        n70: { id: 'n70', value: 70, leftId: null, rightId: null, parentId: 'n50', highlight: 'default' },
        n40: { id: 'n40', value: 40, leftId: null, rightId: null, parentId: 'n30', highlight: 'default' },
      },
      variables: {
        val: { name: 'val', value: 35, color: 'mint' },
        current: { name: 'current', value: 50, color: 'indigo' },
      },
    },
    steps: [
      {
        id: 'bst-step-1',
        stepNumber: 0,
        codeLine: 1,
        title: 'Target Insert: Value 35 into Root 50',
        narration: 'We want to insert 35 into the BST. We start comparison at root Node(50).',
        variables: {
          val: 35,
          'root.val': 50,
        },
        mutations: [
          { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'n50', state: 'active' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'val', value: 35, color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'root.val', value: 50, color: 'indigo' } },
        ],
      },
      {
        id: 'bst-step-2',
        stepNumber: 1,
        codeLine: 3,
        title: 'Compare 35 < 50: Branch Left',
        narration: 'Since 35 < 50, BST property requires us to move left into the subtree rooted at 30.',
        variables: {
          val: 35,
          current: 30,
          branch: 'LEFT',
        },
        mutations: [
          { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'n50', state: 'visited' } },
          { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'n30', state: 'active' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'current', value: 30, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'branch', value: 'LEFT', color: 'amber' } },
        ],
      },
      {
        id: 'bst-step-3',
        stepNumber: 2,
        codeLine: 5,
        title: 'Compare 35 > 30: Branch Right',
        narration: 'Since 35 > 30, we branch right into Node(40).',
        variables: {
          val: 35,
          current: 40,
          branch: 'RIGHT',
        },
        mutations: [
          { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'n30', state: 'visited' } },
          { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'n40', state: 'active' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'current', value: 40, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'branch', value: 'RIGHT', color: 'amber' } },
        ],
      },
      {
        id: 'bst-step-4',
        stepNumber: 3,
        codeLine: 2,
        title: 'Leaf Found: Attach New Node(35)',
        narration: '35 < 40 and 40.left is null. We instantiate Node(35) and attach it. Deterministic layout adjusts child spacing.',
        variables: {
          newNode: 35,
          parent: 40,
          status: 'Inserted cleanly',
        },
        mutations: [
          { type: 'bst', action: { kind: 'insert-tree-node', nodeId: 'n35', value: 35, parentId: 'n40', branch: 'left' } },
          { type: 'bst', action: { kind: 'highlight-tree-node', nodeId: 'n35', state: 'sorted' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'newNode', value: 35, color: 'mint' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'parent', value: 40, color: 'indigo' } },
          { type: 'variable', action: { kind: 'set-variable', name: 'status', value: 'Inserted cleanly', color: 'mint' } },
        ],
      },
    ],
  },
];
