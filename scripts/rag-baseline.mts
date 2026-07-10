/**
 * R0 live baseline runner (Phase R0, RAG-grounding plan).
 *
 * Wires the REAL done-gate (`buildReEducatorGate()`) to the pure eval harness over
 * the labelled fixture set and prints the drift-catch rate as markdown + raw JSON.
 *
 * Deterministic and token-free: the default gate runs `runReEducator({mode:'review'})`
 * with no semanticReview/meaningVerifier, so only the deterministic guards run — no
 * model calls. Re-run any time to regenerate `docs/rag/BASELINE.md`'s RESULTS.
 *
 *   npx tsx scripts/rag-baseline.mts
 */
import { buildReEducatorGate } from '../src/lib/book/gate';
import { runGateBaseline } from '../src/lib/book/eval/harness';
import { formatBaselineMarkdown } from '../src/lib/book/eval/report';
import { EVAL_CASES } from '../src/lib/book/eval/fixtures';

async function main() {
    // Default guards, review mode — exactly how the authoring loop uses the gate.
    const verifyChapter = buildReEducatorGate({});
    const report = await runGateBaseline(EVAL_CASES, verifyChapter);
    console.log(formatBaselineMarkdown(report));
    console.log('\n--- RAW ---');
    console.log(
        JSON.stringify(
            {
                total: report.total,
                caught: report.caught,
                catchRate: report.catchRate,
                perKind: report.perKind,
            },
            null,
            2
        )
    );
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
