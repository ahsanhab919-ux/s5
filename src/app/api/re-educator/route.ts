import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import dbConnect from '@/lib/dbConnect';
import ReEducatorLedger from '@/models/ReEducatorLedger';
import {
    parseRequest,
    runReEducator,
    ReEducatorRequestError,
    type ReEducatorResult,
} from '@/lib/re-educator/service';
import { verifyChain, genesisHash } from '@/lib/re-educator/ledger';

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

        // Run the engine/modes. Pure, deterministic (no semantic reviewer here).
        const outcome: ReEducatorResult = runReEducator(req);
        const { mode, ledger, result } = outcome;

        // Verify the chain we're about to persist. A run whose own ledger does
        // not verify is a bug, not a client error — surface it as a 500 rather
        // than silently storing a broken chain.
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
        const userId = String(user._id || user.id);
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
