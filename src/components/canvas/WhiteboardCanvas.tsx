import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Tldraw, track, useEditor } from '@tldraw/tldraw';
import type { Editor, TLComponents } from '@tldraw/tldraw';
import type { TimelineStep } from '../../types/studio';
import type { CanvasEntities } from '../../types/timeline';
import { ArrayShapeUtil } from '../../canvas/shapes/ArrayShapeUtil';
import { LinkedListNodeShapeUtil } from '../../canvas/shapes/LinkedListNodeShapeUtil';
import { BSTNodeShapeUtil } from '../../canvas/shapes/BSTNodeShapeUtil';
import { LoopTrackerShapeUtil } from '../../canvas/shapes/LoopTrackerShapeUtil';
import { VariableCardsShapeUtil } from '../../canvas/shapes/VariableCardsShapeUtil';
import { layoutLinkedList } from '../../canvas/shapes/linkedListLogic';
import { layoutTree } from '../../canvas/shapes/treeLayoutLogic';
import { entityToLoopShapeProps } from '../../canvas/shapes/loopTrackerLogic';
import { entityMapToVariableItems } from '../../canvas/shapes/variableCardsLogic';
import {
  calculateArrayPanelDimensions,
  calculateVarsPanelDimensions,
  calculateLoopPanelDimensions,
  calculateLinkedListNodeDimensions,
  calculateTreeNodeDimensions,
} from '../../canvas/shapes/panelLayoutLogic';

interface WhiteboardCanvasProps {
  currentStep: TimelineStep;
  scenarioId: string;
  canvasState: CanvasEntities;
  onSeek?: (stepIndex: number) => void;
  onEditorMount?: (editor: Editor) => void;
}

const customShapeUtils = [
  ArrayShapeUtil,
  LinkedListNodeShapeUtil,
  BSTNodeShapeUtil,
  LoopTrackerShapeUtil,
  VariableCardsShapeUtil,
];

/**
 * OnTheCanvas Connectors Overlay
 * Mounts directly inside TLDraw's canvas layer (tl-html-layer) so that
 * all arrows and connectors inherit the canvas camera transforms (pan & zoom)
 * automatically at 60/120fps GPU acceleration.
 */
const CanvasConnectorsOverlay = track(() => {
  const editor = useEditor();
  const allShapes = editor.getCurrentPageShapes();

  // Gather all linked list and tree shapes
  const linkedShapes: any[] = allShapes.filter((s: any) => s.type === 'dsa-linked-node');
  const treeShapes: any[] = allShapes.filter((s: any) => s.type === 'dsa-tree-node');

  if (linkedShapes.length === 0 && treeShapes.length === 0) {
    return null;
  }

  // Fast lookups by nodeId or shapeId
  const linkedByNodeId = new Map<string, any>();
  for (const s of linkedShapes) {
    const nodeId = s.props?.nodeId || s.id.replace('shape:dsa-linked-', '');
    linkedByNodeId.set(nodeId, s);
  }

  const treeByNodeId = new Map<string, any>();
  for (const s of treeShapes) {
    const nodeId = s.props?.nodeId || s.id.replace('shape:dsa-tree-', '');
    treeByNodeId.set(nodeId, s);
  }

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <defs>
        {/* Tree Arrow Marker */}
        <marker
          id="canvas-tree-arrow"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
        </marker>

        {/* Forward Linked List Arrow Marker */}
        <marker
          id="canvas-list-arrow"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#4f46e5" />
        </marker>

        {/* Reverse Linked List Arrow Marker */}
        <marker
          id="canvas-list-arrow-reverse"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
        </marker>
      </defs>

      {/* Render Tree Branches dynamically anchored to live shape coordinates */}
      {treeShapes.map((parent) => {
        const branches: React.ReactNode[] = [];
        const pRadius = (parent.props?.w || 76) / 2;
        const cx1 = parent.x + pRadius;
        const cy1 = parent.y + (parent.props?.h || 76) / 2;

        // Left child branch
        if (parent.props?.leftId) {
          const child = treeByNodeId.get(parent.props.leftId);
          if (child) {
            const cRadius = (child.props?.w || 76) / 2;
            const cx2 = child.x + cRadius;
            const cy2 = child.y + (child.props?.h || 76) / 2;
            const angle = Math.atan2(cy2 - cy1, cx2 - cx1);
            const x1 = cx1 + pRadius * Math.cos(angle);
            const y1 = cy1 + pRadius * Math.sin(angle);
            const x2 = cx2 - (cRadius + 2) * Math.cos(angle);
            const y2 = cy2 - (cRadius + 2) * Math.sin(angle);
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            branches.push(
              <g key={`tree-${parent.id}->${child.id}-left`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  markerEnd="url(#canvas-tree-arrow)"
                />
                <circle
                  cx={midX}
                  cy={midY}
                  r="10"
                  fill="#e0e7ff"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                />
                <text
                  x={midX}
                  y={midY + 3.5}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill="#4338ca"
                >
                  L
                </text>
              </g>
            );
          }
        }

        // Right child branch
        if (parent.props?.rightId) {
          const child = treeByNodeId.get(parent.props.rightId);
          if (child) {
            const cRadius = (child.props?.w || 76) / 2;
            const cx2 = child.x + cRadius;
            const cy2 = child.y + (child.props?.h || 76) / 2;
            const angle = Math.atan2(cy2 - cy1, cx2 - cx1);
            const x1 = cx1 + pRadius * Math.cos(angle);
            const y1 = cy1 + pRadius * Math.sin(angle);
            const x2 = cx2 - (cRadius + 2) * Math.cos(angle);
            const y2 = cy2 - (cRadius + 2) * Math.sin(angle);
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;


            branches.push(
              <g key={`tree-${parent.id}->${child.id}-right`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  markerEnd="url(#canvas-tree-arrow)"
                />
                <circle
                  cx={midX}
                  cy={midY}
                  r="10"
                  fill="#e0e7ff"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                />
                <text
                  x={midX}
                  y={midY + 3.5}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill="#4338ca"
                >
                  R
                </text>
              </g>
            );
          }
        }
        return branches;
      })}

      {/* Dynamic Linked List Arrows */}
      {linkedShapes.map((shape) => {
        const node = shape as any;
        const nextId = node.props?.nextId;
        if (!nextId) return null;

        const targetNode = linkedByNodeId.get(nextId);
        if (!targetNode) return null;

        const isForward = targetNode.x > node.x;
        if (isForward) {
          const startX = node.x + (node.props?.w || 160) - 10;
          const startY = node.y + (node.props?.h || 60) / 2;
          const endX = targetNode.x + 2;
          const endY = targetNode.y + (targetNode.props?.h || 60) / 2;

          return (
            <path
              key={`list-wire-${node.id}->${targetNode.id}`}
              d={`M ${startX} ${startY} C ${startX + 30} ${startY}, ${endX - 30} ${endY}, ${endX} ${endY}`}
              stroke="#6366f1"
              strokeWidth="2.5"
              fill="none"
              markerEnd="url(#canvas-list-arrow)"
            />
          );
        } else {
          const startX = node.x + (node.props?.w || 160) - 20;
          const startY = node.y + 10;
          const endX = targetNode.x + (targetNode.props?.w || 160) - 20;
          const endY = targetNode.y + 10;
          const midY = Math.min(node.y, targetNode.y) - 45;

          return (
            <path
              key={`list-wire-${node.id}->${targetNode.id}`}
              d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
              stroke="#f59e0b"
              strokeWidth="3"
              strokeDasharray="6 3"
              fill="none"
              markerEnd="url(#canvas-list-arrow-reverse)"
            />
          );
        }
      })}
    </svg>
  );
});

const customComponents: TLComponents = {
  OnTheCanvas: CanvasConnectorsOverlay,
  MainMenu: null,
  PageMenu: null,
  QuickActions: null,
  ActionsMenu: null,
  HelpMenu: null,
  NavigationPanel: null,
  Toolbar: null,
  StylePanel: null,
  MenuPanel: null,
  Minimap: null,
  TopPanel: null,
  SharePanel: null,
};

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  currentStep,
  scenarioId,
  canvasState,
  onSeek,
  onEditorMount,
}) => {
  const [editor, setEditor] = useState<Editor | null>(null);

  const variableCards = Object.values(canvasState.variables);
  const arrayEntity = canvasState.array;
  const linkedListNodes = canvasState.linkedListNodes;
  const treeNodes = canvasState.treeNodes;
  const loopEntity = canvasState.loop;

  // Track previous variable values to trigger smooth pulse animations on value change
  const [varSnapshot, setVarSnapshot] = useState<{
    prev: Record<string, string | number>;
    curr: Record<string, string | number>;
  }>({ prev: {}, curr: {} });

  const currentVarMap = useMemo(() => {
    const map: Record<string, string | number> = {};
    for (const card of variableCards) {
      map[card.name] = card.value;
    }
    return map;
  }, [variableCards]);

  const hasVarChanged =
    Object.keys(currentVarMap).some((k) => currentVarMap[k] !== varSnapshot.curr[k]) ||
    Object.keys(varSnapshot.curr).some((k) => currentVarMap[k] !== varSnapshot.curr[k]);

  if (hasVarChanged) {
    setVarSnapshot({
      prev: varSnapshot.curr,
      curr: currentVarMap,
    });
  }

  const changedVars = useMemo(() => {
    const changed = new Set<string>();
    for (const card of variableCards) {
      if (varSnapshot.prev[card.name] !== undefined && varSnapshot.prev[card.name] !== card.value) {
        changed.add(card.name);
      }
    }
    return changed;
  }, [variableCards, varSnapshot]);

  // When switching presets, clear previous shapes so new scenario initializes cleanly
  const prevScenarioRef = useRef(scenarioId);
  useEffect(() => {
    if (!editor) return;
    if (prevScenarioRef.current !== scenarioId) {
      prevScenarioRef.current = scenarioId;
      const allShapes = editor.getCurrentPageShapeIds();
      for (const id of allShapes) {
        if (String(id).startsWith('shape:dsa-')) {
          editor.deleteShape(id);
        }
      }
    }
  }, [editor, scenarioId]);

  const handleMount = useCallback(
    (mountedEditor: Editor) => {
      setEditor(mountedEditor);
      onEditorMount?.(mountedEditor);
      if (typeof window !== 'undefined') {
        (window as any).__tldraw_editor = mountedEditor;
        const params = new URLSearchParams(window.location.search);
        const px = parseFloat(params.get('panX') || '0');
        const py = parseFloat(params.get('panY') || '0');
        if (px || py) {
          mountedEditor.setCamera({ x: px, y: py, z: 1 });
        }
      }
    },
    [onEditorMount]
  );

  // Compute layout coordinates for Linked List and BST
  const listPositions = useMemo(() => {
    if (scenarioId !== 'reverse-linked-list') return {};
    return layoutLinkedList(linkedListNodes, 80, 140, 220);
  }, [scenarioId, linkedListNodes]);

  const treeLayout = useMemo(() => {
    if (scenarioId !== 'bst-insert') return { positions: {}, connectors: [] };
    return layoutTree(treeNodes, 'n50', 60, 70, 110, 110);
  }, [scenarioId, treeNodes]);

  // Synchronize TLDraw shape canvas with pure reducer state
  // PERSISTENCE GUARANTEE: Never overwrite x and y on existing shapes so user drag positions persist across steps!
  useEffect(() => {
    if (!editor) return;

    // 1. Synchronize Array Shape (QuickSort)
    const arrayShapeId = 'shape:dsa-main-array' as any;
    if (scenarioId === 'quicksort-partition' && arrayEntity) {
      const existing = editor.getShape(arrayShapeId);
      const stringifiedHighlights = Object.fromEntries(
        Object.entries(arrayEntity.highlights).map(([k, v]) => [String(k), String(v)])
      );
      const adaptedArrayDims = calculateArrayPanelDimensions(arrayEntity.values.length);

      if (existing) {
        // Do NOT pass x and y to preserve user positioning across steps
        editor.updateShape({
          id: arrayShapeId,
          type: 'dsa-array',
          props: {
            w: adaptedArrayDims.w,
            h: adaptedArrayDims.h,
            values: [...arrayEntity.values],
            pointers: { ...arrayEntity.pointers },
            highlights: stringifiedHighlights,
          },
        } as any);
      } else {
        editor.createShape({
          id: arrayShapeId,
          type: 'dsa-array',
          x: 60,
          y: 70,
          props: {
            w: adaptedArrayDims.w,
            h: adaptedArrayDims.h,
            name: arrayEntity.name || 'arr',
            values: [...arrayEntity.values],
            pointers: { ...arrayEntity.pointers },
            highlights: stringifiedHighlights,
          },
        } as any);
      }
    } else {
      const existing = editor.getShape(arrayShapeId);
      if (existing) editor.deleteShape(arrayShapeId);
    }

    // 2. Synchronize Linked List Node Shapes (Reverse Linked List)
    if (scenarioId === 'reverse-linked-list') {
      const nodeIds = Object.keys(linkedListNodes);
      for (const nodeId of nodeIds) {
        const node = linkedListNodes[nodeId];
        const pos = listPositions[nodeId] || { x: 100, y: 140 };
        const shapeId = `shape:dsa-linked-${nodeId}` as any;
        const existing = editor.getShape(shapeId);
        const adaptedListDims = calculateLinkedListNodeDimensions(node.pointers.length, node.value);

        if (existing) {
          // Do NOT pass x and y to preserve user positioning across steps
          editor.updateShape({
            id: shapeId,
            type: 'dsa-linked-node',
            props: {
              w: adaptedListDims.w,
              h: adaptedListDims.h,
              value: node.value,
              nextId: node.nextId,
              pointers: [...node.pointers],
              highlight: node.pointers.includes('curr')
                ? 'active'
                : node.pointers.includes('prev')
                ? 'sorted'
                : 'default',
            },
          } as any);
        } else {
          editor.createShape({
            id: shapeId,
            type: 'dsa-linked-node',
            x: pos.x,
            y: pos.y,
            props: {
              w: adaptedListDims.w,
              h: adaptedListDims.h,
              nodeId: node.id,
              value: node.value,
              nextId: node.nextId,
              pointers: [...node.pointers],
              highlight: node.pointers.includes('curr') ? 'active' : 'default',
            },
          } as any);
        }
      }
    } else {
      // Clean up linked nodes if switched away
      const allShapes = editor.getCurrentPageShapeIds();
      for (const id of allShapes) {
        if (String(id).includes('dsa-linked-')) {
          editor.deleteShape(id);
        }
      }
    }

    // 3. Synchronize BST Tree Node Shapes
    if (scenarioId === 'bst-insert') {
      const nodeIds = Object.keys(treeNodes);
      for (const nodeId of nodeIds) {
        const node = treeNodes[nodeId];
        const pos = treeLayout.positions[nodeId] || { x: 100, y: 100 };
        const shapeId = `shape:dsa-tree-${nodeId}` as any;
        const existing = editor.getShape(shapeId);
        const adaptedTreeDims = calculateTreeNodeDimensions(node.value);

        if (existing) {
          // Do NOT pass x and y to preserve user positioning across steps
          editor.updateShape({
            id: shapeId,
            type: 'dsa-tree-node',
            props: {
              w: adaptedTreeDims.w,
              h: adaptedTreeDims.h,
              value: node.value,
              leftId: node.leftId,
              rightId: node.rightId,
              parentId: node.parentId,
              highlight: node.highlight,
            },
          } as any);
        } else {
          editor.createShape({
            id: shapeId,
            type: 'dsa-tree-node',
            x: pos.x,
            y: pos.y,
            props: {
              w: adaptedTreeDims.w,
              h: adaptedTreeDims.h,
              nodeId: node.id,
              value: node.value,
              leftId: node.leftId,
              rightId: node.rightId,
              parentId: node.parentId,
              highlight: node.highlight,
            },
          } as any);
        }
      }
    } else {
      // Clean up tree shapes if switched away
      const allShapes = editor.getCurrentPageShapeIds();
      for (const id of allShapes) {
        if (String(id).includes('dsa-tree-')) {
          editor.deleteShape(id);
        }
      }
    }

    // 4. Synchronize Loop Tracker Shape
    const loopShapeId = 'shape:dsa-main-loop' as any;
    if (loopEntity) {
      const existing = editor.getShape(loopShapeId);
      const loopPillsCount = loopEntity.iterationPills?.length || loopEntity.totalIterations;
      const adaptedLoopDims = calculateLoopPanelDimensions(
        loopPillsCount,
        loopEntity.header,
        loopEntity.conditionText
      );
      const loopProps = entityToLoopShapeProps(loopEntity, adaptedLoopDims.w, adaptedLoopDims.h);
      const loopX = scenarioId === 'quicksort-partition' ? 620 : 80;
      const loopY = scenarioId === 'quicksort-partition' ? 70 : 340;

      if (existing) {
        // Do NOT pass x and y to preserve user positioning across steps
        editor.updateShape({
          id: loopShapeId,
          type: 'dsa-loop-tracker',
          props: {
            ...loopProps,
            w: adaptedLoopDims.w,
            h: adaptedLoopDims.h,
          },
        } as any);
      } else {
        editor.createShape({
          id: loopShapeId,
          type: 'dsa-loop-tracker',
          x: loopX,
          y: loopY,
          props: {
            ...loopProps,
            w: adaptedLoopDims.w,
            h: adaptedLoopDims.h,
          },
        } as any);
      }
    } else {
      const existing = editor.getShape(loopShapeId);
      if (existing) editor.deleteShape(loopShapeId);
    }

    // 5. Synchronize On-Canvas Variable Cards Shape
    const varShapeId = 'shape:dsa-main-variables' as any;
    if (variableCards.length > 0) {
      const existing = editor.getShape(varShapeId);
      const varItems = entityMapToVariableItems(canvasState.variables, changedVars);
      const adaptedVarDims = calculateVarsPanelDimensions(varItems.length);
      const defaultX = scenarioId === 'quicksort-partition' ? 60 : scenarioId === 'bst-insert' ? 600 : 570;
      const defaultY = scenarioId === 'bst-insert' ? 70 : 340;

      if (existing) {
        // Do NOT pass x and y to preserve user positioning across steps
        editor.updateShape({
          id: varShapeId,
          type: 'dsa-variable-cards',
          props: {
            w: adaptedVarDims.w,
            h: adaptedVarDims.h,
            title: 'vars',
            variables: varItems,
          },
        } as any);
      } else {
        editor.createShape({
          id: varShapeId,
          type: 'dsa-variable-cards',
          x: defaultX,
          y: defaultY,
          props: {
            w: adaptedVarDims.w,
            h: adaptedVarDims.h,
            title: 'vars',
            variables: varItems,
          },
        } as any);
      }

    } else {
      const existing = editor.getShape(varShapeId);
      if (existing) editor.deleteShape(varShapeId);
    }
  }, [
    editor,
    scenarioId,
    arrayEntity,
    linkedListNodes,
    listPositions,
    treeNodes,
    treeLayout,
    loopEntity,
    variableCards,
    canvasState.variables,
    changedVars,
  ]);

  // Handle direct manipulation seek events from on-canvas loop iteration pills
  useEffect(() => {
    const handleLoopStep = (e: Event) => {
      const customEvent = e as CustomEvent<{ iteration: number }>;
      const iter = customEvent.detail?.iteration;
      if (onSeek && iter !== undefined) {
        onSeek(Math.min(currentStep.stepNumber, iter + 1));
      }
    };
    window.addEventListener('dsa:loop-step', handleLoopStep);
    return () => window.removeEventListener('dsa:loop-step', handleLoopStep);
  }, [onSeek, currentStep]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#fafafa]">
      {/* TLDraw Whiteboard Canvas Engine with OnTheCanvas Connectors */}
      <div className="absolute inset-0 z-0">
        <Tldraw
          shapeUtils={customShapeUtils}
          components={customComponents}
          options={{ maxFontsToLoadBeforeRender: 0 }}
          onMount={handleMount}
        />
      </div>
    </div>
  );
};
