import type { CanvasEntities, TimelineStep } from './timeline';

export type { TimelineStep } from './timeline';

export interface PresetScenario {
  id: string;
  name: string;
  title: string;
  badge: string;
  language: 'python' | 'typescript' | 'cpp';
  fileName: string;
  code: string;
  initialPrompt: string;
  initialState: CanvasEntities;
  steps: TimelineStep[];
}

export interface StudioSettings {
  apiKey: string;
  model: string;
  speechEnabled: boolean;
  theme: 'dark' | 'light';
  playbackSpeed: number;
}
