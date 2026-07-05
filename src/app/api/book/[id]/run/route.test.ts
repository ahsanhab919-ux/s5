import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getAuthenticatedUser: vi.fn() }));

const {
    mockClaim,
    mockSetStatus,
    mockRunLoop,
    mockBuildDeps,
    mockEnsureBible,
    mockGetProfile,
    mockGetWritingMd,
    mockUseByokKey,
} = vi.hoisted(() => ({
    mockClaim: vi.fn(),
    mockSetStatus: vi.fn(),
    mockRunLoop: vi.fn(),
    mockBuildDeps: vi.fn(),
    mockEnsureBible: vi.fn(),
    mockGetProfile: vi.fn(),
    mockGetWritingMd: vi.fn(),
    mockUseByokKey: vi.fn(),
}));

// Keep the real BookServiceError; mock only the DB-touching fns.
vi.mock('@/lib/book/book-service', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/book-service')>()),
    claimBookForRun: mockClaim,
    setBookStatus: mockSetStatus,
}));
// Keep the real runChapterLoop errors/types; mock the loop itself.
vi.mock('@/lib/book/author', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/author')>()),
    runChapterLoop: mockRunLoop,
}));
// Keep the real BookRunError; mock the factory (no network in tests).
vi.mock('@/lib/book/provider', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/provider')>()),
    buildAuthorDeps: mockBuildDeps,
}));
vi.mock('@/lib/book/bible', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/bible')>()),
    ensureBibleBlock: mockEnsureBible,
}));
vi.mock('@/lib/writingProfile', () => ({ getOrCreateWritingProfile: mockGetProfile }));
vi.mock('@/lib/letta', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/letta')>()),
    getWritingMd: mockGetWritingMd,
}));
vi.mock('@/lib/second-me/key-custody', () => ({ useByokKey: mockUseByokKey }));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, options) => ({ data, options, status: options?.status || 200 })),
    },
}));

import { POST } from './route';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { BookServiceError } from '@/lib/book/book-service';
import { BookRunError } from '@/lib/book/provider';

const params = Promise.resolve({ id: 'b1' });
const authed = { _id: 'user-1' };

/** A Request-like object with a JSON body + header lookup. */
function req(body: unknown, headers: Record<string, string> = {}) {
    return {
        json: async () => body,
        headers: { get: (h: string) => headers[h.toLowerCase()] ?? null },
    } as any;
}

/** The book the atomic claim returns once it has transitioned draft → authoring. */
function claimedBook(over: Record<string, unknown> = {}) {
    return {
        _id: 'b1',
        status: 'authoring',
        plan: [{ index: 0, intent: 'Opening', beats: [] }],
        ...over,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue({ lettaAgentId: 'agent-1', modelHandle: undefined });
    mockGetWritingMd.mockResolvedValue({ content: '# voice' });
    mockEnsureBible.mockResolvedValue({});
    mockBuildDeps.mockReturnValue({ writingMd: 'x' });
    mockSetStatus.mockResolvedValue({});
});

describe('POST /api/book/[id]/run', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(null);
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(401);
        expect(mockClaim).not.toHaveBeenCalled();
    });

    it('400 when provider is missing/invalid', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        const res: any = await POST(req({ provider: 'gemini' }), { params });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/provider/i);
        expect(mockClaim).not.toHaveBeenCalled();
    });

    it('404 when the book is not owned/found (claim rejects notFound)', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockClaim.mockRejectedValue(new BookServiceError('Book not found.', true));
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(404);
    });

    // The atomic claim is the SINGLE status gate: a non-draft book is rejected by
    // the claim itself (draft-only precondition), before any generate. No prior
    // read-guard, so this also documents the closed double-run race.
    it.each(['authoring', 'complete', 'failed'])(
        '400 with ZERO provider work when the book is not draft (status: %s)',
        async (status) => {
            (getAuthenticatedUser as any).mockResolvedValue(authed);
            mockUseByokKey.mockResolvedValue('sk-stored');
            mockClaim.mockRejectedValue(
                new BookServiceError(
                    `Book is "${status}" and cannot be started; reset it to draft to run again.`
                )
            );
            const res: any = await POST(req({ provider: 'openai' }), { params });
            expect(res.status).toBe(400);
            expect(res.data.error).toMatch(/cannot be started|reset it to draft/i);
            // The claim rejected → no run, no deps, no terminal status write.
            expect(mockBuildDeps).not.toHaveBeenCalled();
            expect(mockRunLoop).not.toHaveBeenCalled();
            expect(mockSetStatus).not.toHaveBeenCalled();
        }
    );

    it('400 when no BYOK key is available (fail-closed): no claim, no run', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue(undefined);
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/no byok key/i);
        // A missing key must consume NO claim and make no provider call.
        expect(mockClaim).not.toHaveBeenCalled();
        expect(mockRunLoop).not.toHaveBeenCalled();
        expect(mockSetStatus).not.toHaveBeenCalled();
    });

    it('happy path: atomically claims (draft→authoring), runs, sets complete', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockClaim.mockResolvedValue(claimedBook());
        mockRunLoop.mockResolvedValue({
            status: 'complete',
            haltedAtIndex: null,
            chapters: [{ index: 0, intent: 'Opening', status: 'accepted', attempts: 1, content: 'c', issues: [] }],
        });
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(200);
        expect(res.data.status).toBe('complete');
        expect(res.data.accepted).toBe(1);
        expect(res.data.failed).toBe(0);
        // The claim performs the authoring transition; setBookStatus is used ONLY
        // for the terminal transition now (no separate 'authoring' write).
        expect(mockClaim).toHaveBeenCalledWith('user-1', 'b1');
        expect(mockSetStatus).toHaveBeenCalledTimes(1);
        expect(mockSetStatus).toHaveBeenCalledWith('user-1', 'b1', 'complete');
    });

    it('uses the x-second-me-key header when present (over stored custody)', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockClaim.mockResolvedValue(claimedBook());
        mockRunLoop.mockResolvedValue({ status: 'complete', haltedAtIndex: null, chapters: [{ index: 0, intent: 'Opening', status: 'accepted', attempts: 1, content: 'c', issues: [] }] });
        const res: any = await POST(req({ provider: 'openai' }, { 'x-second-me-key': 'sk-header' }), { params });
        expect(res.status).toBe(200);
        expect(mockUseByokKey).not.toHaveBeenCalled(); // header short-circuits custody
        expect(mockBuildDeps).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'sk-header' }));
    });

    it('marks the book failed when the run halts', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockClaim.mockResolvedValue(claimedBook());
        mockRunLoop.mockResolvedValue({
            status: 'halted',
            haltedAtIndex: 0,
            chapters: [{ index: 0, intent: 'Opening', status: 'failed', attempts: 4, content: '', issues: ['x'] }],
        });
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(200);
        expect(res.data.status).toBe('failed');
        expect(mockSetStatus).toHaveBeenCalledTimes(1);
        expect(mockSetStatus).toHaveBeenCalledWith('user-1', 'b1', 'failed');
    });

    it('maps a BookRunError (e.g. over budget) to 400 and resets the book to failed', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockClaim.mockResolvedValue(claimedBook());
        mockRunLoop.mockRejectedValue(new BookRunError('Run token budget exhausted.'));
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/budget/i);
        // The claim set authoring; the catch best-effort resets to failed.
        expect(mockClaim).toHaveBeenCalledWith('user-1', 'b1');
        expect(mockSetStatus).toHaveBeenCalledWith('user-1', 'b1', 'failed');
    });
});
