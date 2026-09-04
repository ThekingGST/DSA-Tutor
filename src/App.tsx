import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WorkspaceTopNav } from './components/layout/WorkspaceTopNav';
import { CodePanel } from './components/code/CodePanel';
import { PromptBar } from './components/prompt/PromptBar';
import { WhiteboardCanvas } from './components/canvas/WhiteboardCanvas';
import { TimelinePlayer } from './components/timeline/TimelinePlayer';
import { SettingsModal } from './components/settings/SettingsModal';
import { PRESET_SCENARIOS } from './mock/presetScenarios';
import { useTimeline } from './core/useTimeline';
import type { PresetScenario, StudioSettings } from './types/studio';
import type { Editor } from '@tldraw/tldraw';

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
    return 380;
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

  // TLDraw Editor instance for top pill toolbar and canvas actions
  const [editor, setEditor] = useState<Editor | null>(null);

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
      theme: 'light',
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
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#f8f9fa] text-slate-800 select-none font-sans">
      {/* Left-Edge Middle Arrow Toggle Button */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        style={{
          left: isSidebarOpen ? `${sidebarWidth}px` : '0px',
        }}
        className={`fixed top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-5 h-14 bg-white/95 hover:bg-white border border-slate-200/90 shadow-md hover:shadow-lg text-slate-500 hover:text-indigo-600 rounded-r-xl transition-all cursor-pointer group select-none ${
          isResizingSidebar ? 'transition-none' : 'transition-all duration-300'
        }`}
        title={isSidebarOpen ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
      >
        {isSidebarOpen ? (
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        )}
      </button>

      {/* Main Studio Split View (Resizable Left Code Panel / Right Whiteboard Canvas) */}
      <main className="flex-1 flex w-full h-full overflow-hidden relative">
        {/* Left Studio Panel: Code Editor & Prompt Bar (collapsible & resizable) */}
        <section
          style={{
            width: isSidebarOpen ? `${sidebarWidth}px` : '0px',
          }}
          className={`h-full flex flex-col border-r border-slate-200 bg-white shrink-0 z-20 ${
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
              setSidebarWidth(380);
              localStorage.setItem('dsa_sidebar_width', '380');
            }}
            title="Drag to resize code & whiteboard array space (Double-click to reset)"
            className={`w-1.5 hover:w-2 -ml-0.5 cursor-col-resize z-30 transition-all flex items-center justify-center group select-none shrink-0 ${
              isResizingSidebar ? 'bg-indigo-500 w-2' : 'bg-slate-200 hover:bg-indigo-500/60'
            }`}
          >
            <div className="w-0.5 h-7 rounded-full bg-slate-400 group-hover:bg-indigo-500" />
          </div>
        )}

        {/* Right Studio Panel: Excalidraw Whiteboard Canvas + Timeline Player HUD */}
        <section className="flex-1 relative h-full overflow-hidden bg-[#fafafa]">
          {/* Integrated Workspace Top Navigation (Scenario Tabs, Hamburger Menu, Settings, Top Pill Toolbar) */}
          <WorkspaceTopNav
            currentScenario={currentScenario}
            onSelectScenario={handleSelectScenario}
            settings={settings}
            onToggleSpeech={handleToggleSpeech}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onResetTimeline={timeline.reset}
            editor={editor}
          />

          {/* Whiteboard Canvas connected to pure reducer CanvasState & Loop Tracker */}
          <WhiteboardCanvas
            currentStep={currentStep}
            scenarioId={currentScenario.id}
            canvasState={timeline.canvasState}
            onSeek={timeline.seekTo}
            onEditorMount={setEditor}
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
