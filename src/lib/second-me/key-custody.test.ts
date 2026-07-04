import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));

const { mockFindOne, mockFind, mockFindOneAndUpdate, mockDeleteOne } = vi.hoisted(() => ({
    mockFindOne: vi.fn(),
    mockFind: vi.fn(),
    mockFindOneAndUpdate: vi.fn(),
    mockDeleteOne: vi.fn(),
}));

vi.mock('@/models/SecondMeKeyCustody', () => ({
    default: {
        findOne: mockFindOne,
        find: mockFind,
        findOneAndUpdate: mockFindOneAndUpdate,
        deleteOne: mockDeleteOne,
    },
}));

import {
    storeByokKey,
    getByokCustody,
    listCustody,
    deleteByokKey,
    useByokKey,
    byokPurpose,
    KeyCustodyError,
} from './key-custody';
// Real crypto-vault is used (not mocked) so we exercise the true seal/open path.
import { seal } from './crypto-vault';

const GOOD_SECRET = 'test-vault-secret-abcdefghij';
const USER = 'user-123';

beforeEach(() => {
    vi.clearAllMocks();
    process.env.SECOND_ME_VAULT_SECRET = GOOD_SECRET;
});
afterEach(() => {
    delete process.env.SECOND_ME_VAULT_SECRET;
});

describe('byokPurpose', () => {
    it('namespaces the provider', () => {
        expect(byokPurpose('openai')).toBe('byok:openai');
        expect(byokPurpose('anthropic')).toBe('byok:anthropic');
    });
});

describe('storeByokKey (validation, before any DB/crypto)', () => {
    it('rejects a missing userId', async () => {
        await expect(storeByokKey('', 'openai', 'sk-x')).rejects.toThrow(KeyCustodyError);
        expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
    });

    it('rejects an unknown provider', async () => {
        await expect(storeByokKey(USER, 'gemini', 'sk-x')).rejects.toThrow(/must be one of/);
        expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
    });

    it('rejects an empty key', async () => {
        await expect(storeByokKey(USER, 'openai', '')).rejects.toThrow(KeyCustodyError);
        expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
    });

    it('rejects when the vault secret is not configured', async () => {
        delete process.env.SECOND_ME_VAULT_SECRET;
        await expect(storeByokKey(USER, 'openai', 'sk-x')).rejects.toThrow(/unavailable/);
        expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
    });
});

describe('storeByokKey (persist)', () => {
    it('seals the key and writes ONLY ciphertext, returning a non-secret view', async () => {
        mockFindOneAndUpdate.mockImplementation(async (_q, update) => ({
            userId: USER,
            purpose: 'byok:openai',
            provider: 'openai',
            sealedKey: update.$set.sealedKey,
        }));

        const apiKey = 'sk-live-super-secret-000';
        const view = await storeByokKey(USER, 'openai', apiKey);

        expect(view).toEqual({
            userId: USER,
            purpose: 'byok:openai',
            provider: 'openai',
            present: true,
        });

        // The written envelope must NOT be the plaintext, and must be openable.
        const [, update] = mockFindOneAndUpdate.mock.calls[0];
        expect(update.$set.sealedKey).not.toContain(apiKey);
        expect(update.$set.sealedKey.startsWith('v1.')).toBe(true);
        // upsert by (userId, purpose)
        expect(mockFindOneAndUpdate.mock.calls[0][0]).toEqual({
            userId: USER,
            purpose: 'byok:openai',
        });
    });

    it('is idempotent via upsert (re-store overwrites)', async () => {
        mockFindOneAndUpdate.mockImplementation(async (_q, update) => ({
            userId: USER,
            purpose: 'byok:anthropic',
            provider: 'anthropic',
            sealedKey: update.$set.sealedKey,
        }));
        await storeByokKey(USER, 'anthropic', 'first');
        await storeByokKey(USER, 'anthropic', 'second');
        expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(2);
        const opts = mockFindOneAndUpdate.mock.calls[0][2];
        expect(opts).toMatchObject({ upsert: true });
    });
});

describe('getByokCustody', () => {
    it('returns undefined when there is no row', async () => {
        mockFindOne.mockResolvedValue(null);
        expect(await getByokCustody(USER, 'openai')).toBeUndefined();
    });

    it('returns a non-secret view WITHOUT opening the envelope', async () => {
        mockFindOne.mockResolvedValue({
            userId: USER,
            purpose: 'byok:openai',
            provider: 'openai',
            sealedKey: seal('should-not-be-returned'),
        });
        const view = await getByokCustody(USER, 'openai');
        expect(view).toEqual({
            userId: USER,
            purpose: 'byok:openai',
            provider: 'openai',
            present: true,
        });
        // The view carries no plaintext and no sealedKey field.
        expect(JSON.stringify(view)).not.toContain('should-not-be-returned');
        expect((view as unknown as Record<string, unknown>).sealedKey).toBeUndefined();
    });
});

describe('listCustody', () => {
    it('returns [] for a missing userId without hitting the DB', async () => {
        expect(await listCustody('')).toEqual([]);
        expect(mockFind).not.toHaveBeenCalled();
    });

    it('maps rows to non-secret views', async () => {
        mockFind.mockResolvedValue([
            { userId: USER, purpose: 'byok:openai', provider: 'openai', sealedKey: seal('a') },
            { userId: USER, purpose: 'byok:anthropic', provider: 'anthropic', sealedKey: seal('b') },
        ]);
        const views = await listCustody(USER);
        expect(views).toHaveLength(2);
        expect(views.every((v) => v.present)).toBe(true);
        expect(JSON.stringify(views)).not.toContain('v1.'); // no envelope leaked
    });
});

describe('deleteByokKey', () => {
    it('returns true when a row was removed', async () => {
        mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
        expect(await deleteByokKey(USER, 'openai')).toBe(true);
        expect(mockDeleteOne).toHaveBeenCalledWith({ userId: USER, purpose: 'byok:openai' });
    });
    it('returns false when nothing matched', async () => {
        mockDeleteOne.mockResolvedValue({ deletedCount: 0 });
        expect(await deleteByokKey(USER, 'openai')).toBe(false);
    });
});

describe('useByokKey (point-of-use, fails closed)', () => {
    it('recovers the plaintext key from a sealed row', async () => {
        const apiKey = 'sk-recover-me-777';
        mockFindOne.mockResolvedValue({
            userId: USER,
            purpose: 'byok:openai',
            provider: 'openai',
            sealedKey: seal(apiKey),
        });
        expect(await useByokKey(USER, 'openai')).toBe(apiKey);
    });

    it('returns undefined when there is no row', async () => {
        mockFindOne.mockResolvedValue(null);
        expect(await useByokKey(USER, 'openai')).toBeUndefined();
    });

    it('returns undefined (fails closed) when the vault secret is absent', async () => {
        delete process.env.SECOND_ME_VAULT_SECRET;
        expect(await useByokKey(USER, 'openai')).toBeUndefined();
        // Should short-circuit before querying.
        expect(mockFindOne).not.toHaveBeenCalled();
    });

    it('returns undefined (fails closed) when the secret rotated / open fails', async () => {
        const sealedUnderOldSecret = seal('key-under-old-secret');
        mockFindOne.mockResolvedValue({
            userId: USER,
            purpose: 'byok:openai',
            provider: 'openai',
            sealedKey: sealedUnderOldSecret,
        });
        // Rotate the secret so open() can no longer recover it.
        process.env.SECOND_ME_VAULT_SECRET = 'rotated-secret-different-value';
        expect(await useByokKey(USER, 'openai')).toBeUndefined();
    });

    it('returns undefined for a missing userId', async () => {
        expect(await useByokKey('', 'openai')).toBeUndefined();
    });
});
