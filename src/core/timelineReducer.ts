import type {
  CanvasEntities,
  CanvasMutation,
  TimelineStep,
  HighlightState,
} from '../types/timeline';

/**
 * Creates an empty/default canvas entities state.
 */
export function createEmptyCanvasEntities(): CanvasEntities {
  return {
    linkedListNodes: {},
    treeNodes: {},
    variables: {},
  };
}

/**
 * Deep clones CanvasEntities to ensure purity during mutation application.
 */
export function cloneCanvasEntities(entities: CanvasEntities): CanvasEntities {
  const result: CanvasEntities = {
    linkedListNodes: Object.fromEntries(
      Object.entries(entities.linkedListNodes).map(([k, v]) => [
        k,
        { ...v, pointers: [...v.pointers] },
      ])
    ),
    treeNodes: Object.fromEntries(
      Object.entries(entities.treeNodes).map(([k, v]) => [k, { ...v }])
    ),
    variables: Object.fromEntries(
      Object.entries(entities.variables).map(([k, v]) => [k, { ...v }])
    ),
  };

  if (entities.array) {
    result.array = {
      ...entities.array,
      values: [...entities.array.values],
      pointers: { ...entities.array.pointers },
      highlights: { ...entities.array.highlights },
    };
  }

  if (entities.loop) {
    result.loop = {
      ...entities.loop,
      iterationPills: entities.loop.iterationPills ? [...entities.loop.iterationPills] : undefined,
    };
  }

  return result;
}

/**
 * Pure reducer function that applies a single atomic CanvasMutation to CanvasEntities.
 */
export function applyCanvasMutation(
  state: CanvasEntities,
  mutation: CanvasMutation
): CanvasEntities {
  const next = cloneCanvasEntities(state);
  const action = mutation.action;

  switch (action.kind) {
    case 'set-slot': {
      if (next.array && action.index >= 0 && action.index < next.array.values.length) {
        next.array.values[action.index] = action.value;
      }
      break;
    }

    case 'swap-slots': {
      if (
        next.array &&
        action.indexA >= 0 &&
        action.indexA < next.array.values.length &&
        action.indexB >= 0 &&
        action.indexB < next.array.values.length
      ) {
        const temp = next.array.values[action.indexA];
        next.array.values[action.indexA] = next.array.values[action.indexB];
        next.array.values[action.indexB] = temp;
      }
      break;
    }

    case 'move-pointer': {
      if (next.array) {
        next.array.pointers[action.name] = action.toIndex;
      }
      break;
    }

    case 'remove-pointer': {
      if (next.array) {
        delete next.array.pointers[action.name];
      }
      break;
    }

    case 'highlight-slots': {
      if (next.array) {
        for (const idx of action.indices) {
          next.array.highlights[idx] = action.state;
        }
      }
      break;
    }

    case 'clear-highlights': {
      if (next.array) {
        next.array.highlights = {};
      }
      break;
    }

    case 'set-variable': {
      next.variables[action.name] = {
        name: action.name,
        value: action.value,
        color: action.color || 'mint',
        isUpdated: true,
      };
      break;
    }

    case 'remove-variable': {
      delete next.variables[action.name];
      break;
    }

    case 'connect-nodes': {
      if (next.linkedListNodes[action.fromId]) {
        next.linkedListNodes[action.fromId].nextId = action.toId;
      }
      break;
    }

    case 'set-node-pointers': {
      if (next.linkedListNodes[action.nodeId]) {
        next.linkedListNodes[action.nodeId].pointers = [...action.pointers];
      }
      break;
    }

    case 'insert-tree-node': {
      next.treeNodes[action.nodeId] = {
        id: action.nodeId,
        value: action.value,
        leftId: null,
        rightId: null,
        parentId: action.parentId || null,
        highlight: 'default' as HighlightState,
      };
      if (action.parentId && next.treeNodes[action.parentId]) {
        if (action.branch === 'left') {
          next.treeNodes[action.parentId].leftId = action.nodeId;
        } else if (action.branch === 'right') {
          next.treeNodes[action.parentId].rightId = action.nodeId;
        }
      }
      break;
    }

    case 'highlight-tree-node': {
      if (next.treeNodes[action.nodeId]) {
        next.treeNodes[action.nodeId].highlight = action.state;
      }
      break;
    }

    case 'set-loop': {
      next.loop = {
        ...action.loop,
        iterationPills: action.loop.iterationPills ? [...action.loop.iterationPills] : undefined,
      };
      break;
    }

    case 'remove-loop': {
      delete next.loop;
      break;
    }

    case 'update-loop': {
      if (next.loop) {
        next.loop.currentIteration = action.iteration;
        next.loop.conditionText = action.conditionText;
        if (action.isComplete !== undefined) {
          next.loop.isComplete = action.isComplete;
        }
      } else {
        next.loop = {
          header: 'for loop',
          conditionText: action.conditionText,
          currentIteration: action.iteration,
          totalIterations: Math.max(4, action.iteration + 1),
          isComplete: !!action.isComplete,
        };
      }
      break;
    }
  }

  return next;
}

/**
 * Applies all mutations in a TimelineStep to the state.
 */
export function applyTimelineStep(
  state: CanvasEntities,
  step: TimelineStep
): CanvasEntities {
  let current = state;
  for (const mutation of step.mutations) {
    current = applyCanvasMutation(current, mutation);
  }
  return current;
}

/**
 * Computes the exact canvas state at a specific step index by folding from initialState.
 * This guarantees 100% deterministic time-travel and scrubbing.
 */
export function computeTimelineState(
  initialState: CanvasEntities,
  steps: TimelineStep[],
  targetStepIndex: number
): CanvasEntities {
  if (!steps.length || targetStepIndex < 0) {
    return cloneCanvasEntities(initialState);
  }

  const boundedIndex = Math.min(targetStepIndex, steps.length - 1);
  let current = cloneCanvasEntities(initialState);

  for (let i = 0; i <= boundedIndex; i++) {
    current = applyTimelineStep(current, steps[i]);
  }

  return current;
}
