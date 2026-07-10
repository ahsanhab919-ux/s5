/**
 * R1a live TWO-SIDED drift-catch runner (Phase R1a, RAG-grounding plan).
 *
 * The first REAL two-sided measurement of the done-gate: it builds the gate WITH a
 * semantic reviewer (via the existing BYOK path) and scores it over both the 16
 * labelled error fixtures (recall) and the 6 clean fixtures (false-positive rate),
 * then reports recall / false-positive rate / precision.
 *
 * ⚠️ THIS SPENDS TOKENS. It makes one model call per fixture (≈ 22 calls) on a
 * small/cheap model. The API key is read from the environment and is never printed.
 * It is intended to be run by the user on their own machine with their own key — the
 * assistant does NOT run it.
 *
 * Run:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/rag-r1a-eval.mts
 *   # or, for OpenAI:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/rag-r1a-eval.mts
 */
import { buildReEducatorGate } from '../src/lib/book/gate';
import { reviewerFromByok } from '../src/lib/re-educator/byok';
import type { SemanticReviewer } from '../src/lib/re-educator/engine';
import type { Issue } from '../src/lib/re-educator/types';
import { runTwoSidedEval } from '../src/lib/book/eval/harness';
import { formatTwoSidedMarkdown } from '../src/lib/book/eval/report';
import { EVAL_CASES, CLEAN_CASES } from '../src/lib/book/eval/fixtures';

/** Pick a provider + cheap default model from whichever key is present in env. */
function resolveByok():
    | { provider: 'anthropic' | 'openai'; apiKey: string; model: string }
    | undefined {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey && anthropicKey.length > 0) {
        return { provider: 'anthropic', apiKey: anthropicKey, model: 'claude-3-5-haiku-latest' };
    }
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && openaiKey.length > 0) {
        return { provider: 'openai', apiKey: openaiKey, model: 'gpt-4o-mini' };
    }
    return undefined;
}

/**
 * Wrap the per-request BYOK reviewer as a plain `SemanticReviewer`. `reviewerFromByok`
 * is bound to a text length + candidate spans, so we rebuild it per draft (each
 * fixture differs in length) and default the candidate span to the whole draft.
 * Empty text (or an unusable descriptor) yields no issues rather than throwing.
 */
function byokReviewer(byok: {
    provider: 'anthropic' | 'openai';
    apiKey: string;
    model: string;
}): SemanticReviewer {
    return async (text: string): Promise<Issue[]> => {
        if (text.length === 0) return [];
        const reviewer = reviewerFromByok(byok, text.length, {
            candidateSpans: [{ start: 0, end: text.length }],
        });
        if (!reviewer) return [];
        return reviewer(text);
    };
}

async function main() {
    const byok = resolveByok();
    if (!byok) {
        console.error(
            'No API key found. Set one of ANTHROPIC_API_KEY or OPENAI_API_KEY and re-run:\n' +
                '  ANTHROPIC_API_KEY=sk-... npx tsx scripts/rag-r1a-eval.mts\n' +
                '  OPENAI_API_KEY=sk-... npx tsx scripts/rag-r1a-eval.mts'
        );
        process.exit(1);
        return;
    }

    const gate = buildReEducatorGate({ semanticReview: byokReviewer(byok) });
    const report = await runTwoSidedEval(EVAL_CASES, CLEAN_CASES, gate);

    console.log(formatTwoSidedMarkdown(report));
    console.log('\n--- SUMMARY ---');
    console.log(
        `recall=${report.recall.toFixed(3)} ` +
            `falsePositiveRate=${report.falsePositiveRate.toFixed(3)} ` +
            `precision=${report.precision.toFixed(3)}`
    );
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
