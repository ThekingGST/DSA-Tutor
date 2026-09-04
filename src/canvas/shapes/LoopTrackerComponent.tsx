import React, { useEffect } from 'react';
import { HTMLContainer } from '@tldraw/tldraw';
import { Repeat, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { ILoopTrackerShape } from './LoopTrackerShapeUtil.ts';
import {
  getPillStatus,
  calculateLoopProgress,
  type PillStatus,
} from './loopTrackerLogic';
import { calculateLoopPanelDimensions } from './panelLayoutLogic';

interface LoopTrackerComponentProps {
  shape: ILoopTrackerShape;
  util: any;
}

export const LoopTrackerComponent: React.FC<LoopTrackerComponentProps> = ({
  shape,
  util,
}) => {
  const {
    w,
    h,
    header,
    conditionText,
    currentIteration,
    totalIterations,
    isComplete,
    iterationPills,
    evalState,
  } = shape.props;

  const progress = calculateLoopProgress(currentIteration, totalIterations, isComplete);

  // Auto-adapt panel size when pills or text expand beyond current bounds
  useEffect(() => {
    const nextDims = calculateLoopPanelDimensions(
      iterationPills.length,
      header,
      conditionText
    );
    if (w < nextDims.w || h < nextDims.h) {
      util.editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          w: Math.max(w, nextDims.w),
          h: Math.max(h, nextDims.h),
        },
      });
    }
  }, [iterationPills.length, header, conditionText, w, h, shape.props, shape.id, shape.type, util.editor]);

  // Human direct manipulation: click a pill to jump iteration
  const handlePillClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFinished = idx >= totalIterations;
    util.editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: {
        currentIteration: isFinished ? totalIterations : idx,
        isComplete: isFinished,
      },
    });

    // Also notify window for timeline seeking if listener exists
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dsa:loop-step', {
          detail: { iteration: idx },
        })
      );
    }
  };

  // Human direct manipulation: step prev/next
  const handleStepPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIteration > 0) {
      const nextIdx = currentIteration - 1;
      util.editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: {
          currentIteration: nextIdx,
          isComplete: false,
        },
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dsa:loop-step', { detail: { iteration: nextIdx } })
        );
      }
    }
  };

  const handleStepNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIteration < totalIterations) {
      const nextIdx = currentIteration + 1;
      const finished = nextIdx >= totalIterations;
      util.editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: {
          currentIteration: nextIdx,
          isComplete: finished,
        },
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dsa:loop-step', { detail: { iteration: nextIdx } })
        );
      }
    }
  };

  return (
    <HTMLContainer
      id={shape.id}
      className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-slate-200/90 shadow-xl shadow-indigo-500/5 select-none text-slate-800 transition-all font-sans overflow-visible flex flex-col justify-between"
      style={{ width: w, height: h, pointerEvents: 'all' }}
    >
      {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
              <Repeat className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
              {header}
            </span>
          </div>

          {/* Progress & Steppers */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleStepPrev}
              disabled={currentIteration <= 0}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Previous Iteration"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
              {isComplete ? 'Complete' : `${progress}%`}
            </span>
            <button
              onClick={handleStepNext}
              disabled={isComplete}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Next Iteration"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Content Area (Vertically & Horizontally Centered) */}
        <div className="flex-1 flex flex-col justify-center items-center gap-2.5 py-1.5 my-auto w-full min-h-0">
          {/* Continuous Animated Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 rounded-full transition-all duration-500 ease-out shadow-xs"
              style={{ width: `${progress}%` }}
            />
          </div>

        {/* Middle Row: Real-Time Condition Evaluation Banner */}
        <div
          className={`w-full px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs transition-all duration-300 shrink-0 ${
            evalState === 'true'
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
              : evalState === 'false'
              ? 'bg-amber-50/90 border-amber-300 text-amber-900'
              : evalState === 'completed'
              ? 'bg-indigo-50/90 border-indigo-300 text-indigo-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <span className="font-handwriting text-sm font-semibold truncate flex-1 mr-2 text-center sm:text-left">
            {conditionText}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
              evalState === 'true'
                ? 'bg-emerald-200 text-emerald-900'
                : evalState === 'false'
                ? 'bg-amber-200 text-amber-900'
                : evalState === 'completed'
                ? 'bg-indigo-200 text-indigo-900'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {evalState === 'true'
              ? 'True'
              : evalState === 'false'
              ? 'False'
              : evalState === 'completed'
              ? 'Done'
              : 'Evaluating'}
          </span>
        </div>

        {/* Bottom Row: Iteration Pills (Centered Horizontally with generous breathing room) */}
        <div className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 overflow-x-auto overflow-y-hidden no-scrollbar scrollbar-none shrink-0">
          {iterationPills.map((pillLabel, idx) => {
            const status: PillStatus = getPillStatus(idx, currentIteration, isComplete);
            const isActive = status === 'active';
            const isDone = status === 'completed';

            return (
              <button
                key={`${pillLabel}-${idx}`}
                onClick={(e) => handlePillClick(idx, e)}
                className={`group flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105'
                    : isDone
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                }`}
                title={`Click to jump to ${pillLabel}`}
              >
                {isDone ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : isActive ? (
                  <Sparkles className="w-3 h-3 text-white animate-pulse" />
                ) : null}
                <span>{pillLabel}</span>
              </button>
            );
          })}

          {/* Final Complete Pill */}
          <button
            onClick={(e) => handlePillClick(totalIterations, e)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
              isComplete
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-105'
                : 'border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600'
            }`}
            title="Loop End"
          >
            <Check className="w-3 h-3" />
            <span>Exit</span>
          </button>
        </div>
      </div>
    </HTMLContainer>
  );
};

