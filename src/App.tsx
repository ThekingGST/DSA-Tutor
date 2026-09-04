import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
      />

      {/* Main Studio Split View (35% Left / 65% Right) */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Studio Panel (35% width): Code Editor & Prompt Bar */}
        <section className="w-[35%] min-w-[360px] max-w-[480px] h-full flex flex-col border-r border-slate-800/80 bg-[#0d1322] shrink-0 z-10">
          {/* Code Panel with Line Highlighting */}
          <div className="flex-1 min-h-0">
            <CodePanel
              code={currentScenario.code}
              language={currentScenario.language}
              fileName={currentScenario.fileName}
              activeLine={currentStep.codeLine}
            />
          </div>

          {/* AI Prompt & Command Bar */}
          <PromptBar
            initialPrompt={currentScenario.initialPrompt}
            onSubmitPrompt={handlePromptSubmit}
            onQuickCommand={(cmd) => handlePromptSubmit(cmd)}
          />
        </section>

        {/* Right Studio Panel (65% width): Whiteboard Canvas + Timeline Player HUD */}
        <section className="flex-1 relative h-full overflow-hidden bg-slate-900">
          {/* Whiteboard Canvas connected to pure reducer CanvasState */}
          <WhiteboardCanvas
            currentStep={currentStep}
            scenarioId={currentScenario.id}
            canvasState={timeline.canvasState}
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
