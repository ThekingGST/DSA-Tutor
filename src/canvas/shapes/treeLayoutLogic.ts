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
