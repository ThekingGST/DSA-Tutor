import React, { useState } from 'react';
import { Menu, Volume2, VolumeX, Settings, RotateCcw, ArrowRightLeft, Layers, GitBranch, Sparkles } from 'lucide-react';
import type { Editor } from '@tldraw/tldraw';
import type { PresetScenario, StudioSettings } from '../../types/studio';
import { PRESET_SCENARIOS } from '../../mock/presetScenarios';
import { TopPillToolbar } from '../canvas/TopPillToolbar';

interface WorkspaceTopNavProps {
  currentScenario: PresetScenario;
  onSelectScenario: (scenario: PresetScenario) => void;
  settings: StudioSettings;
  onToggleSpeech: () => void;
  onOpenSettings: () => void;
  onResetTimeline?: () => void;
  editor?: Editor | null;
}

export const WorkspaceTopNav: React.FC<WorkspaceTopNavProps> = ({
  currentScenario,
  onSelectScenario,
  settings,
  onToggleSpeech,
  onOpenSettings,
  onResetTimeline,
  editor,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="absolute top-3 left-4 right-4 z-30 pointer-events-none flex items-start justify-between gap-4">
      {/* Top Left: Hamburger Menu & Scenario Tabs */}
      <div className="pointer-events-auto flex items-center gap-2 shrink-0">
        {/* Excalidraw Hamburger Menu Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-9 h-9 rounded-xl bg-white/95 hover:bg-white border border-slate-200/90 shadow-xs flex items-center justify-center text-slate-700 hover:text-indigo-600 transition-all cursor-pointer backdrop-blur-md"
            title="Menu & Settings"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-11 left-0 w-56 rounded-2xl bg-white/95 border border-slate-200 shadow-xl backdrop-blur-md p-1.5 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2 text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>DSA Studio Workspace</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer text-left"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings & API Key</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleSpeech();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  {settings.speechEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Audio Narration</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    settings.speechEnabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {settings.speechEnabled ? 'ON' : 'MUTED'}
                </span>
              </button>

              {onResetTimeline && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onResetTimeline();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer text-left"
                >
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                  <span>Reset Timeline (R)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Excalidraw-Style Scenario Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-2xl border border-slate-200/80 backdrop-blur-md">
          {PRESET_SCENARIOS.map((scenario) => {
            const isActive = scenario.id === currentScenario.id;
            const Icon =
              scenario.id === 'quicksort-partition'
                ? ArrowRightLeft
                : scenario.id === 'reverse-linked-list'
                ? Layers
                : GitBranch;

            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => onSelectScenario(scenario)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/90'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <span className="whitespace-nowrap hidden xl:inline">{scenario.name}</span>
                <span className="whitespace-nowrap inline xl:hidden">
                  {scenario.id === 'quicksort-partition'
                    ? 'QuickSort'
                    : scenario.id === 'reverse-linked-list'
                    ? 'Reverse List'
                    : 'BST Tree'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Center: Excalidraw Floating Pill Toolbar & Subtle Hint */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-auto flex flex-col items-center">
        <TopPillToolbar editor={editor} />
      </div>

      {/* Top Right: Minimal Controls */}
      <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
        {/* Speech Quick Toggle */}
        <button
          type="button"
          onClick={onToggleSpeech}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer backdrop-blur-md shadow-xs ${
            settings.speechEnabled
              ? 'bg-white/95 border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              : 'bg-white/95 border-slate-200 text-slate-500 hover:bg-slate-50'
          }`}
          title={settings.speechEnabled ? 'Mute audio narration' : 'Enable audio narration'}
        >
          {settings.speechEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Voice</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              <span>Muted</span>
            </>
          )}
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-xl bg-white/95 hover:bg-white border border-slate-200/90 shadow-xs flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all cursor-pointer backdrop-blur-md"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
