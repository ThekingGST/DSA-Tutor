export interface TimelineStepMock {
  id: string;
  stepIndex: number;
  totalSteps: number;
  codeLine: number; // 1-based line number to highlight in code editor
  title: string;
  narration: string;
  variables: Record<string, string | number>;
  activeArrayIndices?: number[];
  activePointerBadge?: { name: string; index: number };
}

export interface PresetScenario {
  id: string;
  name: string;
  badge: string;
  language: 'python' | 'typescript' | 'cpp';
  fileName: string;
  code: string;
  steps: TimelineStepMock[];
  initialPrompt: string;
}

export interface StudioSettings {
  apiKey: string;
  model: string;
  speechEnabled: boolean;
  theme: 'dark' | 'light';
  playbackSpeed: number;
}
