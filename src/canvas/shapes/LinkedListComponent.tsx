import React, { useState } from 'react';
import { HTMLContainer } from '@tldraw/tldraw';
import type { ILinkedListNodeShape, LinkedListNodeShapeUtil } from './LinkedListNodeShapeUtil.ts';
import { POINTER_BADGE_COLORS } from './linkedListLogic';
import { calculateLinkedListNodeDimensions } from './panelLayoutLogic';

export interface LinkedListComponentProps {
  shape: ILinkedListNodeShape;
  util: LinkedListNodeShapeUtil;
}

export const LinkedListComponent: React.FC<LinkedListComponentProps> = ({ shape, util }) => {
  const { value, nextId, pointers, highlight, nodeId } = shape.props;
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(value));

  // Commit inline edit with automatic dimension adaptation
  const handleCommitEdit = () => {
    const parsed = isNaN(Number(editVal)) ? editVal : Number(editVal);
    const nextDims = calculateLinkedListNodeDimensions(
      pointers.length,
      parsed,
      shape.props.w,
      shape.props.h
    );

    util.editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: {
        ...shape.props,
        w: nextDims.w,
        h: nextDims.h,
        value: parsed,
      },
    } as any);
    setIsEditing(false);
  };

  // Quick toggle / detach next pointer
  const handleToggleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    // If connected, detach to null; if null, instructor can click to rewire
    const newNext = nextId ? null : 'n1';
    util.editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: {
        ...shape.props,
        nextId: newNext,
      },
    } as any);
  };

  const isActive = highlight === 'active';
  const isComparing = highlight === 'comparing';
  const isSorted = highlight === 'sorted';
  const isSwapped = highlight === 'swapped';

  return (
    <HTMLContainer
      id={shape.id}
      className={`p-3 sm:p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border-2 shadow-xl select-none overflow-visible flex flex-col justify-center items-center transition-all duration-200 ${
        isSwapped
          ? 'border-fuchsia-500 ring-3 ring-fuchsia-400 bg-fuchsia-50/90 scale-105'
          : isComparing
          ? 'border-amber-500 ring-2 ring-amber-300 bg-amber-50/90 scale-105'
          : isSorted
          ? 'border-emerald-600 ring-2 ring-emerald-300 bg-emerald-50/90'
          : isActive
          ? 'border-indigo-600 ring-2 ring-indigo-300 bg-indigo-50/90 scale-105'
          : 'border-slate-400/90 hover:border-indigo-500 hover:shadow-2xl'
      }`}
      style={{
        width: shape.props.w,
        height: shape.props.h,
        pointerEvents: 'all',
      }}
    >
      {/* Centered Content Wrapper (Centered Vertically and Horizontally with Generous Margin) */}
      <div className="w-full flex flex-col justify-center items-center my-auto mx-auto gap-2 overflow-visible">
        {/* Pointer Badges (e.g. prev, curr, next, head) */}
        {pointers.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 overflow-visible shrink-0 flex-wrap pb-0.5">
            {pointers.map((pName) => {
              const colorConfig = POINTER_BADGE_COLORS[pName] || {
                bg: 'bg-indigo-600',
                text: 'text-white',
                ring: 'ring-indigo-400',
              };
              return (
                <span
                  key={pName}
                  className={`px-2.5 py-0.5 rounded-full ${colorConfig.bg} ${colorConfig.text} font-handwriting text-xs font-bold shadow-xs transition-transform hover:scale-105`}
                >
                  {pName}
                </span>
              );
            })}
          </div>
        )}

        {/* Two-Compartment Card: [ data | next ●-> ] */}
        <div className="w-full flex items-center justify-center rounded-xl border-2 border-slate-300 bg-white overflow-hidden shadow-inner shrink-0">
          {/* Value Compartment */}
          <div
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setEditVal(String(value));
            }}
            title="Double-click to edit value"
            className="flex-1 min-w-[56px] h-12 flex items-center justify-center border-r-2 border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors px-2"
          >
            {isEditing ? (
              <input
                type="text"
                autoFocus
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                onBlur={handleCommitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommitEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="w-14 text-center font-handwriting text-xl font-bold text-indigo-700 bg-transparent border-b-2 border-indigo-600 focus:outline-hidden"
              />
            ) : (
              <span className="font-handwriting text-2xl font-bold text-slate-800 truncate">
                {value}
              </span>
            )}
          </div>

          {/* Next Pointer Compartment */}
          <div
            onClick={handleToggleNext}
            title="Click next port to detach/rewire"
            className="w-14 h-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50 transition-colors cursor-pointer group shrink-0"
          >
            <div className="flex items-center gap-1">
              <span
                className={`w-3 h-3 rounded-full border-2 border-white shadow-xs transition-transform group-hover:scale-125 ${
                  nextId ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              />
              <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600">→</span>
            </div>
            <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
              {nextId ? nextId : 'null'}
            </span>
          </div>
        </div>

        {/* Node ID Badge Subscript */}
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 shrink-0">
          <span>id: {nodeId}</span>
          <span className="text-[9px] text-indigo-500 font-medium">next: {nextId ?? 'null'}</span>
        </div>
      </div>
    </HTMLContainer>
  );
};

