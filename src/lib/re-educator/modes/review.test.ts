import { describe, it, expect } from 'vitest';
import { review, type ReviewConfig } from './review';
import { STANDARD } from '../profiles';
import { terminology, type TerminologyRule } from '../guards/terminology';
import { pii } from '../guards/pii';
import { readability } from '../guards/readability';
import { verifyChain, type LedgerMeta } from '../ledger';
import type { RegisteredGuard } from '../engine';
import type { Span } from '../types';

const META: LedgerMeta = {
  manuscript: 'doc_review',
  writing_md_version: 'wmd_v1',
  anchors: [],
};

const APPLY_RULES: TerminologyRule[] = [{ avoid: 'utilise', prefer: 'utilize' }];

type Over = Partial<ReviewConfig> & { termRules?: TerminologyRule[] };

function config(over: Over = {}): ReviewConfig {
  const { termRules = APPLY_RULES, ...rest } = over;
  const guards: RegisteredGuard[] = [
    { name: 'terminology', category: 'terminology', run: terminology, ctx: { rules: termRules } },
    { name: 'pii', category: 'pii', run: pii },
    { name: 'readability', category: 'readability', run: readability },
  ];
  return { profile: STANDARD, guards, anchors: [], meta: META, ...rest };
}

const LONG = Array.from({ length: 35 }, (_, i) => `word${i}`).join(' ') + '.';
// A single passage hitting three buckets: applied (terminology), author-required
// (pii), proposed (readability long sentence).
const MIXED = `Please utilise the form. ${LONG} Email a@b.com.`;

describe('review — single round', () => {
  it('runs exactly one round (rounds === 1)', () => {
    expect(review(config(), MIXED).rounds).toBe(1);
  });

  it('applies in-bound mechanical fixes to the text', () => {
    const res = review(config(), MIXED);
    expect(res.text).toContain('Please utilize the form.');
  });
});

describe('review — issue panel grouping', () => {
  it('sorts outcomes into applied / proposed / author-required buckets', () => {
    const res = review(config(), MIXED);
    expect(res.panel.applied.some((o) => o.issue.category === 'terminology')).toBe(true);
    expect(res.panel.authorRequired.some((o) => o.issue.category === 'pii')).toBe(true);
    expect(res.panel.proposed.some((o) => o.issue.category === 'readability')).toBe(true);
  });

  it('summary totals match the panel bucket sizes', () => {
    const res = review(config(), MIXED);
    const { summary, panel } = res;
    expect(summary.applied).toBe(panel.applied.length);
    expect(summary.proposed).toBe(panel.proposed.length);
    expect(summary.authorRequired).toBe(panel.authorRequired.length);
    expect(summary.revertedRequeued).toBe(panel.revertedRequeued.length);
    expect(summary.total).toBe(
      panel.applied.length +
        panel.proposed.length +
        panel.authorRequired.length +
        panel.revertedRequeued.length,
    );
  });

  it('surfaces reverted edits into the reverted-requeued bucket', () => {
    // Cascading rule 'utilize'->'use' is out of the 0.15 bound -> reverted.
    const res = review(config({ termRules: [{ avoid: 'utilize', prefer: 'use' }] }), 'Please utilize it.');
    expect(res.panel.revertedRequeued.length).toBeGreaterThan(0);
    expect(res.text).toBe('Please utilize it.'); // unchanged
  });
});

describe('review — gates', () => {
  it('opens the applied-confirm gate when edits were applied', () => {
    const res = review(config(), 'Please utilise the form.');
    expect(res.gates.hasAppliedToConfirm).toBe(true);
  });

  it('opens the review-queue gate when there is anything to hand back', () => {
    const res = review(config(), 'Email a@b.com now please today.');
    expect(res.gates.hasReviewQueue).toBe(true);
  });

  it('leaves both gates closed for clean text', () => {
    const res = review(config(), 'The cat sat. The dog ran.');
    expect(res.gates.hasAppliedToConfirm).toBe(false);
    expect(res.gates.hasReviewQueue).toBe(false);
    expect(res.summary.total).toBe(0);
  });
});

describe('review — ledger + anchors', () => {
  it('produces a ledger that passes chain verification', () => {
    const res = review(config(), MIXED);
    expect(verifyChain(res.ledger).valid).toBe(true);
  });

  it('records only applied edits in the ledger', () => {
    const res = review(config(), MIXED);
    expect(res.ledger.entries.length).toBe(res.summary.applied);
  });

  it('never edits inside a frozen anchor (routes it to author-required)', () => {
    const text = 'Please utilise the form.';
    const anchors: Span[] = [{ start: 0, end: text.length }];
    const res = review(config({ anchors }), text);
    expect(res.text).toBe(text);
    expect(res.ledger.entries).toHaveLength(0);
    expect(res.panel.authorRequired.some((o) => o.issue.category === 'terminology')).toBe(true);
  });
});

describe('review — determinism', () => {
  it('is deterministic across repeated runs (text + ledger hashes)', () => {
    const a = review(config(), MIXED);
    const b = review(config(), MIXED);
    expect(a.text).toBe(b.text);
    expect(a.ledger.entries.map((e) => e.hash)).toEqual(b.ledger.entries.map((e) => e.hash));
  });
});
