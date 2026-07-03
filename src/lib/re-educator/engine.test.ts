import { describe, it, expect } from 'vitest';
import {
  runEngine,
  review,
  adjudicate,
  type EngineConfig,
  type RegisteredGuard,
} from './engine';
import { STANDARD, PARAPHRASE } from './profiles';
import { terminology, type TerminologyRule } from './guards/terminology';
import { pii } from './guards/pii';
import { readability } from './guards/readability';
import { verifyChain, type LedgerMeta } from './ledger';
import type { Issue, Span } from './types';

const META: LedgerMeta = {
  manuscript: 'doc_engine',
  writing_md_version: 'wmd_v1',
  anchors: [],
};

// Non-cascading rule: the fixed term is NOT itself flagged, so a valid fix
// stays fixed. diff 'utilise'->'utilize' is 0.14, within STANDARD's 0.15 bound.
const APPLY_RULES: TerminologyRule[] = [{ avoid: 'utilise', prefer: 'utilize' }];
// Out-of-bound rule: 'utilize'->'use' is diff 0.71, over the 0.15 bound.
const REVERT_RULES: TerminologyRule[] = [{ avoid: 'utilize', prefer: 'use' }];

type BaseOverrides = Partial<EngineConfig> & { termRules?: TerminologyRule[] };

function baseConfig(over: BaseOverrides = {}): EngineConfig {
  const { termRules = APPLY_RULES, ...rest } = over;
  const guards: RegisteredGuard[] = [
    { name: 'terminology', category: 'terminology', run: terminology, ctx: { rules: termRules } },
    { name: 'pii', category: 'pii', run: pii },
    { name: 'readability', category: 'readability', run: readability },
  ];
  return { profile: STANDARD, guards, anchors: [], meta: META, ...rest };
}

describe('REVIEW stage', () => {
  it('aggregates issues from every registered guard', () => {
    const text = 'Please utilise the form. Email me at a@b.com.';
    const issues = review(baseConfig(), text);
    const cats = new Set(issues.map((i) => i.category));
    expect(cats.has('terminology')).toBe(true);
    expect(cats.has('pii')).toBe(true);
  });

  it('returns issues sorted by span start', () => {
    const text = 'Please utilise the form. Email me at a@b.com.';
    const issues = review(baseConfig(), text);
    const starts = issues.map((i) => i.span.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it('merges semantic-reviewer findings when present', () => {
    const semanticReview = (_t: string): Issue[] => [
      {
        category: 'clarity',
        span: { start: 0, end: 3 },
        severity: 'minor',
        rationale: 'semantic',
        text: 'foo',
      },
    ];
    const issues = review(baseConfig({ semanticReview }), 'foo utilise bar');
    expect(issues.some((i) => i.category === 'clarity')).toBe(true);
  });
});

describe('VERDICT stage', () => {
  it('assigns profile verdicts when no anchors overlap', () => {
    const issues = review(baseConfig(), 'Please utilise this. a@b.com');
    const adj = adjudicate(baseConfig(), issues);
    const term = adj.find((a) => a.issue.category === 'terminology');
    const piiAdj = adj.find((a) => a.issue.category === 'pii');
    expect(term?.verdict).toBe('auto-fixable');
    expect(piiAdj?.verdict).toBe('author-required');
  });

  it('freezes any issue overlapping a frozen anchor', () => {
    const text = 'Please utilise the form.';
    // Anchor covers the whole sentence including "utilise".
    const anchors: Span[] = [{ start: 0, end: text.length }];
    const issues = review(baseConfig({ anchors }), text);
    const adj = adjudicate(baseConfig({ anchors }), issues);
    const term = adj.find((a) => a.issue.category === 'terminology');
    expect(term?.overlapsAnchor).toBe(true);
    expect(term?.verdict).toBe('author-required');
    expect(term?.maxDiff).toBe(0);
  });
});

describe('runEngine — full pipeline', () => {
  it('applies an in-bound mechanical fix and records it in the ledger', () => {
    const res = runEngine(baseConfig(), 'Please utilise the form.');
    expect(res.text).toBe('Please utilize the form.');
    const applied = res.outcomes.filter((o) => o.disposition === 'applied');
    expect(applied).toHaveLength(1);
    expect(applied[0].edit).toEqual({
      before: 'utilise',
      after: 'utilize',
      reason: expect.any(String),
    });
    expect(res.ledger.entries).toHaveLength(1);
  });

  it('produces a ledger that passes chain verification', () => {
    const res = runEngine(baseConfig(), 'Please utilise the form.');
    expect(verifyChain(res.ledger)).toEqual({ valid: true, brokenAt: -1 });
  });

  it('reverts and re-queues an out-of-bound mechanical edit (never applied)', () => {
    // "utilize" -> "use" is diff 0.71, over STANDARD terminology bound 0.15.
    const res = runEngine(baseConfig({ termRules: REVERT_RULES }), 'Please utilize the form.');
    expect(res.text).toBe('Please utilize the form.'); // unchanged
    const reverted = res.outcomes.find((o) => o.disposition === 'reverted-requeued');
    expect(reverted).toBeDefined();
    expect(reverted?.note).toContain('reverted');
    expect(res.ledger.entries).toHaveLength(0);
  });

  it('never edits PII — always author-required, text untouched', () => {
    const res = runEngine(baseConfig(), 'Reach me at jane@example.com please.');
    expect(res.text).toBe('Reach me at jane@example.com please.');
    const piiOut = res.outcomes.find((o) => o.issue.category === 'pii');
    expect(piiOut?.disposition).toBe('author-required');
    expect(piiOut?.edit).toBeUndefined();
  });

  it('proposes (does not apply) a readability issue under STANDARD', () => {
    const long = Array.from({ length: 35 }, (_, i) => `word${i}`).join(' ') + '.';
    const res = runEngine(baseConfig(), long);
    const read = res.outcomes.find((o) => o.issue.category === 'readability');
    expect(read?.verdict).toBe('propose');
    expect(read?.disposition).toBe('proposed');
    expect(res.text).toBe(long); // proposals are never auto-applied
  });

  it('does not apply edits inside a frozen anchor', () => {
    const text = 'Please utilise the form.';
    const anchors: Span[] = [{ start: 0, end: text.length }];
    const res = runEngine(baseConfig({ anchors }), text);
    expect(res.text).toBe(text);
    expect(res.ledger.entries).toHaveLength(0);
    const term = res.outcomes.find((o) => o.issue.category === 'terminology');
    expect(term?.disposition).toBe('author-required');
  });

  it('applies multiple edits with correct offset bookkeeping', () => {
    const res = runEngine(baseConfig(), 'utilise this and utilise that.');
    expect(res.text).toBe('utilize this and utilize that.');
    expect(res.ledger.entries).toHaveLength(2);
    expect(verifyChain(res.ledger).valid).toBe(true);
  });

  it('is deterministic: same input yields identical text and ledger hashes', () => {
    const run = () => runEngine(baseConfig(), 'Please utilise the form here.');
    const a = run();
    const b = run();
    expect(a.text).toBe(b.text);
    expect(a.ledger.entries.map((e) => e.hash)).toEqual(
      b.ledger.entries.map((e) => e.hash),
    );
  });
});

describe('Paraphrase = config, not new code', () => {
  it('same engine + PARAPHRASE profile changes disposition without code changes', () => {
    // readability is "propose" in STANDARD but "auto-fixable" in PARAPHRASE.
    // The readability guard emits no suggestion, so PARAPHRASE routes it to the
    // "auto-fixable but no mechanical suggestion -> proposed/deferred" branch
    // rather than author-required. This proves the profile alone drives behavior.
    const long = Array.from({ length: 35 }, (_, i) => `word${i}`).join(' ') + '.';

    const std = runEngine(baseConfig({ profile: STANDARD }), long);
    const para = runEngine(baseConfig({ profile: PARAPHRASE }), long);

    const stdRead = std.outcomes.find((o) => o.issue.category === 'readability');
    const paraRead = para.outcomes.find((o) => o.issue.category === 'readability');

    expect(stdRead?.verdict).toBe('propose');
    expect(paraRead?.verdict).toBe('auto-fixable');
    // Both leave text unchanged (no mechanical suggestion), but the verdict flip
    // came purely from swapping the profile object — no engine code changed.
    expect(std.text).toBe(long);
    expect(para.text).toBe(long);
  });
});
