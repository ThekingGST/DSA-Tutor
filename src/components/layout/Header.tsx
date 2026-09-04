import React from 'react';
import { Sparkles, Volume2, VolumeX, Settings, PlayCircle, Layers, GitBranch, ArrowRightLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { PresetScenario, StudioSettings } from '../../types/studio';
import { PRESET_SCENARIOS } from '../../mock/presetScenarios';

interface HeaderProps {
  currentScenario: PresetScenario;
  onSelectScenario: (scenario: PresetScenario) => void;
  settings: StudioSettings;
  onToggleSpeech: () => void;
  onOpenSettings: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScenario,
  onSelectScenario,
  settings,
  onToggleSpeech,
  onOpenSettings,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-[#0d1322] px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* Left: Brand / Title + Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">DSA Studio</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                AI Whiteboard
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Hide sidebar (Code & AI) [Ctrl+B]" : "Show sidebar (Code & AI) [Ctrl+B]"}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
            isSidebarOpen
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30'
          }`}
        >
          {isSidebarOpen ? (
            <>
              <PanelLeftClose className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline text-[11px]">Hide Code</span>
            </>
          ) : (
            <>
              <PanelLeftOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline text-[11px]">Show Code</span>
            </>
          )}
        </button>
      </div>

      {/* Middle: Preset Scenario Pills */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        <span className="text-[11px] font-medium text-slate-400 px-2 flex items-center gap-1">
          <PlayCircle className="w-3.5 h-3.5 text-indigo-400" /> Presets:
        </span>
        {PRESET_SCENARIOS.map((scenario) => {
          const isActive = scenario.id === currentScenario.id;
          const Icon = scenario.id === 'quicksort-partition' ? ArrowRightLeft : scenario.id === 'reverse-linked-list' ? Layers : GitBranch;
          return (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5 opacity-80" />
              <span>{scenario.name}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Voice Toggle */}
        <button
          onClick={onToggleSpeech}
          title={settings.speechEnabled ? 'Mute voice narration' : 'Enable voice narration'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            settings.speechEnabled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          {settings.speechEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span className="text-[11px]">Voice On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span className="text-[11px]">Muted</span>
            </>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Studio & API Settings"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
