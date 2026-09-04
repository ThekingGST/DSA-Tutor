import React, { useState } from 'react';
import { HTMLContainer } from '@tldraw/tldraw';
import type { ITreeNodeShape, BSTNodeShapeUtil } from './BSTNodeShapeUtil.ts';
import { calculateTreeNodeDimensions } from './panelLayoutLogic';

export interface BSTNodeComponentProps {
  shape: ITreeNodeShape;
  util: BSTNodeShapeUtil;
}

export const BSTNodeComponent: React.FC<BSTNodeComponentProps> = ({ shape, util }) => {
  const { value, highlight, nodeId, branchLabel } = shape.props;
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(value));

  // Dynamic diameter calculation with automatic padding for rings and hover states
  const panelW = shape.props.w || 76;
  const panelH = shape.props.h || 76;
  const bubbleDiameter = Math.max(56, Math.min(panelW, panelH) - 12);

  const handleCommitEdit = () => {
    const parsed = parseInt(editVal, 10);
    if (!isNaN(parsed)) {
      const nextDims = calculateTreeNodeDimensions(parsed, shape.props.w, shape.props.h);
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
    }
    setIsEditing(false);
  };

  const isActive = highlight === 'active';
  const isVisited = highlight === 'visited';
  const isSorted = highlight === 'sorted';
  const isComparing = highlight === 'comparing';

  return (
    <HTMLContainer
      id={shape.id}
      className="relative select-none flex items-center justify-center overflow-visible"
      style={{
        width: panelW,
        height: panelH,
        pointerEvents: 'all',
      }}
    >
      {/* Branch Label Badge (e.g. L or R) positioned with safe breathing margin */}
      {branchLabel && (
        <span className="absolute top-0.5 left-0.5 z-10 w-5 h-5 rounded-full bg-amber-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs">
          {branchLabel}
        </span>
      )}

      {/* Circular Node Bubble (Centered Horizontally & Vertically with Automatic Padding) */}
      <div
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
          setEditVal(String(value));
        }}
        title={`Node: ${nodeId} (Double click to edit)`}
        style={{
          width: `${bubbleDiameter}px`,
          height: `${bubbleDiameter}px`,
        }}
        className={`rounded-full border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${
          isActive
            ? 'border-indigo-600 bg-indigo-50/95 ring-4 ring-indigo-400/80 scale-105 shadow-indigo-500/30'
            : isVisited
            ? 'border-purple-500 bg-purple-50/90 text-purple-900 ring-2 ring-purple-300'
            : isSorted
            ? 'border-emerald-600 bg-emerald-50/95 ring-3 ring-emerald-400 scale-105 shadow-emerald-500/20'
            : isComparing
            ? 'border-amber-500 bg-amber-50/95 ring-3 ring-amber-400 scale-105'
            : 'border-slate-500 bg-white hover:border-indigo-500 hover:scale-105'
        }`}
      >
        {isEditing ? (
          <input
            type="number"
            autoFocus
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={handleCommitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommitEdit();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="w-12 text-center font-handwriting text-xl font-bold text-indigo-700 bg-transparent border-b-2 border-indigo-600 focus:outline-hidden"
          />
        ) : (
          <span className="font-handwriting text-2xl font-bold text-slate-800 leading-none">
            {value}
          </span>
        )}
      </div>
    </HTMLContainer>
  );
};

