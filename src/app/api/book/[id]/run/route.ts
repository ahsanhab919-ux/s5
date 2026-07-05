import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getBook, setBookStatus, BookServiceError } from '@/lib/book/book-service';
import { runChapterLoop, BookAuthorError, type PlannedChapter } from '@/lib/book/author';
import { buildAuthorDeps, BookRunError } from '@/lib/book/provider';
import { ensureBibleBlock, BookBibleError } from '@/lib/book/bible';
import { getOrCreateWritingProfile } from '@/lib/writingProfile';
import { getWritingMd } from '@/lib/letta';
import { isByokProvider, type ByokProviderName } from '@/lib/re-educator/byok';
import { useByokKey } from '@/lib/second-me/key-custody';

/**
 * POST /api/book/[id]/run — author an owned book with the user's BYOK model.
 *
 * The thin shell that turns the pure orchestrator (author.ts) + BYOK provider
 * adapter (provider.ts) into a runnable feature. Mirrors the other book routes:
 * auth → parse → load owned book → build deps → run → status transition → JSON.
 *
 * Fail-closed (spec §5/§7): a missing/unrecoverable BYOK key is a clear 400 (no
 * fabricated model call), an over-budget or unrecoverable run marks the book
 * `failed`, and a run only reaches `complete` when EVERY planned chapter passed
 * the done-gate.
 *
 * Status guard: only a book in `draft` or `authoring` may run; a `complete` or
 * `failed` book is rejected (409-ish, surfaced as 400) — re-authoring a finished
 * book must be an explicit reset, not a side effect of hitting run again.
 *
 * BYOK: the key is recovered from the user's PERSISTED custody (second-me
 * key-custody) for the chosen provider, or supplied once via the
 * `x-second-me-key` header (the same header the keys route accepts). It is never
 * logged or echoed.
 *
 * Body: { provider: 'openai'|'anthropic', model?: string }
 * Returns: { status, accepted, failed, haltedAtIndex, chapters: [{index,status,attempts}] }
 */
const RUNNABLE_STATUSES = ['draft', 'authoring'] as const;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    let userId = '';
    let bookId = '';
    let markedAuthoring = false;
    try {
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        bookId = id;
        userId = String(user._id || user.id);

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Body must be valid JSON.' }, { status: 400 });
        }
        const b = (body ?? {}) as Record<string, unknown>;
        const provider = b.provider;
        if (!isByokProvider(provider)) {
            return NextResponse.json(
                { error: 'A valid "provider" (openai or anthropic) is required.' },
                { status: 400 }
            );
        }
        const model = typeof b.model === 'string' && b.model.length > 0 ? b.model : undefined;

        // Ownership + not-found (404) enforced by the service (scoped to userId).
        const book = await getBook(userId, bookId);

        // Status guard: only draft/authoring may run.
        if (!(RUNNABLE_STATUSES as readonly string[]).includes(book.status)) {
            return NextResponse.json(
                { error: `Book is "${book.status}" and cannot be run. Only draft/authoring books may run.` },
                { status: 400 }
            );
        }

        const plan: PlannedChapter[] = book.plan.map((c) => ({
            index: c.index,
            intent: c.intent,
            beats: c.beats,
        }));
        if (plan.length === 0) {
            return NextResponse.json(
                { error: 'Book has no chapter plan to author.' },
                { status: 400 }
            );
        }

        // Recover the BYOK key: per-request header wins (kept out of captured
        // bodies), else the user's persisted, sealed custody. Fail closed if none.
        const headerKey = request.headers.get('x-second-me-key') ?? undefined;
        const apiKey =
            headerKey || (await useByokKey(userId, provider as ByokProviderName));
        if (!apiKey) {
            return NextResponse.json(
                {
                    error: `No BYOK key available for "${provider}". Store one via /api/second-me/keys or send it in the x-second-me-key header.`,
                },
                { status: 400 }
            );
        }

        // The user's writing agent owns WRITING.md (voice) + the bible block.
        const profile = await getOrCreateWritingProfile(userId);
        const agentId = profile.lettaAgentId;
        const { content: writingMd } = await getWritingMd(agentId);

        // Ensure the coherence-spine block exists so readBible/updateBible work.
        await ensureBibleBlock(agentId, bookId);

        const deps = buildAuthorDeps({
            userId,
            bookId,
            agentId,
            provider: provider as ByokProviderName,
            apiKey,
            writingMd,
            model: model ?? profile.modelHandle,
        });

        // Mark authoring BEFORE the run so a crash leaves an honest state.
        await setBookStatus(userId, bookId, 'authoring');
        markedAuthoring = true;

        const result = await runChapterLoop(plan, deps, { failurePolicy: 'halt' });

        const accepted = result.chapters.filter((c) => c.status === 'accepted').length;
        const failed = result.chapters.filter((c) => c.status === 'failed').length;
        const complete = result.status === 'complete' && failed === 0 && accepted === plan.length;

        await setBookStatus(userId, bookId, complete ? 'complete' : 'failed');

        return NextResponse.json({
            status: complete ? 'complete' : 'failed',
            accepted,
            failed,
            haltedAtIndex: result.haltedAtIndex,
            chapters: result.chapters.map((c) => ({
                index: c.index,
                status: c.status,
                attempts: c.attempts,
            })),
        });
    } catch (error) {
        // A run that threw after we marked it authoring must not linger as
        // "authoring" — record the failure (best-effort; never mask the original).
        if (markedAuthoring && userId && bookId) {
            try {
                await setBookStatus(userId, bookId, 'failed');
            } catch {
                /* swallow: the original error below is what matters */
            }
        }
        if (error instanceof BookServiceError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.notFound ? 404 : 400 }
            );
        }
        if (
            error instanceof BookRunError ||
            error instanceof BookAuthorError ||
            error instanceof BookBibleError
        ) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('Error running book:', error);
        return NextResponse.json({ error: 'Failed to run book.' }, { status: 500 });
    }
}
