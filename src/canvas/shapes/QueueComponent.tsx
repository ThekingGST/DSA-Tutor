import React, { useState } from 'react';
import { HTMLContainer } from '@tldraw/tldraw';
import type { IQueueShape, QueueShapeUtil } from './QueueShapeUtil';

export interface QueueComponentProps {
  shape: IQueueShape;
  util: QueueShapeUtil;
}

export const QueueComponent: React.FC<QueueComponentProps> = ({ shape, util }) => {
  const { name, items, front, rear, capacity, isCircular, highlights, currentOperation } = shape.props;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editVal, setEditVal] = useState<string>('');

  const handleEnqueue = () => {
    const randomVal = Math.floor(Math.random() * 50) + 1;
    if (isCircular) {
      const nextRear = (rear + 1) % capacity;
      const nextItems = [...items];
      while (nextItems.length < capacity) nextItems.push(null);
      nextItems[nextRear] = randomVal;
      util.editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          items: nextItems,
          rear: nextRear,
          currentOperation: 'enqueue',
        },
      } as any);
    } else {
      const nextItems = [...items, randomVal];
      util.editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          items: nextItems,
          rear: nextItems.length - 1,
          currentOperation: 'enqueue',
        },
      } as any);
    }
  };

  const handleDequeue = () => {
    if (isCircular) {
      const nextItems = [...items];
      nextItems[front] = null;
      const nextFront = (front + 1) % capacity;
      util.editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          items: nextItems,
          front: nextFront,
          currentOperation: 'dequeue',
        },
      } as any);
    } else {
      if (front > rear) return;
      const nextFront = front + 1;
      util.editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          front: nextFront,
          currentOperation: 'dequeue',
        },
      } as any);
    }
  };

  const handleCommitEdit = (index: number) => {
    const parsed = isNaN(Number(editVal)) ? editVal : Number(editVal);
    const nextItems = [...items];
    nextItems[index] = parsed;
    util.editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: {
        ...shape.props,
        items: nextItems,
      },
    } as any);
    setEditingIndex(null);
  };

  const displaySlots = isCircular
    ? Array.from({ length: capacity }, (_, i) => items[i] ?? null)
    : items;

  return (
    <HTMLContainer
      id={shape.id}
      className="p-4 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-slate-700/80 shadow-[4px_4px_0px_0px_rgba(30,41,59,0.85)] select-none overflow-visible flex flex-col justify-between"
      style={{
        width: shape.props.w,
        height: shape.props.h,
        pointerEvents: 'all',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/90 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-caveat font-bold text-2xl text-slate-800 tracking-wide">
            {name}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs font-semibold">
            {isCircular ? 'Circular Ring' : 'FIFO Queue'}
          </span>
          {isCircular && (
            <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-mono text-xs font-semibold">
              cap = {capacity}
            </span>
          )}
          {currentOperation && currentOperation !== 'idle' && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-mono text-[10px] font-bold uppercase tracking-wider animate-pulse">
              {currentOperation}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleEnqueue}
            className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
            title="Enqueue element at rear"
          >
            + Enqueue
          </button>
          <button
            onClick={handleDequeue}
            className="px-2 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
            title="Dequeue element from front"
          >
            - Dequeue
          </button>
        </div>
      </div>

      {/* Pointers & Slots Container */}
      <div className="flex-1 flex flex-col justify-center items-center my-3 relative overflow-visible">
        {/* Pointer Badges track front and rear */}
        <div className="w-full flex items-center justify-center gap-3 overflow-visible pb-1">
          {displaySlots.map((_, idx) => {
            const isFront = idx === front;
            const isRear = idx === rear;

            return (
              <div key={`ptr-${idx}`} className="w-14 flex flex-col items-center justify-end h-7 shrink-0">
                {isFront && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono text-[9px] font-bold tracking-wider uppercase shadow-xs">
                    FRONT ↓
                  </span>
                )}
                {isRear && !isFront && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white font-mono text-[9px] font-bold tracking-wider uppercase shadow-xs">
                    REAR ↓
                  </span>
                )}
                {isFront && isRear && (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-mono text-[8px] font-bold tracking-wider uppercase shadow-xs">
                    F & R ↓
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Horizontal Slot Pipeline */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
          {displaySlots.map((slotVal, idx) => {
            const isFront = idx === front;
            const isRear = idx === rear;
            const hl = highlights[String(idx)];
            const isActive = hl === 'active';
            const isFilled = slotVal !== null && slotVal !== undefined;

            return (
              <div
                key={`slot-${idx}`}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingIndex(idx);
                  setEditVal(slotVal !== null ? String(slotVal) : '');
                }}
                className={`w-14 h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-150 relative shrink-0 ${
                  isActive
                    ? 'bg-indigo-100 border-indigo-600 ring-2 ring-indigo-400 text-indigo-900 shadow-md scale-105'
                    : isFront
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                    : isRear
                    ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-sm'
                    : isFilled
                    ? 'bg-white border-slate-300 text-slate-800'
                    : 'bg-slate-50/80 border-dashed border-slate-300 text-slate-400'
                }`}
              >
                <span className="text-[9px] font-mono text-slate-400 font-semibold mb-0.5">
                  [{idx}]
                </span>

                {editingIndex === idx ? (
                  <input
                    type="text"
                    autoFocus
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onBlur={() => handleCommitEdit(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitEdit(idx);
                      if (e.key === 'Escape') setEditingIndex(null);
                    }}
                    className="w-10 text-center font-bold text-xs bg-white border border-indigo-500 rounded px-1"
                  />
                ) : (
                  <span className="font-handwriting font-bold text-lg">
                    {slotVal !== null ? slotVal : '—'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Circular Queue wrap-around bridge banner */}
        {isCircular && (
          <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] font-mono text-purple-600 font-medium bg-purple-50/80 px-2.5 py-0.5 rounded-full border border-purple-200">
            <span>Wrap-around logic: (rear + 1) % {capacity}</span>
            {rear < front && <span className="font-bold text-indigo-600">(Wrapped Around)</span>}
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-100 pt-2 shrink-0">
        <span>{isCircular ? 'Circular Array Buffer' : 'FIFO: First In, First Out'}</span>
        <span>front: {front} | rear: {rear}</span>
      </div>
    </HTMLContainer>
  );
};
