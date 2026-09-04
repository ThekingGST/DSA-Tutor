import type { CanvasEntities, TreeNodeEntity, LinkedListNodeEntity } from '../types/timeline.ts';
import { cloneCanvasEntities } from '../core/timelineReducer.ts';

export interface MicroCommandResult {
  isMicroCommand: boolean;
  nextState?: CanvasEntities;
  message?: string;
  error?: string;
}

/**
 * Checks if an input prompt is an instant micro-command, and if so,
 * immutably updates the canvas entities state without an AI network roundtrip.
 */
export function executeMicroCommand(
  rawCommand: string,
  currentState: CanvasEntities
): MicroCommandResult {
  const trimmed = rawCommand.trim();

  // 1. CREATE / SET ARRAY: e.g. "create array [10, 5, 20, 8, 15]" or "create an array [10, 6, 8, 9, 10]" or "arr = [1, 2, 3]"
  const arrayMatch = trimmed.match(
    /^(?:create\s+(?:an?\s+)?array|make\s+(?:an?\s+)?array|array\s*=|arr\s*=|new\s+array|array)\s*\[?([\d\s,.-]+)\]?$/i
  );
  if (arrayMatch) {
    const rawNumbers = arrayMatch[1]
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map(Number)
      .filter((n) => !isNaN(n));

    if (rawNumbers.length > 0) {
      const next = cloneCanvasEntities(currentState);
      next.array = {
        id: 'dsa-main-array',
        name: 'arr',
        values: rawNumbers,
        pointers: {},
        highlights: {},
      };
      // Clean up previous algorithm artifacts so the new array starts fresh
      next.loop = undefined;
      next.treeNodes = {};
      next.linkedListNodes = {};
      next.variables = {
        length: { name: 'length', value: rawNumbers.length, color: 'indigo' },
      };
      return {
        isMicroCommand: true,
        nextState: next,
        message: `Created array with ${rawNumbers.length} elements: [${rawNumbers.join(', ')}]`,
      };
    }
  }

  // 2. APPEND TO ARRAY: e.g. "append 42" or "push 42" or "add 42 to array"
  const appendMatch = trimmed.match(/^(?:append|push|add)\s+(-?\d+)(?:\s+to\s+array)?$/i);
  if (appendMatch) {
    const val = Number(appendMatch[1]);
    const next = cloneCanvasEntities(currentState);
    if (!next.array) {
      next.array = {
        id: 'dsa-main-array',
        name: 'arr',
        values: [val],
        pointers: {},
        highlights: {},
      };
    } else {
      next.array.values.push(val);
    }
    return {
      isMicroCommand: true,
      nextState: next,
      message: `Appended ${val} to array`,
    };
  }

  // 3. CREATE / SET VARIABLE: e.g. "set max = 10" or "create variable secondMax = 5" or "var count = 0"
  const setVarMatch = trimmed.match(
    /^(?:create\s+variable|create\s+var|set\s+variable|set\s+var|set|var)\s+([a-zA-Z_]\w*)\s*=\s*(.+)$/i
  );
  if (setVarMatch) {
    const varName = setVarMatch[1];
    let varVal: string | number = setVarMatch[2].trim();
    if (!isNaN(Number(varVal)) && varVal !== '') {
      varVal = Number(varVal);
    }

    const next = cloneCanvasEntities(currentState);
    // Deterministic semantic pastel color selection
    let color: 'mint' | 'indigo' | 'amber' | 'purple' = 'indigo';
    const lowerName = varName.toLowerCase();
    if (lowerName.includes('max') || lowerName.includes('min') || lowerName.includes('found')) {
      color = 'mint';
    } else if (lowerName.includes('pivot') || lowerName.includes('key') || lowerName.includes('target')) {
      color = 'amber';
    } else if (lowerName.includes('count') || lowerName.includes('sum') || lowerName.includes('temp')) {
      color = 'purple';
    }

    next.variables[varName] = {
      name: varName,
      value: varVal,
      color,
      isUpdated: true,
    };

    return {
      isMicroCommand: true,
      nextState: next,
      message: `Set variable ${varName} = ${varVal}`,
    };
  }

  // 4. REMOVE VARIABLE: e.g. "remove variable max" or "delete var count"
  const delVarMatch = trimmed.match(/^(?:remove\s+variable|remove\s+var|delete\s+var|del\s+var)\s+([a-zA-Z_]\w*)$/i);
  if (delVarMatch) {
    const varName = delVarMatch[1];
    const next = cloneCanvasEntities(currentState);
    if (next.variables[varName]) {
      delete next.variables[varName];
      return {
        isMicroCommand: true,
        nextState: next,
        message: `Removed variable ${varName}`,
      };
    }
    return {
      isMicroCommand: true,
      nextState: next,
      message: `Variable ${varName} does not exist`,
    };
  }

  // 5. INSERT TREE NODE: e.g. "insert 35 into tree" or "tree insert 45" or "insert node 20"
  const treeInsertMatch = trimmed.match(
    /^(?:insert\s+(-?\d+)\s+into\s+tree|tree\s+insert\s+(-?\d+)|insert\s+node\s+(-?\d+)|add\s+node\s+(-?\d+))$/i
  );
  if (treeInsertMatch) {
    const val = Number(
      treeInsertMatch[1] || treeInsertMatch[2] || treeInsertMatch[3] || treeInsertMatch[4]
    );
    const next = cloneCanvasEntities(currentState);
    const newId = `node-${val}`;

    if (Object.keys(next.treeNodes).length === 0) {
      // First node becomes root
      next.treeNodes[newId] = {
        id: newId,
        value: val,
        leftId: null,
        rightId: null,
        parentId: null,
        highlight: 'active',
      };
    } else {
      // Simple BST insertion finding parent
      let currId: string | null = Object.values(next.treeNodes).find((n) => !n.parentId)?.id || null;
      let attached = false;

      while (currId && !attached) {
        const currNode: TreeNodeEntity = next.treeNodes[currId];
        if (val < currNode.value) {
          if (!currNode.leftId) {
            currNode.leftId = newId;
            next.treeNodes[newId] = {
              id: newId,
              value: val,
              leftId: null,
              rightId: null,
              parentId: currId,
              highlight: 'active',
            };
            attached = true;
          } else {
            currId = currNode.leftId;
          }
        } else {
          if (!currNode.rightId) {
            currNode.rightId = newId;
            next.treeNodes[newId] = {
              id: newId,
              value: val,
              leftId: null,
              rightId: null,
              parentId: currId,
              highlight: 'active',
            };
            attached = true;
          } else {
            currId = currNode.rightId;
          }
        }
      }
    }

    return {
      isMicroCommand: true,
      nextState: next,
      message: `Inserted Node(${val}) into tree`,
    };
  }

  // 6. CREATE LINKED LIST: e.g. "create list [1, 2, 3, 4]" or "linked list [10, 20]"
  const listMatch = trimmed.match(
    /^(?:create\s+linked\s+list|create\s+list|new\s+list|list\s*=|linked\s+list)\s*\[?([\d\s,.-]+)\]?$/i
  );
  if (listMatch) {
    const rawNumbers = listMatch[1]
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map(Number)
      .filter((n) => !isNaN(n));

    if (rawNumbers.length > 0) {
      const next = cloneCanvasEntities(currentState);
      next.linkedListNodes = {};
      let prevId: string | null = null;

      rawNumbers.forEach((val, idx) => {
        const nodeId = `n${idx + 1}`;
        const node: LinkedListNodeEntity = {
          id: nodeId,
          value: val,
          nextId: null,
          pointers: idx === 0 ? ['head'] : [],
        };
        next.linkedListNodes[nodeId] = node;

        if (prevId && next.linkedListNodes[prevId]) {
          next.linkedListNodes[prevId].nextId = nodeId;
        }
        prevId = nodeId;
      });

      return {
        isMicroCommand: true,
        nextState: next,
        message: `Created singly linked list with ${rawNumbers.length} nodes: ${rawNumbers.join(' -> ')} -> null`,
      };
    }
  }

  // 7. MOVE POINTER: e.g. "move pointer i to 3" or "pointer j = 2"
  const pointerMatch = trimmed.match(
    /^(?:move\s+pointer\s+([a-zA-Z_]\w*)\s+to\s+(\d+)|pointer\s+([a-zA-Z_]\w*)\s*=\s*(\d+))$/i
  );
  if (pointerMatch) {
    const pName = pointerMatch[1] || pointerMatch[3];
    const targetIdx = Number(pointerMatch[2] || pointerMatch[4]);
    const next = cloneCanvasEntities(currentState);
    if (!next.array) {
      return {
        isMicroCommand: true,
        error: 'No active array found to move pointer on.',
      };
    }
    next.array.pointers[pName] = targetIdx;
    return {
      isMicroCommand: true,
      nextState: next,
      message: `Moved pointer '${pName}' to slot index ${targetIdx}`,
    };
  }

  // 8. SWAP ARRAY SLOTS: e.g. "swap 1 2" or "swap slots 1 and 2"
  const swapMatch = trimmed.match(/^(?:swap\s+slots?\s+(\d+)\s+(?:and\s+)?(\d+)|swap\s+(\d+)\s+(\d+))$/i);
  if (swapMatch) {
    const idxA = Number(swapMatch[1] || swapMatch[3]);
    const idxB = Number(swapMatch[2] || swapMatch[4]);
    const next = cloneCanvasEntities(currentState);
    if (!next.array || !next.array.values) {
      return {
        isMicroCommand: true,
        error: 'No active array found to swap elements.',
      };
    }
    if (idxA < 0 || idxA >= next.array.values.length || idxB < 0 || idxB >= next.array.values.length) {
      return {
        isMicroCommand: true,
        error: `Indices ${idxA} and ${idxB} out of bounds for array length ${next.array.values.length}`,
      };
    }
    const temp = next.array.values[idxA];
    next.array.values[idxA] = next.array.values[idxB];
    next.array.values[idxB] = temp;
    next.array.highlights[idxA] = 'swapped';
    next.array.highlights[idxB] = 'swapped';
    return {
      isMicroCommand: true,
      nextState: next,
      message: `Swapped slot [${idxA}] (${next.array.values[idxB]}) with slot [${idxB}] (${temp})`,
    };
  }

  // Not a micro-command
  return { isMicroCommand: false };
}
