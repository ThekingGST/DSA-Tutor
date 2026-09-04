import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Volume2 } from 'lucide-react';
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
  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col items-center gap-2 pointer-events-none select-none">
      {/* Step Narration Subtitle Banner */}
      <div className="pointer-events-auto max-w-2xl w-full rounded-2xl bg-[#0f172a]/95 backdrop-blur-md border border-slate-700/80 p-3.5 shadow-2xl transition-all duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Step {stepIndex + 1}/{totalSteps}
            </span>
            <span className="text-xs font-semibold text-white">{currentStep.title}</span>
          </div>
          {speechEnabled && (
            <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium shrink-0">
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse delay-75" />
                <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse delay-150" />
              </div>
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-300 leading-relaxed font-sans">
          {currentStep.narration}
        </p>
      </div>

      {/* Main Control Bar HUD */}
      <div className="pointer-events-auto flex items-center justify-between gap-4 max-w-2xl w-full px-4 py-2.5 rounded-2xl bg-[#0b1120]/95 backdrop-blur-md border border-slate-700/80 shadow-2xl">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onReset}
            title="Reset to beginning"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onStepPrev}
            disabled={stepIndex === 0}
            title="Previous step (Left Arrow)"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={onPlayPause}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
          </button>
          <button
            onClick={onStepNext}
            disabled={stepIndex >= totalSteps - 1}
            title="Next step (Right Arrow)"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Step Scrubber & Indicators */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 relative flex items-center h-5 cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            const targetStep = Math.min(Math.max(Math.round(clickPos * (totalSteps - 1)), 0), totalSteps - 1);
            onSeek(targetStep);
          }}>
            {/* Background Track */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-200"
                style={{ width: `${((stepIndex) / Math.max(totalSteps - 1, 1)) * 100}%` }}
              />
            </div>
            {/* Step Marker Pills */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-0.5">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
                    idx <= stepIndex
                      ? 'bg-indigo-400 border-white scale-110 shadow-xs shadow-indigo-500'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 shrink-0">
            {stepIndex + 1}/{totalSteps}
          </span>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-xl border border-slate-800">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-medium transition-all ${
                speed === s
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
