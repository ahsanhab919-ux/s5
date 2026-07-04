/**
 * Second Me — key custody service (Step 4).
 *
 * The persistent, encrypted-at-rest complement to the per-request BYOK path
 * (src/lib/re-educator/byok.ts). Where byok.ts takes a key that arrives on a
 * single request and is never persisted, this lets a user store a BYOK provider
 * key ONCE, sealed, so later runs reuse it without the key crossing the wire
 * again. It also reserves the seam for custodying the Second Me private signing
 * key (Step 1's deferred half).
 *
 * Layering: this file owns the DB row and the "what purposes are legal" policy.
 * The actual encryption is delegated to crypto-vault.ts. The row only ever holds
 * a vault envelope; plaintext exists only transiently inside `storeByokKey`
 * (input) and `useByokKey` (output at point of use).
 *
 * SECURITY (spec §8, mirrors byok.ts):
 *   - The plaintext key is sealed BEFORE any DB write and is never logged.
 *   - Retrieval returns metadata (provider, presence) freely; the plaintext is
 *     handed back ONLY by `useByokKey`, and ONLY to its caller — the point of
 *     use that builds a provider. No other path returns it.
 *   - Fail CLOSED: a missing vault secret, absent row, or failed open surfaces
 *     as "no usable key" (undefined) at the use site, never a thrown 500 leaking
 *     state. Storage, being an explicit user action, DOES throw on bad input so
 *     the user learns their key was rejected.
 *
 * See: SECOND-ME-SPEC.md §5–§6, src/lib/re-educator/byok.ts, crypto-vault.ts.
 */

import dbConnect from '@/lib/dbConnect';
import SecondMeKeyCustody, {
    ISecondMeKeyCustody,
} from '@/models/SecondMeKeyCustody';
import { seal, open, vaultAvailable, VaultError } from './crypto-vault';
import { BYOK_PROVIDERS, isByokProvider, type ByokProviderName } from '@/lib/re-educator/byok';

/** Custody purpose namespace for a BYOK provider key. */
export function byokPurpose(provider: ByokProviderName): string {
    return `byok:${provider}`;
}

/** Thrown for a rejected custody STORE (bad input). Never contains the key. */
export class KeyCustodyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'KeyCustodyError';
    }
}

/** Non-secret view of a custody row — safe to return/log. Never holds plaintext. */
export interface CustodyRecordView {
    userId: string;
    purpose: string;
    provider?: string;
    /** True — the row exists and holds sealed material. Presence, not the key. */
    present: true;
}

function toView(doc: ISecondMeKeyCustody): CustodyRecordView {
    return {
        userId: doc.userId,
        purpose: doc.purpose,
        provider: doc.provider,
        present: true,
    };
}

/**
 * Store (or replace) a user's sealed BYOK key for one provider. Idempotent per
 * (userId, provider): re-storing overwrites the sealed envelope in place.
 *
 * Validates BEFORE any crypto or DB work (byok.ts validation idiom): unknown
 * provider or empty key is rejected with KeyCustodyError. The plaintext key is
 * sealed and only the envelope is written — the DB never sees the key.
 *
 * Returns the non-secret view. SECURITY: `apiKey` is never logged.
 */
export async function storeByokKey(
    userId: string,
    provider: string,
    apiKey: string
): Promise<CustodyRecordView> {
    if (!userId) {
        throw new KeyCustodyError('storeByokKey: userId is required');
    }
    if (!isByokProvider(provider)) {
        throw new KeyCustodyError(
            `storeByokKey: provider must be one of ${BYOK_PROVIDERS.join(', ')}`
        );
    }
    if (typeof apiKey !== 'string' || apiKey.length === 0) {
        throw new KeyCustodyError('storeByokKey: apiKey must be a non-empty string');
    }
    if (!vaultAvailable()) {
        // Storage without a vault secret would mean storing something we can
        // never open — reject loudly rather than persist a dead envelope.
        throw new KeyCustodyError(
            'storeByokKey: key custody is unavailable (vault secret not configured)'
        );
    }

    // Seal FIRST — the plaintext never reaches the DB layer.
    const sealedKey = seal(apiKey);
    const purpose = byokPurpose(provider);

    await dbConnect();
    const doc = await SecondMeKeyCustody.findOneAndUpdate(
        { userId, purpose },
        { $set: { sealedKey, provider } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return toView(doc as ISecondMeKeyCustody);
}

/**
 * List a user's stored BYOK providers as non-secret views. Never opens any
 * envelope. Returns [] when the user has none.
 */
export async function listCustody(userId: string): Promise<CustodyRecordView[]> {
    if (!userId) return [];
    await dbConnect();
    const docs = await SecondMeKeyCustody.find({ userId });
    return docs.map((d) => toView(d as ISecondMeKeyCustody));
}

/**
 * Return the non-secret view of a user's stored key for a provider, or
 * `undefined` if none. Does NOT open the envelope — use `useByokKey` for that.
 */
export async function getByokCustody(
    userId: string,
    provider: ByokProviderName
): Promise<CustodyRecordView | undefined> {
    if (!userId) return undefined;
    await dbConnect();
    const doc = await SecondMeKeyCustody.findOne({ userId, purpose: byokPurpose(provider) });
    return doc ? toView(doc as ISecondMeKeyCustody) : undefined;
}

/**
 * Delete a user's stored key for a provider. Idempotent — returns true iff a row
 * was removed. Lets the user revoke a stored key.
 */
export async function deleteByokKey(
    userId: string,
    provider: ByokProviderName
): Promise<boolean> {
    if (!userId) return false;
    await dbConnect();
    const res = await SecondMeKeyCustody.deleteOne({
        userId,
        purpose: byokPurpose(provider),
    });
    return (res?.deletedCount ?? 0) > 0;
}

/**
 * THE point-of-use accessor: recover a user's plaintext BYOK key for a provider,
 * or `undefined` if there is nothing usable. This is the ONLY function that
 * returns plaintext, and it does so only to its direct caller (which builds a
 * provider and discards it).
 *
 * Fails CLOSED to `undefined` — never throws — on: no row, vault unavailable, or
 * a failed open (tampered/rotated secret). A run then proceeds as if the user
 * supplied no key (deterministic-only), exactly like the per-request BYOK path.
 *
 * SECURITY: the returned plaintext is never logged here; the failure branch
 * swallows the (plaintext-free) VaultError and returns undefined.
 */
export async function useByokKey(
    userId: string,
    provider: ByokProviderName
): Promise<string | undefined> {
    if (!userId) return undefined;
    if (!vaultAvailable()) return undefined;

    await dbConnect();
    const doc = await SecondMeKeyCustody.findOne({ userId, purpose: byokPurpose(provider) });
    if (!doc) return undefined;

    try {
        return open((doc as ISecondMeKeyCustody).sealedKey);
    } catch (err) {
        // Fail closed: a VaultError here means we cannot recover the key (wrong
        // secret or tampered row). Treat as "no key" — never propagate.
        if (err instanceof VaultError) return undefined;
        // Any other unexpected error also fails closed to preserve the invariant.
        return undefined;
    }
}
