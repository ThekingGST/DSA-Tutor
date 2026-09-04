import type { TLBaseShape } from '@tldraw/tldraw';

export const ARRAY_SHAPE_TYPE = 'dsa-array' as const;

export interface ArrayShapeProps {
  w: number;
  h: number;
  name: string;
  values: number[];
  pointers: Record<string, number>;
  highlights: Record<string, string>;
}

export type IArrayShape = TLBaseShape<'dsa-array', ArrayShapeProps>;

export const ARRAY_DEFAULT_PROPS: ArrayShapeProps = {
  w: 560,
  h: 230,
  name: 'arr',
  values: [29, 10, 14, 37, 13],
  pointers: { i: 0, j: 1, pivot: 4 },
  highlights: {},
};

/**
 * Computes dynamic width of the array shape based on slot count.
 */
export function computeArrayWidth(valuesCount: number, minWidth = 560): number {
  return Math.max(minWidth, (valuesCount + 2) * 80 + 80);
}

/**
 * Returns pointers stationed before index 0 (e.g. i = -1 in Lomuto partition).
 */
export function getPrePointers(pointers: Record<string, number>): [string, number][] {
  return Object.entries(pointers).filter(([, pIdx]) => Number(pIdx) < 0);
}

/**
 * Returns pointers pointing to a specific valid slot index.
 */
export function getActivePointersForSlot(
  pointers: Record<string, number>,
  slotIndex: number
): [string, number][] {
  return Object.entries(pointers).filter(([, pIdx]) => Number(pIdx) === slotIndex);
}

/**
 * Pure function: snaps a pointer to a target slot index.
 */
export function snapPointerToSlot(
  pointers: Record<string, number>,
  pointerName: string,
  targetIndex: number
): Record<string, number> {
  return {
    ...pointers,
    [pointerName]: targetIndex,
  };
}

/**
 * Pure function: updates a slot value at an index.
 */
export function updateSlotValue(
  values: number[],
  index: number,
  newValue: number
): number[] {
  if (index < 0 || index >= values.length) return [...values];
  const next = [...values];
  next[index] = newValue;
  return next;
}

/**
 * Pure function: appends a new element to array values.
 */
export function appendArraySlot(
  values: number[],
  newValue: number
): { nextValues: number[]; nextWidth: number } {
  const nextValues = [...values, newValue];
  const nextWidth = computeArrayWidth(nextValues.length);
  return { nextValues, nextWidth };
}

/**
 * Returns highlight state for a slot index.
 */
export function getSlotHighlight(
  highlights: Record<string, string>,
  index: number
): string {
  return highlights[String(index)] || 'default';
}
