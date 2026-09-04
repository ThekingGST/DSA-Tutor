import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Hand,
  MousePointer,
  Square,
  Diamond,
  Circle,
  ArrowRight,
  Minus,
  Pencil,
  Type,
  Eraser,
  Box,
} from 'lucide-react';
import type { Editor } from '@tldraw/tldraw';

interface TopPillToolbarProps {
  editor?: Editor | null;
}

export const TopPillToolbar: React.FC<TopPillToolbarProps> = ({ editor }) => {
  const [activeTool, setActiveTool] = useState<string>('select');
  const [isLocked, setIsLocked] = useState(false);

  // Sync active tool from editor events
  useEffect(() => {
    if (!editor) return;

    const updateTool = () => {
      try {
        const toolId = editor.getCurrentToolId();
        setActiveTool(toolId);
      } catch {}
    };

    updateTool();
    const cleanup = editor.store.listen(updateTool);
    return () => cleanup();
  }, [editor]);

  // Global shortcut listeners for 1-9, 0, v, h, d, e, t
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const ed = editor || (typeof window !== 'undefined' ? (window as any).__tldraw_editor : null);
      if (!ed) return;

      switch (e.key) {
        case '1':
        case 'v':
        case 'V':
          ed.setCurrentTool('select');
          setActiveTool('select');
          break;
        case 'h':
        case 'H':
          ed.setCurrentTool('hand');
          setActiveTool('hand');
          break;
        case '2':
        case 'r':
        case 'R':
          ed.setCurrentTool('geo');
          setActiveTool('rectangle');
          break;
        case '3':
          ed.setCurrentTool('geo');
          setActiveTool('diamond');
          break;
        case '4':
        case 'o':
        case 'O':
          ed.setCurrentTool('geo');
          setActiveTool('ellipse');
          break;
        case '5':
        case 'a':
          ed.setCurrentTool('arrow');
          setActiveTool('arrow');
          break;
        case '6':
        case 'l':
        case 'L':
          ed.setCurrentTool('line');
          setActiveTool('line');
          break;
        case '7':
        case 'd':
        case 'D':
        case 'p':
        case 'P':
          ed.setCurrentTool('draw');
          setActiveTool('draw');
          break;
        case '8':
        case 't':
        case 'T':
          ed.setCurrentTool('text');
          setActiveTool('text');
          break;
        case '9':
        case 'e':
        case 'E':
          ed.setCurrentTool('eraser');
          setActiveTool('eraser');
          break;
        case '0':
        case 'f':
        case 'F':
          ed.setCurrentTool('frame');
          setActiveTool('frame');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const selectTool = (toolId: string, geoType?: string) => {
    const ed = editor || (typeof window !== 'undefined' ? (window as any).__tldraw_editor : null);
    if (!ed) return;

    if (toolId === 'lock') {
      setIsLocked((prev) => !prev);
      return;
    }

    if (toolId === 'geo') {
      try {
        ed.setCurrentTool('geo');
        if (geoType) {
          setActiveTool(geoType);
          return;
        }
      } catch {}
    } else {
      try {
        ed.setCurrentTool(toolId);
      } catch {}
    }

    setActiveTool(toolId);
  };

  const tools = [
    {
      id: 'lock',
      icon: isLocked ? Lock : Unlock,
      label: 'Lock',
      badge: '',
      isActive: isLocked,
    },
    {
      id: 'hand',
      icon: Hand,
      label: 'Hand (pan)',
      badge: 'H',
      isActive: activeTool === 'hand',
    },
    {
      id: 'select',
      icon: MousePointer,
      label: 'Selection',
      badge: '1',
      isActive: activeTool === 'select',
    },
    {
      id: 'rectangle',
      toolId: 'geo',
      geoType: 'rectangle',
      icon: Square,
      label: 'Rectangle',
      badge: '2',
      isActive: activeTool === 'rectangle' || (activeTool === 'geo' && !['diamond', 'ellipse'].includes(activeTool)),
    },
    {
      id: 'diamond',
      toolId: 'geo',
      geoType: 'diamond',
      icon: Diamond,
      label: 'Diamond',
      badge: '3',
      isActive: activeTool === 'diamond',
    },
    {
      id: 'ellipse',
      toolId: 'geo',
      geoType: 'ellipse',
      icon: Circle,
      label: 'Ellipse',
      badge: '4',
      isActive: activeTool === 'ellipse',
    },
    {
      id: 'arrow',
      icon: ArrowRight,
      label: 'Arrow',
      badge: '5',
      isActive: activeTool === 'arrow',
    },
    {
      id: 'line',
      icon: Minus,
      label: 'Line',
      badge: '6',
      isActive: activeTool === 'line',
    },
    {
      id: 'draw',
      icon: Pencil,
      label: 'Draw',
      badge: '7',
      isActive: activeTool === 'draw',
    },
    {
      id: 'text',
      icon: Type,
      label: 'Text',
      badge: '8',
      isActive: activeTool === 'text',
    },
    {
      id: 'eraser',
      icon: Eraser,
      label: 'Eraser',
      badge: '9',
      isActive: activeTool === 'eraser',
    },
    {
      id: 'frame',
      icon: Box,
      label: 'Frame',
      badge: '0',
      isActive: activeTool === 'frame',
    },
  ];

  return (
    <div className="flex flex-col items-center pointer-events-auto select-none">
      {/* Excalidraw Floating Pill Toolbar */}
      <div className="flex items-center gap-0.5 p-1 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md shadow-slate-900/5 rounded-2xl">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTool(t.toolId || t.id, t.geoType)}
              title={`${t.label} ${t.badge ? `(${t.badge})` : ''}`}
              className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
                t.isActive
                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.badge && (
                <span
                  className={`absolute -bottom-0.5 right-1 text-[8px] font-mono leading-none ${
                    t.isActive ? 'text-indigo-500 font-bold' : 'text-slate-400'
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Subtle Excalidraw Helper Caption */}
      <span className="text-[11px] font-sans text-slate-400/90 select-none mt-1.5 tracking-tight text-center">
        To move canvas, hold mouse wheel or spacebar while dragging, or use the hand tool
      </span>
    </div>
  );
};
