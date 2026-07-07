import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import dbConnect from '@/lib/dbConnect';
import ReEducatorLedger from '@/models/ReEducatorLedger';

/**
 * GET /api/re-educator/[runId] — one owned run's full ledger.
 *
 * The `runId` is the ledger document's Mongo _id (POST returns
 * `runId: String(doc._id)`). Owner-scoped lookup (findOne by _id + userId): a
 * missing OR foreign run ⇒ 404, never leaking another user's run. Unlike the
 * list endpoint, this returns the full self-verifying `ledger` blob (the point
 * of a detail view — it's the caller's own run), mirroring the POST response.
 *
 * Returns: { run: { runId, createdAt, mode, profile, entryCount, headHash,
 *                    genesisHash, writingMdVersion, ledger } }
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ runId: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { runId } = await params;
        const userId = String(user._id || user.id);

        await dbConnect();
        const doc = await ReEducatorLedger.findOne({ _id: runId, userId });
        if (!doc) return NextResponse.json({ error: 'Run not found.' }, { status: 404 });

        return NextResponse.json({
            run: {
                runId: String(doc._id),
                createdAt: doc.createdAt,
                mode: doc.mode,
                profile: doc.profile,
                entryCount: doc.entryCount,
                headHash: doc.headHash,
                genesisHash: doc.genesisHash,
                writingMdVersion: doc.writingMdVersion,
                ledger: doc.ledger,
            },
        });
    } catch (error) {
        console.error('Error fetching Re-educator run:', error);
        return NextResponse.json({ error: 'Failed to fetch Re-educator run.' }, { status: 500 });
    }
}
