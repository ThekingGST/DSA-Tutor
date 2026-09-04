import type {
  TimelineStoryboard,
  TimelineStep,
  CanvasEntities,
  CanvasMutation,
} from '../types/timeline.ts';

/**
 * Extracts and parses a JSON object or array from an LLM response string.
 * Resilient against markdown backtick fences, commentary prefixes, and trailing commas.
 */
export function extractJsonFromResponse(rawResponse: string): unknown {
  if (!rawResponse || typeof rawResponse !== 'string') {
    throw new Error('Empty or invalid response received from AI model');
  }

  let cleaned = rawResponse.trim();

  // Strip markdown code fences if present (```json ... ``` or ``` ...)
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  // If there is commentary before the first '{' or '[', find the start
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  let startIndex = -1;
  let isObject = true;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
    isObject = true;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    isObject = false;
  }

  if (startIndex !== -1) {
    // Find matching last closing brace/bracket
    const endIndex = isObject ? cleaned.lastIndexOf('}') : cleaned.lastIndexOf(']');
    if (endIndex > startIndex) {
      cleaned = cleaned.substring(startIndex, endIndex + 1);
    }
  }

  // Sanitize trailing commas before closing braces/brackets (common LLM JSON flaw)
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    // Attempt minor rescue: replace unescaped newlines in JSON strings if any
    try {
      const rescued = cleaned.replace(/(?<=:\s*"[^"]*)\n([^"]*")/g, '\\n$1');
      return JSON.parse(rescued);
    } catch {
      throw new Error(`Failed to parse AI response as JSON: ${err.message}`);
    }
  }
}

/**
 * Validates and normalizes an untrusted storyboard payload from AI or storage.
 * Provides fallback defaults so the canvas and timeline player never crash.
 */
export function validateAndNormalizeStoryboard(
  raw: unknown,
  fallbackPrompt = 'Algorithm Visualization'
): TimelineStoryboard {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Storyboard payload must be an object');
  }

  const obj: Record<string, any> = Array.isArray(raw)
    ? { steps: raw }
    : (raw as Record<string, any>);

  const rawSteps: any[] = Array.isArray(obj.steps) ? obj.steps : [];

  const id = typeof obj.id === 'string' && obj.id ? obj.id : `ai-gen-${Date.now()}`;
  const title = typeof obj.title === 'string' && obj.title ? obj.title : fallbackPrompt;
  const badge = typeof obj.badge === 'string' && obj.badge ? obj.badge : 'AI Generated';
  const language =
    obj.language === 'python' || obj.language === 'typescript' || obj.language === 'cpp'
      ? obj.language
      : 'python';
  const fileName =
    typeof obj.fileName === 'string' && obj.fileName
      ? obj.fileName
      : language === 'python'
      ? 'solution.py'
      : language === 'typescript'
      ? 'solution.ts'
      : 'solution.cpp';
  const code =
    typeof obj.code === 'string' && obj.code.trim()
      ? obj.code
      : `# ${title}\n# Generated algorithm solution\ndef solve():\n    pass`;
  const initialPrompt =
    typeof obj.initialPrompt === 'string' && obj.initialPrompt ? obj.initialPrompt : fallbackPrompt;

  // Validate initialState
  const rawInit = obj.initialState && typeof obj.initialState === 'object' ? obj.initialState : {};
  const initialState: CanvasEntities = {
    array:
      rawInit.array && Array.isArray(rawInit.array.values)
        ? {
            id: rawInit.array.id || 'arr-1',
            name: rawInit.array.name || 'arr',
            values: rawInit.array.values.map((v: any) => Number(v) || 0),
            pointers: rawInit.array.pointers && typeof rawInit.array.pointers === 'object' ? rawInit.array.pointers : {},
            highlights: rawInit.array.highlights && typeof rawInit.array.highlights === 'object' ? rawInit.array.highlights : {},
          }
        : undefined,
    linkedListNodes:
      rawInit.linkedListNodes && typeof rawInit.linkedListNodes === 'object'
        ? rawInit.linkedListNodes
        : {},
    treeNodes:
      rawInit.treeNodes && typeof rawInit.treeNodes === 'object'
        ? rawInit.treeNodes
        : {},
    variables:
      rawInit.variables && typeof rawInit.variables === 'object'
        ? rawInit.variables
        : {},
    loop:
      rawInit.loop && typeof rawInit.loop === 'object'
        ? {
            id: rawInit.loop.id || 'loop-1',
            header: rawInit.loop.header || 'for item in collection',
            conditionText: rawInit.loop.conditionText || 'condition == True',
            currentIteration: Number(rawInit.loop.currentIteration) || 0,
            totalIterations: Number(rawInit.loop.totalIterations) || 1,
            isComplete: Boolean(rawInit.loop.isComplete),
            iterationPills: Array.isArray(rawInit.loop.iterationPills) ? rawInit.loop.iterationPills : undefined,
          }
        : undefined,
  };

  // Validate and normalize steps
  const steps: TimelineStep[] = rawSteps.map((s: any, idx: number) => {
    const stepNumber = idx;
    const stepId = typeof s.id === 'string' ? s.id : `step-${idx}`;
    const codeLine = typeof s.codeLine === 'number' && s.codeLine >= 1 ? s.codeLine : 1;
    const stepTitle = typeof s.title === 'string' && s.title ? s.title : `Step ${idx + 1}`;
    const narration =
      typeof s.narration === 'string' && s.narration
        ? s.narration
        : `Executing step ${idx + 1}.`;
    const variables =
      s.variables && typeof s.variables === 'object' && !Array.isArray(s.variables)
        ? s.variables
        : {};

    const mutations: CanvasMutation[] = Array.isArray(s.mutations)
      ? s.mutations
          .filter((m: any) => m && typeof m === 'object' && m.action && typeof m.action.kind === 'string')
          .map((m: any) => ({
            type: m.type || 'array',
            targetId: m.targetId,
            action: m.action,
          }))
      : [];

    return {
      id: stepId,
      stepNumber,
      codeLine,
      title: stepTitle,
      narration,
      variables,
      mutations,
    };
  });

  // Guarantee at least 1 fallback step if steps array was empty
  if (steps.length === 0) {
    steps.push({
      id: 'step-0',
      stepNumber: 0,
      codeLine: 1,
      title: 'Initialize Algorithm',
      narration: `Ready to run ${title}.`,
      variables: {},
      mutations: [],
    });
  }

  const chatExplanation =
    typeof obj.chatExplanation === 'string' && obj.chatExplanation.trim()
      ? obj.chatExplanation.trim()
      : `Here's a solution for ${title} in ${language}. I've generated the code and added the required visualization to the workspace. You can step through the execution using the timeline.`;

  return {
    id,
    title,
    badge,
    language,
    fileName,
    code,
    initialPrompt,
    initialState,
    steps,
    chatExplanation,
  };
}
