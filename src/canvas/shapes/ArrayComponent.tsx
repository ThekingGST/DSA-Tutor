import React, { useState, useEffect } from 'react';
import { HTMLContainer } from '@tldraw/tldraw';
import type { IArrayShape, ArrayShapeUtil } from './ArrayShapeUtil';
import { calculateArrayPanelDimensions } from './panelLayoutLogic';

export interface ArrayComponentProps {
  shape: IArrayShape;
  util: ArrayShapeUtil;
}

// Color palette for named pointers to make algorithms intuitive and memorable
const POINTER_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  pivot: { bg: 'bg-amber-500', text: 'text-white', ring: 'ring-amber-400' },
  i: { bg: 'bg-indigo-600', text: 'text-white', ring: 'ring-indigo-400' },
  j: { bg: 'bg-purple-600', text: 'text-white', ring: 'ring-purple-400' },
  left: { bg: 'bg-blue-600', text: 'text-white', ring: 'ring-blue-400' },
  right: { bg: 'bg-rose-600', text: 'text-white', ring: 'ring-rose-400' },
  mid: { bg: 'bg-emerald-600', text: 'text-white', ring: 'ring-emerald-400' },
};

export const ArrayComponent: React.FC<ArrayComponentProps> = ({ shape, util }) => {
  const { values, pointers, highlights, name } = shape.props;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editVal, setEditVal] = useState<string>('');
  const [selectedPointer, setSelectedPointer] = useState<string | null>(null);

  // Auto-adapt panel size when values expand beyond current bounds
  useEffect(() => {
    const nextDims = calculateArrayPanelDimensions(values.length);
    if (shape.props.w < nextDims.w || shape.props.h < nextDims.h) {
      util.editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          w: Math.max(shape.props.w, nextDims.w),
          h: Math.max(shape.props.h, nextDims.h),
        },
      } as any);
    }
  }, [values.length, shape.props, shape.id, shape.type, util.editor]);

  // Commit inline edit
  const handleCommitEdit = (index: number) => {
    const parsed = parseInt(editVal, 10);
    if (!isNaN(parsed)) {
      const nextValues = [...values];
      nextValues[index] = parsed;
      util.editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          values: nextValues,
        },
      } as any);
    }
    setEditingIndex(null);
  };

  // Add element with automatic size adaptation
  const handleAddElement = () => {
    const nextValues = [...values, Math.floor(Math.random() * 50) + 1];
    const nextDims = calculateArrayPanelDimensions(nextValues.length, shape.props.w, shape.props.h);
    util.editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: {
        ...shape.props,
        w: nextDims.w,
        h: nextDims.h,
        values: nextValues,
      },
    } as any);
  };

  // Move a pointer to a target slot index
  const handleSnapPointerToSlot = (pointerName: string, targetIndex: number) => {
    const nextPointers = {
      ...pointers,
      [pointerName]: targetIndex,
    };
    util.editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: {
        ...shape.props,
        pointers: nextPointers,
      },
    } as any);
    setSelectedPointer(null);
  };

  // HTML5 Drag handlers
  const handlePointerDragStart = (pointerName: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', pointerName);
    e.dataTransfer.effectAllowed = 'move';
    setSelectedPointer(pointerName);
  };

  const handleSlotDrop = (targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    const pointerName = e.dataTransfer.getData('text/plain') || selectedPointer;
    if (pointerName) {
      handleSnapPointerToSlot(pointerName, targetIndex);
    }
  };

  const handleSlotDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Compute pointer positioning along continuous sliding track
  const pointerList = Object.entries(pointers).map(([name, slotIdx]) => ({
    name,
    slotIdx: Number(slotIdx),
  }));

  // Group pointers per slot index for clean staggering
  const pointersBySlot = new Map<number, string[]>();
  for (const { name, slotIdx } of pointerList) {
    const list = pointersBySlot.get(slotIdx) || [];
    list.push(name);
    pointersBySlot.set(slotIdx, list);
  }

  // Compute total width of the slots row so pointers and slots share the same centered coordinate system
  const slotsTotal = values.length + 1;
  const slotsRowWidth = slotsTotal * 84 - 12;

  return (
    <HTMLContainer
      id={shape.id}
      className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-slate-300 shadow-xl select-none flex flex-col justify-between overflow-visible"
      style={{
        width: shape.props.w,
        height: shape.props.h,
        pointerEvents: 'all',
      }}
    >
      {/* Array Header Title & Quick Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-200 mb-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-handwriting text-2xl font-bold text-slate-800">
            {name || 'Array'}
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold">
            n = {values.length}
          </span>
          {selectedPointer && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 animate-pulse">
              Pointer `{selectedPointer}` selected: click a slot to snap
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddElement}
          title="Append slot (+)"
          className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
        >
          + Append
        </button>
      </div>

      {/* 1D Array Slots Centered Area (Horizontally & Vertically Centered with generous breathing room) */}
      <div className="relative overflow-x-auto overflow-y-hidden flex-1 flex flex-col justify-center items-center min-h-0 py-2 px-3 no-scrollbar scrollbar-none">
        <div
          className="relative flex flex-col items-center justify-center my-auto shrink-0 overflow-visible"
          style={{ width: slotsRowWidth, minWidth: slotsRowWidth }}
        >
          {/* Continuous Gliding Pointer Track (Smooth animated sliding across slots) */}
          <div className="relative h-8 w-full overflow-visible mb-2 shrink-0 z-30">
            {pointerList.map(({ name, slotIdx }) => {
              const colorConfig = POINTER_COLORS[name] || {
                bg: 'bg-slate-700',
                text: 'text-white',
                ring: 'ring-slate-400',
              };
              const isSelected = selectedPointer === name;

              const slotPeers = pointersBySlot.get(slotIdx) || [name];
              const peerIndex = slotPeers.indexOf(name);
              const totalPeers = slotPeers.length;

              // Base center coordinate: slot [-1] center is 36px, pitch is 84px
              const baseCenterX = 36 + (slotIdx + 1) * 84;
              // Clean horizontal stagger if multiple pointers occupy same slot
              const staggerOffset = totalPeers > 1 ? (peerIndex - (totalPeers - 1) / 2) * 26 : 0;
              const targetX = baseCenterX + staggerOffset;

              return (
                <div
                  key={name}
                  style={{
                    transform: `translateX(${targetX}px) translateX(-50%)`,
                    transition: 'transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  className="absolute top-0 left-0 flex items-center justify-center pointer-events-auto z-30"
                >
                  <div
                    draggable
                    onDragStart={(e) => handlePointerDragStart(name, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPointer(isSelected ? null : name);
                    }}
                    className={`px-2.5 py-0.5 rounded-full ${colorConfig.bg} ${colorConfig.text} font-handwriting text-sm font-bold shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform ${
                      isSelected ? `ring-3 ${colorConfig.ring} scale-110` : ''
                    }`}
                    title={`Drag pointer ${name} or click to select, then click a slot to snap`}
                  >
                    {name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Array Slots Row */}
          <div className="flex items-center gap-3 w-full relative z-10 shrink-0 pt-0.5">
          {/* Pre-Array Start Zone (ghost cell for index -1) */}
          <div
            className={`w-[72px] shrink-0 flex flex-col items-center cursor-pointer rounded-xl p-1 transition-all ${
              selectedPointer ? 'ring-2 ring-indigo-300 bg-indigo-50/50' : ''
            }`}
            onDragOver={handleSlotDragOver}
            onDrop={(e) => handleSlotDrop(-1, e)}
            onClick={() => {
              if (selectedPointer) handleSnapPointerToSlot(selectedPointer, -1);
            }}
          >
            {/* Ghost Start Cell */}
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/80 flex flex-col items-center justify-center shadow-2xs hover:border-indigo-400 transition-colors">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Start
              </span>
            </div>

            {/* Subscript Index */}
            <span className="mt-1 font-handwriting text-sm font-semibold text-slate-400">
              [-1]
            </span>
          </div>

          {/* In-Bounds Array Slots [0..n-1] */}
          {values.map((val, idx) => {
            const highlight = highlights[String(idx)] || 'default';
            const isComparing = highlight === 'comparing';
            const isSwapped = highlight === 'swapped';
            const isSorted = highlight === 'sorted';
            const isActive = highlight === 'active';

            return (
              <div
                key={idx}
                className={`w-[72px] shrink-0 flex flex-col items-center cursor-pointer rounded-xl p-1 transition-all ${
                  selectedPointer ? 'hover:bg-indigo-50/60 ring-1 ring-slate-200' : ''
                }`}
                onDragOver={handleSlotDragOver}
                onDrop={(e) => handleSlotDrop(idx, e)}
                onClick={() => {
                  if (selectedPointer) {
                    handleSnapPointerToSlot(selectedPointer, idx);
                  }
                }}
              >
                {/* Slot Value Box with Smooth Transitions & Swap Animation */}
                <div
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingIndex(idx);
                    setEditVal(String(val));
                  }}
                  className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-350 ease-out ${
                    isSwapped
                      ? 'border-fuchsia-500 bg-fuchsia-50/90 shadow-lg shadow-fuchsia-500/25 scale-105 ring-3 ring-fuchsia-400 animate-pulse'
                      : isComparing
                      ? 'border-amber-500 bg-amber-50/90 shadow-md shadow-amber-500/20 scale-105 ring-2 ring-amber-300'
                      : isSorted
                      ? 'border-emerald-600 bg-emerald-50/90 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-300'
                      : isActive
                      ? 'border-indigo-600 bg-indigo-50/90 shadow-md shadow-indigo-500/20 scale-105 ring-2 ring-indigo-300'
                      : 'border-slate-400/90 bg-white hover:border-indigo-500 hover:shadow-xs'
                  }`}
                >
                  {editingIndex === idx ? (
                    <input
                      type="number"
                      autoFocus
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={() => handleCommitEdit(idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommitEdit(idx);
                        if (e.key === 'Escape') setEditingIndex(null);
                      }}
                      className="w-12 text-center font-handwriting text-2xl font-bold text-indigo-700 bg-transparent border-b-2 border-indigo-600 focus:outline-hidden"
                    />
                  ) : (
                    <span className="font-handwriting text-2xl font-bold text-slate-800 transition-all duration-200">
                      {val}
                    </span>
                  )}
                </div>

                {/* Slot Index Subscript */}
                <span className="mt-1 font-handwriting text-sm font-semibold text-slate-400">
                  [{idx}]
                </span>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1.5 border-t border-slate-100 shrink-0">
        <span>✎ Double-click slot to edit</span>
        <span>⇄ Drag or click pointer to snap to slot</span>
      </div>
    </HTMLContainer>
  );
};
