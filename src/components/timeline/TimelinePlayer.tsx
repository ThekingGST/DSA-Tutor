import React, { useState } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import type { TimelineStep } from '../../types/studio';

interface TimelinePlayerProps {
  currentStep: TimelineStep;
  stepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  speechEnabled: boolean;
  onPlayPause: () => void;
  onStepPrev: () => void;
  onStepNext: () => void;
  onReset: () => void;
  onSeek: (stepIndex: number) => void;
  onSpeedChange: (speed: number) => void;
}

const SPEEDS = [0.5, 1, 1.5, 2];

export const TimelinePlayer: React.FC<TimelinePlayerProps> = ({
  currentStep,
  stepIndex,
  totalSteps,
  isPlaying,
  speed,
  speechEnabled,
  onPlayPause,
  onStepPrev,
  onStepNext,
  onReset,
  onSeek,
  onSpeedChange,
}) => {
  const [isSubtitleCollapsed, setIsSubtitleCollapsed] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col items-center gap-2 pointer-events-none select-none font-sans">
      {/* Compact Step Narration Card (Light Excalidraw Style) */}
      <div className="pointer-events-auto max-w-xl w-full rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 p-3 shadow-lg shadow-slate-900/5 transition-all duration-300">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Step {stepIndex + 1}/{totalSteps}
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {currentStep.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {speechEnabled && (
              <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-medium shrink-0">
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px] font-mono">Audio</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSubtitleCollapsed(!isSubtitleCollapsed)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title={isSubtitleCollapsed ? "Show explanation" : "Hide explanation"}
            >
              {isSubtitleCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {!isSubtitleCollapsed && (
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            {currentStep.narration}
          </p>
        )}
      </div>

      {/* Main Excalidraw-Style Timeline Control Bar */}
      <div className="pointer-events-auto flex items-center justify-between gap-3 max-w-2xl w-full px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl shadow-slate-900/5 text-slate-700">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            title="Reset (R)"
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onStepPrev}
            disabled={stepIndex === 0}
            title="Previous step (Left Arrow)"
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Solid Indigo Play/Pause Pill matching photo */}
          <button
            type="button"
            onClick={onPlayPause}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onStepNext}
            disabled={stepIndex >= totalSteps - 1}
            title="Next step (Right Arrow)"
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono text-slate-500 ml-1 shrink-0 font-medium">
            Step {stepIndex + 1} / {totalSteps}
          </span>
        </div>

        {/* Center: Interactive Scrubber */}
        <div
          className="flex-1 relative flex items-center h-5 cursor-pointer mx-2"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            const targetStep = Math.min(
              Math.max(Math.round(clickPos * (totalSteps - 1)), 0),
              totalSteps - 1
            );
            onSeek(targetStep);
          }}
        >
          {/* Background Track */}
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-200"
              style={{ width: `${(stepIndex / Math.max(totalSteps - 1, 1)) * 100}%` }}
            />
          </div>

          {/* Step Marker Dots */}
          <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-0.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full border transition-all ${
                  idx <= stepIndex
                    ? 'bg-indigo-600 border-white scale-110 shadow-xs'
                    : 'bg-slate-300 border-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right: Speed Controls */}
        <div className="flex items-center gap-1 shrink-0 text-slate-500 text-[11px] font-mono">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mr-0.5 hidden sm:inline">
            Speed:
          </span>
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange(s)}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
                  speed === s
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
