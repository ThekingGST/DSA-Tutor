import type { TLBaseShape } from '@tldraw/tldraw';
import type { TreeNodeEntity } from '../../types/timeline';

export const TREE_NODE_SHAPE_TYPE = 'dsa-tree-node' as const;

export interface TreeNodeShapeProps {
  w: number;
  h: number;
  nodeId: string;
  value: number;
  leftId: string | null;
  rightId: string | null;
  parentId: string | null;
  highlight: string;
  branchLabel?: string;
}

export type ITreeNodeShape = TLBaseShape<'dsa-tree-node', TreeNodeShapeProps>;

export const TREE_NODE_DEFAULT_PROPS: TreeNodeShapeProps = {
  w: 70,
  h: 70,
  nodeId: 'node-root',
  value: 50,
  leftId: null,
  rightId: null,
  parentId: null,
  highlight: 'default',
};

export interface TreeLayoutPosition {
  x: number;
  y: number;
  depth: number;
  inOrderRank: number;
}

export interface TreeConnector {
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  branch: 'left' | 'right';
}

/**
 * Finds the root node of the binary tree (the node with parentId === null, or the first key).
 */
export function findTreeRootId(nodes: Record<string, TreeNodeEntity>): string | null {
  const allNodes = Object.values(nodes);
  if (!allNodes.length) return null;
  const root = allNodes.find((n) => !n.parentId || !nodes[n.parentId]);
  return root ? root.id : allNodes[0].id;
}

/**
 * Deterministic In-Order Traversal based coordinate solver.
 * Guarantees zero edge-crossing and strict left-to-right BST ordering.
 */
export function layoutTree(
  nodes: Record<string, TreeNodeEntity>,
  rootId?: string | null,
  originX = 140,
  originY = 80,
  slotWidth = 105,
  levelHeight = 95
): {
  positions: Record<string, TreeLayoutPosition>;
  connectors: TreeConnector[];
} {
  const positions: Record<string, TreeLayoutPosition> = {};
  const connectors: TreeConnector[] = [];

  const effectiveRootId = rootId || findTreeRootId(nodes);
  if (!effectiveRootId || !nodes[effectiveRootId]) {
    return { positions, connectors };
  }

  // 1. In-order traversal to assign X rank and depths
  let currentRank = 0;

  function traverseInOrder(nodeId: string | null, depth: number) {
    if (!nodeId || !nodes[nodeId]) return;
    const node = nodes[nodeId];

    // Left subtree
    if (node.leftId && nodes[node.leftId]) {
      traverseInOrder(node.leftId, depth + 1);
    }

    // Node itself
    const rank = currentRank++;
    positions[node.id] = {
      x: originX + rank * slotWidth,
      y: originY + depth * levelHeight,
      depth,
      inOrderRank: rank,
    };

    // Right subtree
    if (node.rightId && nodes[node.rightId]) {
      traverseInOrder(node.rightId, depth + 1);
    }
  }

  traverseInOrder(effectiveRootId, 0);

  // 2. Generate connector edges (parent -> children)
  const nodeRadius = 35; // 70px / 2
  for (const node of Object.values(nodes)) {
    const parentPos = positions[node.id];
    if (!parentPos) continue;

    if (node.leftId && positions[node.leftId]) {
      const childPos = positions[node.leftId];
      connectors.push({
        fromId: node.id,
        toId: node.leftId,
        x1: parentPos.x + nodeRadius,
        y1: parentPos.y + nodeRadius * 2,
        x2: childPos.x + nodeRadius,
        y2: childPos.y,
        branch: 'left',
      });
    }

    if (node.rightId && positions[node.rightId]) {
      const childPos = positions[node.rightId];
      connectors.push({
        fromId: node.id,
        toId: node.rightId,
        x1: parentPos.x + nodeRadius,
        y1: parentPos.y + nodeRadius * 2,
        x2: childPos.x + nodeRadius,
        y2: childPos.y,
        branch: 'right',
      });
    }
  }

  return { positions, connectors };
}

/**
 * Pure function: inserts or updates a tree node in the dictionary.
 */
export function insertTreeNode(
  nodes: Record<string, TreeNodeEntity>,
  nodeId: string,
  value: number,
  parentId?: string,
  branch?: 'left' | 'right'
): Record<string, TreeNodeEntity> {
  const next: Record<string, TreeNodeEntity> = {
    ...nodes,
    [nodeId]: {
      id: nodeId,
      value,
      leftId: null,
      rightId: null,
      parentId: parentId || null,
      highlight: 'sorted',
    },
  };

  if (parentId && next[parentId] && branch) {
    next[parentId] = {
      ...next[parentId],
      leftId: branch === 'left' ? nodeId : next[parentId].leftId,
      rightId: branch === 'right' ? nodeId : next[parentId].rightId,
    };
  }

  return next;
}

/**
 * In-order traversal: Left -> Node -> Right. Returns array of node values.
 */
export function traverseTreeInorder(
  nodes: Record<string, TreeNodeEntity>,
  rootId?: string | null
): number[] {
  const result: number[] = [];
  const root = rootId || findTreeRootId(nodes);
  if (!root || !nodes[root]) return result;

  function traverse(id: string | null) {
    if (!id || !nodes[id]) return;
    const n = nodes[id];
    if (n.leftId) traverse(n.leftId);
    result.push(typeof n.value === 'number' ? n.value : Number(n.value));
    if (n.rightId) traverse(n.rightId);
  }

  traverse(root);
  return result;
}

/**
 * Pre-order traversal: Node -> Left -> Right. Returns array of node values.
 */
export function traverseTreePreorder(
  nodes: Record<string, TreeNodeEntity>,
  rootId?: string | null
): number[] {
  const result: number[] = [];
  const root = rootId || findTreeRootId(nodes);
  if (!root || !nodes[root]) return result;

  function traverse(id: string | null) {
    if (!id || !nodes[id]) return;
    const n = nodes[id];
    result.push(typeof n.value === 'number' ? n.value : Number(n.value));
    if (n.leftId) traverse(n.leftId);
    if (n.rightId) traverse(n.rightId);
  }

  traverse(root);
  return result;
}

/**
 * Post-order traversal: Left -> Right -> Node. Returns array of node values.
 */
export function traverseTreePostorder(
  nodes: Record<string, TreeNodeEntity>,
  rootId?: string | null
): number[] {
  const result: number[] = [];
  const root = rootId || findTreeRootId(nodes);
  if (!root || !nodes[root]) return result;

  function traverse(id: string | null) {
    if (!id || !nodes[id]) return;
    const n = nodes[id];
    if (n.leftId) traverse(n.leftId);
    if (n.rightId) traverse(n.rightId);
    result.push(typeof n.value === 'number' ? n.value : Number(n.value));
  }

  traverse(root);
  return result;
}

/**
 * Level-order traversal (BFS). Returns array of node values.
 */
export function traverseTreeLevelOrder(
  nodes: Record<string, TreeNodeEntity>,
  rootId?: string | null
): number[] {
  const result: number[] = [];
  const root = rootId || findTreeRootId(nodes);
  if (!root || !nodes[root]) return result;

  const queue: string[] = [root];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const n = nodes[currentId];
    if (n) {
      result.push(typeof n.value === 'number' ? n.value : Number(n.value));
      if (n.leftId && nodes[n.leftId]) queue.push(n.leftId);
      if (n.rightId && nodes[n.rightId]) queue.push(n.rightId);
    }
  }
  return result;
}

/**
 * Computes tree height (1-based maximum path from node to leaf).
 */
export function computeTreeHeight(
  nodes: Record<string, TreeNodeEntity>,
  nodeId?: string | null
): number {
  if (!nodeId || !nodes[nodeId]) return 0;
  const n = nodes[nodeId];
  const leftH = computeTreeHeight(nodes, n.leftId);
  const rightH = computeTreeHeight(nodes, n.rightId);
  return 1 + Math.max(leftH, rightH);
}

/**
 * Computes AVL Balance Factor: height(left) - height(right).
 */
export function computeBalanceFactor(
  nodes: Record<string, TreeNodeEntity>,
  nodeId: string
): number {
  if (!nodeId || !nodes[nodeId]) return 0;
  const n = nodes[nodeId];
  const leftH = computeTreeHeight(nodes, n.leftId);
  const rightH = computeTreeHeight(nodes, n.rightId);
  return leftH - rightH;
}

/**
 * Performs AVL Right Rotation (LL Rotation) at node y.
 *        y                  x
 *       / \                / \
 *      x   T3   --->      T1  y
 *     / \                    / \
 *    T1  T2                 T2  T3
 */
export function performRightRotation(
  nodes: Record<string, TreeNodeEntity>,
  yId: string
): Record<string, TreeNodeEntity> {
  const next: Record<string, TreeNodeEntity> = {
    ...Object.fromEntries(Object.entries(nodes).map(([k, v]) => [k, { ...v }])),
  };

  const y = next[yId];
  if (!y || !y.leftId || !next[y.leftId]) return next;
  const xId = y.leftId;
  const x = next[xId];
  const T2 = x.rightId;

  // Rotation
  x.rightId = yId;
  y.leftId = T2 || null;

  // Update parents
  x.parentId = y.parentId;
  y.parentId = xId;
  if (T2 && next[T2]) next[T2].parentId = yId;

  if (x.parentId && next[x.parentId]) {
    if (next[x.parentId].leftId === yId) {
      next[x.parentId].leftId = xId;
    } else if (next[x.parentId].rightId === yId) {
      next[x.parentId].rightId = xId;
    }
  }

  return next;
}

/**
 * Performs AVL Left Rotation (RR Rotation) at node x.
 *        x                  y
 *       / \                / \
 *      T1  y     --->     x   T3
 *         / \            / \
 *        T2  T3         T1  T2
 */
export function performLeftRotation(
  nodes: Record<string, TreeNodeEntity>,
  xId: string
): Record<string, TreeNodeEntity> {
  const next: Record<string, TreeNodeEntity> = {
    ...Object.fromEntries(Object.entries(nodes).map(([k, v]) => [k, { ...v }])),
  };

  const x = next[xId];
  if (!x || !x.rightId || !next[x.rightId]) return next;
  const yId = x.rightId;
  const y = next[yId];
  const T2 = y.leftId;

  // Rotation
  y.leftId = xId;
  x.rightId = T2 || null;

  // Update parents
  y.parentId = x.parentId;
  x.parentId = yId;
  if (T2 && next[T2]) next[T2].parentId = xId;

  if (y.parentId && next[y.parentId]) {
    if (next[y.parentId].leftId === xId) {
      next[y.parentId].leftId = yId;
    } else if (next[y.parentId].rightId === xId) {
      next[y.parentId].rightId = yId;
    }
  }

  return next;
}

/**
 * Deletes a BST node by value, handling leaf, 1-child, and 2-children cases.
 */
export function deleteBstNode(
  nodes: Record<string, TreeNodeEntity>,
  val: number
): Record<string, TreeNodeEntity> {
  const next: Record<string, TreeNodeEntity> = {
    ...Object.fromEntries(Object.entries(nodes).map(([k, v]) => [k, { ...v }])),
  };

  const target = Object.values(next).find((n) => n.value === val);
  if (!target) return next;

  const parent = target.parentId ? next[target.parentId] : null;

  // Case 1: Leaf node (no children)
  if (!target.leftId && !target.rightId) {
    if (parent) {
      if (parent.leftId === target.id) parent.leftId = null;
      if (parent.rightId === target.id) parent.rightId = null;
    }
    delete next[target.id];
    return next;
  }

  // Case 2: One child (only left or only right)
  if (!target.leftId || !target.rightId) {
    const childId = (target.leftId || target.rightId)!;
    const child = next[childId];
    if (child) child.parentId = target.parentId;
    if (parent) {
      if (parent.leftId === target.id) parent.leftId = childId;
      if (parent.rightId === target.id) parent.rightId = childId;
    }
    delete next[target.id];
    return next;
  }

  // Case 3: Two children -> find in-order successor (min in right subtree)
  let succId = target.rightId;
  while (next[succId]?.leftId) {
    succId = next[succId].leftId!;
  }
  const succ = next[succId];

  // Re-stitch successor's child to successor's parent
  const succParent = succ.parentId ? next[succ.parentId] : null;
  if (succParent && succParent.id !== target.id) {
    succParent.leftId = succ.rightId;
    if (succ.rightId && next[succ.rightId]) {
      next[succ.rightId].parentId = succParent.id;
    }
    succ.rightId = target.rightId;
    if (target.rightId && next[target.rightId]) {
      next[target.rightId].parentId = succ.id;
    }
  }

  succ.leftId = target.leftId;
  if (target.leftId && next[target.leftId]) {
    next[target.leftId].parentId = succ.id;
  }
  succ.parentId = target.parentId;

  if (parent) {
    if (parent.leftId === target.id) parent.leftId = succ.id;
    if (parent.rightId === target.id) parent.rightId = succ.id;
  }

  delete next[target.id];
  return next;
}

/**
 * Min-Heap sift-down step simulator.
 * Swaps heap array elements and returns step history.
 */
export function heapifySiftDown(
  heap: number[],
  startIndex: number
): { heap: number[]; swappedIndices: [number, number] }[] {
  const steps: { heap: number[]; swappedIndices: [number, number] }[] = [];
  const arr = [...heap];
  let i = startIndex;
  const n = arr.length;

  while (true) {
    let smallest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < n && arr[left] < arr[smallest]) {
      smallest = left;
    }
    if (right < n && arr[right] < arr[smallest]) {
      smallest = right;
    }

    if (smallest !== i) {
      const temp = arr[i];
      arr[i] = arr[smallest];
      arr[smallest] = temp;
      steps.push({
        heap: [...arr],
        swappedIndices: [i, smallest],
      });
      i = smallest;
    } else {
      break;
    }
  }

  return steps;
}

