import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import dbConnect from '@/lib/dbConnect';
import ReEducatorLedger from '@/models/ReEducatorLedger';
import {
    parseRequest,
    runReEducator,
    ReEducatorRequestError,
    type ReEducatorResult,
    type GuardOptions,
} from '@/lib/re-educator/service';
import { verifyChain, genesisHash } from '@/lib/re-educator/ledger';
import { reviewerFromByok, verifierFromByok, type ByokRequest } from '@/lib/re-educator/byok';
import type { SemanticUsage } from '@/lib/re-educator/provider';
import type { LedgerUsage } from '@/lib/re-educator/ledger';
import { readWritingContext } from '@/lib/re-educator/writing-context';
import { getOrCreateWritingProfile } from '@/lib/writingProfile';
import { getWritingMd } from '@/lib/letta';

/**
 * Fetch a user's WRITING.md content, or null if unavailable. Resolves the
 * user's Letta agent (creating a profile if needed) then reads the block.
 * Thrown errors are caught upstream by readWritingContext (best-effort).
 */
async function fetchWritingMd(userId: string): Promise<string | null> {
    await dbConnect();
    const profile = await getOrCreateWritingProfile(userId);
    if (!profile?.lettaAgentId) return null;
    const { content } = await getWritingMd(profile.lettaAgentId);
    return content || null;
}

/**
 * Read the per-request BYOK descriptor from the request (Phase 2 #4). The
 * provider name + optional model come from the JSON body's `byok` object; the
 * API key is preferred from the `x-reeducator-key` header (so it stays out of
 * any body that a proxy or log might capture) but a body key is accepted as a
 * fallback. The key is used only to build the reviewer for this one run — it is
 * NEVER persisted and NEVER logged (spec §7b#4, §8).
 */
function readByok(body: unknown, request: Request): ByokRequest | undefined {
    const raw = (body as { byok?: unknown })?.byok;
    const fromBody = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : undefined;
    const headerKey = request.headers.get('x-reeducator-key') ?? undefined;
    const provider = typeof fromBody?.provider === 'string' ? fromBody.provider : undefined;
    if (!provider) return undefined;
    const bodyKey = typeof fromBody?.apiKey === 'string' ? fromBody.apiKey : undefined;
    const model = typeof fromBody?.model === 'string' ? fromBody.model : undefined;
    // Header key wins; body key is the fallback for clients that cannot set headers.
    return { provider, apiKey: headerKey || bodyKey, model };
}

/**
 * Merge WRITING.md-derived guard options with caller-supplied ones. The caller
 * wins on every field (explicit request beats stored context); WRITING.md only
 * fills gaps the caller left empty.
 */
function mergeGuardOptions(
    fromContext: GuardOptions,
    fromCaller: GuardOptions | undefined,
): GuardOptions {
    if (!fromCaller) return fromContext;
    return {
        terminologyRules: fromCaller.terminologyRules ?? fromContext.terminologyRules,
        voiceProfile: fromCaller.voiceProfile ?? fromContext.voiceProfile,
    };
}

/**
 * POST /api/re-educator
 *
 * Run the Re-educator over a piece of text and persist the resulting ledger.
 * This is the thin HTTP shell over the pure service layer — auth, parse, run,
 * persist, respond. All decision logic lives in src/lib/re-educator/service.ts
 * so it stays unit-testable without HTTP.
 *
 * Body: {
 *   text: string,                       // required — the manuscript
 *   mode: 'nudge'|'review'|'auto'|'paraphrase',
 *   anchors?: {start,end}[],            // frozen spans no edit may touch
 *   guardOptions?: { terminologyRules?, voiceProfile? },
 *   writingMdVersion?: string,          // ledger tag (Phase 1 #3 fills from Letta)
 *   nudge?: { span, replacement, category },   // nudge mode only
 *   auto?:  { optIn, authorization, ... },     // auto mode only
 * }
 *
 * Returns: { mode, ledger, result, runId, chain: { valid, entryCount, headHash } }
 *
 * Phase 0/1 runs deterministically: no LLM is invoked (the semantic reviewer is
 * left undefined — the pass-through reviewer). Phase 2 BYOK supplies a real
 * reviewer with no change to this route.
 *
 * Spec: RE-EDUCATOR-SPEC.md §6 (s5 integration).
 */
export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Body must be valid JSON.' }, { status: 400 });
        }

        // Parse + validate (throws ReEducatorRequestError => 400).
        const req = parseRequest(body);
        const userId = String(user._id || user.id);

        // Enrich with the user's WRITING.md context (Phase 1 #3). Best-effort:
        // readWritingContext never throws — if Letta is unreachable or the block
        // is absent, we get EMPTY_WRITING_CONTEXT and the run proceeds
        // deterministically. Caller-supplied guardOptions win over WRITING.md;
        // the caller-supplied writingMdVersion (if any) is respected too.
        const ctx = await readWritingContext(userId, fetchWritingMd);
        req.guardOptions = mergeGuardOptions(ctx.guardOptions, req.guardOptions);
        if (!req.writingMdVersion) req.writingMdVersion = ctx.writingMdVersion;

        // Phase 2 #4/#5 — BYOK: if the caller supplied a provider + key, construct a
        // real semantic reviewer AND a meaning-preservation verifier for THIS run
        // only, both from the same descriptor. The key never touches the parsed
        // request object, the ledger, or any log line; it flows into the provider
        // and is discarded when the handler returns. No descriptor (or a bad one)
        // ⇒ undefined ⇒ the run stays deterministic-only. Both are functions, so
        // persisting `req`/`ledger` later cannot leak the key.
        const byok = readByok(body, request);
        // Capture the (post-cap) semantic usage for the ledger. The sink fires
        // inside the reviewer during the run; we attach the record to the ledger
        // AFTER the run (usage lives outside the hash chain, so this cannot break
        // verification). Never receives the key or manuscript text.
        let capturedUsage: SemanticUsage | undefined;
        req.semanticReview = reviewerFromByok(byok, req.text.length, {
            writingMd: ctx.writingMd,
            // Caller-supplied regions of interest scope what reaches the model
            // (spec §4a). Absent ⇒ whole document, still hard-capped by the adapter.
            candidateSpans: req.candidateSpans,
            onUsage: (u) => {
                capturedUsage = u;
            },
        });
        req.meaningVerifier = verifierFromByok(byok);

        // Run the engine/modes. Deterministic unless a BYOK reviewer was built.
        const outcome: ReEducatorResult = await runReEducator(req);
        const { mode, ledger, result } = outcome;

        // Attach the semantic usage (if a provider ran) to the ledger. This is a
        // sibling of the hash chain — recorded AFTER the run and outside `meta` —
        // so it never affects genesis/verification. Carries the model handle the
        // caller chose (never the key).
        if (capturedUsage) {
            const usage: LedgerUsage = {
                provider: capturedUsage.provider,
                spans_reviewed: capturedUsage.spansReviewed,
                chars_sent: capturedUsage.charsSent,
                capped: capturedUsage.capped,
            };
            if (byok?.model) usage.model = byok.model;
            ledger.usage = usage;
        }

        // Verify the chain we're about to persist. A run whose own ledger does
        // not verify is a bug, not a client error — surface it as a 500 rather
        // than silently storing a broken chain. Usage sits outside the chain, so
        // attaching it above does not affect this result.
        const chain = verifyChain(ledger);
        if (!chain.valid) {
            console.error('Re-educator produced an invalid ledger chain:', chain);
            return NextResponse.json(
                { error: 'Internal error: produced ledger failed verification.' },
                { status: 500 }
            );
        }

        // Persist the ledger blob. A run isn't real until it's stored.
        const entryCount = ledger.entries.length;
        const headHash =
            entryCount > 0 ? ledger.entries[entryCount - 1].hash : genesisHash(ledger.meta);
        const profile = mode === 'paraphrase' ? 'paraphrase' : 'standard';

        await dbConnect();
        const doc = await ReEducatorLedger.create({
            userId,
            mode,
            profile,
            ledger,
            genesisHash: genesisHash(ledger.meta),
            headHash,
            entryCount,
            writingMdVersion: ledger.meta.writing_md_version,
        });

        return NextResponse.json({
            mode,
            runId: String(doc._id),
            ledger,
            result,
            chain: { valid: chain.valid, entryCount, headHash },
        });
    } catch (error) {
        if (error instanceof ReEducatorRequestError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('Error running Re-educator:', error);
        return NextResponse.json({ error: 'Failed to run Re-educator.' }, { status: 500 });
    }
}

/** Default/most a single list page returns (bounds an unpaged scan). */
const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;

/**
 * GET /api/re-educator — list the authenticated user's runs, newest first.
 *
 * Read side of the ledger: every POST persists a run, and this surfaces the
 * user's own history. Owner-scoped (find by userId) — the same IDOR discipline
 * as the write path. Backed by the model's { userId, createdAt: -1 } index.
 *
 * Returns a SUMMARY per run (runId, createdAt, mode, profile, entryCount,
 * head/genesis hashes, writingMdVersion) — deliberately NOT the full `ledger`
 * blob, which carries the manuscript edit chain (large + content-bearing). Fetch
 * a single run's full ledger via GET /api/re-educator/[runId].
 *
 * Query: ?limit=<1..100> (default 50).
 * Returns: { runs: [...] }
 */
export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = String(user._id || user.id);

        const raw = Number(new URL(request.url).searchParams.get('limit'));
        const limit =
            Number.isFinite(raw) && raw > 0
                ? Math.min(Math.floor(raw), MAX_LIST_LIMIT)
                : DEFAULT_LIST_LIMIT;

        await dbConnect();
        const docs = await ReEducatorLedger.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit);

        const runs = docs.map((d) => ({
            runId: String(d._id),
            createdAt: d.createdAt,
            mode: d.mode,
            profile: d.profile,
            entryCount: d.entryCount,
            headHash: d.headHash,
            genesisHash: d.genesisHash,
            writingMdVersion: d.writingMdVersion,
        }));

        return NextResponse.json({ runs });
    } catch (error) {
        console.error('Error listing Re-educator runs:', error);
        return NextResponse.json({ error: 'Failed to list Re-educator runs.' }, { status: 500 });
    }
}
