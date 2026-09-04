import React, { useState, useEffect } from 'react';
import { HTMLContainer } from '@tldraw/tldraw';
import { Sparkles, Plus, Check, X } from 'lucide-react';
import type { IVariableCardsShape, VariableCardsShapeUtil } from './VariableCardsShapeUtil.ts';
import {
  getVariableTheme,
  updateVariableInList,
  upsertVariableInList,
  removeVariableFromList,
  type VariableItem,
} from './variableCardsLogic';
import { calculateVarsPanelDimensions, PANEL_CONSTANTS } from './panelLayoutLogic';

export interface VariableCardsComponentProps {
  shape: IVariableCardsShape;
  util: VariableCardsShapeUtil;
}

export const VariableCardsComponent: React.FC<VariableCardsComponentProps> = ({
  shape,
  util,
}) => {
  const { w, h, title, variables } = shape.props;

  const [editingVar, setEditingVar] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newVal, setNewVal] = useState('');

  // Auto-adapt panel size when variables expand beyond current bounds
  useEffect(() => {
    const nextDims = calculateVarsPanelDimensions(variables.length);
    if (w < nextDims.w || h < nextDims.h) {
      util.editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          w: Math.max(w, nextDims.w),
          h: Math.max(h, nextDims.h),
        },
      } as any);
    }
  }, [variables.length, w, h, shape.props, shape.id, shape.type, util.editor]);

  // Commit inline edit of an existing variable
  const handleCommitEdit = (name: string) => {
    if (editVal.trim() !== '') {
      const parsedNum = Number(editVal);
      const finalVal = isNaN(parsedNum) ? editVal.trim() : parsedNum;
      const updated = updateVariableInList(variables, name, finalVal);

      util.editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          variables: updated,
        },
      } as any);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dsa:variable-edit', {
            detail: { name, value: finalVal },
          })
        );
      }
    }
    setEditingVar(null);
    setEditVal('');
  };

  // Add new variable with automatic size adaptation
  const handleCommitAdd = () => {
    if (newName.trim() !== '') {
      const parsedNum = Number(newVal);
      const finalVal = newVal.trim() === '' ? 0 : isNaN(parsedNum) ? newVal.trim() : parsedNum;
      const newItem: VariableItem = {
        name: newName.trim(),
        value: finalVal,
        color: 'mint',
        isUpdated: true,
      };
      const updated = upsertVariableInList(variables, newItem);
      const nextDims = calculateVarsPanelDimensions(updated.length, w, h);

      util.editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          w: nextDims.w,
          h: nextDims.h,
          variables: updated,
        },
      } as any);
    }
    setIsAdding(false);
    setNewName('');
    setNewVal('');
  };

  // Delete variable with automatic size adaptation
  const handleDeleteVar = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeVariableFromList(variables, name);
    const nextDims = calculateVarsPanelDimensions(updated.length);
    util.editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: {
        ...shape.props,
        w: Math.max(PANEL_CONSTANTS.MIN_WIDTH, nextDims.w),
        h: Math.max(PANEL_CONSTANTS.MIN_HEIGHT, nextDims.h),
        variables: updated,
      },
    } as any);
  };

  return (
    <HTMLContainer
      id={shape.id}
      className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-slate-200/90 shadow-xl shadow-indigo-500/5 select-none text-slate-800 transition-all font-sans overflow-visible flex flex-col justify-between"
      style={{
        width: w,
        height: h,
        pointerEvents: 'all',
      }}
    >
      {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-handwriting font-bold text-slate-800 tracking-wide">
              {title || 'vars'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-semibold">
              n = {variables.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Reactive State
            </span>

            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs"
              title="Add Variable"
            >
              <Plus className="w-3 h-3" />
              <span>Var</span>
            </button>
          </div>
        </div>

        {/* Inline Add Bar (if opened) */}
        {isAdding && (
          <div className="mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 shrink-0 animate-in fade-in duration-200">
            <input
              type="text"
              placeholder="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-20 px-2 py-1 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              autoFocus
            />
            <span className="text-xs font-bold text-slate-400">=</span>
            <input
              type="text"
              placeholder="value"
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommitAdd()}
              className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleCommitAdd}
              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
              title="Save"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Cards Flow Area (Centered Horizontally & Vertically with generous breathing room) */}
        <div className="flex-1 flex flex-wrap items-center justify-center content-center gap-2.5 overflow-y-auto overflow-x-hidden py-2.5 px-2 my-auto no-scrollbar scrollbar-none">
          {variables.map((card) => {
            const theme = getVariableTheme(card.color);
            const isEditing = editingVar === card.name;

            return (
              <div
                key={card.name}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingVar(card.name);
                  setEditVal(String(card.value));
                }}
                className={`group relative px-3 py-1.5 rounded-xl border-2 shadow-2xs transition-all duration-300 hover:scale-105 cursor-pointer flex items-center gap-1.5 ${
                  card.isUpdated
                    ? 'ring-3 ring-amber-400 scale-105 shadow-md animate-pulse'
                    : ''
                } ${theme.cardClass}`}
                title="Double click to edit"
              >
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-handwriting text-base font-bold">
                      {card.name} =
                    </span>
                    <input
                      type="text"
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommitEdit(card.name);
                        if (e.key === 'Escape') setEditingVar(null);
                      }}
                      onBlur={() => handleCommitEdit(card.name)}
                      autoFocus
                      className="w-16 px-1.5 py-0.5 text-xs font-mono rounded border border-indigo-400 bg-white focus:outline-hidden"
                    />
                  </div>
                ) : (
                  <>
                    <span className="font-handwriting text-base font-bold transition-all duration-200 tracking-wide">
                      {card.name} = {String(card.value)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteVar(card.name, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 text-slate-400 hover:text-rose-600 transition-opacity ml-1 cursor-pointer"
                      title="Remove variable"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Helper Bar */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-100 shrink-0">
          <span>✎ Double-click card to edit value</span>
          <span>⇋ Live state</span>
        </div>
    </HTMLContainer>
  );
};
