import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getAuthenticatedUser: vi.fn() }));

const { mockFindOne } = vi.hoisted(() => ({ mockFindOne: vi.fn() }));

vi.mock('@/models/ReEducatorLedger', () => ({ default: { findOne: mockFindOne } }));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, options) => ({ data, options, status: options?.status || 200 })),
    },
}));

import { GET } from './route';
import { getAuthenticatedUser } from '@/lib/server-auth';

const params = Promise.resolve({ runId: 'r1' });
const authed = { _id: 'user-1' };

beforeEach(() => {
    vi.clearAllMocks();
});

describe('GET /api/re-educator/[runId] (one owned run)', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(null);
        const res: any = await GET({} as any, { params });
        expect(res.status).toBe(401);
        expect(mockFindOne).not.toHaveBeenCalled();
    });

    it('404 when the run is missing or not owned', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockFindOne.mockResolvedValue(null);
        const res: any = await GET({} as any, { params });
        expect(res.status).toBe(404);
        // Ownership is enforced in the query itself.
        expect(mockFindOne).toHaveBeenCalledWith({ _id: 'r1', userId: 'user-1' });
    });

    it('happy path: returns the owned run WITH its full ledger blob', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockFindOne.mockResolvedValue({
            _id: 'r1',
            createdAt: new Date('2024-01-02'),
            mode: 'review',
            profile: 'standard',
            entryCount: 2,
            headHash: 'h1',
            genesisHash: 'g1',
            writingMdVersion: 'v1',
            ledger: { meta: {}, entries: [{ hash: 'h1' }] },
        });
        const res: any = await GET({} as any, { params });
        expect(res.status).toBe(200);
        expect(res.data.run.runId).toBe('r1');
        // Detail intentionally includes the full self-verifying ledger.
        expect(res.data.run.ledger).toEqual({ meta: {}, entries: [{ hash: 'h1' }] });
    });
});
