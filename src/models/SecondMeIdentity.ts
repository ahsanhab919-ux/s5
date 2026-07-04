import mongoose, { Document } from 'mongoose';
import type { AccessibleRecordModel } from '@casl/mongoose';

/**
 * SecondMeIdentity — the signed, persisted identity for a user's Second Me.
 *
 * A Second Me is the *delegable* form of the user's Twin: it reuses the SAME
 * Letta agent (and therefore the same WRITING.md memory) as the WritingProfile,
 * but adds a verifiable identity so that work performed on the user's behalf can
 * be attributed and, later, signed.
 *
 * This is the near-identical analog of WritingProfile.ts: a per-user pointer to a
 * Letta agent plus identity metadata. Step 1 stores only the PUBLIC half of the
 * signing keypair — private-key custody is deferred to Step 4 (the encrypted
 * key-custody store, shared with BYOK). Signing/actions are Phase 3.
 *
 * See: SECOND-ME-SPEC.md §5–§6, SECOND-ME-STEP1-SCOPE.md, src/models/WritingProfile.ts
 */
export interface ISecondMeIdentity extends Document {
    userId: string;
    lettaAgentId: string;
    /** Ed25519 public key (base64) — the verifiable half of the identity. */
    publicKey: string;
    /** Short, stable fingerprint of the public key (identifies the key in logs/ledger). */
    keyId: string;
    /** Identity is revocable (AWP trust-boundary requirement). Defaults false. */
    revoked: boolean;
}

const SecondMeIdentitySchema = new mongoose.Schema(
    {
        // One Second Me identity per user (same one-per-user rule as WritingProfile).
        userId: { type: String, required: true, unique: true, index: true },
        // The user's EXISTING Letta agent — reused, not newly created. This is what
        // ties Second Me to the same memory (WRITING.md) as the Twin.
        lettaAgentId: { type: String, required: true },
        publicKey: { type: String, required: true },
        keyId: { type: String, required: true },
        revoked: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Typed as an AccessibleRecordModel so `.accessibleBy(ability)` (added by the
// CASL accessibleRecordsPlugin registered in dbConnect) type-checks — same
// IDOR/ownership scoping as every other user-owned model.
const SecondMeIdentity =
    (mongoose.models.SecondMeIdentity as AccessibleRecordModel<ISecondMeIdentity>) ||
    mongoose.model<ISecondMeIdentity, AccessibleRecordModel<ISecondMeIdentity>>(
        'SecondMeIdentity',
        SecondMeIdentitySchema
    );

export default SecondMeIdentity;
