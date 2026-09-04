import React, { useState } from 'react';
import { Sparkles, ArrowUpRight, PlusCircle, Wand2 } from 'lucide-react';

interface PromptBarProps {
  initialPrompt?: string;
  onSubmitPrompt: (prompt: string) => void;
  onQuickCommand: (command: string) => void;
}

const QUICK_COMMANDS = [
  { label: '+ Array [10, 5, 20, 8, 15]', cmd: 'create array [10, 5, 20, 8, 15]' },
  { label: '+ Var max = 10', cmd: 'create variable max = 10' },
  { label: '+ Var secondMax = 5', cmd: 'create variable secondMax = 5' },
  { label: 'Sort via QuickSort', cmd: 'visualize quicksort partition' },
  { label: '+ BST Node(35)', cmd: 'insert 35 into tree' },
];

export const PromptBar: React.FC<PromptBarProps> = ({
  initialPrompt = '',
  onSubmitPrompt,
  onQuickCommand,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSubmitPrompt(prompt.trim());
  };

  return (
    <div className="p-3 bg-[#0d1322] border-t border-slate-800/80 space-y-2.5">
      {/* Quick Command Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1 shrink-0">
          <Wand2 className="w-3 h-3 text-indigo-400" /> Shortcuts:
        </span>
        {QUICK_COMMANDS.map((qc) => (
          <button
            key={qc.label}
            type="button"
            onClick={() => onQuickCommand(qc.cmd)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-indigo-300 hover:border-indigo-500/50 hover:bg-indigo-950/30 transition-all shrink-0"
          >
            <PlusCircle className="w-2.5 h-2.5 opacity-60" />
            <span>{qc.label}</span>
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3 text-indigo-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask AI (e.g. 'create array [10, 5, 20]' or 'explain partition')..."
          className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 pl-9.5 pr-20 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 shadow-inner"
        />
        <button
          type="submit"
          disabled={!prompt.trim()}
          className="absolute right-1.5 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-sm"
        >
          <span>Ask</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
