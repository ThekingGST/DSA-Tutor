import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tldraw } from '@tldraw/tldraw';
import type { Editor } from '@tldraw/tldraw';
import type { TimelineStep } from '../../types/studio';
import type { CanvasEntities } from '../../types/timeline';
import { ArrayShapeUtil } from '../../canvas/shapes/ArrayShapeUtil';
import { LinkedListNodeShapeUtil } from '../../canvas/shapes/LinkedListNodeShapeUtil';
import { BSTNodeShapeUtil } from '../../canvas/shapes/BSTNodeShapeUtil';
import { layoutLinkedList } from '../../canvas/shapes/linkedListLogic';
import { layoutTree } from '../../canvas/shapes/treeLayoutLogic';

interface WhiteboardCanvasProps {
  currentStep: TimelineStep;
  scenarioId: string;
  canvasState: CanvasEntities;
}

const customShapeUtils = [ArrayShapeUtil, LinkedListNodeShapeUtil, BSTNodeShapeUtil];

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  scenarioId,
  canvasState,
}) => {
  const [editor, setEditor] = useState<Editor | null>(null);

  const variableCards = Object.values(canvasState.variables);
  const arrayEntity = canvasState.array;
  const linkedListNodes = canvasState.linkedListNodes;
  const treeNodes = canvasState.treeNodes;

  const handleMount = useCallback((mountedEditor: Editor) => {
    setEditor(mountedEditor);
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
      const targetWidth = Math.max(560, (arrayEntity.values.length + 1) * 80 + 100);

      if (existing) {
        editor.updateShape({
          id: arrayShapeId,
          type: 'dsa-array',
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
          x: 100,
          y: 80,
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
              w: 160,
              h: 110,
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
      // Clean up linked list shapes if switched away
      const allShapes = editor.getCurrentPageShapeIds();
      for (const id of allShapes) {
        if (String(id).includes('dsa-linked-')) {
          editor.deleteShape(id);
        }
      }
    }

    // 3. Synchronize Tree Node Shapes (BST Insert)
    if (scenarioId === 'bst-insert') {
      const nodeIds = Object.keys(treeNodes);
      for (const nodeId of nodeIds) {
        const node = treeNodes[nodeId];
        const pos = treeLayout.positions[nodeId] || { x: 250, y: 80 };
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
  }, [editor, scenarioId, arrayEntity, linkedListNodes, listPositions, treeNodes, treeLayout]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#fafafa]">
      {/* TLDraw Whiteboard Canvas Engine */}
      <div className="absolute inset-0 z-0">
        <Tldraw
          shapeUtils={customShapeUtils}
          options={{ maxFontsToLoadBeforeRender: 0 }}
          onMount={handleMount}
        />
      </div>

      {/* Dynamic Visual Connectors Overlay for Tree and Linked List */}
      {scenarioId === 'bst-insert' && treeLayout.connectors.length > 0 && (
        <svg
          className="absolute inset-0 z-5 pointer-events-none w-full h-full"
          style={{ position: 'absolute' }}
        >
          <defs>
            <marker
              id="tree-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
            </marker>
          </defs>
          {treeLayout.connectors.map((c) => (
            <g key={`${c.fromId}->${c.toId}`}>
              <line
                x1={c.x1}
                y1={c.y1}
                x2={c.x2}
                y2={c.y2}
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                markerEnd="url(#tree-arrow)"
              />
              {/* Branch Label Badge: L or R */}
              <circle
                cx={(c.x1 + c.x2) / 2}
                cy={(c.y1 + c.y2) / 2}
                r="10"
                fill="#e0e7ff"
                stroke="#6366f1"
                strokeWidth="1.5"
              />
              <text
                x={(c.x1 + c.x2) / 2}
                y={(c.y1 + c.y2) / 2 + 3.5}
                textAnchor="middle"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                fill="#4338ca"
              >
                {c.branch === 'left' ? 'L' : 'R'}
              </text>
            </g>
          ))}
        </svg>
      )}

      {scenarioId === 'reverse-linked-list' && (
        <svg
          className="absolute inset-0 z-5 pointer-events-none w-full h-full"
          style={{ position: 'absolute' }}
        >
          <defs>
            <marker
              id="list-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#4f46e5" />
            </marker>
            <marker
              id="list-arrow-reverse"
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
          {Object.values(linkedListNodes).map((node) => {
            if (!node.nextId || !listPositions[node.nextId] || !listPositions[node.id]) {
              return null;
            }
            const fromPos = listPositions[node.id];
            const toPos = listPositions[node.nextId];
            const isForward = toPos.x > fromPos.x;

            if (isForward) {
              const startX = fromPos.x + 160;
              const startY = fromPos.y + 60;
              const endX = toPos.x;
              const endY = toPos.y + 60;
              return (
                <path
                  key={`wire-${node.id}->${node.nextId}`}
                  d={`M ${startX} ${startY} L ${endX} ${endY}`}
                  stroke="#4f46e5"
                  strokeWidth="3"
                  markerEnd="url(#list-arrow)"
                />
              );
            } else {
              // Backward / reversed pointer curve overhead
              const startX = fromPos.x + 20;
              const startY = fromPos.y + 10;
              const endX = toPos.x + 140;
              const endY = toPos.y + 10;
              const midY = fromPos.y - 45;
              return (
                <path
                  key={`wire-${node.id}->${node.nextId}`}
                  d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeDasharray="6 3"
                  fill="none"
                  markerEnd="url(#list-arrow-reverse)"
                />
              );
            }
          })}
        </svg>
      )}

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
