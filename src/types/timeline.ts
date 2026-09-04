export type HighlightState = 'default' | 'active' | 'comparing' | 'sorted' | 'swapped' | 'visited';

export type PointerMap = Record<string, number | string | null>;

export interface ArrayEntity {
  id: string;
  name: string;
  values: number[];
  pointers: Record<string, number>; // e.g. { i: 0, j: 1, pivot: 4 }
  highlights: Record<number, HighlightState>; // index -> HighlightState
}

export interface LinkedListNodeEntity {
  id: string;
  value: number | string;
  nextId: string | null;
  pointers: string[]; // pointers pointing to this node, e.g. ['curr', 'prev']
}

export interface TreeNodeEntity {
  id: string;
  value: number;
  leftId: string | null;
  rightId: string | null;
  parentId: string | null;
  highlight: HighlightState;
}

export interface VariableCardEntity {
  name: string;
  value: string | number;
  color?: 'mint' | 'indigo' | 'amber' | 'purple';
  isUpdated?: boolean;
}

export interface LoopTrackerEntity {
  header: string;
  conditionText: string;
  currentIteration: number;
  totalIterations: number;
  isComplete: boolean;
}

export interface CanvasEntities {
  array?: ArrayEntity;
  linkedListNodes: Record<string, LinkedListNodeEntity>;
  treeNodes: Record<string, TreeNodeEntity>;
  variables: Record<string, VariableCardEntity>;
  loop?: LoopTrackerEntity;
}

export type CanvasMutationAction =
  | { kind: 'set-slot'; index: number; value: number }
  | { kind: 'swap-slots'; indexA: number; indexB: number }
  | { kind: 'move-pointer'; name: string; toIndex: number }
  | { kind: 'remove-pointer'; name: string }
  | { kind: 'highlight-slots'; indices: number[]; state: HighlightState }
  | { kind: 'clear-highlights' }
  | { kind: 'set-variable'; name: string; value: string | number; color?: 'mint' | 'indigo' | 'amber' | 'purple' }
  | { kind: 'remove-variable'; name: string }
  | { kind: 'connect-nodes'; fromId: string; toId: string | null }
  | { kind: 'set-node-pointers'; nodeId: string; pointers: string[] }
  | { kind: 'insert-tree-node'; nodeId: string; value: number; parentId?: string; branch?: 'left' | 'right' }
  | { kind: 'highlight-tree-node'; nodeId: string; state: HighlightState }
  | { kind: 'update-loop'; iteration: number; conditionText: string; isComplete?: boolean };

export interface CanvasMutation {
  type: 'array' | 'linked-list' | 'bst' | 'loop' | 'variable';
  targetId?: string;
  action: CanvasMutationAction;
}

export interface TimelineStep {
  id: string;
  stepNumber: number; // 0-based index
  codeLine: number; // 1-based line number in code editor
  title: string;
  narration: string;
  variables: Record<string, string | number>;
  mutations: CanvasMutation[];
}

export interface TimelineStoryboard {
  id: string;
  title: string;
  badge: string;
  language: 'python' | 'typescript' | 'cpp';
  fileName: string;
  code: string;
  initialPrompt: string;
  initialState: CanvasEntities;
  steps: TimelineStep[];
}
