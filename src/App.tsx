import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, Code2 } from 'lucide-react';
import { WorkspaceTopNav } from './components/layout/WorkspaceTopNav';
import { CodePanel } from './components/code/CodePanel';
import { PromptBar } from './components/prompt/PromptBar';
import { ChatPanel, type ChatMessage } from './components/chat/ChatPanel';
import { WhiteboardCanvas } from './components/canvas/WhiteboardCanvas';
import { TimelinePlayer } from './components/timeline/TimelinePlayer';
import { SettingsModal } from './components/settings/SettingsModal';
import { PRESET_SCENARIOS } from './mock/presetScenarios';
import { useTimeline } from './core/useTimeline';
import { FEATHERLESS_DEFAULT_MODEL, executeMicroCommand, solveProblemWithAi } from './ai';
import { parseDsaIntent, buildStoryboardFromIntent } from './ai/dsaIntentParser';
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
      const promptParam = new URLSearchParams(window.location.search).get('prompt');
      if (promptParam) {
        const intent = parseDsaIntent(promptParam);
        const sb = buildStoryboardFromIntent(intent, 'python');
        return {
          ...sb,
          name: sb.title,
        };
      }
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

  // AI loading and status state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Left sidebar tab: 'code' | 'chat' (supports ?tab=chat or ?tab=code URL param)
  const [activeLeftTab, setActiveLeftTab] = useState<'code' | 'chat'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'code') return 'code';
      if (tabParam === 'chat') return 'chat';
      if (params.get('prompt')) return 'chat';
    }
    return 'code';
  });

  // AI Chat message history
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const promptParam = new URLSearchParams(window.location.search).get('prompt');
      if (promptParam) {
        const intent = parseDsaIntent(promptParam);
        const sb = buildStoryboardFromIntent(intent, 'python');
        return [
          {
            id: 'user-init',
            role: 'user',
            text: promptParam,
            timestamp: 'Just now',
          },
          {
            id: 'ai-init',
            role: 'assistant',
            text: sb.chatExplanation || `Created ${sb.title} in your workspace.`,
            timestamp: 'Just now',
            metadata: {
              algorithmTitle: sb.title,
              language: sb.language,
              stepCount: sb.steps.length,
              visualComponents: [
                sb.initialState.array ? 'arr' : '',
                Object.keys(sb.initialState.variables).length > 0 ? 'vars' : '',
                sb.initialState.loop ? 'for' : '',
                Object.keys(sb.initialState.linkedListNodes).length > 0 ? 'linked-list' : '',
                Object.keys(sb.initialState.treeNodes).length > 0 ? 'tree' : '',
              ].filter(Boolean),
            },
          },
        ];
      }
    }
    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        text: "Hi! I'm your AI DSA Tutor powered by GLM 5.3 Flash. Ask me any programming or data-structure problem (e.g. 'Create an array [10, 6, 8, 9, 10]', 'Reverse a linked list', or 'Find the maximum element') and I'll generate the solution code and load an interactive step-by-step visualization onto your canvas!",
        timestamp: 'Ready',
        metadata: {
          algorithmTitle: 'GLM 5.3 Flash Tutor',
          language: 'All Languages',
          stepCount: 0,
        },
      },
    ];
  });

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<StudioSettings>(() => {
    const savedKey =
      localStorage.getItem('dsa_featherless_api_key') ||
      (import.meta.env.VITE_FEATHERLESS_API_KEY as string) ||
      '';
    const savedModel =
      localStorage.getItem('dsa_featherless_model') || FEATHERLESS_DEFAULT_MODEL;
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

  // Handle manual code edits from CodePanel
  const handleCodeChange = (newCode: string) => {
    setCurrentScenario((prev) => ({
      ...prev,
      code: newCode,
    }));
  };

  // Handle language switch from CodePanel
  const handleLanguageChange = async (lang: 'python' | 'typescript' | 'cpp') => {
    if (lang === currentScenario.language) return;
    setIsAiLoading(true);
    setAiStatusMessage({ text: `Translating solution to ${lang}...`, type: 'info' });
    try {
      const result = await solveProblemWithAi(currentScenario.title, {
        language: lang,
        currentCode: currentScenario.code,
        apiKey: settings.apiKey,
        model: settings.model,
      });

      setCurrentScenario({
        ...result.storyboard,
        name: result.storyboard.title,
      });
      setAiStatusMessage({ text: `Converted to ${lang}`, type: 'success' });
      setTimeout(() => setAiStatusMessage(null), 3000);
    } catch {
      setAiStatusMessage({ text: `Failed to change language`, type: 'error' });
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Prompt Bar submit (Micro-commands or AI Problem Solving)
  const handlePromptSubmit = async (promptText: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: promptText,
      timestamp: timeStr,
    };
    setChatMessages((prev) => [...prev, userMsg]);

    // 1. Instant Micro-Command execution (0ms latency direct canvas mutation)
    const microResult = executeMicroCommand(promptText, timeline.canvasState);
    if (microResult.isMicroCommand) {
      if (microResult.error) {
        setAiStatusMessage({ text: microResult.error, type: 'error' });
        setChatMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            text: `⚠️ ${microResult.error}`,
            timestamp: timeStr,
          },
        ]);
      } else if (microResult.nextState) {
        // If an array was created/updated, generate matching declaration code for the editor
        let nextCode = currentScenario.code;
        if (microResult.nextState.array) {
          const vals = microResult.nextState.array.values;
          nextCode =
            currentScenario.language === 'typescript'
              ? `// Array declaration and initialization\nconst arr: number[] = [${vals.join(', ')}];\n\nconsole.log(\`Array with \${arr.length} elements:\`, arr);`
              : currentScenario.language === 'cpp'
              ? `// Array declaration and initialization\n#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> arr = {${vals.join(', ')}};\n    std::cout << "Array with " << arr.size() << " elements" << std::endl;\n    return 0;\n}`
              : `# Array declaration and initialization\narr = [${vals.join(', ')}]\n\nprint(f"Array with {len(arr)} elements: {arr}")`;
        }

        const isArrayCreation = !!microResult.nextState.array && (promptText.toLowerCase().includes('array') || promptText.includes('['));
        const updatedScenario: PresetScenario = {
          id: `micro-${Date.now()}`,
          name: isArrayCreation ? 'Array Initialization' : currentScenario.name,
          title: isArrayCreation ? 'Array Initialization' : currentScenario.title,
          badge: isArrayCreation ? 'Array Structure' : currentScenario.badge,
          language: currentScenario.language,
          fileName: currentScenario.language === 'python' ? 'array.py' : currentScenario.language === 'typescript' ? 'array.ts' : 'array.cpp',
          code: nextCode,
          initialPrompt: promptText,
          initialState: microResult.nextState,
          steps: [
            {
              id: `micro-${Date.now()}`,
              stepNumber: 0,
              codeLine: 2,
              title: isArrayCreation ? 'Array Created' : 'Micro-Command Execution',
              narration: microResult.message || 'Canvas updated directly.',
              variables: microResult.nextState.array ? { length: microResult.nextState.array.values.length } : {},
              mutations: microResult.nextState.array
                ? [
                    {
                      type: 'array',
                      action: {
                        kind: 'highlight-slots',
                        indices: microResult.nextState.array.values.map((_, i) => i),
                        state: 'active',
                      },
                    },
                  ]
                : [],
            },
          ],
        };
        setCurrentScenario(updatedScenario);
        setAiStatusMessage({ text: microResult.message || 'Canvas updated.', type: 'success' });
        setChatMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            text: `✅ ${microResult.message || 'Canvas updated directly.'}`,
            timestamp: timeStr,
            metadata: {
              algorithmTitle: 'Micro-Command',
              language: currentScenario.language,
              stepCount: 1,
              visualComponents: [
                microResult.nextState?.array ? 'arr' : '',
                Object.keys(microResult.nextState?.variables || {}).length > 0 ? 'vars' : '',
                microResult.nextState?.loop ? 'for' : '',
                Object.keys(microResult.nextState?.linkedListNodes || {}).length > 0 ? 'linked-list' : '',
                Object.keys(microResult.nextState?.treeNodes || {}).length > 0 ? 'tree' : '',
              ].filter(Boolean),
            },
          },
        ]);
        setTimeout(() => setAiStatusMessage(null), 4000);
      }
      return;
    }

    // 2. Macro-Storyboard AI Problem Solving
    setIsAiLoading(true);
    setActiveLeftTab('chat');
    const shortModelName = settings.model.split('/').pop() || 'GLM 5.3 Flash';
    setAiStatusMessage({ text: `Analyzing with ${shortModelName}...`, type: 'info' });

    try {
      const result = await solveProblemWithAi(promptText, {
        language: currentScenario.language,
        currentCode: currentScenario.code,
        apiKey: settings.apiKey,
        model: settings.model,
      });

      const newScenario: PresetScenario = {
        id: result.storyboard.id,
        name: result.storyboard.title,
        title: result.storyboard.title,
        badge: result.storyboard.badge,
        language: result.storyboard.language,
        fileName: result.storyboard.fileName,
        code: result.storyboard.code,
        initialPrompt: result.storyboard.initialPrompt,
        initialState: result.storyboard.initialState,
        steps: result.storyboard.steps,
      };

      // State verification: check that required components actually exist in workspace state
      const hasArray = !!(newScenario.initialState.array && newScenario.initialState.array.values.length > 0);
      const hasLinkedList = Object.keys(newScenario.initialState.linkedListNodes).length > 0;
      const hasTree = Object.keys(newScenario.initialState.treeNodes).length > 0;

      const pLower = promptText.toLowerCase();
      const askedArray = pLower.includes('array') || promptText.includes('[') || promptText.includes('{');
      const askedList = pLower.includes('list') || promptText.includes('->');
      const askedTree = pLower.includes('tree') || pLower.includes('bst');

      let validatedExplanation = result.chatExplanation;
      if (askedArray && !hasArray) {
        validatedExplanation = `⚠️ Could not create the requested array visualization. Workspace state was not updated.`;
      } else if (askedList && !hasLinkedList) {
        validatedExplanation = `⚠️ Could not create the requested linked list visualization. Workspace state was not updated.`;
      } else if (askedTree && !hasTree) {
        validatedExplanation = `⚠️ Could not create the requested tree visualization. Workspace state was not updated.`;
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      setCurrentScenario(newScenario);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: validatedExplanation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: {
          algorithmTitle: result.storyboard.title,
          language: result.storyboard.language,
          stepCount: result.storyboard.steps.length,
          visualComponents: [
            result.storyboard.initialState.array ? 'arr' : '',
            Object.keys(result.storyboard.initialState.variables).length > 0 ? 'vars' : '',
            result.storyboard.initialState.loop ? 'for' : '',
            Object.keys(result.storyboard.initialState.linkedListNodes).length > 0 ? 'linked-list' : '',
            Object.keys(result.storyboard.initialState.treeNodes).length > 0 ? 'tree' : '',
          ].filter(Boolean),
        },
      };

      setChatMessages((prev) => [...prev, aiMsg]);

      setAiStatusMessage({
        text: `Loaded "${result.storyboard.title}" (${result.storyboard.steps.length} steps)`,
        type: 'success',
      });

      setTimeout(() => setAiStatusMessage(null), 5000);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          text: `Error solving problem: ${err.message || String(err)}. Please try again.`,
          timestamp: timeStr,
        },
      ]);
      setAiStatusMessage({
        text: `Error: ${err.message || String(err)}`,
        type: 'error',
      });
    } finally {
      setIsAiLoading(false);
    }
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
        {/* Left Studio Panel: Code Editor, AI Chat, and Prompt Bar (collapsible & resizable) */}
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
          {/* Top Tabs Switcher: Code Editor vs AI Chat */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50/90 border-b border-slate-200 shrink-0 select-none">
            <div className="flex items-center p-0.5 rounded-xl bg-slate-200/70 border border-slate-300/60">
              <button
                type="button"
                onClick={() => setActiveLeftTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeLeftTab === 'code'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLeftTab('chat')}
                className={`relative flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeLeftTab === 'chat'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>AI Chat</span>
                {chatMessages.length > 1 && activeLeftTab !== 'chat' && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                )}
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              {currentScenario.badge}
            </span>
          </div>

          {/* Tab Content: CodePanel or ChatPanel */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {activeLeftTab === 'code' ? (
              <CodePanel
                code={currentScenario.code}
                language={currentScenario.language}
                fileName={currentScenario.fileName}
                activeLine={currentStep.codeLine}
                onCollapse={() => setIsSidebarOpen(false)}
                onCodeChange={handleCodeChange}
                onLanguageChange={handleLanguageChange}
              />
            ) : (
              <ChatPanel
                messages={chatMessages}
                isLoading={isAiLoading}
                onSelectPrompt={handlePromptSubmit}
                onPlayTimeline={timeline.play}
                onSwitchToCodeTab={() => setActiveLeftTab('code')}
              />
            )}
          </div>

          {/* AI Prompt & Command Bar */}
          <PromptBar
            initialPrompt={currentScenario.initialPrompt}
            isLoading={isAiLoading}
            statusMessage={aiStatusMessage}
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
