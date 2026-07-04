import { describe, it, expect, vi } from 'vitest';
import {
  openAiProvider,
  anthropicProvider,
  parseIssuesJson,
  buildPrompt,
  MAX_SPANS,
  MAX_SNIPPET_CHARS,
  MAX_OUTPUT_TOKENS,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_ANTHROPIC_MODEL,
} from './adapters';
import { providerToReviewer } from './provider';
import type { Span } from './types';

const TEXT = 'The quick brown fox jumps over the lazy dog near the river.';
const CANDIDATE: Span = { start: 4, end: 19 }; // "quick brown fox"

/** Build a fake fetch returning a given OpenAI-shaped JSON body + status. */
function openAiFetch(content: string, ok = true, status = 200): typeof fetch {
  return vi.fn(async () => ({
    ok,
    status,
    json: async () => ({ choices: [{ message: { content } }] }),
  })) as unknown as typeof fetch;
}

/** Build a fake fetch returning an Anthropic-shaped JSON body + status. */
function anthropicFetch(text: string, ok = true, status = 200): typeof fetch {
  return vi.fn(async () => ({
    ok,
    status,
    json: async () => ({ content: [{ text }] }),
  })) as unknown as typeof fetch;
}

const GOOD_JSON = JSON.stringify({
  issues: [
    { span: { start: 4, end: 19 }, category: 'clarity', severity: 'minor', rationale: 'unclear' },
  ],
});

describe('parseIssuesJson', () => {
  it('parses a clean JSON object', () => {
    expect(parseIssuesJson(GOOD_JSON)).toHaveLength(1);
  });

  it('strips ```json fences', () => {
    expect(parseIssuesJson('```json\n' + GOOD_JSON + '\n```')).toHaveLength(1);
  });

  it('strips bare ``` fences', () => {
    expect(parseIssuesJson('```\n' + GOOD_JSON + '\n```')).toHaveLength(1);
  });

  it('extracts JSON from surrounding prose', () => {
    expect(parseIssuesJson('Here you go:\n' + GOOD_JSON + '\nHope that helps!')).toHaveLength(1);
  });

  it('returns [] on empty, non-JSON, or issues-not-an-array', () => {
    expect(parseIssuesJson('')).toEqual([]);
    expect(parseIssuesJson('not json at all')).toEqual([]);
    expect(parseIssuesJson('{"issues": "nope"}')).toEqual([]);
    expect(parseIssuesJson('{"nope": []}')).toEqual([]);
  });
});

describe('buildPrompt — scoping + caps', () => {
  it('includes only the provided spans and their snippets', () => {
    const prompt = buildPrompt(
      { text: TEXT, spans: [CANDIDATE] },
      [{ index: 0, start: 4, end: 19, snippet: 'quick brown fox' }],
    );
    expect(prompt).toContain('quick brown fox');
    expect(prompt).toContain('[4,19]');
    expect(prompt).toContain('ONLY the numbered spans');
  });

  it('embeds WRITING.md context when supplied', () => {
    const prompt = buildPrompt(
      { text: TEXT, spans: [CANDIDATE], writingMd: 'Use active voice.' },
      [{ index: 0, start: 4, end: 19, snippet: 'quick brown fox' }],
    );
    expect(prompt).toContain('Use active voice.');
  });
});

describe('openAiProvider', () => {
  it('returns [] with no API key and never calls fetch', async () => {
    const spy = openAiFetch(GOOD_JSON);
    const p = openAiProvider({ apiKey: undefined, fetchImpl: spy });
    const out = await p.review({ text: TEXT, spans: [CANDIDATE] });
    expect(out).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns [] with no candidate spans and never calls fetch', async () => {
    const spy = openAiFetch(GOOD_JSON);
    const p = openAiProvider({ apiKey: 'sk-test', fetchImpl: spy });
    const out = await p.review({ text: TEXT, spans: [] });
    expect(out).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('POSTs to the OpenAI endpoint with a Bearer key and json_object format', async () => {
    const spy = openAiFetch(GOOD_JSON);
    const p = openAiProvider({ apiKey: 'sk-test', fetchImpl: spy });
    await p.review({ text: TEXT, spans: [CANDIDATE] });
    expect(spy).toHaveBeenCalledOnce();
    const [url, init] = (spy as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer sk-test');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe(DEFAULT_OPENAI_MODEL);
    expect(body.max_tokens).toBe(MAX_OUTPUT_TOKENS);
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('returns raw issues parsed from the model response', async () => {
    const p = openAiProvider({ apiKey: 'sk-test', fetchImpl: openAiFetch(GOOD_JSON) });
    const out = await p.review({ text: TEXT, spans: [CANDIDATE] });
    expect(out).toHaveLength(1);
  });

  it('fails closed to [] on a non-2xx response', async () => {
    const p = openAiProvider({ apiKey: 'sk-test', fetchImpl: openAiFetch('', false, 429) });
    await expect(p.review({ text: TEXT, spans: [CANDIDATE] })).resolves.toEqual([]);
  });

  it('fails closed to [] on a network error', async () => {
    const throwing = vi.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    const p = openAiProvider({ apiKey: 'sk-test', fetchImpl: throwing });
    await expect(p.review({ text: TEXT, spans: [CANDIDATE] })).resolves.toEqual([]);
  });

  it('caps spans to MAX_SPANS and truncates snippets to MAX_SNIPPET_CHARS', async () => {
    const spy = openAiFetch(GOOD_JSON);
    const p = openAiProvider({ apiKey: 'sk-test', fetchImpl: spy });
    const longText = 'x'.repeat(5000);
    const manySpans: Span[] = Array.from({ length: 30 }, (_, i) => ({
      start: i * 100,
      end: i * 100 + 1000, // deliberately longer than MAX_SNIPPET_CHARS
    }));
    await p.review({ text: longText, spans: manySpans });
    const [, init] = (spy as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const prompt = JSON.parse((init as RequestInit).body as string).messages[1].content as string;
    // Only MAX_SPANS span lines appear.
    const spanLines = prompt.split('\n').filter((l) => l.startsWith('- span '));
    expect(spanLines).toHaveLength(MAX_SPANS);
    // No single snippet exceeds the char cap (allow for JSON.stringify quoting).
    for (const line of spanLines) {
      const snippet = line.slice(line.indexOf(': ') + 2);
      expect(snippet.length).toBeLessThanOrEqual(MAX_SNIPPET_CHARS + 2);
    }
  });
});

describe('anthropicProvider', () => {
  it('returns [] with no API key and never calls fetch', async () => {
    const spy = anthropicFetch(GOOD_JSON);
    const p = anthropicProvider({ apiKey: undefined, fetchImpl: spy });
    expect(await p.review({ text: TEXT, spans: [CANDIDATE] })).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('POSTs to the Anthropic endpoint with x-api-key + version headers', async () => {
    const spy = anthropicFetch(GOOD_JSON);
    const p = anthropicProvider({ apiKey: 'sk-ant', fetchImpl: spy });
    await p.review({ text: TEXT, spans: [CANDIDATE] });
    const [url, init] = (spy as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-ant');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe(DEFAULT_ANTHROPIC_MODEL);
    expect(body.max_tokens).toBe(MAX_OUTPUT_TOKENS);
  });

  it('parses issues from the Anthropic content shape', async () => {
    const p = anthropicProvider({ apiKey: 'sk-ant', fetchImpl: anthropicFetch(GOOD_JSON) });
    expect(await p.review({ text: TEXT, spans: [CANDIDATE] })).toHaveLength(1);
  });

  it('fails closed to [] on non-2xx and on network error', async () => {
    const p1 = anthropicProvider({ apiKey: 'sk-ant', fetchImpl: anthropicFetch('', false, 500) });
    await expect(p1.review({ text: TEXT, spans: [CANDIDATE] })).resolves.toEqual([]);
    const throwing = vi.fn(async () => {
      throw new Error('boom');
    }) as unknown as typeof fetch;
    const p2 = anthropicProvider({ apiKey: 'sk-ant', fetchImpl: throwing });
    await expect(p2.review({ text: TEXT, spans: [CANDIDATE] })).resolves.toEqual([]);
  });

  it('honours a custom model override', async () => {
    const spy = anthropicFetch(GOOD_JSON);
    const p = anthropicProvider({ apiKey: 'sk-ant', model: 'claude-opus-4', fetchImpl: spy });
    await p.review({ text: TEXT, spans: [CANDIDATE] });
    const [, init] = (spy as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse((init as RequestInit).body as string).model).toBe('claude-opus-4');
  });
});

describe('adapters compose with providerToReviewer (validation + fail-closed)', () => {
  it('a valid finding survives validation and enters the pipeline', async () => {
    const p = openAiProvider({ apiKey: 'sk-test', fetchImpl: openAiFetch(GOOD_JSON) });
    const reviewer = providerToReviewer(p, { candidateSpans: [CANDIDATE] });
    const out = await reviewer(TEXT);
    expect(out).toHaveLength(1);
    expect(out[0].category).toBe('clarity');
    expect(out[0].source).toBe('openai');
    // text is re-derived by the validator from the real source span.
    expect(out[0].text).toBe('quick brown fox');
  });

  it('a hallucinated out-of-candidate span is dropped by the adapter layer', async () => {
    const hallucinated = JSON.stringify({
      issues: [
        { span: { start: 40, end: 48 }, category: 'clarity', severity: 'minor', rationale: 'x' },
      ],
    });
    const p = openAiProvider({ apiKey: 'sk-test', fetchImpl: openAiFetch(hallucinated) });
    const reviewer = providerToReviewer(p, { candidateSpans: [CANDIDATE] });
    expect(await reviewer(TEXT)).toEqual([]);
  });

  it('an off-vocabulary category from the model is dropped', async () => {
    const offVocab = JSON.stringify({
      issues: [
        { span: { start: 4, end: 19 }, category: 'terminology', severity: 'minor', rationale: 'x' },
      ],
    });
    const p = anthropicProvider({ apiKey: 'sk-ant', fetchImpl: anthropicFetch(offVocab) });
    const reviewer = providerToReviewer(p, { candidateSpans: [CANDIDATE] });
    expect(await reviewer(TEXT)).toEqual([]);
  });

  it('a provider error leaves the reviewer yielding [] (deterministic-only)', async () => {
    const throwing = vi.fn(async () => {
      throw new Error('down');
    }) as unknown as typeof fetch;
    const p = openAiProvider({ apiKey: 'sk-test', fetchImpl: throwing });
    const reviewer = providerToReviewer(p, { candidateSpans: [CANDIDATE] });
    await expect(reviewer(TEXT)).resolves.toEqual([]);
  });
});
