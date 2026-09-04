import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tldraw, track, useEditor } from '@tldraw/tldraw';
import type { Editor, TLComponents } from '@tldraw/tldraw';
import type { TimelineStep } from '../../types/studio';
import type { CanvasEntities } from '../../types/timeline';
import { ArrayShapeUtil } from '../../canvas/shapes/ArrayShapeUtil';
import { LinkedListNodeShapeUtil } from '../../canvas/shapes/LinkedListNodeShapeUtil';
import { BSTNodeShapeUtil } from '../../canvas/shapes/BSTNodeShapeUtil';
import { LoopTrackerShapeUtil } from '../../canvas/shapes/LoopTrackerShapeUtil';
import { layoutLinkedList } from '../../canvas/shapes/linkedListLogic';
import { layoutTree } from '../../canvas/shapes/treeLayoutLogic';
import { entityToLoopShapeProps } from '../../canvas/shapes/loopTrackerLogic';

interface WhiteboardCanvasProps {
  currentStep: TimelineStep;
  scenarioId: string;
  canvasState: CanvasEntities;
  onSeek?: (stepIndex: number) => void;
}

const customShapeUtils = [
  ArrayShapeUtil,
  LinkedListNodeShapeUtil,
  BSTNodeShapeUtil,
  LoopTrackerShapeUtil,
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
        const pRadius = 35; // 70px diameter circle
        const cx1 = parent.x + pRadius;
        const cy1 = parent.y + pRadius;

        // Left child branch
        if (parent.props?.leftId) {
          const child = treeByNodeId.get(parent.props.leftId);
          if (child) {
            const cx2 = child.x + pRadius;
            const cy2 = child.y + pRadius;
            const angle = Math.atan2(cy2 - cy1, cx2 - cx1);
            const x1 = cx1 + pRadius * Math.cos(angle);
            const y1 = cy1 + pRadius * Math.sin(angle);
            const x2 = cx2 - (pRadius + 2) * Math.cos(angle);
            const y2 = cy2 - (pRadius + 2) * Math.sin(angle);
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
            const cx2 = child.x + pRadius;
            const cy2 = child.y + pRadius;
            const angle = Math.atan2(cy2 - cy1, cx2 - cx1);
            const x1 = cx1 + pRadius * Math.cos(angle);
            const y1 = cy1 + pRadius * Math.sin(angle);
            const x2 = cx2 - (pRadius + 2) * Math.cos(angle);
            const y2 = cy2 - (pRadius + 2) * Math.sin(angle);
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

      {/* Render Linked List Pointers dynamically anchored to live shape coordinates */}
      {linkedShapes.map((node) => {
        const nextId = node.props?.nextId;
        if (!nextId) return null;
        const targetNode = linkedByNodeId.get(nextId);
        if (!targetNode) return null;

        const isForward = targetNode.x > node.x;

        if (isForward) {
          const startX = node.x + (node.props?.w || 160);
          const startY = node.y + 60;
          const endX = targetNode.x;
          const endY = targetNode.y + 60;

          return (
            <path
              key={`list-wire-${node.id}->${targetNode.id}`}
              d={`M ${startX} ${startY} L ${endX} ${endY}`}
              stroke="#4f46e5"
              strokeWidth="3"
              markerEnd="url(#canvas-list-arrow)"
            />
          );
        } else {
          // Backward / reversed pointer curve overhead
          const startX = node.x + 20;
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
  StylePanel: null,
};

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  currentStep,
  scenarioId,
  canvasState,
  onSeek,
}) => {
  const [editor, setEditor] = useState<Editor | null>(null);

  const variableCards = Object.values(canvasState.variables);
  const arrayEntity = canvasState.array;
  const linkedListNodes = canvasState.linkedListNodes;
  const treeNodes = canvasState.treeNodes;
  const loopEntity = canvasState.loop;

  const handleMount = useCallback((mountedEditor: Editor) => {
    setEditor(mountedEditor);
    if (typeof window !== 'undefined') {
      (window as any).__tldraw_editor = mountedEditor;
      const params = new URLSearchParams(window.location.search);
      const px = parseFloat(params.get('panX') || '0');
      const py = parseFloat(params.get('panY') || '0');
      if (px || py) {
        mountedEditor.setCamera({ x: px, y: py, z: 1 });
      }
    }
  }, []);

  // Compute layout coordinates for Linked List and BST
  const listPositions = useMemo(() => {
    if (scenarioId !== 'reverse-linked-list') return {};
    return layoutLinkedList(linkedListNodes, 80, 140, 220);
  }, [scenarioId, linkedListNodes]);

  const treeLayout = useMemo(() => {
    if (scenarioId !== 'bst-insert') return { positions: {}, connectors: [] };
    return layoutTree(treeNodes, 'n50', 100, 70, 120, 110);
  }, [scenarioId, treeNodes]);

  // Synchronize TLDraw shape canvas with pure reducer state
  useEffect(() => {
    if (!editor) return;

    // 1. Synchronize Array Shape (QuickSort)
    const arrayShapeId = 'shape:dsa-main-array' as any;
    if (scenarioId === 'quicksort-partition' && arrayEntity) {
      const existing = editor.getShape(arrayShapeId);
      const stringifiedHighlights = Object.fromEntries(
        Object.entries(arrayEntity.highlights).map(([k, v]) => [String(k), String(v)])
      );
      const targetWidth = Math.max(540, (arrayEntity.values.length + 1) * 75 + 80);

      if (existing) {
        editor.updateShape({
          id: arrayShapeId,
          type: 'dsa-array',
          x: 60,
          y: 70,
          props: {
            w: targetWidth,
            h: 230,
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
            w: targetWidth,
            h: 230,
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

        if (existing) {
          editor.updateShape({
            id: shapeId,
            type: 'dsa-linked-node',
            x: pos.x,
            y: pos.y,
            props: {
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
              w: 170,
              h: 120,
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

        if (existing) {
          editor.updateShape({
            id: shapeId,
            type: 'dsa-tree-node',
            x: pos.x,
            y: pos.y,
            props: {
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
              w: 70,
              h: 70,
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
      const loopProps = entityToLoopShapeProps(loopEntity, 380, 148);
      // Clean positioning on canvas
      const loopX = scenarioId === 'quicksort-partition' ? 620 : 80;
      const loopY = scenarioId === 'quicksort-partition' ? 70 : 340;

      if (existing) {
        editor.updateShape({
          id: loopShapeId,
          type: 'dsa-loop-tracker',
          x: loopX,
          y: loopY,
          props: { ...loopProps },
        } as any);
      } else {
        editor.createShape({
          id: loopShapeId,
          type: 'dsa-loop-tracker',
          x: loopX,
          y: loopY,
          props: { ...loopProps },
        } as any);
      }
    } else {
      const existing = editor.getShape(loopShapeId);
      if (existing) editor.deleteShape(loopShapeId);
    }
  }, [editor, scenarioId, arrayEntity, linkedListNodes, listPositions, treeNodes, treeLayout, loopEntity]);

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

      {/* On-Canvas Sketched Variable Cards (Floating Semantic Overlay Matching Design) */}
      <div className="absolute bottom-28 left-12 z-10 pointer-events-auto select-none bg-white/95 backdrop-blur-xs p-4 rounded-2xl border border-slate-200 shadow-xl max-w-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase tracking-wider">
            On-Canvas Variable Cards:
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
            Reactive State
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {variableCards.map((card) => {
            const isMint = card.color === 'mint';
            const isAmber = card.color === 'amber';
            return (
              <div
                key={card.name}
                className={`px-4 py-2 rounded-xl border-2 shadow-xs transition-transform duration-200 hover:scale-105 cursor-pointer ${
                  isMint
                    ? 'border-emerald-500/80 bg-emerald-50/80 text-emerald-800'
                    : isAmber
                    ? 'border-amber-400/80 bg-amber-50/80 text-amber-900'
                    : 'border-indigo-400/80 bg-indigo-50/80 text-indigo-900'
                }`}
              >
                <span className="font-handwriting text-xl font-bold">
                  {card.name} = {String(card.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
