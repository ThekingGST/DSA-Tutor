import type { LoopTrackerEntity } from '../../types/timeline';

export const LOOP_TRACKER_SHAPE_TYPE = 'dsa-loop-tracker';

export type LoopEvalState = 'true' | 'false' | 'evaluating' | 'completed' | 'neutral';
export type PillStatus = 'pending' | 'active' | 'completed';

export interface LoopTrackerShapeProps {
  w: number;
  h: number;
  header: string;
  conditionText: string;
  currentIteration: number;
  totalIterations: number;
  isComplete: boolean;
  iterationPills: string[];
  evalState: LoopEvalState;
}

export const LOOP_TRACKER_DEFAULT_PROPS: LoopTrackerShapeProps = {
  w: 420,
  h: 148,
  header: 'for j in range(low, high)',
  conditionText: 'j < high (Evaluating)',
  currentIteration: 0,
  totalIterations: 4,
  isComplete: false,
  iterationPills: ['j = 0', 'j = 1', 'j = 2', 'j = 3'],
  evalState: 'neutral',
};

/**
 * Derives the pill status given pill index, current iteration, and completion state.
 */
export function getPillStatus(
  pillIndex: number,
  currentIteration: number,
  isComplete: boolean
): PillStatus {
  if (isComplete) return 'completed';
  if (pillIndex === currentIteration) return 'active';
  if (pillIndex < currentIteration) return 'completed';
  return 'pending';
}

/**
 * Calculates percentage completion (0 - 100) for a loop.
 */
export function calculateLoopProgress(
  currentIteration: number,
  totalIterations: number,
  isComplete: boolean
): number {
  if (totalIterations <= 0) return 100;
  if (isComplete) return 100;
  const clamped = Math.max(0, Math.min(currentIteration, totalIterations));
  return Math.round((clamped / totalIterations) * 100);
}

/**
 * Pure function to advance or seek loop iteration with bounds safety.
 */
export function advanceLoopIteration(
  loop: LoopTrackerEntity,
  targetIteration: number,
  conditionText?: string,
  isComplete?: boolean
): LoopTrackerEntity {
  const maxIter = Math.max(1, loop.totalIterations);
  const clamped = Math.max(0, Math.min(targetIteration, maxIter));
  const completed = isComplete !== undefined ? isComplete : clamped >= maxIter;

  return {
    ...loop,
    currentIteration: clamped,
    conditionText: conditionText !== undefined ? conditionText : loop.conditionText,
    isComplete: completed,
  };
}

/**
 * Steps iteration forward or backward by 1.
 */
export function stepLoopIteration(
  loop: LoopTrackerEntity,
  direction: 'next' | 'prev'
): LoopTrackerEntity {
  const delta = direction === 'next' ? 1 : -1;
  const target = loop.currentIteration + delta;
  return advanceLoopIteration(loop, target);
}

/**
 * Formats a conditional comparison expression and determines evaluation color.
 */
export function formatConditionEvaluation(
  lhs: string | number,
  op: '<' | '<=' | '>' | '>=' | '==' | '!=' | '!==',
  rhs: string | number,
  result: boolean
): { text: string; evalState: LoopEvalState } {
  return {
    text: `${lhs} ${op} ${rhs} ➔ ${result ? 'True' : 'False'}`,
    evalState: result ? 'true' : 'false',
  };
}

/**
 * Converts a LoopTrackerEntity into TLDraw LoopTrackerShapeProps.
 */
export function entityToLoopShapeProps(
  entity: LoopTrackerEntity,
  width = 420,
  height = 148
): LoopTrackerShapeProps {
  const pills =
    entity.iterationPills && entity.iterationPills.length > 0
      ? entity.iterationPills
      : Array.from({ length: entity.totalIterations }, (_, i) =>
          entity.variableName ? `${entity.variableName}=${i}` : `Iter ${i}`
        );

  let evalState: LoopEvalState = 'neutral';
  if (entity.isComplete) {
    evalState = 'completed';
  } else if (entity.conditionText.toLowerCase().includes('true')) {
    evalState = 'true';
  } else if (entity.conditionText.toLowerCase().includes('false')) {
    evalState = 'false';
  } else if (entity.conditionText.toLowerCase().includes('eval')) {
    evalState = 'evaluating';
  }

  return {
    w: width,
    h: height,
    header: entity.header,
    conditionText: entity.conditionText,
    currentIteration: entity.currentIteration,
    totalIterations: entity.totalIterations,
    isComplete: entity.isComplete,
    iterationPills: pills,
    evalState,
  };
}
