import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks (route-test style: vi.hoisted fns + vi.mock modules) --------------
vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));

const { mockIdentityFindOne, mockIdentityCreate, mockProfileFindOne } = vi.hoisted(
    () => ({
        mockIdentityFindOne: vi.fn(),
        mockIdentityCreate: vi.fn(),
        mockProfileFindOne: vi.fn(),
    })
);

vi.mock('@/models/SecondMeIdentity', () => ({
    default: { findOne: mockIdentityFindOne, create: mockIdentityCreate },
}));

vi.mock('@/models/WritingProfile', () => ({
    default: { findOne: mockProfileFindOne },
}));

import {
    ensureSecondMeIdentity,
    generatePublicIdentity,
} from './identity';

beforeEach(() => {
    vi.clearAllMocks();
    // create echoes back the row it was given (Mongoose-like)
    mockIdentityCreate.mockImplementation(async (doc) => doc);
});

describe('generatePublicIdentity', () => {
    it('produces a base64 public key and a 16-char hex keyId', () => {
        const { publicKey, keyId } = generatePublicIdentity();
        expect(publicKey).toMatch(/^[A-Za-z0-9+/]+=*$/);
        expect(keyId).toMatch(/^[0-9a-f]{16}$/);
    });

    it('is unique per call (fresh keypair each time)', () => {
        const a = generatePublicIdentity();
        const b = generatePublicIdentity();
        expect(a.publicKey).not.toBe(b.publicKey);
        expect(a.keyId).not.toBe(b.keyId);
    });
});

describe('ensureSecondMeIdentity', () => {
    it('rejects an empty userId', async () => {
        await expect(ensureSecondMeIdentity('')).rejects.toThrow(/userId is required/);
        expect(mockIdentityFindOne).not.toHaveBeenCalled();
    });

    it('returns the existing identity without creating a new one (idempotent)', async () => {
        const existing = { userId: 'u1', lettaAgentId: 'agent_1', revoked: false };
        mockIdentityFindOne.mockResolvedValue(existing);

        const result = await ensureSecondMeIdentity('u1');

        expect(result).toBe(existing);
        expect(mockProfileFindOne).not.toHaveBeenCalled();
        expect(mockIdentityCreate).not.toHaveBeenCalled();
    });

    it('throws a clear error when the user has no WritingProfile / Letta agent', async () => {
        mockIdentityFindOne.mockResolvedValue(null);
        mockProfileFindOne.mockResolvedValue(null);

        await expect(ensureSecondMeIdentity('u2')).rejects.toThrow(
            /has no WritingProfile/
        );
        expect(mockIdentityCreate).not.toHaveBeenCalled();
    });

    it('creates an identity reusing the WritingProfile lettaAgentId, revoked=false', async () => {
        mockIdentityFindOne.mockResolvedValue(null);
        mockProfileFindOne.mockResolvedValue({ userId: 'u3', lettaAgentId: 'agent_xyz' });

        const result = await ensureSecondMeIdentity('u3');

        expect(mockIdentityCreate).toHaveBeenCalledTimes(1);
        expect(result.userId).toBe('u3');
        // Reuses the SAME agent as the Twin — does not mint a new one.
        expect(result.lettaAgentId).toBe('agent_xyz');
        expect(result.revoked).toBe(false);
        // Public identity populated; private material intentionally absent (Step 4).
        expect(result.publicKey).toMatch(/^[A-Za-z0-9+/]+=*$/);
        expect(result.keyId).toMatch(/^[0-9a-f]{16}$/);
    });
});
