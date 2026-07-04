import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getAuthenticatedUser: vi.fn() }));

const { mockFindOne } = vi.hoisted(() => ({ mockFindOne: vi.fn() }));
vi.mock('@/models/SecondMeIdentity', () => ({ default: { findOne: mockFindOne } }));

const { mockGetSkill, mockPutSkill } = vi.hoisted(() => ({
    mockGetSkill: vi.fn(),
    mockPutSkill: vi.fn(),
}));
vi.mock('@/lib/second-me/skill-profile', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/second-me/skill-profile')>()),
    getSkillProfile: mockGetSkill,
    putSkillProfile: mockPutSkill,
}));

const { mockGetRep } = vi.hoisted(() => ({ mockGetRep: vi.fn() }));
vi.mock('@/lib/second-me/reputation', () => ({ getReputation: mockGetRep }));

const { mockListCustody } = vi.hoisted(() => ({ mockListCustody: vi.fn() }));
vi.mock('@/lib/second-me/key-custody', () => ({ listCustody: mockListCustody }));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, options) => ({ data, options, status: options?.status || 200 })),
    },
}));

import { GET, PUT } from './route';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { SkillProfileError } from '@/lib/second-me/skill-profile';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('GET /api/second-me/profile', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(null);
        const res: any = await GET();
        expect(res.status).toBe(401);
    });

    it('composes a snapshot with public-only identity and presence-only keys', async () => {
        (getAuthenticatedUser as any).mockResolvedValue({ _id: 'u1' });
        mockFindOne.mockResolvedValue({
            keyId: 'kid',
            publicKey: 'PUB',
            revoked: false,
            lettaAgentId: 'a1',
        });
        mockGetSkill.mockResolvedValue({
            personas: ['writer'],
            defaultPersona: 'writer',
            focusAreas: ['x'],
        });
        mockGetRep.mockResolvedValue({ karma: 10, level: 0 });
        mockListCustody.mockResolvedValue([{ provider: 'openai', present: true }]);

        const res: any = await GET();
        expect(res.status).toBe(200);
        expect(res.data.identity).toEqual({
            keyId: 'kid',
            publicKey: 'PUB',
            revoked: false,
            lettaAgentId: 'a1',
        });
        expect(res.data.skillProfile.personas).toEqual(['writer']);
        expect(res.data.keys).toEqual([{ provider: 'openai', present: true }]);
        expect(res.data.personas).toEqual(['student', 'writer', 'executive']);
        // never provisions an identity on a GET
        expect(mockFindOne).toHaveBeenCalledWith({ userId: 'u1' });
    });

    it('returns null identity/skillProfile when the user has none', async () => {
        (getAuthenticatedUser as any).mockResolvedValue({ _id: 'u1' });
        mockFindOne.mockResolvedValue(null);
        mockGetSkill.mockResolvedValue(null);
        mockGetRep.mockResolvedValue({ karma: 0, level: 0 });
        mockListCustody.mockResolvedValue([]);

        const res: any = await GET();
        expect(res.data.identity).toBeNull();
        expect(res.data.skillProfile).toBeNull();
        expect(res.data.keys).toEqual([]);
    });
});

describe('PUT /api/second-me/profile', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(null);
        const req = { json: async () => ({}) } as any;
        const res: any = await PUT(req);
        expect(res.status).toBe(401);
    });

    it('saves and returns the skill profile', async () => {
        (getAuthenticatedUser as any).mockResolvedValue({ _id: 'u1' });
        mockPutSkill.mockResolvedValue({
            personas: ['writer', 'executive'],
            defaultPersona: 'writer',
            focusAreas: [],
        });
        const req = {
            json: async () => ({ personas: ['writer', 'executive'], defaultPersona: 'writer' }),
        } as any;
        const res: any = await PUT(req);
        expect(res.status).toBe(200);
        expect(res.data.skillProfile.personas).toEqual(['writer', 'executive']);
        expect(mockPutSkill).toHaveBeenCalledWith('u1', {
            personas: ['writer', 'executive'],
            defaultPersona: 'writer',
        });
    });

    it('maps a SkillProfileError to 400 with its message', async () => {
        (getAuthenticatedUser as any).mockResolvedValue({ _id: 'u1' });
        mockPutSkill.mockRejectedValue(new SkillProfileError('Unknown persona "wizard"'));
        const req = { json: async () => ({ personas: ['wizard'] }) } as any;
        const res: any = await PUT(req);
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/unknown persona/i);
    });
});
