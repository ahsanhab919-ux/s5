import mongoose, { Document } from 'mongoose';
import type { AccessibleRecordModel } from '@casl/mongoose';

/**
 * SecondMeKeyCustody — the encrypted-at-rest key store for a user's Second Me.
 *
 * This is the "encrypted-profile storage" the per-request BYOK path (see
 * src/lib/re-educator/byok.ts) explicitly deferred, and the private-key custody
 * seam SecondMeIdentity (Step 1) deferred. It holds SEALED key material only —
 * the row stores the crypto-vault envelope string, never plaintext. Reading the
 * row back gives you ciphertext; recovering the key requires the vault secret
 * and happens exactly at the point of use.
 *
 * Keyed by (userId, purpose) so one user can custody several distinct secrets
 * without collision:
 *   - a BYOK provider key ("byok:openai", "byok:anthropic"), and — later —
 *   - the Second Me Ed25519 PRIVATE signing key ("second-me-private-key").
 *
 * Mirrors WritingProfile/SecondMeIdentity conventions: typed as an
 * AccessibleRecordModel for CASL ownership scoping, `{ timestamps: true }`, and
 * the models-cache guard. Differs only in the compound uniqueness (one row per
 * user PER purpose, not one per user).
 *
 * See: SECOND-ME-SPEC.md §5–§6, src/lib/second-me/crypto-vault.ts,
 * src/lib/re-educator/byok.ts (the per-request path this complements).
 */
export interface ISecondMeKeyCustody extends Document {
    userId: string;
    /** What this sealed secret is for, e.g. "byok:openai" or "second-me-private-key". */
    purpose: string;
    /**
     * The crypto-vault envelope (`v1.<iv>.<tag>.<ct>`). SEALED — never plaintext.
     * Named to make it obvious in any dump that this is ciphertext, not a key.
     */
    sealedKey: string;
    /**
     * Non-secret provider label for BYOK rows (mirrors byok.ts BYOK_PROVIDERS),
     * so callers can list what a user has stored without opening the envelope.
     * Absent for non-BYOK purposes (e.g. the private signing key).
     */
    provider?: string;
}

const SecondMeKeyCustodySchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        purpose: { type: String, required: true },
        // The sealed envelope. Required and never stored in the clear — the
        // service layer is the only writer and it always seals first.
        sealedKey: { type: String, required: true },
        provider: { type: String, required: false },
    },
    { timestamps: true }
);

// One custody row per (user, purpose). A user may hold several purposes; each
// purpose is unique within the user. This is the compound analog of the
// per-user `unique` on WritingProfile/SecondMeIdentity.
SecondMeKeyCustodySchema.index({ userId: 1, purpose: 1 }, { unique: true });

// Typed as AccessibleRecordModel so `.accessibleBy(ability)` (CASL
// accessibleRecordsPlugin, registered in dbConnect) type-checks — identical
// IDOR/ownership scoping to every other user-owned model.
const SecondMeKeyCustody =
    (mongoose.models.SecondMeKeyCustody as AccessibleRecordModel<ISecondMeKeyCustody>) ||
    mongoose.model<ISecondMeKeyCustody, AccessibleRecordModel<ISecondMeKeyCustody>>(
        'SecondMeKeyCustody',
        SecondMeKeyCustodySchema
    );

export default SecondMeKeyCustody;
