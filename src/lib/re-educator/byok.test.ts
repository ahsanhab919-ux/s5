import { describe, it, expect } from 'vitest';
import {
  reviewerFromByok,
  verifierFromByok,
  isByokProvider,
  BYOK_PROVIDERS,
  type ByokRequest,
} from './byok';

const KEY = 'sk-secret-value';
const TEXT_LEN = 100;

describe('isByokProvider', () => {
  it('accepts exactly the supported providers', () => {
    for (const p of BYOK_PROVIDERS) expect(isByokProvider(p)).toBe(true);
  });

  it('rejects anything else', () => {
    for (const bad of ['gemini', 'OPENAI', '', undefined, null, 42, {}]) {
      expect(isByokProvider(bad)).toBe(false);
    }
  });
});

describe('reviewerFromByok — fail-closed to undefined', () => {
  it('returns undefined when the descriptor is absent', () => {
    expect(reviewerFromByok(undefined, TEXT_LEN)).toBeUndefined();
  });

  it('returns undefined when the provider is missing or unsupported', () => {
    expect(reviewerFromByok({ apiKey: KEY }, TEXT_LEN)).toBeUndefined();
    expect(reviewerFromByok({ provider: 'gemini', apiKey: KEY }, TEXT_LEN)).toBeUndefined();
  });

  it('returns undefined when the key is missing or empty', () => {
    expect(reviewerFromByok({ provider: 'openai' }, TEXT_LEN)).toBeUndefined();
    expect(reviewerFromByok({ provider: 'openai', apiKey: '' }, TEXT_LEN)).toBeUndefined();
  });

  it('returns undefined for empty text (nothing to review)', () => {
    expect(reviewerFromByok({ provider: 'openai', apiKey: KEY }, 0)).toBeUndefined();
  });

  it('never throws on a malformed descriptor', () => {
    // Deliberately wrong shapes — the factory must degrade, not crash.
    expect(() =>
      reviewerFromByok({ provider: 123 as unknown as string }, TEXT_LEN),
    ).not.toThrow();
    expect(() =>
      reviewerFromByok(42 as unknown as ByokRequest, TEXT_LEN),
    ).not.toThrow();
  });
});

describe('reviewerFromByok — builds a reviewer for valid descriptors', () => {
  it('builds a function for a valid OpenAI descriptor', () => {
    const reviewer = reviewerFromByok({ provider: 'openai', apiKey: KEY }, TEXT_LEN);
    expect(typeof reviewer).toBe('function');
  });

  it('builds a function for a valid Anthropic descriptor with a model override', () => {
    const reviewer = reviewerFromByok(
      { provider: 'anthropic', apiKey: KEY, model: 'claude-opus-4' },
      TEXT_LEN,
    );
    expect(typeof reviewer).toBe('function');
  });

  it('does not leak the key through the returned reviewer', () => {
    const reviewer = reviewerFromByok({ provider: 'openai', apiKey: KEY }, TEXT_LEN);
    // The reviewer is an opaque closure; its string form must not contain the key.
    expect(String(reviewer)).not.toContain(KEY);
    // And no enumerable property on the function carries it.
    expect(JSON.stringify(Object.entries(reviewer as object))).not.toContain(KEY);
  });
});

describe('verifierFromByok', () => {
  it('returns undefined on absent / unsupported / keyless descriptors', () => {
    expect(verifierFromByok(undefined)).toBeUndefined();
    expect(verifierFromByok({ apiKey: KEY })).toBeUndefined();
    expect(verifierFromByok({ provider: 'gemini', apiKey: KEY })).toBeUndefined();
    expect(verifierFromByok({ provider: 'openai' })).toBeUndefined();
    expect(verifierFromByok({ provider: 'openai', apiKey: '' })).toBeUndefined();
  });

  it('builds a named verifier for valid openai / anthropic descriptors', () => {
    const oa = verifierFromByok({ provider: 'openai', apiKey: KEY });
    expect(oa?.name).toBe('openai');
    const an = verifierFromByok({ provider: 'anthropic', apiKey: KEY });
    expect(an?.name).toBe('anthropic');
  });

  it('never throws on a malformed descriptor', () => {
    expect(() => verifierFromByok(42 as unknown as ByokRequest)).not.toThrow();
    expect(() =>
      verifierFromByok({ provider: 123 as unknown as string }),
    ).not.toThrow();
  });
});
