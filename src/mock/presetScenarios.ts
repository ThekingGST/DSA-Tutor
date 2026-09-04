import type { PresetScenario } from '../types/studio';

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'quicksort-partition',
    name: 'QuickSort Partition',
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
    steps: [
      {
        id: 'qs-step-1',
        stepIndex: 0,
        totalSteps: 6,
        codeLine: 2,
        title: 'Choose Pivot & Initialize Pointers',
        narration: 'We pick pivot = arr[high] (13). Pointer i starts at low - 1 (-1), and pointer j will scan the array.',
        variables: {
          pivot: 13,
          i: -1,
          j: 0,
          'arr[high]': 13,
        },
        activeArrayIndices: [4],
        activePointerBadge: { name: 'pivot', index: 4 },
      },
      {
        id: 'qs-step-2',
        stepIndex: 1,
        totalSteps: 6,
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
        activeArrayIndices: [0, 4],
        activePointerBadge: { name: 'j', index: 0 },
      },
      {
        id: 'qs-step-3',
        stepIndex: 2,
        totalSteps: 6,
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
        activeArrayIndices: [0, 1],
        activePointerBadge: { name: 'i', index: 0 },
      },
      {
        id: 'qs-step-4',
        stepIndex: 3,
        totalSteps: 6,
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
        activeArrayIndices: [2, 4],
        activePointerBadge: { name: 'j', index: 2 },
      },
      {
        id: 'qs-step-5',
        stepIndex: 4,
        totalSteps: 6,
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
        activeArrayIndices: [3, 4],
        activePointerBadge: { name: 'j', index: 3 },
      },
      {
        id: 'qs-step-6',
        stepIndex: 5,
        totalSteps: 6,
        codeLine: 8,
        title: 'Place Pivot into Sorted Position',
        narration: 'Finally, swap arr[i+1] (arr[1]=29) with arr[high] (arr[4]=13). The pivot 13 is now permanently in its sorted position!',
        variables: {
          pivot: 13,
          'pivot_index': 1,
          'status': 'Partition complete',
        },
        activeArrayIndices: [1, 4],
        activePointerBadge: { name: 'pivot', index: 1 },
      },
    ],
  },
  {
    id: 'reverse-linked-list',
    name: 'Reverse Singly Linked List',
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
    steps: [
      {
        id: 'rll-step-1',
        stepIndex: 0,
        totalSteps: 5,
        codeLine: 2,
        title: 'Initialize prev and curr Pointers',
        narration: 'We set prev to null and curr to the head of the list (Node 1).',
        variables: {
          prev: 'null',
          curr: 'Node(1)',
          'curr.val': 1,
        },
      },
      {
        id: 'rll-step-2',
        stepIndex: 1,
        totalSteps: 5,
        codeLine: 5,
        title: 'Store Next Pointer Before Breaking Link',
        narration: 'Save next = curr.next (Node 2) so we do not lose reference to the rest of the list.',
        variables: {
          prev: 'null',
          curr: 'Node(1)',
          next: 'Node(2)',
        },
      },
      {
        id: 'rll-step-3',
        stepIndex: 2,
        totalSteps: 5,
        codeLine: 6,
        title: 'Mid-Air Rewire: curr.next = prev',
        narration: 'Detach Node 1\'s next arrow and rewire it backwards to prev (null). The first link is now reversed!',
        variables: {
          'curr.next': 'prev (null)',
          curr: 'Node(1)',
          action: 'Rewired pointer backwards',
        },
      },
      {
        id: 'rll-step-4',
        stepIndex: 3,
        totalSteps: 5,
        codeLine: 7,
        title: 'Slide prev and curr Forward',
        narration: 'Advance prev to curr (Node 1), then advance curr to next (Node 2). Ready for next node reversal.',
        variables: {
          prev: 'Node(1)',
          curr: 'Node(2)',
          next: 'Node(3)',
        },
      },
      {
        id: 'rll-step-5',
        stepIndex: 4,
        totalSteps: 5,
        codeLine: 10,
        title: 'Traversal Complete: Return New Head',
        narration: 'curr is now null. prev points to Node 4, which is the new head of our fully reversed list!',
        variables: {
          newHead: 'Node(4)',
          status: 'List fully reversed',
        },
      },
    ],
  },
  {
    id: 'bst-insert',
    name: 'BST Insert & Traversal',
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
    steps: [
      {
        id: 'bst-step-1',
        stepIndex: 0,
        totalSteps: 4,
        codeLine: 1,
        title: 'Target Insert: Value 35 into Root 50',
        narration: 'We want to insert 35 into the BST. We start comparison at root Node(50).',
        variables: {
          val: 35,
          'root.val': 50,
        },
      },
      {
        id: 'bst-step-2',
        stepIndex: 1,
        totalSteps: 4,
        codeLine: 3,
        title: 'Compare 35 < 50: Branch Left',
        narration: 'Since 35 < 50, BST property requires us to move left into the subtree rooted at 30.',
        variables: {
          val: 35,
          'current': 30,
          'branch': 'LEFT',
        },
      },
      {
        id: 'bst-step-3',
        stepIndex: 2,
        totalSteps: 4,
        codeLine: 5,
        title: 'Compare 35 > 30: Branch Right',
        narration: 'Since 35 > 30, we branch right into Node(40).',
        variables: {
          val: 35,
          'current': 40,
          'branch': 'RIGHT',
        },
      },
      {
        id: 'bst-step-4',
        stepIndex: 3,
        totalSteps: 4,
        codeLine: 2,
        title: 'Leaf Found: Attach New Node(35)',
        narration: '35 < 40 and 40.left is null. We instantiate Node(35) and attach it. Deterministic layout adjusts child spacing.',
        variables: {
          newNode: 35,
          parent: 40,
          status: 'Inserted cleanly',
        },
      },
    ],
  },
];
