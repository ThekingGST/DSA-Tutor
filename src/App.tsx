import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { CodePanel } from './components/code/CodePanel';
import { PromptBar } from './components/prompt/PromptBar';
import { WhiteboardCanvas } from './components/canvas/WhiteboardCanvas';
import { TimelinePlayer } from './components/timeline/TimelinePlayer';
import { SettingsModal } from './components/settings/SettingsModal';
import { PRESET_SCENARIOS } from './mock/presetScenarios';
import type { PresetScenario, StudioSettings } from './types/studio';

export const App: React.FC = () => {
  // Scenario state
  const [currentScenario, setCurrentScenario] = useState<PresetScenario>(PRESET_SCENARIOS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<StudioSettings>(() => {
    const savedKey = localStorage.getItem('dsa_featherless_api_key') || (import.meta.env.VITE_FEATHERLESS_API_KEY as string) || '';
    const savedModel = localStorage.getItem('dsa_featherless_model') || 'Qwen/Qwen2.5-Coder-32B-Instruct';
    const savedSpeech = localStorage.getItem('dsa_speech_enabled') !== 'false';
    return {
      apiKey: savedKey,
      model: savedModel,
      speechEnabled: savedSpeech,
      theme: 'dark',
      playbackSpeed: 1,
    };
  });

  const currentStep = currentScenario.steps[currentStepIndex] || currentScenario.steps[0];
  const totalSteps = currentScenario.steps.length;

  // Speech synthesis narrator
  const speakCurrentStep = useCallback((text: string) => {
    if (!settings.speechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05 * speed;
    utterance.pitch = 1.0;
    
    // Pick a smooth modern voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }, [settings.speechEnabled, speed]);

  // Handle step change with narration
  const goToStep = useCallback((newIndex: number) => {
    const boundedIndex = Math.min(Math.max(newIndex, 0), totalSteps - 1);
    setCurrentStepIndex(boundedIndex);
    const step = currentScenario.steps[boundedIndex];
    if (step) {
      speakCurrentStep(step.narration);
    }
  }, [totalSteps, currentScenario.steps, speakCurrentStep]);

  // Stepping controls
  const handleStepNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStepIndex, totalSteps, goToStep]);

  const handleStepPrev = useCallback(() => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, goToStep]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    goToStep(0);
  }, [goToStep]);

  // Switch scenario
  const handleSelectScenario = (scenario: PresetScenario) => {
    setIsPlaying(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentScenario(scenario);
    setCurrentStepIndex(0);
  };

  // Auto-play timer
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (isPlaying) {
      const delay = (2400 / speed);
      timerRef.current = window.setTimeout(() => {
        if (currentStepIndex < totalSteps - 1) {
          goToStep(currentStepIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, delay);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, totalSteps, speed, goToStep]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleStepNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleStepPrev();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStepNext, handleStepPrev, handleReset]);

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
          {/* Whiteboard Canvas */}
          <WhiteboardCanvas
            currentStep={currentStep}
            scenarioId={currentScenario.id}
          />

          {/* Bottom Floating Timeline Player HUD */}
          <TimelinePlayer
            currentStep={currentStep}
            stepIndex={currentStepIndex}
            totalSteps={totalSteps}
            isPlaying={isPlaying}
            speed={speed}
            speechEnabled={settings.speechEnabled}
            onPlayPause={() => setIsPlaying(prev => !prev)}
            onStepPrev={handleStepPrev}
            onStepNext={handleStepNext}
            onReset={handleReset}
            onSeek={goToStep}
            onSpeedChange={setSpeed}
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
