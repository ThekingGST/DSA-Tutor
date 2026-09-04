import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import { Header } from './components/layout/Header';
import { CodePanel } from './components/code/CodePanel';
import { PromptBar } from './components/prompt/PromptBar';
import { WhiteboardCanvas } from './components/canvas/WhiteboardCanvas';
import { TimelinePlayer } from './components/timeline/TimelinePlayer';
import { SettingsModal } from './components/settings/SettingsModal';
import { PRESET_SCENARIOS } from './mock/presetScenarios';
import { useTimeline } from './core/useTimeline';
import type { PresetScenario, StudioSettings } from './types/studio';

export const App: React.FC = () => {
  // Sidebar visibility state (supports ?sidebar=false or ?sidebar=0 for presentation / full whiteboard mode)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('sidebar');
      if (p === 'false' || p === '0' || p === 'hidden') return false;
    }
    return true;
  });

  // Sidebar width state for flexible array space resizing
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dsa_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 280 && parsed <= 900) return parsed;
      }
    }
    return 400;
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  // Resize handler for splitter
  const startResizing = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  }, []);

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handlePointerMove = (e: PointerEvent) => {
      const maxWidth = Math.max(480, Math.floor(window.innerWidth * 0.55));
      const newWidth = Math.min(Math.max(280, e.clientX), maxWidth);
      setSidebarWidth(newWidth);
    };

    const handlePointerUp = () => {
      setIsResizingSidebar(false);
      localStorage.setItem('dsa_sidebar_width', String(sidebarWidth));
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isResizingSidebar, sidebarWidth]);

  // Scenario state initialized with URL params if provided
  const [currentScenario, setCurrentScenario] = useState<PresetScenario>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('preset');
      const found = PRESET_SCENARIOS.find((s) => s.id === p);
      if (found) return found;
    }
    return PRESET_SCENARIOS[0];
  });

  const initialStepFromUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      const s = parseInt(new URLSearchParams(window.location.search).get('step') || '0', 10);
      if (!isNaN(s) && s >= 0) return s;
    }
    return 0;
  }, []);

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<StudioSettings>(() => {
    const savedKey =
      localStorage.getItem('dsa_featherless_api_key') ||
      (import.meta.env.VITE_FEATHERLESS_API_KEY as string) ||
      '';
    const savedModel =
      localStorage.getItem('dsa_featherless_model') || 'Qwen/Qwen2.5-Coder-32B-Instruct';
    const savedSpeech = localStorage.getItem('dsa_speech_enabled') !== 'false';
    return {
      apiKey: savedKey,
      model: savedModel,
      speechEnabled: savedSpeech,
      theme: 'dark',
      playbackSpeed: 1,
    };
  });

  // Speech synthesis narrator
  const speakNarration = useCallback(
    (text: string) => {
      if (!settings.speechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    },
    [settings.speechEnabled]
  );

  // Pure Timeline State Machine Hook
  const timeline = useTimeline(currentScenario, {
    initialStepIndex: initialStepFromUrl,
    defaultSpeed: 1,
    onStepChange: (step) => {
      speakNarration(step.narration);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('preset', currentScenario.id);
        url.searchParams.set('step', String(step.stepNumber));
        window.history.replaceState(null, '', url.toString());
      }
    },
  });

  const currentStep = timeline.currentStep || currentScenario.steps[0];

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyB') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        timeline.togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        timeline.stepNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        timeline.stepPrev();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        timeline.reset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timeline]);

  // Switch scenario
  const handleSelectScenario = (scenario: PresetScenario) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentScenario(scenario);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('preset', scenario.id);
      url.searchParams.set('step', '0');
      window.history.replaceState(null, '', url.toString());
    }
  };

  // Save settings
  const handleSaveSettings = (newSettings: StudioSettings) => {
    setSettings(newSettings);
    localStorage.setItem('dsa_featherless_api_key', newSettings.apiKey);
    localStorage.setItem('dsa_featherless_model', newSettings.model);
    localStorage.setItem('dsa_speech_enabled', String(newSettings.speechEnabled));
  };

  // Toggle speech
  const handleToggleSpeech = () => {
    const nextSpeech = !settings.speechEnabled;
    if (!nextSpeech && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    handleSaveSettings({
      ...settings,
      speechEnabled: nextSpeech,
    });
  };

  // AI Prompt Bar submit
  const handlePromptSubmit = (promptText: string) => {
    console.log('AI Prompt received:', promptText);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0f1d] text-slate-100">
      {/* Top Header */}
      <Header
        currentScenario={currentScenario}
        onSelectScenario={handleSelectScenario}
        settings={settings}
        onToggleSpeech={handleToggleSpeech}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Studio Split View (Resizable Left Code Panel / Right Whiteboard Canvas) */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Studio Panel: Code Editor & Prompt Bar (collapsible & resizable) */}
        <section
          style={{
            width: isSidebarOpen ? `${sidebarWidth}px` : '0px',
          }}
          className={`h-full flex flex-col border-r border-slate-800/80 bg-[#0d1322] shrink-0 z-10 ${
            isResizingSidebar ? 'transition-none select-none' : 'transition-all duration-300 ease-in-out'
          } ${
            isSidebarOpen
              ? 'opacity-100 min-w-[280px]'
              : 'min-w-0 max-w-0 opacity-0 overflow-hidden pointer-events-none border-none'
          }`}
        >
          {/* Code Panel with Line Highlighting */}
          <div className="flex-1 min-h-0 flex flex-col">
            <CodePanel
              code={currentScenario.code}
              language={currentScenario.language}
              fileName={currentScenario.fileName}
              activeLine={currentStep.codeLine}
              onCollapse={() => setIsSidebarOpen(false)}
            />
          </div>

          {/* AI Prompt & Command Bar */}
          <PromptBar
            initialPrompt={currentScenario.initialPrompt}
            onSubmitPrompt={handlePromptSubmit}
            onQuickCommand={(cmd) => handlePromptSubmit(cmd)}
          />
        </section>

        {/* Draggable Divider to resize array canvas space vs code space */}
        {isSidebarOpen && (
          <div
            onPointerDown={startResizing}
            onDoubleClick={() => {
              setSidebarWidth(400);
              localStorage.setItem('dsa_sidebar_width', '400');
            }}
            title="Drag to resize code & whiteboard array space (Double-click to reset)"
            className={`w-1.5 hover:w-2 -ml-0.5 cursor-col-resize z-20 transition-all flex items-center justify-center group select-none shrink-0 ${
              isResizingSidebar ? 'bg-indigo-500 w-2' : 'bg-slate-800/60 hover:bg-indigo-500/60'
            }`}
          >
            <div className="w-0.5 h-7 rounded-full bg-slate-600 group-hover:bg-indigo-300" />
          </div>
        )}

        {/* Right Studio Panel: Whiteboard Canvas + Timeline Player HUD */}
        <section className="flex-1 relative h-full overflow-hidden bg-slate-900">
          {/* Floating Show Sidebar Button when collapsed (positioned below TLDraw top action bar) */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-14 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0d1322]/95 hover:bg-[#16203c] border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white shadow-xl shadow-black/40 backdrop-blur-md text-xs font-medium transition-all cursor-pointer group"
              title="Show sidebar (Code & AI) [Ctrl+B]"
            >
              <PanelLeftOpen className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Show Code</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
                Ctrl+B
              </kbd>
            </button>
          )}

          {/* Whiteboard Canvas connected to pure reducer CanvasState & Loop Tracker */}
          <WhiteboardCanvas
            currentStep={currentStep}
            scenarioId={currentScenario.id}
            canvasState={timeline.canvasState}
            onSeek={timeline.seekTo}
          />

          {/* Bottom Floating Timeline Player HUD */}
          <TimelinePlayer
            currentStep={currentStep}
            stepIndex={timeline.currentStepIndex}
            totalSteps={timeline.totalSteps}
            isPlaying={timeline.isPlaying}
            speed={timeline.speed}
            speechEnabled={settings.speechEnabled}
            onPlayPause={timeline.togglePlay}
            onStepPrev={timeline.stepPrev}
            onStepNext={timeline.stepNext}
            onReset={timeline.reset}
            onSeek={timeline.seekTo}
            onSpeedChange={timeline.setSpeed}
          />
        </section>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;
