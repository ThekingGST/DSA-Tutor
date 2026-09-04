import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractJsonFromResponse,
  validateAndNormalizeStoryboard,
} from '../src/ai/storyboardParser.ts';

test('Phase 6: Storyboard Parser & JSON Sanitization Tests', async (t) => {
  await t.test('Parses clean raw JSON without fences', () => {
    const raw = `{"title": "Test Algorithm", "steps": [{"stepNumber": 0, "title": "Step 0"}]}`;
    const parsed = extractJsonFromResponse(raw) as any;
    assert.equal(parsed.title, 'Test Algorithm');
    assert.equal(parsed.steps.length, 1);
  });

  await t.test('Extracts JSON embedded in markdown fences and commentary', () => {
    const raw = `
Here is the generated storyboard for your request:
\`\`\`json
{
  "id": "my-algo",
  "title": "Selection Sort",
  "steps": [
    { "stepNumber": 0, "title": "Init" }
  ]
}
\`\`\`
I hope this visual helps!
    `;
    const parsed = extractJsonFromResponse(raw) as any;
    assert.equal(parsed.id, 'my-algo');
    assert.equal(parsed.title, 'Selection Sort');
  });

  await t.test('Sanitizes trailing commas in arrays and objects', () => {
    const malformed = `
{
  "title": "Trailing Commas Test",
  "steps": [
    { "stepNumber": 0, "title": "Step 0", },
  ],
}
    `;
    const parsed = extractJsonFromResponse(malformed) as any;
    assert.equal(parsed.title, 'Trailing Commas Test');
    assert.equal(parsed.steps.length, 1);
  });

  await t.test('Validates and normalizes incomplete storyboard payload', () => {
    const rawPayload = {
      title: 'Quick Demo',
      steps: [
        {
          title: 'First Step',
          // missing stepNumber, codeLine, narration, mutations
        },
      ],
    };

    const storyboard = validateAndNormalizeStoryboard(rawPayload);
    assert.ok(storyboard.id.startsWith('ai-gen-'));
    assert.equal(storyboard.title, 'Quick Demo');
    assert.equal(storyboard.language, 'python');
    assert.equal(storyboard.steps.length, 1);
    assert.equal(storyboard.steps[0].stepNumber, 0);
    assert.equal(storyboard.steps[0].codeLine, 1);
    assert.ok(storyboard.steps[0].narration.length > 0);
    assert.deepEqual(storyboard.steps[0].mutations, []);
  });

  await t.test('Generates fallback step if steps array is empty', () => {
    const emptyPayload = {
      title: 'Empty Algorithm',
      steps: [],
    };

    const storyboard = validateAndNormalizeStoryboard(emptyPayload);
    assert.equal(storyboard.steps.length, 1);
    assert.equal(storyboard.steps[0].stepNumber, 0);
    assert.equal(storyboard.steps[0].title, 'Initialize Algorithm');
  });
});
