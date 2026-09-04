import React, { useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Play,
  Code2,
  Layers,
  ArrowRight,
  HelpCircle,
  Clock,
  Loader2,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  metadata?: {
    algorithmTitle?: string;
    language?: string;
    stepCount?: number;
    visualComponents?: string[];
  };
}

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onSelectPrompt: (prompt: string) => void;
  onPlayTimeline?: () => void;
  onSwitchToCodeTab?: () => void;
}

const SAMPLE_QUESTIONS = [
  { label: 'Reverse a linked list', prompt: 'Reverse a linked list' },
  { label: 'How does binary search work?', prompt: 'How does binary search work?' },
  { label: 'Find maximum element in array', prompt: 'Find the maximum element in this array' },
  { label: 'Explain how this for loop works', prompt: 'Explain how this for loop works' },
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading = false,
  onSelectPrompt,
  onPlayTimeline,
  onSwitchToCodeTab,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/60 overflow-hidden font-sans select-none">
      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-6 px-3 space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100/80 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-800">AI DSA Problem Solver</h4>
              <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed">
                Ask any algorithmic question. AI will generate the solution code and load an interactive
                whiteboard visualization into your workspace.
              </p>
            </div>

            {/* Quick Starter Suggestions */}
            <div className="w-full space-y-2 pt-2">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <HelpCircle className="w-3 h-3" /> Popular Questions
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-left">
                {SAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q.prompt}
                    type="button"
                    onClick={() => onSelectPrompt(q.prompt)}
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-xs text-slate-700 hover:text-indigo-600 cursor-pointer shadow-2xs group"
                  >
                    <span>{q.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 text-xs animate-in fade-in duration-200 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 select-text shadow-2xs space-y-2 leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-xs'
                    : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between text-[10px] opacity-70 gap-2 select-none">
                  <span className="font-semibold flex items-center gap-1">
                    {msg.role === 'user' ? (
                      <>
                        <User className="w-3 h-3" /> You
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3" /> AI Tutor
                      </>
                    )}
                  </span>
                  <span className="font-mono flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" /> {msg.timestamp}
                  </span>
                </div>

                {/* Message Body */}
                <p className="text-xs whitespace-pre-wrap">{msg.text}</p>

                {/* Assistant Metadata Cards (Algorithm Info & Actions) */}
                {msg.role === 'assistant' && msg.metadata && (
                  <div className="pt-2 border-t border-slate-100 space-y-2 select-none">
                    {/* Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      {msg.metadata.algorithmTitle && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                          {msg.metadata.algorithmTitle}
                        </span>
                      )}
                      {msg.metadata.language && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono border border-slate-200 uppercase">
                          {msg.metadata.language}
                        </span>
                      )}
                      {typeof msg.metadata.stepCount === 'number' && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                          {msg.metadata.stepCount} Steps Ready
                        </span>
                      )}
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {onPlayTimeline && (
                        <button
                          type="button"
                          onClick={onPlayTimeline}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-[11px] transition-colors cursor-pointer border border-indigo-200/80"
                        >
                          <Play className="w-3 h-3 fill-indigo-700" />
                          <span>Play Storyboard</span>
                        </button>
                      )}
                      {onSwitchToCodeTab && (
                        <button
                          type="button"
                          onClick={onSwitchToCodeTab}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition-colors cursor-pointer border border-slate-200"
                        >
                          <Code2 className="w-3 h-3" />
                          <span>View Code</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator when generating */}
        {isLoading && (
          <div className="flex gap-2.5 text-xs animate-in fade-in duration-200 items-start">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-indigo-200/80 rounded-2xl rounded-bl-xs p-3 shadow-2xs space-y-1.5 max-w-[85%]">
              <div className="flex items-center gap-2 text-indigo-600 font-medium text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Solving problem & synthesizing visualization...</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Generating clean executable code and mapping variables, arrays, and loops to the whiteboard.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Follow-ups at bottom if messages exist */}
      {messages.length > 0 && !isLoading && (
        <div className="px-3 py-2 bg-slate-100/80 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-500" /> Follow-up:
          </span>
          {SAMPLE_QUESTIONS.map((q) => (
            <button
              key={q.prompt}
              type="button"
              onClick={() => onSelectPrompt(q.prompt)}
              className="px-2 py-0.5 rounded-full text-[10px] bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-slate-600 transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
