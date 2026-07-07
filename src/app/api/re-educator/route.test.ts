import { describe, it, expect, vi, beforeEach } from 'vitest';

// Read-side (GET) coverage only — the POST run path is exercised elsewhere and is
// intentionally not touched here.

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getAuthenticatedUser: vi.fn() }));

const { mockFind, mockSort, mockLimit } = vi.hoisted(() => ({
    mockFind: vi.fn(),
    mockSort: vi.fn(),
    mockLimit: vi.fn(),
}));

vi.mock('@/models/ReEducatorLedger', () => ({ default: { find: mockFind } }));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, options) => ({ data, options, status: options?.status || 200 })),
    },
}));

import { GET } from './route';
import { getAuthenticatedUser } from '@/lib/server-auth';

const authed = { _id: 'user-1' };

/** A Request-like object carrying a URL (for ?limit= parsing). */
function req(url = 'http://localhost/api/re-educator') {
    return { url } as any;
}

beforeEach(() => {
    vi.clearAllMocks();
    // find(...).sort(...).limit(...) => resolves to the docs array.
    mockFind.mockReturnValue({ sort: mockSort });
    mockSort.mockReturnValue({ limit: mockLimit });
    mockLimit.mockResolvedValue([]);
});

describe('GET /api/re-educator (run history list)', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(null);
        const res: any = await GET(req());
        expect(res.status).toBe(401);
        expect(mockFind).not.toHaveBeenCalled();
    });

    it('returns an empty list for a user with no runs', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        const res: any = await GET(req());
        expect(res.status).toBe(200);
        expect(res.data.runs).toEqual([]);
        expect(mockFind).toHaveBeenCalledWith({ userId: 'user-1' });
    });

    it('lists runs newest-first as safe summaries (no raw ledger blob), default limit 50', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockLimit.mockResolvedValue([
            {
                _id: 'r1',
                createdAt: new Date('2024-01-02'),
                mode: 'review',
                profile: 'standard',
                entryCount: 3,
                headHash: 'h1',
                genesisHash: 'g1',
                writingMdVersion: 'v1',
                ledger: { secret: 'do-not-leak' },
            },
        ]);
        const res: any = await GET(req());
        expect(res.status).toBe(200);
        expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
        expect(mockLimit).toHaveBeenCalledWith(50);
        const run = res.data.runs[0];
        expect(run).toEqual({
            runId: 'r1',
            createdAt: new Date('2024-01-02'),
            mode: 'review',
            profile: 'standard',
            entryCount: 3,
            headHash: 'h1',
            genesisHash: 'g1',
            writingMdVersion: 'v1',
        });
        // The content-bearing ledger blob is never in the list projection.
        expect('ledger' in run).toBe(false);
    });

    it('bounds ?limit to <= 100 and floors non-positive/invalid to the default', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);

        await GET(req('http://localhost/api/re-educator?limit=500'));
        expect(mockLimit).toHaveBeenLastCalledWith(100);

        await GET(req('http://localhost/api/re-educator?limit=5'));
        expect(mockLimit).toHaveBeenLastCalledWith(5);

        await GET(req('http://localhost/api/re-educator?limit=0'));
        expect(mockLimit).toHaveBeenLastCalledWith(50);

        await GET(req('http://localhost/api/re-educator?limit=abc'));
        expect(mockLimit).toHaveBeenLastCalledWith(50);
    });
});
