/**
 * Re-educator — four-stage engine orchestrator (Phase 0).
 *
 * REVIEW → VERDICT → REVISE → VERIFY, exactly as RE-EDUCATOR-SPEC.md §3. The
 * engine is identical across modes; a mode only selects a verdict profile
 * (§4b) — that is the whole "Paraphrase = config, not new code" claim.
 *
 * Phase 0 is fully deterministic:
 *   - REVIEW runs the pure guards. The semantic (LLM) reviewer is a pluggable
 *     seam (`semanticReview`) that is simply absent in Phase 0.
 *   - VERDICT uses resolvePolicy(), which freezes any issue overlapping a frozen
 *     anchor BEFORE the profile is consulted.
 *   - REVISE applies only mechanical `auto-fixable` suggestions, and only when
 *     the edit stays within the category's minimum-diff bound and touches no
 *     anchor. It produces the minimum diff (guards already carry the exact span).
 *   - VERIFY re-runs the flagging guard on the revised text; the edit is kept
 *     only if that guard no longer flags the (shifted) span AND the diff stayed
 *     in bound. Anything that fails is reverted and re-queued — never kept.
 *
 * Every applied edit is recorded in the hash-chained ledger (§5).
 */

import type { Guard, Issue, IssueCategory, Span } from './types';
import {
  type Profile,
  type Verdict,
  resolvePolicy,
} from './profiles';
import { normalizedDistance, withinBound } from './diff';
import {
  type LedgerData,
  type LedgerEntryInput,
  type LedgerMeta,
  appendEntry,
  createLedger,
} from './ledger';

/** A guard registered with the engine, keyed by the category it owns. */
export interface RegisteredGuard {
  /** Guard name, e.g. "readability" — recorded on issues + ledger verify. */
  name: string;
  category: IssueCategory;
  run: Guard<unknown>;
  /** Optional per-guard context (options / rules / voice profile). */
  ctx?: unknown;
}

/**
 * Optional semantic seam. Phase 0 leaves this undefined. When supplied it
 * returns extra issues (clarity, tone, unsupported-assertion) to merge into the
 * REVIEW output. Kept as an interface so Phase 2 BYOK is one field, no rework.
 */
export type SemanticReviewer = (text: string) => Issue[];

export interface EngineConfig {
  profile: Profile;
  guards: RegisteredGuard[];
  /** Frozen spans no edit may touch (author claims / thesis / WRITING.md goals). */
  anchors?: Span[];
  /** Optional semantic reviewer (absent in Phase 0). */
  semanticReview?: SemanticReviewer;
  /** Ledger meta for this run. */
  meta: LedgerMeta;
}

/** An issue after adjudication: original issue + its resolved verdict/bound. */
export interface AdjudicatedIssue {
  issue: Issue;
  verdict: Verdict;
  maxDiff: number;
  overlapsAnchor: boolean;
}

/** The disposition of an issue after the REVISE + VERIFY stages. */
export type Disposition =
  | 'applied' // auto-fixable edit applied and verified
  | 'proposed' // needs author OK (semantic edit) — drafted, not applied
  | 'author-required' // never edited, handed back
  | 'reverted-requeued'; // an edit was attempted but failed verification

export interface IssueOutcome {
  issue: Issue;
  verdict: Verdict;
  disposition: Disposition;
  /** The drafted or applied edit, when there is one. */
  edit?: { before: string; after: string; reason: string };
  /** Why the outcome landed where it did (esp. reverts). */
  note?: string;
}

export interface EngineResult {
  /** Final text after all applied edits. */
  text: string;
  outcomes: IssueOutcome[];
  ledger: LedgerData;
}

/** True if two spans overlap at all. */
function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

function overlapsAnyAnchor(span: Span, anchors: Span[]): boolean {
  return anchors.some((anchor) => overlaps(span, anchor));
}

/** Stage 1 — REVIEW: run every guard, then merge any semantic findings. */
export function review(config: EngineConfig, text: string): Issue[] {
  const issues: Issue[] = [];
  for (const g of config.guards) {
    for (const issue of g.run(text, g.ctx)) {
      issues.push({ ...issue, source: issue.source ?? g.name });
    }
  }
  if (config.semanticReview) issues.push(...config.semanticReview(text));
  // Stable order: by span start, then category, for deterministic processing.
  return issues.sort(
    (a, b) => a.span.start - b.span.start || a.category.localeCompare(b.category),
  );
}

/** Stage 2 — VERDICT: resolve each issue's policy (anchors freeze first). */
export function adjudicate(config: EngineConfig, issues: Issue[]): AdjudicatedIssue[] {
  const anchors = config.anchors ?? [];
  return issues.map((issue) => {
    const overlapsAnchor = overlapsAnyAnchor(issue.span, anchors);
    const policy = resolvePolicy(issue.category, config.profile, overlapsAnchor);
    return { issue, verdict: policy.verdict, maxDiff: policy.maxDiff, overlapsAnchor };
  });
}

/**
 * Find the guard that owns a category, to re-run it during VERIFY. Falls back to
 * a name match on the issue's `source` if present.
 */
function guardFor(config: EngineConfig, issue: Issue): RegisteredGuard | undefined {
  return (
    config.guards.find((g) => g.name === issue.source) ??
    config.guards.find((g) => g.category === issue.category)
  );
}

/**
 * VERIFY a single applied edit: re-run the flagging guard on the new text and
 * confirm it no longer flags a span overlapping the edited region. Also confirm
 * the diff stayed within bound. Pure — takes the already-edited text.
 */
export function verifyEdit(
  config: EngineConfig,
  issue: Issue,
  editedSpan: Span,
  editedText: string,
  before: string,
  after: string,
  maxDiff: number,
): boolean {
  if (!withinBound(before, after, maxDiff)) return false;
  const guard = guardFor(config, issue);
  if (!guard) return false;
  const reflagged = guard
    .run(editedText, guard.ctx)
    .some((i) => i.category === issue.category && overlaps(i.span, editedSpan));
  return !reflagged;
}

/**
 * Run the whole pipeline. Applies mechanical `auto-fixable` edits one at a time
 * (recomputing offsets after each accepted edit), verifying and ledgering each.
 */
export function runEngine(config: EngineConfig, inputText: string): EngineResult {
  const issues = review(config, inputText);
  const adjudicated = adjudicate(config, issues);

  // Apply edits left-to-right so earlier offsets stay valid until consumed.
  const ordered = [...adjudicated].sort((a, b) => a.issue.span.start - b.issue.span.start);

  let text = inputText;
  let offset = 0; // net length delta applied so far
  let ledger = createLedger(config.meta);
  const outcomes: IssueOutcome[] = [];

  for (const adj of ordered) {
    const { issue, verdict, maxDiff } = adj;

    if (verdict === 'author-required') {
      outcomes.push({ issue, verdict, disposition: 'author-required' });
      continue;
    }

    if (verdict === 'propose') {
      // Draft only; never applied without author OK.
      const before = issue.text;
      const after = issue.suggestion ?? issue.text;
      outcomes.push({
        issue,
        verdict,
        disposition: 'proposed',
        edit: { before, after, reason: issue.rationale },
        note: 'Semantic edit — awaiting author confirmation.',
      });
      continue;
    }

    // verdict === 'auto-fixable'
    const before = issue.text;
    const after = issue.suggestion;
    if (after === undefined || after === before) {
      // Nothing mechanical to apply (e.g. a flag with no suggestion).
      outcomes.push({
        issue,
        verdict,
        disposition: 'proposed',
        note: 'Auto-fixable but no mechanical suggestion; deferred to author.',
      });
      continue;
    }

    // Compute the live span in the current (already-edited) text.
    const liveStart = issue.span.start + offset;
    const liveEnd = issue.span.end + offset;
    const candidate = text.slice(0, liveStart) + after + text.slice(liveEnd);
    const newSpan: Span = { start: liveStart, end: liveStart + after.length };

    const ok = verifyEdit(config, issue, newSpan, candidate, before, after, maxDiff);

    if (!ok) {
      outcomes.push({
        issue,
        verdict,
        disposition: 'reverted-requeued',
        edit: { before, after, reason: issue.rationale },
        note: 'Edit failed VERIFY (out of bound or guard still flags) — reverted.',
      });
      continue;
    }

    // Accept: mutate text, shift offset, ledger it.
    text = candidate;
    offset += after.length - (liveEnd - liveStart);

    const entry: LedgerEntryInput = {
      issue_id: issue.id ?? `${issue.category}:${issue.span.start}:${issue.span.end}`,
      span: issue.span,
      category: issue.category,
      severity: issue.severity,
      verdict,
      edit: { before, after, reason: issue.rationale },
      verify: {
        guard: guardFor(config, issue)?.name ?? issue.source ?? issue.category,
        before_score: 1,
        after_score: normalizedDistance(before, after),
        result: 'pass',
      },
    };
    ledger = appendEntry(ledger, entry);

    outcomes.push({
      issue,
      verdict,
      disposition: 'applied',
      edit: { before, after, reason: issue.rationale },
    });
  }

  return { text, outcomes, ledger };
}
