import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));

const { mockFindOne, mockCreate } = vi.hoisted(() => ({
    mockFindOne: vi.fn(),
    mockCreate: vi.fn(),
}));

vi.mock('@/models/SecondMeSkillProfile', () => ({
    default: { findOne: mockFindOne, create: mockCreate },
    SECOND_ME_PERSONAS: ['student', 'writer', 'executive'],
}));

import {
    parseSkillProfile,
    getSkillProfile,
    putSkillProfile,
    SkillProfileError,
    MAX_FOCUS_AREAS,
    MAX_FOCUS_AREA_LEN,
} from './skill-profile';

beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockImplementation(async (doc) => doc);
});

describe('parseSkillProfile (pure validation)', () => {
    it('accepts a minimal valid payload', () => {
        const out = parseSkillProfile({ personas: ['writer'], defaultPersona: 'writer' });
        expect(out).toEqual({ personas: ['writer'], defaultPersona: 'writer', focusAreas: [] });
    });

    it('accepts all three personas', () => {
        const out = parseSkillProfile({
            personas: ['student', 'writer', 'executive'],
            defaultPersona: 'executive',
        });
        expect(out.personas).toEqual(['student', 'writer', 'executive']);
        expect(out.defaultPersona).toBe('executive');
    });

    it('dedupes repeated personas', () => {
        const out = parseSkillProfile({
            personas: ['writer', 'writer', 'student'],
            defaultPersona: 'writer',
        });
        expect(out.personas).toEqual(['writer', 'student']);
    });

    it('rejects a non-object body', () => {
        expect(() => parseSkillProfile(null)).toThrow(SkillProfileError);
        expect(() => parseSkillProfile('x')).toThrow(/JSON object/);
    });

    it('rejects an empty or missing personas array', () => {
        expect(() => parseSkillProfile({ personas: [], defaultPersona: 'writer' })).toThrow(
            /non-empty "personas"/
        );
        expect(() => parseSkillProfile({ defaultPersona: 'writer' })).toThrow(/non-empty "personas"/);
    });

    it('rejects an unknown persona', () => {
        expect(() =>
            parseSkillProfile({ personas: ['wizard'], defaultPersona: 'wizard' })
        ).toThrow(/Unknown persona "wizard"/);
    });

    it('rejects an unknown defaultPersona', () => {
        expect(() =>
            parseSkillProfile({ personas: ['writer'], defaultPersona: 'nope' })
        ).toThrow(/"defaultPersona" must be one of/);
    });

    it('rejects a defaultPersona not present in personas', () => {
        expect(() =>
            parseSkillProfile({ personas: ['writer'], defaultPersona: 'student' })
        ).toThrow(/must also be listed in "personas"/);
    });

    it('trims, dedupes, and drops empty focus areas', () => {
        const out = parseSkillProfile({
            personas: ['writer'],
            defaultPersona: 'writer',
            focusAreas: ['  sci-fi ', 'sci-fi', '   ', 'poetry'],
        });
        expect(out.focusAreas).toEqual(['sci-fi', 'poetry']);
    });

    it('rejects focusAreas that is not an array', () => {
        expect(() =>
            parseSkillProfile({ personas: ['writer'], defaultPersona: 'writer', focusAreas: 'x' })
        ).toThrow(/"focusAreas" must be an array/);
    });

    it('rejects a non-string focus area', () => {
        expect(() =>
            parseSkillProfile({ personas: ['writer'], defaultPersona: 'writer', focusAreas: [1] })
        ).toThrow(/must be a string/);
    });

    it('rejects an over-long focus area', () => {
        const long = 'a'.repeat(MAX_FOCUS_AREA_LEN + 1);
        expect(() =>
            parseSkillProfile({ personas: ['writer'], defaultPersona: 'writer', focusAreas: [long] })
        ).toThrow(/exceeds/);
    });

    it('rejects too many focus areas', () => {
        const many = Array.from({ length: MAX_FOCUS_AREAS + 1 }, (_, i) => `area${i}`);
        expect(() =>
            parseSkillProfile({ personas: ['writer'], defaultPersona: 'writer', focusAreas: many })
        ).toThrow(/Too many focus areas/);
    });
});

describe('getSkillProfile', () => {
    it('rejects an empty userId', async () => {
        await expect(getSkillProfile('')).rejects.toThrow(/userId is required/);
    });

    it('returns null when none exists', async () => {
        mockFindOne.mockResolvedValue(null);
        expect(await getSkillProfile('u1')).toBeNull();
    });
});

describe('putSkillProfile', () => {
    it('rejects an empty userId before touching the DB', async () => {
        await expect(putSkillProfile('', { personas: ['writer'], defaultPersona: 'writer' })).rejects.toThrow(
            /userId is required/
        );
        expect(mockFindOne).not.toHaveBeenCalled();
    });

    it('creates a new profile when none exists', async () => {
        mockFindOne.mockResolvedValue(null);
        const result = await putSkillProfile('u2', {
            personas: ['student', 'writer'],
            defaultPersona: 'student',
        });
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(result.userId).toBe('u2');
        expect(result.personas).toEqual(['student', 'writer']);
        expect(result.defaultPersona).toBe('student');
    });

    it('updates an existing profile in place (idempotent upsert)', async () => {
        const existing = {
            userId: 'u3',
            personas: ['writer'],
            defaultPersona: 'writer',
            focusAreas: [],
            save: vi.fn().mockImplementation(async function (this: any) {
                return this;
            }),
        };
        mockFindOne.mockResolvedValue(existing);

        const result = await putSkillProfile('u3', {
            personas: ['executive'],
            defaultPersona: 'executive',
            focusAreas: ['strategy'],
        });

        expect(mockCreate).not.toHaveBeenCalled();
        expect(existing.save).toHaveBeenCalledTimes(1);
        expect(result.personas).toEqual(['executive']);
        expect(result.defaultPersona).toBe('executive');
        expect(result.focusAreas).toEqual(['strategy']);
    });

    it('propagates validation errors before any DB write', async () => {
        await expect(putSkillProfile('u4', { personas: [] })).rejects.toThrow(SkillProfileError);
        expect(mockFindOne).not.toHaveBeenCalled();
        expect(mockCreate).not.toHaveBeenCalled();
    });
});
