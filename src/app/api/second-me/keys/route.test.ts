import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getAuthenticatedUser: vi.fn() }));

const { mockStore, mockDelete } = vi.hoisted(() => ({
    mockStore: vi.fn(),
    mockDelete: vi.fn(),
}));
// Keep the real KeyCustodyError + isByokProvider; mock only the DB-touching fns.
vi.mock('@/lib/second-me/key-custody', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/second-me/key-custody')>()),
    storeByokKey: mockStore,
    deleteByokKey: mockDelete,
}));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, options) => ({ data, options, status: options?.status || 200 })),
    },
}));

import { POST, DELETE } from './route';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { KeyCustodyError } from '@/lib/second-me/key-custody';

/** Build a Request-like object with a JSON body and optional headers. */
function req(body: unknown, headers: Record<string, string> = {}) {
    return {
        json: async () => body,
        headers: { get: (h: string) => headers[h.toLowerCase()] ?? null },
    } as any;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('POST /api/second-me/keys', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(null);
        const res: any = await POST(req({ provider: 'openai' }, { 'x-second-me-key': 'k' }));
        expect(res.status).toBe(401);
    });

    it('400 when provider missing', async () => {
        (getAuthenticatedUser as any).mockResolvedValue({ _id: 'u1' });
        const res: any = await POST(req({}, { 'x-second-me-key': 'k' }));
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/provider/i);
    });

    it('400 when key missing', async () => {
        (getAuthenticatedUser as any).mockResolvedValue({ _id: 'u1' });
        const res: any = await POST(req({ provider: 'openai' }));
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/api key/i);
    });

    it('stores using the header key and returns a non-secret view', async () => {
        (getAuthenticatedUser as any).mockResolvedValue({ _id: 'u1' });
        mockStore.mockResolvedValue({ provider: 'openai', present: true });
        const res: any = await POST(req({ provider: 'openai' }, { 'x-second-me-key': 'sk-secret' }));
        expect(res.status).toBe(200);
        expect(res.data.key).toEqual({ provider: 'openai', present: true });
        expect(mockStore).toHaveBeenCalledWith('u1', 'openai', 'sk-secret');
        // response never carries the plaintext
        expect(JSON.stringify(res.data)).not.toContain('sk-secret');
    });

    it('prefers the header key over a body key', async () => {
        (getAuthenticatedUser as any).mockResolvedValue({ _id: 'u1' });
        mockStore.mockResolvedValue({ provider: 'openai', present: true });
        await POST(req({ provider: 'openai', apiKey: 'body-key' }, { 'x-second-me-key': 'header-key' }));
        expect(mockStore).toHaveBeenCalledWith('u1', 'openai', 'header-key');
    });

    it('maps a KeyCustodyError to 400', async () => {
        (getAuthenticatedUser as any).mockResolvedValue({ _id: 'u1' });
        mockStore.mockRejectedValue(new KeyCustodyError('key custody is unavailable'));
        const res: any = await POST(req({ provider: 'openai' }, { 'x-second-me-key': 'k' }));
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/unavailable/i);
    });
});

describe('DELETE /api/second-me/keys', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(null);
        const res: any = await DELETE(req({ provider: 'openai' }));
        expect(res.status).toBe(401);
    });

    it('400 on an invalid provider', async () => {
        (getAuthenticatedUser as any).mockResolvedValue({ _id: 'u1' });
        const res: any = await DELETE(req({ provider: 'cohere' }));
        expect(res.status).toBe(400);
    });

    it('deletes and reports removed', async () => {
        (getAuthenticatedUser as any).mockResolvedValue({ _id: 'u1' });
        mockDelete.mockResolvedValue(true);
        const res: any = await DELETE(req({ provider: 'openai' }));
        expect(res.status).toBe(200);
        expect(res.data.removed).toBe(true);
        expect(mockDelete).toHaveBeenCalledWith('u1', 'openai');
    });
});
