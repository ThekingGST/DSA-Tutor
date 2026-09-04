import type { TLBaseShape } from '@tldraw/tldraw';
import type { LinkedListNodeEntity } from '../../types/timeline';

export const LINKED_LIST_SHAPE_TYPE = 'dsa-linked-node' as const;

export interface LinkedListNodeShapeProps {
  w: number;
  h: number;
  nodeId: string;
  value: number | string;
  nextId: string | null;
  pointers: string[];
  highlight: string;
}

export type ILinkedListNodeShape = TLBaseShape<'dsa-linked-node', LinkedListNodeShapeProps>;

export const LINKED_LIST_DEFAULT_PROPS: LinkedListNodeShapeProps = {
  w: 160,
  h: 110,
  nodeId: 'node-1',
  value: 1,
  nextId: null,
  pointers: ['head'],
  highlight: 'default',
};

export const POINTER_BADGE_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  head: { bg: 'bg-indigo-600', text: 'text-white', ring: 'ring-indigo-400' },
  prev: { bg: 'bg-amber-600', text: 'text-white', ring: 'ring-amber-400' },
  curr: { bg: 'bg-purple-600', text: 'text-white', ring: 'ring-purple-400' },
  next: { bg: 'bg-blue-600', text: 'text-white', ring: 'ring-blue-400' },
  newHead: { bg: 'bg-emerald-600', text: 'text-white', ring: 'ring-emerald-400' },
  tail: { bg: 'bg-rose-600', text: 'text-white', ring: 'ring-rose-400' },
};

/**
 * Computes deterministic (x, y) canvas coordinates for a sequence of linked list nodes.
 */
export function layoutLinkedList(
  nodes: Record<string, LinkedListNodeEntity>,
  startX = 100,
  startY = 140,
  spacing = 210
): Record<string, { x: number; y: number }> {
  const result: Record<string, { x: number; y: number }> = {};
  const entries = Object.values(nodes);

  entries.forEach((node, idx) => {
    result[node.id] = {
      x: startX + idx * spacing,
      y: startY,
    };
  });

  return result;
}

/**
 * Pure function: connects fromId.next to toId (or null).
 */
export function connectNodes(
  nodes: Record<string, LinkedListNodeEntity>,
  fromId: string,
  toId: string | null
): Record<string, LinkedListNodeEntity> {
  if (!nodes[fromId]) return { ...nodes };
  return {
    ...nodes,
    [fromId]: {
      ...nodes[fromId],
      nextId: toId,
    },
  };
}

/**
 * Pure function: updates a node's display value.
 */
export function updateNodeValue(
  nodes: Record<string, LinkedListNodeEntity>,
  nodeId: string,
  newValue: number | string
): Record<string, LinkedListNodeEntity> {
  if (!nodes[nodeId]) return { ...nodes };
  return {
    ...nodes,
    [nodeId]: {
      ...nodes[nodeId],
      value: newValue,
    },
  };
}

/**
 * Pure function: sets the pointer labels attached to a node.
 */
export function setNodePointers(
  nodes: Record<string, LinkedListNodeEntity>,
  nodeId: string,
  pointers: string[]
): Record<string, LinkedListNodeEntity> {
  if (!nodes[nodeId]) return { ...nodes };
  return {
    ...nodes,
    [nodeId]: {
      ...nodes[nodeId],
      pointers: [...pointers],
    },
  };
}
