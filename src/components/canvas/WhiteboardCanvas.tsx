import React from 'react';
import { Tldraw } from '@tldraw/tldraw';
import type { TimelineStep } from '../../types/studio';
import type { CanvasEntities } from '../../types/timeline';

interface WhiteboardCanvasProps {
  currentStep: TimelineStep;
  scenarioId: string;
  canvasState: CanvasEntities;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  scenarioId,
  canvasState,
}) => {
  const variableCards = Object.values(canvasState.variables);
  const arrayEntity = canvasState.array;
  const linkedListNodes = Object.values(canvasState.linkedListNodes);
  const treeNodes = Object.values(canvasState.treeNodes);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#fafafa]">
      {/* TLDraw Whiteboard Canvas Engine */}
      <div className="absolute inset-0 z-0">
        <Tldraw persistenceKey="dsa-studio-canvas" />
      </div>

      {/* Visual Semantic DSA Canvas Overlay (Driven by Pure Reducer State) */}
      <div className="absolute top-20 left-12 z-10 pointer-events-auto select-none bg-white/95 backdrop-blur-xs p-6 rounded-2xl border border-slate-200 shadow-xl max-w-2xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-handwriting text-3xl font-bold text-slate-800 tracking-wide">
            {scenarioId === 'bst-insert'
              ? 'Binary Search Tree'
              : scenarioId === 'reverse-linked-list'
              ? 'Linked List'
              : 'Array'}
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600">
            Live Reducer State
          </span>
        </div>

        {/* Array Visualization (Live Mutated Slots & Draggable/Snapping Badges) */}
        {scenarioId === 'quicksort-partition' && arrayEntity && (
          <div className="space-y-6">
            {/* 1D Array Slots */}
            <div className="flex items-end gap-3 pt-6 overflow-x-auto pb-1">
              {arrayEntity.values.map((val, idx) => {
                const highlight = arrayEntity.highlights[idx] || 'default';
                const isComparing = highlight === 'comparing';
                const isSwapped = highlight === 'swapped';
                const isSorted = highlight === 'sorted';
                const isActive = highlight === 'active';

                // Check which pointers point to this slot
                const pointingBadges = Object.entries(arrayEntity.pointers).filter(
                  ([, pIdx]) => pIdx === idx
                );

                return (
                  <div key={idx} className="flex flex-col items-center shrink-0">
                    {/* Floating Pointer Badges above slot */}
                    <div className="h-7 flex items-center justify-center gap-1">
                      {pointingBadges.map(([name]) => (
                        <span
                          key={name}
                          className="font-handwriting text-xl font-bold text-indigo-600 animate-bounce drop-shadow-xs"
                        >
                          {name}
                        </span>
                      ))}
                    </div>

                    {/* Slot Box with Dynamic Highlight States */}
                    <div
                      className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                        isSwapped
                          ? 'border-fuchsia-500 bg-fuchsia-50/90 shadow-md shadow-fuchsia-500/20 scale-105 ring-2 ring-fuchsia-400'
                          : isComparing
                          ? 'border-amber-500 bg-amber-50/90 shadow-md shadow-amber-500/20 scale-105'
                          : isSorted
                          ? 'border-emerald-600 bg-emerald-50/90 shadow-md shadow-emerald-500/20'
                          : isActive
                          ? 'border-indigo-600 bg-indigo-50/90 shadow-md shadow-indigo-500/20 scale-105'
                          : 'border-slate-400/90 bg-white hover:border-slate-600'
                      }`}
                    >
                      <span className="font-handwriting text-2xl font-bold text-slate-800">
                        {val}
                      </span>
                    </div>

                    {/* Index Subscript */}
                    <span className="mt-1.5 font-handwriting text-base font-semibold text-slate-400">
                      {idx}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pointers outside array bounds (e.g. i = -1) */}
            {arrayEntity.pointers['i'] === -1 && (
              <div className="text-xs font-mono text-slate-500 flex items-center gap-1">
                <span>Left boundary:</span>
                <span className="font-handwriting text-lg font-bold text-indigo-600">i = -1</span>
              </div>
            )}

            {/* On-Canvas Variable Cards (Directly Driven by Reducer) */}
            <div className="pt-2 border-t border-dashed border-slate-200">
              <div className="text-[11px] font-mono text-slate-400 mb-2">On-Canvas Variable Cards:</div>
              <div className="flex flex-wrap items-center gap-3">
                {variableCards.map((card) => {
                  const isMint = card.color === 'mint';
                  const isAmber = card.color === 'amber';
                  return (
                    <div
                      key={card.name}
                      className={`px-4 py-2.5 rounded-xl border-2 shadow-xs transition-transform duration-200 hover:scale-105 cursor-pointer ${
                        isMint
                          ? 'border-emerald-500/80 bg-emerald-50/70 text-emerald-800'
                          : isAmber
                          ? 'border-amber-400/80 bg-amber-50/70 text-amber-900'
                          : 'border-indigo-400/80 bg-indigo-50/70 text-indigo-900'
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
        )}

        {/* Linked List Visualization (Live Reducer Connected Nodes) */}
        {scenarioId === 'reverse-linked-list' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pt-2 overflow-x-auto pb-1">
              {linkedListNodes.map((node) => (
                <React.Fragment key={node.id}>
                  <div className="flex flex-col items-center">
                    {/* Node Pointer Badges */}
                    <div className="h-6 flex items-center gap-1">
                      {node.pointers.map((p) => (
                        <span key={p} className="font-handwriting text-lg font-bold text-indigo-600 animate-pulse">
                          {p}
                        </span>
                      ))}
                    </div>
                    {/* Node Compartment Card [ data | ●-> ] */}
                    <div className="flex rounded-xl border-2 border-slate-600 bg-white overflow-hidden shadow-sm">
                      <div className="w-12 h-14 flex items-center justify-center border-r-2 border-slate-300">
                        <span className="font-handwriting text-2xl font-bold text-slate-800">{node.value}</span>
                      </div>
                      <div className="w-8 h-14 flex items-center justify-center bg-slate-50">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      </div>
                    </div>
                  </div>
                  {/* Wire Connector */}
                  {node.nextId ? (
                    <span className="font-handwriting text-2xl font-bold text-indigo-500 mt-6">→</span>
                  ) : (
                    <span className="font-handwriting text-lg text-slate-400 ml-1 mt-6">null</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Variable Cards */}
            <div className="pt-2 border-t border-dashed border-slate-200">
              <div className="flex flex-wrap gap-3">
                {variableCards.map((card) => (
                  <div key={card.name} className="px-4 py-2 rounded-xl border-2 border-emerald-500/80 bg-emerald-50/70 text-emerald-800">
                    <span className="font-handwriting text-lg font-bold">
                      {card.name} = {String(card.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BST Visualization (Live Reducer Node Placement & Traversal) */}
        {scenarioId === 'bst-insert' && (
          <div className="space-y-6">
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

            {/* Variable Cards */}
            <div className="pt-2 border-t border-dashed border-slate-200">
              <div className="flex flex-wrap gap-3">
                {variableCards.map((card) => (
                  <div key={card.name} className="px-4 py-2 rounded-xl border-2 border-emerald-500/80 bg-emerald-50/70 text-emerald-800">
                    <span className="font-handwriting text-lg font-bold">
                      {card.name} = {String(card.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
