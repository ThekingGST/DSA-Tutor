import React, { useState, useEffect, useCallback } from 'react';
import { Tldraw } from '@tldraw/tldraw';
import type { Editor } from '@tldraw/tldraw';
import type { TimelineStep } from '../../types/studio';
import type { CanvasEntities } from '../../types/timeline';
import { ArrayShapeUtil } from '../../canvas/shapes/ArrayShapeUtil';

interface WhiteboardCanvasProps {
  currentStep: TimelineStep;
  scenarioId: string;
  canvasState: CanvasEntities;
}

const customShapeUtils = [ArrayShapeUtil];

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  scenarioId,
  canvasState,
}) => {
  const [editor, setEditor] = useState<Editor | null>(null);

  const variableCards = Object.values(canvasState.variables);
  const arrayEntity = canvasState.array;
  const linkedListNodes = Object.values(canvasState.linkedListNodes);
  const treeNodes = Object.values(canvasState.treeNodes);

  const handleMount = useCallback((mountedEditor: Editor) => {
    setEditor(mountedEditor);
  }, []);

  // Synchronize TLDraw shape canvas with pure reducer arrayEntity
  useEffect(() => {
    if (!editor) return;

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
      // If switched away from QuickSort, remove the array shape
      const existing = editor.getShape(arrayShapeId);
      if (existing) {
        editor.deleteShape(arrayShapeId);
      }
    }
  }, [editor, scenarioId, arrayEntity]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#fafafa]">
      {/* TLDraw Whiteboard Canvas Engine with Custom ArrayShapeUtil */}
      <div className="absolute inset-0 z-0">
        <Tldraw
          shapeUtils={customShapeUtils}
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

      {/* Linked List Preview (for Linked List Scenario until Phase 4) */}
      {scenarioId === 'reverse-linked-list' && (
        <div className="absolute top-20 left-12 z-10 pointer-events-auto select-none bg-white/95 backdrop-blur-xs p-6 rounded-2xl border border-slate-200 shadow-xl max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-handwriting text-3xl font-bold text-slate-800 tracking-wide">
              Linked List
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600">
              Live Reducer State
            </span>
          </div>
          <div className="flex items-center gap-2 pt-2 overflow-x-auto pb-1">
            {linkedListNodes.map((node) => (
              <React.Fragment key={node.id}>
                <div className="flex flex-col items-center">
                  <div className="h-6 flex items-center gap-1">
                    {node.pointers.map((p) => (
                      <span key={p} className="font-handwriting text-lg font-bold text-indigo-600 animate-pulse">
                        {p}
                      </span>
                    ))}
                  </div>
                  <div className="flex rounded-xl border-2 border-slate-600 bg-white overflow-hidden shadow-sm">
                    <div className="w-12 h-14 flex items-center justify-center border-r-2 border-slate-300">
                      <span className="font-handwriting text-2xl font-bold text-slate-800">{node.value}</span>
                    </div>
                    <div className="w-8 h-14 flex items-center justify-center bg-slate-50">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    </div>
                  </div>
                </div>
                {node.nextId ? (
                  <span className="font-handwriting text-2xl font-bold text-indigo-500 mt-6">→</span>
                ) : (
                  <span className="font-handwriting text-lg text-slate-400 ml-1 mt-6">null</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* BST Preview (for BST Scenario until Phase 4) */}
      {scenarioId === 'bst-insert' && (
        <div className="absolute top-20 left-12 z-10 pointer-events-auto select-none bg-white/95 backdrop-blur-xs p-6 rounded-2xl border border-slate-200 shadow-xl max-w-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-handwriting text-3xl font-bold text-slate-800 tracking-wide">
              Binary Search Tree
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600">
              Live Reducer State
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 py-2">
            {treeNodes.map((node) => {
              const isActive = node.highlight === 'active';
              const isVisited = node.highlight === 'visited';
              const isSorted = node.highlight === 'sorted';

              return (
                <div
                  key={node.id}
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-md transition-all duration-300 ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-100 ring-2 ring-indigo-400 scale-110'
                      : isVisited
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : isSorted
                      ? 'border-emerald-600 bg-emerald-100 ring-2 ring-emerald-400 scale-105'
                      : 'border-slate-500 bg-white'
                  }`}
                >
                  <span className="font-handwriting text-2xl font-bold text-slate-800">
                    {node.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
