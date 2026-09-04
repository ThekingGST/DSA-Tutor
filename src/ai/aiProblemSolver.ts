import type { TimelineStoryboard } from '../types/timeline.ts';
import { FeatherlessClient } from './featherlessClient.ts';
import { generateProceduralStoryboard } from './fallbackStoryboards.ts';

export interface ProblemSolvingContext {
  language?: 'python' | 'typescript' | 'cpp';
  currentCode?: string;
  apiKey?: string;
  model?: string;
}

export interface ProblemSolvingResult {
  storyboard: TimelineStoryboard;
  chatExplanation: string;
  source: 'featherless' | 'fallback';
  identifiedLanguage: 'python' | 'typescript' | 'cpp';
  algorithmTitle: string;
}

/**
 * Analyzes the user's natural language question and determines the target programming language.
 * If not explicitly mentioned by the user, falls back to the configured workspace language.
 */
export function resolveTargetLanguage(
  prompt: string,
  defaultLanguage: 'python' | 'typescript' | 'cpp' = 'python'
): 'python' | 'typescript' | 'cpp' {
  const p = prompt.toLowerCase();
  if (p.includes('in typescript') || p.includes('in ts') || p.includes('in javascript') || p.includes('in js')) {
    return 'typescript';
  }
  if (p.includes('in c++') || p.includes('in cpp') || p.includes('in c plus plus')) {
    return 'cpp';
  }
  if (p.includes('in python') || p.includes('in py')) {
    return 'python';
  }
  return defaultLanguage;
}

/**
 * AI-powered problem solver.
 * Takes the user query from the chat section, solves the problem, generates executable code
 * in the appropriate language, crafts the full interactive whiteboard visualization storyboard,
 * and produces a concise conversational chat explanation.
 */
export async function solveProblemWithAi(
  prompt: string,
  context: ProblemSolvingContext = {}
): Promise<ProblemSolvingResult> {
  const targetLanguage = resolveTargetLanguage(prompt, context.language || 'python');

  const client = new FeatherlessClient({
    apiKey: context.apiKey,
    model: context.model,
  });

  // If user has Featherless API Key, attempt live LLM generation
  if (client.hasApiKey()) {
    try {
      const enrichedPrompt = `${prompt} (Generate executable solution in ${targetLanguage})`;
      const res = await client.generateStoryboard(enrichedPrompt, context.currentCode);

      if (res.source === 'featherless' && res.storyboard) {
        const chatExplanation =
          res.storyboard.chatExplanation ||
          `Here's an optimal solution for ${res.storyboard.title} in ${res.storyboard.language}. I've generated the code and added the required visualization to the workspace. You can step through the execution using the timeline.`;

        return {
          storyboard: res.storyboard,
          chatExplanation,
          source: 'featherless',
          identifiedLanguage: res.storyboard.language || targetLanguage,
          algorithmTitle: res.storyboard.title,
        };
      }
    } catch (err) {
      console.warn('Featherless live generation failed, falling back to procedural solver:', err);
    }
  }

  // Zero-fail procedural solver (deterministic, offline-ready)
  const fallback = generateProceduralStoryboard(prompt, targetLanguage);
  return {
    storyboard: fallback,
    chatExplanation:
      fallback.chatExplanation ||
      `Here's a solution for ${fallback.title} in ${targetLanguage}. I've generated the code and added the required visualization to the workspace. You can step through the execution using the timeline.`,
    source: 'fallback',
    identifiedLanguage: targetLanguage,
    algorithmTitle: fallback.title,
  };
}
