import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getAuthenticatedUser: vi.fn() }));

const {
    mockGetBook,
    mockSetStatus,
    mockRunLoop,
    mockBuildDeps,
    mockEnsureBible,
    mockGetProfile,
    mockGetWritingMd,
    mockUseByokKey,
} = vi.hoisted(() => ({
    mockGetBook: vi.fn(),
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
    getBook: mockGetBook,
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

/** A book stub with a runnable status + a one-chapter plan. */
function bookStub(over: Record<string, unknown> = {}) {
    return {
        _id: 'b1',
        status: 'draft',
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
    });

    it('400 when provider is missing/invalid', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        const res: any = await POST(req({ provider: 'gemini' }), { params });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/provider/i);
    });

    it('404 when the book is not owned/found', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockGetBook.mockRejectedValue(new BookServiceError('Book not found.', true));
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(404);
    });

    it('400 when the book status is not runnable (already complete)', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockGetBook.mockResolvedValue(bookStub({ status: 'complete' }));
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/cannot be run/i);
        expect(mockSetStatus).not.toHaveBeenCalled();
    });

    it('400 when no BYOK key is available (fail-closed, no run)', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockGetBook.mockResolvedValue(bookStub());
        mockUseByokKey.mockResolvedValue(undefined);
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/no byok key/i);
        expect(mockRunLoop).not.toHaveBeenCalled();
        expect(mockSetStatus).not.toHaveBeenCalled();
    });

    it('happy path: sets authoring, runs, sets complete, returns a summary', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockGetBook.mockResolvedValue(bookStub());
        mockUseByokKey.mockResolvedValue('sk-stored');
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
        // authoring set before, complete set after.
        expect(mockSetStatus).toHaveBeenNthCalledWith(1, 'user-1', 'b1', 'authoring');
        expect(mockSetStatus).toHaveBeenNthCalledWith(2, 'user-1', 'b1', 'complete');
    });

    it('uses the x-second-me-key header when present (over stored custody)', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockGetBook.mockResolvedValue(bookStub());
        mockRunLoop.mockResolvedValue({ status: 'complete', haltedAtIndex: null, chapters: [{ index: 0, intent: 'Opening', status: 'accepted', attempts: 1, content: 'c', issues: [] }] });
        const res: any = await POST(req({ provider: 'openai' }, { 'x-second-me-key': 'sk-header' }), { params });
        expect(res.status).toBe(200);
        expect(mockUseByokKey).not.toHaveBeenCalled(); // header short-circuits custody
        expect(mockBuildDeps).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'sk-header' }));
    });

    it('marks the book failed when the run halts', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockGetBook.mockResolvedValue(bookStub());
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockRunLoop.mockResolvedValue({
            status: 'halted',
            haltedAtIndex: 0,
            chapters: [{ index: 0, intent: 'Opening', status: 'failed', attempts: 4, content: '', issues: ['x'] }],
        });
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(200);
        expect(res.data.status).toBe('failed');
        expect(mockSetStatus).toHaveBeenNthCalledWith(2, 'user-1', 'b1', 'failed');
    });

    it('maps a BookRunError (e.g. over budget) to 400 and marks the book failed', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockGetBook.mockResolvedValue(bookStub());
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockRunLoop.mockRejectedValue(new BookRunError('Run token budget exhausted.'));
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/budget/i);
        // authoring was set (before), then failed (in catch).
        expect(mockSetStatus).toHaveBeenCalledWith('user-1', 'b1', 'authoring');
        expect(mockSetStatus).toHaveBeenCalledWith('user-1', 'b1', 'failed');
    });
});
