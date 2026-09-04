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

  if (entities.stack) {
    result.stack = {
      ...entities.stack,
      items: [...entities.stack.items],
      highlights: entities.stack.highlights ? { ...entities.stack.highlights } : undefined,
    };
  }

  if (entities.queue) {
    result.queue = {
      ...entities.queue,
      items: [...entities.queue.items],
      highlights: entities.queue.highlights ? { ...entities.queue.highlights } : undefined,
    };
  }

  if (entities.graph) {
    result.graph = {
      ...entities.graph,
      nodes: Object.fromEntries(
        Object.entries(entities.graph.nodes).map(([k, v]) => [k, { ...v }])
      ),
      edges: entities.graph.edges.map((e) => ({ ...e })),
    };
  }

  if (entities.hashTable) {
    result.hashTable = {
      ...entities.hashTable,
      buckets: entities.hashTable.buckets.map((b) => ({
        ...b,
        chain: [...b.chain],
      })),
    };
  }

  if (entities.callStack) {
    result.callStack = {
      ...entities.callStack,
      frames: entities.callStack.frames.map((f) => ({
        ...f,
        args: { ...f.args },
      })),
    };
  }

  if (entities.dpTable) {
    result.dpTable = {
      ...entities.dpTable,
      rows: [...entities.dpTable.rows],
      cols: [...entities.dpTable.cols],
      cells: entities.dpTable.cells.map((row) => [...row]),
      dependencyCells: entities.dpTable.dependencyCells
        ? entities.dpTable.dependencyCells.map((d) => ({ ...d }))
        : undefined,
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

    case 'connect-doubly': {
      if (next.linkedListNodes[action.fromId]) {
        next.linkedListNodes[action.fromId].nextId = action.toId;
      }
      if (action.toId && next.linkedListNodes[action.toId]) {
        next.linkedListNodes[action.toId].prevId = action.fromId;
      }
      break;
    }

    case 'connect-circular': {
      if (next.linkedListNodes[action.tailId]) {
        next.linkedListNodes[action.tailId].nextId = action.headId;
        next.linkedListNodes[action.tailId].isCircular = true;
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

    // Stack Actions
    case 'push-stack': {
      if (next.stack) {
        next.stack.items.push(action.value);
        next.stack.currentOperation = 'push';
        if (!next.stack.highlights) next.stack.highlights = {};
        next.stack.highlights[next.stack.items.length - 1] = 'active';
      }
      break;
    }

    case 'pop-stack': {
      if (next.stack && next.stack.items.length > 0) {
        next.stack.items.pop();
        next.stack.currentOperation = 'pop';
        if (next.stack.highlights) {
          delete next.stack.highlights[next.stack.items.length];
        }
      }
      break;
    }

    case 'peek-stack': {
      if (next.stack && next.stack.items.length > 0) {
        next.stack.currentOperation = 'peek';
        if (!next.stack.highlights) next.stack.highlights = {};
        next.stack.highlights[next.stack.items.length - 1] = 'active';
      }
      break;
    }

    case 'clear-stack-highlights': {
      if (next.stack) {
        next.stack.highlights = {};
      }
      break;
    }

    // Queue Actions
    case 'enqueue': {
      if (next.queue) {
        next.queue.currentOperation = 'enqueue';
        if (next.queue.isCircular) {
          const cap = next.queue.capacity || next.queue.items.length || 5;
          const newRear = (next.queue.rear + 1) % cap;
          next.queue.rear = newRear;
          while (next.queue.items.length < cap) {
            next.queue.items.push(null);
          }
          next.queue.items[newRear] = action.value;
        } else {
          next.queue.items.push(action.value);
          next.queue.rear = next.queue.items.length - 1;
        }
      }
      break;
    }

    case 'dequeue': {
      if (next.queue) {
        next.queue.currentOperation = 'dequeue';
        if (next.queue.isCircular) {
          const cap = next.queue.capacity || next.queue.items.length || 5;
          next.queue.items[next.queue.front] = null;
          next.queue.front = (next.queue.front + 1) % cap;
        } else {
          next.queue.front = Math.min(next.queue.rear + 1, next.queue.front + 1);
        }
      }
      break;
    }

    case 'peek-queue': {
      if (next.queue) {
        next.queue.currentOperation = 'peek';
        if (!next.queue.highlights) next.queue.highlights = {};
        next.queue.highlights[next.queue.front] = 'active';
      }
      break;
    }

    case 'update-queue': {
      if (next.queue) {
        if (action.front !== undefined) next.queue.front = action.front;
        if (action.rear !== undefined) next.queue.rear = action.rear;
        if (action.items !== undefined) next.queue.items = [...action.items];
      }
      break;
    }

    // Graph Actions
    case 'add-graph-node': {
      if (next.graph) {
        next.graph.nodes[action.node.id] = { ...action.node };
      }
      break;
    }

    case 'remove-graph-node': {
      if (next.graph) {
        delete next.graph.nodes[action.nodeId];
        next.graph.edges = next.graph.edges.filter(
          (e) => e.from !== action.nodeId && e.to !== action.nodeId
        );
      }
      break;
    }

    case 'add-graph-edge': {
      if (next.graph) {
        next.graph.edges.push({ ...action.edge });
      }
      break;
    }

    case 'highlight-graph-node': {
      if (next.graph && next.graph.nodes[action.nodeId]) {
        next.graph.nodes[action.nodeId].highlight = action.state;
        if (action.distance !== undefined) {
          next.graph.nodes[action.nodeId].distance = action.distance;
        }
        if (action.visited !== undefined) {
          next.graph.nodes[action.nodeId].visited = action.visited;
        }
      }
      break;
    }

    case 'highlight-graph-edge': {
      if (next.graph) {
        const edge = next.graph.edges.find((e) => e.id === action.edgeId);
        if (edge) edge.highlight = action.state;
      }
      break;
    }

    // Hash Table Actions
    case 'hash-insert': {
      if (next.hashTable && next.hashTable.buckets[action.index]) {
        const b = next.hashTable.buckets[action.index];
        b.chain.push(action.value);
        b.value = action.value;
        if (action.isCollision !== undefined) b.isCollision = action.isCollision;
      }
      break;
    }

    case 'hash-probe': {
      if (next.hashTable && next.hashTable.buckets[action.index]) {
        next.hashTable.buckets[action.index].isProbed = true;
      }
      break;
    }

    // DP Table Actions
    case 'set-dp-cell': {
      if (next.dpTable && next.dpTable.cells[action.row]) {
        next.dpTable.cells[action.row][action.col] = action.value;
        next.dpTable.activeCell = { row: action.row, col: action.col };
        if (action.dependencies) {
          next.dpTable.dependencyCells = action.dependencies.map((d) => ({ ...d }));
        }
      }
      break;
    }

    // Call Stack Actions
    case 'push-call-frame': {
      if (next.callStack) {
        next.callStack.frames.push({ ...action.frame });
      }
      break;
    }

    case 'pop-call-frame': {
      if (next.callStack && next.callStack.frames.length > 0) {
        next.callStack.frames.pop();
      }
      break;
    }

    case 'set-frame-return': {
      if (next.callStack) {
        const frame = next.callStack.frames.find((f) => f.id === action.frameId);
        if (frame) {
          frame.returnValue = action.returnValue;
          frame.status = 'returning';
        }
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
