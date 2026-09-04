import React, { useState } from 'react';
import { Code2, Copy, Check, Terminal, PanelLeftClose, Edit3, Eye } from 'lucide-react';

interface CodePanelProps {
  code: string;
  language: string;
  fileName: string;
  activeLine: number; // 1-based line number
  onCollapse?: () => void;
  onCodeChange?: (newCode: string) => void;
  onLanguageChange?: (lang: 'python' | 'typescript' | 'cpp') => void;
}

const LANGUAGES: Array<{ label: string; value: 'python' | 'typescript' | 'cpp' }> = [
  { label: 'Python', value: 'python' },
  { label: 'TS', value: 'typescript' },
  { label: 'C++', value: 'cpp' },
];

export const CodePanel: React.FC<CodePanelProps> = ({
  code,
  language,
  fileName,
  activeLine,
  onCollapse,
  onCodeChange,
  onLanguageChange,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(code);
  const [prevCode, setPrevCode] = useState(code);

  if (code !== prevCode && !isEditing) {
    setPrevCode(code);
    setEditedCode(code);
  }

  const lines = (isEditing ? editedCode : code).split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedCode : code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Save changes
      if (onCodeChange && editedCode !== code) {
        onCodeChange(editedCode);
      }
      setIsEditing(false);
    } else {
      setEditedCode(code);
      setIsEditing(true);
    }
  };

  const handleLangClick = (val: 'python' | 'typescript' | 'cpp') => {
    if (onLanguageChange) {
      onLanguageChange(val);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-b border-slate-200 overflow-hidden font-sans select-none">
      {/* Code Header Tab matching Excalidraw Style */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
            <Code2 className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-800">Code Editor</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            ({fileName})
          </span>
        </div>

        {/* Action Controls: Language Switcher + Edit Mode + Copy */}
        <div className="flex items-center gap-1.5">
          {/* Language Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-200/70 border border-slate-300/60">
            {LANGUAGES.map((lang) => {
              const isSelected =
                language.toLowerCase().includes(lang.value.slice(0, 2)) ||
                (lang.value === 'typescript' && (language === 'typescript' || language === 'ts' || language === 'js'));
              return (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => handleLangClick(lang.value)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>

          {/* Edit / Done Toggle */}
          <button
            type="button"
            onClick={handleToggleEdit}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
              isEditing
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
            title={isEditing ? 'Save manual edits' : 'Edit code manually'}
          >
            {isEditing ? (
              <>
                <Check className="w-3 h-3" />
                <span>Save</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3 h-3 text-slate-500" />
                <span>Edit</span>
              </>
            )}
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Copy Code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Collapse sidebar (Ctrl+B)"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Code Display Area (Editable Textarea in Edit Mode, Highlighted Table in View Mode) */}
      {isEditing ? (
        <div className="flex-1 p-3 bg-slate-900 overflow-hidden flex flex-col font-mono text-xs">
          <div className="text-[10px] text-slate-400 pb-1 flex items-center justify-between">
            <span>Manual Code Edit Mode</span>
            <span className="text-emerald-400">Click Save when done</span>
          </div>
          <textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full p-2 bg-slate-950 text-indigo-100 rounded-lg border border-slate-700 font-mono text-xs leading-relaxed resize-none focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 selection:bg-indigo-700"
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto font-mono text-xs p-2 leading-relaxed bg-white select-text">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const lineStr = lineNum < 10 ? `0${lineNum}` : `${lineNum}`;
                const isActive = lineNum === activeLine;

                return (
                  <tr
                    key={lineNum}
                    className={`transition-colors duration-200 ${
                      isActive
                        ? 'active-code-line border-l-3 border-indigo-600 bg-indigo-50/90'
                        : 'hover:bg-slate-50 border-l-3 border-transparent'
                    }`}
                  >
                    {/* Indicator Arrow */}
                    <td className="w-4 text-right pr-0.5 select-none text-[9px]">
                      {isActive ? (
                        <span className="text-indigo-600 animate-pulse font-bold">▶</span>
                      ) : (
                        <span className="opacity-0">·</span>
                      )}
                    </td>
                    {/* Line Number with leading zero */}
                    <td
                      className={`w-7 text-right pr-2.5 select-none text-[11px] ${
                        isActive ? 'text-indigo-600 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {lineStr}
                    </td>
                    {/* Line Content */}
                    <td
                      className={`pl-1 pr-3 py-0.5 whitespace-pre font-mono ${
                        isActive ? 'text-indigo-950 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      {line || ' '}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Status */}
      <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 select-none shrink-0 font-sans">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-indigo-600" />
          <span>Active Line {activeLine}</span>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <span className="text-[10px] font-medium text-amber-600 flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> Editing
            </span>
          ) : (
            <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Synced to Canvas
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
