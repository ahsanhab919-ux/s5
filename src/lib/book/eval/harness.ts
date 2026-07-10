/**
 * Gate-baseline eval — pure harness (Phase R0).
 *
 * Orchestrates an INJECTED `verifyChapter` over a labelled fixture set and scores
 * the gate's drift-catch rate. Pure: no I/O, no gate construction, no model calls.
 * Tests inject a deterministic fake; a real baseline run injects the output of
 * `buildReEducatorGate(...)` (which does make model calls — done by the caller, not
 * here). This keeps the scoring logic unit-testable in isolation.
 *
 * "Caught" = the gate REJECTED the draft (`!result.passed`). Since every fixture
 * draft contains a known error, a higher catch rate is better. The isolated gate
 * never sees each case's `priorContext`, so a low baseline is the expected, and
 * measurable, motivation for retrieval grounding.
 */
import type { GateResult, PlannedChapter } from '../author';
import type { BaselineReport, CatchStat, EvalCase, PerCaseResult } from './types';

/** The injected gate under test. Matches AuthorDeps.verifyChapter. */
export type VerifyChapter = (draft: string, chapter: PlannedChapter) => Promise<GateResult>;

function rate(caught: number, total: number): number {
    return total === 0 ? 0 : caught / total;
}

function statFor(results: PerCaseResult[]): CatchStat {
    const total = results.length;
    const caught = results.filter((r) => r.caught).length;
    return { total, caught, catchRate: rate(caught, total) };
}

/**
 * Run the injected gate over every case and compute per-kind + overall catch rates.
 * Cases are evaluated sequentially so an injected real gate does not fan out
 * unbounded concurrent model calls.
 */
export async function runGateBaseline(
    cases: EvalCase[],
    verifyChapter: VerifyChapter
): Promise<BaselineReport> {
    const perCase: PerCaseResult[] = [];
    for (const c of cases) {
        const result = await verifyChapter(c.draft, c.chapter);
        perCase.push({
            id: c.id,
            kind: c.kind,
            expectedErrorType: c.expectedError.type,
            caught: !result.passed,
            issues: result.issues,
        });
    }

    const fiction = perCase.filter((r) => r.kind === 'fiction');
    const nonfiction = perCase.filter((r) => r.kind === 'nonfiction');
    const total = perCase.length;
    const caught = perCase.filter((r) => r.caught).length;

    return {
        total,
        caught,
        catchRate: rate(caught, total),
        perKind: {
            fiction: statFor(fiction),
            nonfiction: statFor(nonfiction),
        },
        perCase,
    };
}

export default { runGateBaseline };
