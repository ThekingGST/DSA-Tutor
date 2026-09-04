import React, { useState } from 'react';
import { FileCode, Copy, Check, Terminal, PanelLeftClose } from 'lucide-react';

interface CodePanelProps {
  code: string;
  language: string;
  fileName: string;
  activeLine: number; // 1-based line number
  onCollapse?: () => void;
}

export const CodePanel: React.FC<CodePanelProps> = ({
  code,
  language,
  fileName,
  activeLine,
  onCollapse,
}) => {
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] border-b border-slate-800/80 overflow-hidden">
      {/* Code Header Tab */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0b1120] border-b border-slate-800/80 select-none">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-medium text-slate-200">{fileName}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700/60">
            {language}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Copy Code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Hide sidebar (Ctrl+B)"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Code Lines Display */}
      <div className="flex-1 overflow-y-auto font-mono text-xs p-2 leading-relaxed select-text">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isActive = lineNum === activeLine;
              return (
                <tr
                  key={lineNum}
                  className={`transition-colors duration-200 ${
                    isActive
                      ? 'active-code-line border-l-3 border-indigo-500 bg-indigo-950/30'
                      : 'hover:bg-slate-800/30 border-l-3 border-transparent'
                  }`}
                >
                  {/* Indicator Arrow */}
                  <td className="w-5 text-right pr-1 select-none text-[10px]">
                    {isActive ? (
                      <span className="text-indigo-400 animate-pulse font-bold">▶</span>
                    ) : (
                      <span className="opacity-0">·</span>
                    )}
                  </td>
                  {/* Line Number */}
                  <td
                    className={`w-8 text-right pr-3 select-none text-[11px] ${
                      isActive ? 'text-indigo-300 font-semibold' : 'text-slate-600'
                    }`}
                  >
                    {lineNum}
                  </td>
                  {/* Line Content */}
                  <td className={`pl-1 pr-4 py-0.5 whitespace-pre font-mono ${isActive ? 'text-indigo-100 font-medium' : 'text-slate-300'}`}>
                    {line || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Status */}
      <div className="px-4 py-1.5 bg-[#090e1a] border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 select-none">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-indigo-400" />
          <span>Active Execution: Line {activeLine}</span>
        </div>
        <span>Synced with Timeline</span>
      </div>
    </div>
  );
};
