import test from 'node:test';
import assert from 'node:assert/strict';
import { FeatherlessClient } from '../src/ai/featherlessClient.ts';
import { FEATHERLESS_DEFAULT_MODEL } from '../src/ai/systemPrompt.ts';

test('Phase 6: Featherless AI Client Tests', async (t) => {
  await t.test('Initializes with default model zai-org/GLM-5.3-Flash', () => {
    const client = new FeatherlessClient();
    assert.equal(client.getModel(), FEATHERLESS_DEFAULT_MODEL);
    assert.equal(client.getModel(), 'zai-org/GLM-5.3-Flash');
  });

  await t.test('Falls back to procedural storyboard cleanly when no API key is provided', async () => {
    const client = new FeatherlessClient({ apiKey: '' });
    assert.equal(client.hasApiKey(), false);

    const result = await client.generateStoryboard('find max element');
    assert.equal(result.source, 'fallback');
    assert.equal(result.storyboard.title, 'Find Maximum Element');
    assert.ok(result.storyboard.steps.length > 0);
  });

  await t.test('Supports custom model override', () => {
    const client = new FeatherlessClient({ model: 'Qwen/Qwen2.5-Coder-32B-Instruct' });
    assert.equal(client.getModel(), 'Qwen/Qwen2.5-Coder-32B-Instruct');

    client.setModel('zai-org/GLM-5.3-Flash');
    assert.equal(client.getModel(), 'zai-org/GLM-5.3-Flash');
  });

  await t.test('Correctly handles mock fetch response with zai-org/GLM-5.3-Flash', async () => {
    const originalFetch = globalThis.fetch;
    try {
      const mockResponse = {
        id: 'chatcmpl-123',
        choices: [
          {
            message: {
              content: `\`\`\`json
{
  "id": "mock-selection-sort",
  "title": "Selection Sort Simulation",
  "badge": "Sorting",
  "language": "python",
  "code": "def selection_sort(): pass",
  "steps": [
    {
      "id": "step-0",
      "stepNumber": 0,
      "codeLine": 1,
      "title": "Initialization",
      "narration": "We begin selection sort.",
      "variables": { "i": 0 },
      "mutations": []
    }
  ]
}
\`\`\``,
            },
          },
        ],
      };

      globalThis.fetch = async (url: any, init: any) => {
        const body = JSON.parse(init.body);
        assert.equal(body.model, 'zai-org/GLM-5.3-Flash');
        assert.equal(init.headers.Authorization, 'Bearer test-fl-key');
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const client = new FeatherlessClient({ apiKey: 'test-fl-key' });
      const { storyboard, source } = await client.generateStoryboard('simulate selection sort');

      assert.equal(source, 'featherless');
      assert.equal(storyboard.id, 'mock-selection-sort');
      assert.equal(storyboard.title, 'Selection Sort Simulation');
      assert.equal(storyboard.steps.length, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('Falls back to procedural storyboard gracefully on HTTP error', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => {
        return new Response('Rate limited', { status: 429 });
      };

      const client = new FeatherlessClient({ apiKey: 'test-fl-key' });
      const { storyboard, source, error } = await client.generateStoryboard('find max element');

      assert.equal(source, 'fallback');
      assert.equal(storyboard.title, 'Find Maximum Element');
      assert.match(error || '', /HTTP 429/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
