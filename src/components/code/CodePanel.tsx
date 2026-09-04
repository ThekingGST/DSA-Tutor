import React, { useState } from 'react';
import { Code2, Copy, Check, Terminal, PanelLeftClose } from 'lucide-react';

interface CodePanelProps {
  code: string;
  language: string;
  fileName: string;
  activeLine: number; // 1-based line number
  onCollapse?: () => void;
}

const LANGUAGES = ['JS', 'C++', 'Python'];

export const CodePanel: React.FC<CodePanelProps> = ({
  code,
  language,
  fileName,
  activeLine,
  onCollapse,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>(() => {
    if (language.toLowerCase().includes('py')) return 'Python';
    if (language.toLowerCase().includes('c')) return 'C++';
    return 'JS';
  });

  const lines = code.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white border-b border-slate-200 overflow-hidden font-sans select-none">
      {/* Code Header Tab matching Excalidraw Style */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
            <Code2 className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-800">Code & State</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            ({fileName})
          </span>
        </div>

        {/* Language Switcher Segmented Control */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-200/70 border border-slate-300/60">
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLang(lang)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>

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

      {/* Code Lines Display (Clean Light Excalidraw Style) */}
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

      {/* Footer Status */}
      <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 select-none shrink-0 font-sans">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-indigo-600" />
          <span>Active Line {activeLine}</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Synced</span>
      </div>
    </div>
  );
};
