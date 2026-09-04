import React from 'react';
import { Tldraw } from '@tldraw/tldraw';
import type { TimelineStepMock } from '../../types/studio';

interface WhiteboardCanvasProps {
  currentStep: TimelineStepMock;
  scenarioId: string;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  currentStep,
  scenarioId,
}) => {
  // Extract active variables to show as on-canvas cards (matching user photo)
  const variableEntries = Object.entries(currentStep.variables);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#fafafa]">
      {/* TLDraw Whiteboard Canvas Engine */}
      <div className="absolute inset-0 z-0">
        <Tldraw persistenceKey="dsa-studio-canvas" />
      </div>

      {/* Visual Semantic DSA Canvas Overlay (Phase 1 Preview Layer) */}
      <div className="absolute top-20 left-12 z-10 pointer-events-auto select-none bg-white/95 backdrop-blur-xs p-6 rounded-2xl border border-slate-200 shadow-xl max-w-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-handwriting text-3xl font-bold text-slate-800 tracking-wide">
            {scenarioId === 'bst-insert' ? 'Binary Search Tree' : scenarioId === 'reverse-linked-list' ? 'Linked List' : 'Array'}
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600">
            Semantic Component
          </span>
        </div>

        {/* Array Visualization (Matching User's Photo Mockup) */}
        {scenarioId === 'quicksort-partition' && (
          <div className="space-y-6">
            {/* 1D Array Slots */}
            <div className="flex items-end gap-3 pt-6">
              {[
                { val: 10, idx: 0 },
                { val: 5, idx: 1 },
                { val: 20, idx: 2, isActive: true },
                { val: 8, idx: 3 },
                { val: 15, idx: 4 },
              ].map((cell) => {
                const isHighlighted = cell.isActive;
                return (
                  <div key={cell.idx} className="flex flex-col items-center">
                    {/* Floating Pointer Badge */}
                    <div className="h-6 flex items-center justify-center">
                      {isHighlighted && (
                        <span className="font-handwriting text-xl font-bold text-indigo-600 animate-bounce">
                          i
                        </span>
                      )}
                    </div>
                    {/* Slot Box */}
                    <div
                      className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                        isHighlighted
                          ? 'border-indigo-600 bg-indigo-50/80 shadow-md shadow-indigo-500/20 scale-105'
                          : 'border-slate-400/90 bg-white hover:border-slate-600'
                      }`}
                    >
                      <span className="font-handwriting text-2xl font-bold text-slate-800">
                        {cell.val}
                      </span>
                    </div>
                    {/* Index Subscript */}
                    <span className="mt-1.5 font-handwriting text-base font-semibold text-slate-400">
                      {cell.idx}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* On-Canvas Variable Cards (Exactly as in User's Photo) */}
            <div className="pt-2 border-t border-dashed border-slate-200">
              <div className="text-[11px] font-mono text-slate-400 mb-2">On-Canvas Variable Cards:</div>
              <div className="flex flex-wrap items-center gap-4">
                {/* Mint-green Sketched Variable Cards */}
                <div className="px-5 py-3 rounded-xl border-2 border-emerald-500/80 bg-emerald-50/70 shadow-xs transition-transform hover:scale-105 cursor-pointer">
                  <span className="font-handwriting text-xl font-bold text-emerald-800">
                    max = {currentStep.variables['pivot'] ?? 10}
                  </span>
                </div>
                <div className="px-5 py-3 rounded-xl border-2 border-emerald-500/80 bg-emerald-50/70 shadow-xs transition-transform hover:scale-105 cursor-pointer">
                  <span className="font-handwriting text-xl font-bold text-emerald-800">
                    secondMax = 5
                  </span>
                </div>
                {variableEntries.map(([k, v]) => {
                  if (k === 'pivot') return null;
                  return (
                    <div
                      key={k}
                      className="px-4 py-2.5 rounded-xl border-2 border-indigo-400/70 bg-indigo-50/60 shadow-xs"
                    >
                      <span className="font-handwriting text-lg font-bold text-indigo-900">
                        {k} = {String(v)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Linked List Visualization */}
        {scenarioId === 'reverse-linked-list' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pt-2">
              {[1, 2, 3, 4].map((val, idx) => (
                <React.Fragment key={val}>
                  <div className="flex rounded-xl border-2 border-slate-500 bg-white overflow-hidden shadow-sm">
                    <div className="w-12 h-14 flex items-center justify-center border-r-2 border-slate-300">
                      <span className="font-handwriting text-2xl font-bold text-slate-800">{val}</span>
                    </div>
                    <div className="w-8 h-14 flex items-center justify-center bg-slate-50">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    </div>
                  </div>
                  {idx < 3 && (
                    <span className="font-handwriting text-2xl font-bold text-indigo-500">→</span>
                  )}
                </React.Fragment>
              ))}
              <span className="font-handwriting text-lg text-slate-400 ml-1">null</span>
            </div>

            {/* Variable Cards */}
            <div className="pt-2 border-t border-dashed border-slate-200">
              <div className="flex flex-wrap gap-3">
                {variableEntries.map(([k, v]) => (
                  <div key={k} className="px-4 py-2 rounded-xl border-2 border-emerald-500/80 bg-emerald-50/70">
                    <span className="font-handwriting text-lg font-bold text-emerald-800">
                      {k} = {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BST Visualization */}
        {scenarioId === 'bst-insert' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-2">
              {/* Root */}
              <div className="w-14 h-14 rounded-full border-2 border-indigo-600 bg-indigo-50 flex items-center justify-center shadow-md">
                <span className="font-handwriting text-2xl font-bold text-indigo-900">50</span>
              </div>
              {/* Children */}
              <div className="flex items-center gap-12">
                <div className="w-12 h-12 rounded-full border-2 border-slate-600 bg-white flex items-center justify-center shadow-sm">
                  <span className="font-handwriting text-xl font-bold text-slate-800">30</span>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-slate-600 bg-white flex items-center justify-center shadow-sm">
                  <span className="font-handwriting text-xl font-bold text-slate-800">70</span>
                </div>
              </div>
            </div>

            {/* Variable Cards */}
            <div className="pt-2 border-t border-dashed border-slate-200">
              <div className="flex flex-wrap gap-3">
                {variableEntries.map(([k, v]) => (
                  <div key={k} className="px-4 py-2 rounded-xl border-2 border-emerald-500/80 bg-emerald-50/70">
                    <span className="font-handwriting text-lg font-bold text-emerald-800">
                      {k} = {String(v)}
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
