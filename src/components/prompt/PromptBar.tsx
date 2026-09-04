import React, { useState } from 'react';
import { Sparkles, ArrowUpRight, PlusCircle, Wand2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface PromptBarProps {
  initialPrompt?: string;
  isLoading?: boolean;
  statusMessage?: { text: string; type: 'success' | 'error' | 'info' } | null;
  onSubmitPrompt: (prompt: string) => void;
  onQuickCommand: (command: string) => void;
}

const QUICK_COMMANDS = [
  { label: '+ Array [10, 5, 20, 8, 15]', cmd: 'create array [10, 5, 20, 8, 15]' },
  { label: '+ Var max = 10', cmd: 'create variable max = 10' },
  { label: '+ Var secondMax = 5', cmd: 'create variable secondMax = 5' },
  { label: 'Sort via QuickSort', cmd: 'visualize quicksort partition' },
  { label: '+ BST Node(35)', cmd: 'insert 35 into tree' },
  { label: 'Find Maximum', cmd: 'find max element in array' },
];

export const PromptBar: React.FC<PromptBarProps> = ({
  initialPrompt = '',
  isLoading = false,
  statusMessage = null,
  onSubmitPrompt,
  onQuickCommand,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [prevInitial, setPrevInitial] = useState(initialPrompt);

  if (initialPrompt !== prevInitial) {
    setPrevInitial(initialPrompt);
    setPrompt(initialPrompt);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    const submitted = prompt.trim();
    setPrompt('');
    onSubmitPrompt(submitted);
  };

  return (
    <div className="p-3 bg-slate-50/90 border-t border-slate-200 space-y-2 select-none">
      {/* Quick Command Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1 shrink-0">
          <Wand2 className="w-3 h-3 text-indigo-500" /> Shortcuts:
        </span>
        {QUICK_COMMANDS.map((qc) => (
          <button
            key={qc.label}
            type="button"
            disabled={isLoading}
            onClick={() => onQuickCommand(qc.cmd)}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/50 disabled:opacity-50 transition-all shrink-0 cursor-pointer shadow-2xs"
          >
            <PlusCircle className="w-2.5 h-2.5 opacity-60" />
            <span>{qc.label}</span>
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3 text-indigo-500 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </div>
        <input
          type="text"
          value={prompt}
          disabled={isLoading}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            isLoading
              ? "Generating interactive storyboard with GLM 5.3 Flash..."
              : "Ask AI (e.g. 'find max', 'create array [10, 5, 20]', 'insert 42 into tree')..."
          }
          className="w-full rounded-xl bg-white border border-slate-300 pl-9 pr-24 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 disabled:bg-slate-100 disabled:text-slate-500 shadow-2xs transition-all font-sans"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          className="absolute right-1 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all cursor-pointer shadow-xs"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Thinking</span>
            </>
          ) : (
            <>
              <span>Ask</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Status / Feedback Pill */}
      {statusMessage && (
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : statusMessage.type === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          )}
          <span className="truncate">{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
};
