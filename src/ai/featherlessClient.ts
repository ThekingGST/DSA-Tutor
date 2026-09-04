import type { TimelineStoryboard } from '../types/timeline.ts';
import { FEATHERLESS_DEFAULT_MODEL, FEATHERLESS_SYSTEM_PROMPT } from './systemPrompt.ts';
import { extractJsonFromResponse, validateAndNormalizeStoryboard } from './storyboardParser.ts';
import { generateProceduralStoryboard } from './fallbackStoryboards.ts';

export interface FeatherlessConfig {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  timeoutMs?: number;
}

export class FeatherlessClient {
  private apiKey: string;
  private model: string;
  private endpoint: string;
  private timeoutMs: number;

  constructor(config: FeatherlessConfig = {}) {
    this.apiKey =
      config.apiKey ||
      (typeof localStorage !== 'undefined'
        ? localStorage.getItem('dsa_featherless_api_key') || ''
        : '') ||
      (typeof import.meta !== 'undefined' && import.meta.env
        ? (import.meta.env.VITE_FEATHERLESS_API_KEY as string) || ''
        : '');
    this.model =
      config.model ||
      (typeof localStorage !== 'undefined'
        ? localStorage.getItem('dsa_featherless_model') || FEATHERLESS_DEFAULT_MODEL
        : FEATHERLESS_DEFAULT_MODEL);
    this.endpoint = config.endpoint || 'https://api.featherless.ai/v1/chat/completions';
    this.timeoutMs = config.timeoutMs || 25000;
  }

  public hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public getModel(): string {
    return this.model;
  }

  public setApiKey(key: string) {
    this.apiKey = key.trim();
  }

  public setModel(model: string) {
    this.model = model.trim();
  }

  /**
   * Generates an interactive TimelineStoryboard from natural language or code.
   * If offline, no API key is provided, or the request fails, seamlessly falls back
   * to a high-quality procedural storyboard.
   */
  public async generateStoryboard(
    prompt: string,
    codeContext?: string
  ): Promise<{ storyboard: TimelineStoryboard; source: 'featherless' | 'fallback'; error?: string }> {
    if (!this.hasApiKey()) {
      return {
        storyboard: generateProceduralStoryboard(prompt),
        source: 'fallback',
        error: 'No Featherless API key configured; loaded procedural fallback storyboard.',
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const userMessage = codeContext
        ? `Create a visual DSA storyboard for the following problem and code:\n\nUser Request: ${prompt}\n\nCode:\n${codeContext}`
        : `Create a visual DSA storyboard for the following algorithm:\n\nUser Request: ${prompt}`;

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: FEATHERLESS_SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.2,
          max_tokens: 3500,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `Featherless API returned HTTP ${response.status} ${response.statusText}: ${errorBody.slice(0, 150)}`
        );
      }

      const json = await response.json();
      const rawContent = json?.choices?.[0]?.message?.content;
      if (!rawContent) {
        throw new Error('No content returned in Featherless API response');
      }

      const parsedJson = extractJsonFromResponse(rawContent);
      const storyboard = validateAndNormalizeStoryboard(parsedJson, prompt);

      return {
        storyboard,
        source: 'featherless',
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const errorMessage = err?.name === 'AbortError' ? 'Featherless request timed out' : err?.message || String(err);
      console.warn(`Featherless storyboard generation fallback: ${errorMessage}`);

      return {
        storyboard: generateProceduralStoryboard(prompt),
        source: 'fallback',
        error: errorMessage,
      };
    }
  }
}

export const defaultFeatherlessClient = new FeatherlessClient();
