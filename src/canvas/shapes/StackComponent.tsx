import React, { useState } from 'react';
import { HTMLContainer } from '@tldraw/tldraw';
import type { IStackShape, StackShapeUtil } from './StackShapeUtil';

export interface StackComponentProps {
  shape: IStackShape;
  util: StackShapeUtil;
}

export const StackComponent: React.FC<StackComponentProps> = ({ shape, util }) => {
  const { name, items, maxCapacity, highlights, currentOperation } = shape.props;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editVal, setEditVal] = useState<string>('');

  const topIndex = items.length - 1;

  const handlePush = () => {
    if (items.length >= maxCapacity) return;
    const randomVal = Math.floor(Math.random() * 50) + 1;
    const nextItems = [...items, randomVal];
    util.editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: {
        ...shape.props,
        items: nextItems,
        currentOperation: 'push',
      },
    } as any);
  };

  const handlePop = () => {
    if (items.length === 0) return;
    const nextItems = items.slice(0, -1);
    util.editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: {
        ...shape.props,
        items: nextItems,
        currentOperation: 'pop',
      },
    } as any);
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
            size = {items.length}
          </span>
          {currentOperation && currentOperation !== 'idle' && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-mono text-[10px] font-bold uppercase tracking-wider animate-pulse">
              {currentOperation}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePush}
            disabled={items.length >= maxCapacity}
            className="px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 transition-colors cursor-pointer"
            title="Push element to top"
          >
            + Push
          </button>
          <button
            onClick={handlePop}
            disabled={items.length === 0}
            className="px-2 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40 transition-colors cursor-pointer"
            title="Pop top element"
          >
            - Pop
          </button>
        </div>
      </div>

      {/* Vertical Stack Chamber (U-shaped container) */}
      <div className="flex-1 flex flex-col justify-end items-center my-3 relative overflow-hidden">
        <div className="w-full max-w-[220px] flex flex-col-reverse items-center justify-start border-l-4 border-r-4 border-b-4 border-slate-600 rounded-b-2xl p-2 bg-slate-50/70 min-h-[140px] max-h-[220px] gap-1.5 shadow-inner">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center m-auto text-slate-400 py-6">
              <span className="text-xs font-mono font-medium">Stack is Empty</span>
              <span className="text-[10px] text-slate-400 mt-0.5">(Underflow on pop)</span>
            </div>
          ) : (
            items.map((item, idx) => {
              const isTop = idx === topIndex;
              const hl = highlights[String(idx)];
              const isActive = hl === 'active' || (isTop && currentOperation === 'peek');

              return (
                <div
                  key={idx}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingIndex(idx);
                    setEditVal(String(item));
                  }}
                  className={`w-full py-2 px-3 rounded-lg border-2 flex items-center justify-between transition-all duration-150 relative ${
                    isActive
                      ? 'bg-indigo-100 border-indigo-600 ring-2 ring-indigo-400 text-indigo-900 shadow-md scale-[1.02]'
                      : isTop
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
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
                      className="w-16 text-center font-bold text-sm bg-white border border-indigo-500 rounded px-1"
                    />
                  ) : (
                    <span className="font-handwriting font-bold text-lg">{item}</span>
                  )}

                  {isTop ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-mono text-[9px] font-bold tracking-wider uppercase shadow-xs">
                      TOP
                    </span>
                  ) : (
                    <span className="w-6" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-100 pt-2 shrink-0">
        <span>LIFO: Last In, First Out</span>
        <span>cap: {maxCapacity}</span>
      </div>
    </HTMLContainer>
  );
};
