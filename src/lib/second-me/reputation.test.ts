import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));

const { mockFindOne, mockCreate } = vi.hoisted(() => ({
    mockFindOne: vi.fn(),
    mockCreate: vi.fn(),
}));

// Mock ONLY the model I/O (default export). Keep the REAL deriveLevel /
// MAX_REPUTATION_LEVEL so the pure-function tests exercise production code.
vi.mock('@/models/SecondMeReputation', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/models/SecondMeReputation')>();
    return {
        ...actual,
        default: { findOne: mockFindOne, create: mockCreate },
    };
});

import { deriveLevel, MAX_REPUTATION_LEVEL } from '@/models/SecondMeReputation';
import { ensureReputation, getReputation } from './reputation';

beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockImplementation(async (doc) => doc);
});

describe('deriveLevel (pure)', () => {
    it('is 0 below 100 karma', () => {
        expect(deriveLevel(0)).toBe(0);
        expect(deriveLevel(99)).toBe(0);
    });
    it('steps up every 100 karma', () => {
        expect(deriveLevel(100)).toBe(1);
        expect(deriveLevel(250)).toBe(2);
    });
    it('caps at MAX_REPUTATION_LEVEL', () => {
        expect(deriveLevel(100000)).toBe(MAX_REPUTATION_LEVEL);
    });
    it('treats negative / non-finite karma as 0', () => {
        expect(deriveLevel(-5)).toBe(0);
        expect(deriveLevel(NaN)).toBe(0);
    });
});

describe('ensureReputation', () => {
    it('rejects an empty userId', async () => {
        await expect(ensureReputation('')).rejects.toThrow(/userId is required/);
    });

    it('returns the existing record without creating (idempotent)', async () => {
        const existing = { userId: 'u1', karma: 120, reviewCount: 3, helpfulnessScore: 0.5 };
        mockFindOne.mockResolvedValue(existing);
        const r = await ensureReputation('u1');
        expect(r).toBe(existing);
        expect(mockCreate).not.toHaveBeenCalled();
    });

    it('seeds a zeroed record when none exists', async () => {
        mockFindOne.mockResolvedValue(null);
        const r = await ensureReputation('u2');
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(r.karma).toBe(0);
        expect(r.reviewCount).toBe(0);
        expect(r.helpfulnessScore).toBe(0);
    });
});

describe('getReputation', () => {
    it('returns a view with a derived level', async () => {
        mockFindOne.mockResolvedValue({
            userId: 'u3',
            karma: 250,
            reviewCount: 4,
            helpfulnessScore: 0.8,
        });
        const v = await getReputation('u3');
        expect(v).toEqual({
            userId: 'u3',
            karma: 250,
            reviewCount: 4,
            helpfulnessScore: 0.8,
            level: 2,
        });
    });

    it('seeds then returns a zeroed view (level 0) for a new user', async () => {
        mockFindOne.mockResolvedValue(null);
        const v = await getReputation('u4');
        expect(v.level).toBe(0);
        expect(v.karma).toBe(0);
    });
});
