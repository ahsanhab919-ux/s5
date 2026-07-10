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
 *   # OmniRoute — local, self-hosted OpenAI-compatible gateway. Start it FIRST:
 *   #   npm i -g omniroute && omniroute   (gateway at http://localhost:20128)
 *   OMNIROUTE_API_KEY=... npx tsx scripts/rag-r1a-eval.mts
 *   # OmniRoute can also run keyless (REQUIRE_API_KEY=false); then just set:
 *   USE_OMNIROUTE=1 npx tsx scripts/rag-r1a-eval.mts
 *   # or, for Gemini:
 *   GEMINI_API_KEY=... npx tsx scripts/rag-r1a-eval.mts
 *   # or, for Anthropic:
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
    | { provider: 'anthropic' | 'openai' | 'gemini' | 'omniroute'; apiKey: string; model: string }
    | undefined {
    // OmniRoute first — the local/free gateway the user is standing up. It can run
    // with auth disabled (REQUIRE_API_KEY=false); the adapter only checks the key
    // is truthy, so a keyless local run gets a non-empty placeholder.
    const omniKey = process.env.OMNIROUTE_API_KEY ?? process.env.OMNIROUTE_KEY;
    const omniKeyless = process.env.OMNIROUTE_URL || process.env.USE_OMNIROUTE;
    if ((omniKey && omniKey.length > 0) || omniKeyless) {
        return {
            provider: 'omniroute',
            apiKey: omniKey && omniKey.length > 0 ? omniKey : 'sk-omniroute-local',
            model: process.env.OMNIROUTE_MODEL ?? 'auto',
        };
    }
    const geminiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (geminiKey && geminiKey.length > 0) {
        return { provider: 'gemini', apiKey: geminiKey, model: 'gemini-1.5-flash' };
    }
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
    provider: 'anthropic' | 'openai' | 'gemini' | 'omniroute';
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
            'No provider selected. Set one of OMNIROUTE_API_KEY (or USE_OMNIROUTE for a ' +
                'keyless local gateway), GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY ' +
                'and re-run:\n' +
                '  # OmniRoute must be running locally first: npm i -g omniroute && omniroute\n' +
                '  #   (gateway at http://localhost:20128)\n' +
                '  OMNIROUTE_API_KEY=... npx tsx scripts/rag-r1a-eval.mts\n' +
                '  USE_OMNIROUTE=1 npx tsx scripts/rag-r1a-eval.mts\n' +
                '  GEMINI_API_KEY=... npx tsx scripts/rag-r1a-eval.mts\n' +
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
