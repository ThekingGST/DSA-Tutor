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
  prevId?: string | null;
  isCircular?: boolean;
  pointers: string[]; // pointers pointing to this node, e.g. ['curr', 'prev']
}

export interface TreeNodeEntity {
  id: string;
  value: number;
  leftId: string | null;
  rightId: string | null;
  parentId: string | null;
  highlight: HighlightState;
  height?: number;
  balanceFactor?: number;
  heapIndex?: number;
}

export interface VariableCardEntity {
  name: string;
  value: string | number;
  color?: 'mint' | 'indigo' | 'amber' | 'purple';
  isUpdated?: boolean;
}

export interface LoopTrackerEntity {
  id?: string;
  header: string;
  conditionText: string;
  currentIteration: number;
  totalIterations: number;
  isComplete: boolean;
  variableName?: string;
  iterationPills?: string[];
}

export interface StackEntity {
  id: string;
  name: string;
  items: (number | string)[];
  maxCapacity?: number;
  highlights?: Record<number, HighlightState>;
  currentOperation?: 'idle' | 'push' | 'pop' | 'peek';
}

export interface QueueEntity {
  id: string;
  name: string;
  items: (number | string | null)[];
  front: number;
  rear: number;
  capacity?: number;
  isCircular?: boolean;
  highlights?: Record<number, HighlightState>;
  currentOperation?: 'idle' | 'enqueue' | 'dequeue' | 'peek';
}

export interface GraphNodeEntity {
  id: string;
  label: string;
  x: number;
  y: number;
  highlight?: HighlightState;
  distance?: number | string;
  visited?: boolean;
}

export interface GraphEdgeEntity {
  id: string;
  from: string;
  to: string;
  weight?: number;
  directed?: boolean;
  highlight?: HighlightState;
}

export interface GraphEntity {
  id: string;
  name: string;
  nodes: Record<string, GraphNodeEntity>;
  edges: GraphEdgeEntity[];
}

export interface HashBucketEntity {
  index: number;
  chain: (number | string)[];
  value?: number | string | null;
  isCollision?: boolean;
  isProbed?: boolean;
}

export interface HashTableEntity {
  id: string;
  name: string;
  buckets: HashBucketEntity[];
  collisionStrategy: 'chaining' | 'open-addressing';
}

export interface CallFrameEntity {
  id: string;
  functionName: string;
  args: Record<string, number | string>;
  returnValue?: number | string;
  status: 'active' | 'returning' | 'completed';
}

export interface CallStackEntity {
  id: string;
  frames: CallFrameEntity[];
}

export interface DpTableEntity {
  id: string;
  name: string;
  rows: string[];
  cols: string[];
  cells: (number | string | null)[][];
  activeCell?: { row: number; col: number };
  dependencyCells?: { row: number; col: number }[];
}

export interface CanvasEntities {
  array?: ArrayEntity;
  linkedListNodes: Record<string, LinkedListNodeEntity>;
  treeNodes: Record<string, TreeNodeEntity>;
  variables: Record<string, VariableCardEntity>;
  loop?: LoopTrackerEntity;
  stack?: StackEntity;
  queue?: QueueEntity;
  graph?: GraphEntity;
  hashTable?: HashTableEntity;
  callStack?: CallStackEntity;
  dpTable?: DpTableEntity;
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
  | { kind: 'connect-doubly'; fromId: string; toId: string | null }
  | { kind: 'connect-circular'; tailId: string; headId: string }
  | { kind: 'set-node-pointers'; nodeId: string; pointers: string[] }
  | { kind: 'insert-tree-node'; nodeId: string; value: number; parentId?: string; branch?: 'left' | 'right' }
  | { kind: 'highlight-tree-node'; nodeId: string; state: HighlightState }
  | { kind: 'set-loop'; loop: LoopTrackerEntity }
  | { kind: 'remove-loop' }
  | { kind: 'update-loop'; iteration: number; conditionText: string; isComplete?: boolean }
  // Stack actions
  | { kind: 'push-stack'; value: number | string }
  | { kind: 'pop-stack' }
  | { kind: 'peek-stack' }
  | { kind: 'clear-stack-highlights' }
  // Queue actions
  | { kind: 'enqueue'; value: number | string }
  | { kind: 'dequeue' }
  | { kind: 'peek-queue' }
  | { kind: 'update-queue'; front?: number; rear?: number; items?: (number | string | null)[] }
  // Graph actions
  | { kind: 'add-graph-node'; node: GraphNodeEntity }
  | { kind: 'remove-graph-node'; nodeId: string }
  | { kind: 'add-graph-edge'; edge: GraphEdgeEntity }
  | { kind: 'highlight-graph-node'; nodeId: string; state: HighlightState; distance?: number | string; visited?: boolean }
  | { kind: 'highlight-graph-edge'; edgeId: string; state: HighlightState }
  // Hash Table actions
  | { kind: 'hash-insert'; index: number; value: number | string; isCollision?: boolean }
  | { kind: 'hash-probe'; index: number }
  // DP Table actions
  | { kind: 'set-dp-cell'; row: number; col: number; value: number | string; dependencies?: { row: number; col: number }[] }
  // Call Stack actions
  | { kind: 'push-call-frame'; frame: CallFrameEntity }
  | { kind: 'pop-call-frame' }
  | { kind: 'set-frame-return'; frameId: string; returnValue: number | string };

export interface CanvasMutation {
  type: 'array' | 'linked-list' | 'bst' | 'loop' | 'variable' | 'stack' | 'queue' | 'graph' | 'hash-table' | 'dp-table' | 'call-stack';
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
  chatExplanation?: string;
}
