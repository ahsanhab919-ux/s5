import mongoose, { Document } from 'mongoose';
import type { AccessibleRecordModel } from '@casl/mongoose';

/**
 * WritingProfile — the MongoDB mirror for a user's WRITING.md.
 *
 * The WRITING.md content itself lives in Letta (core-memory block "writing_md"
 * on the user's agent). This collection stores only the pointer + metadata so
 * the app can find a user's agent without a Letta round-trip, and so we can
 * enforce one-agent-per-user and track edit history lightly.
 *
 * See: src/lib/letta.ts and MEMORY-STACK-EVALUATION.md
 */
export interface IWritingProfile extends Document {
    userId: string;
    lettaAgentId: string;
    blockLabel: string;
    // Optional BYOK overrides (Phase 2). When empty, server defaults are used.
    modelHandle?: string;
    embeddingHandle?: string;
    // Lightweight local cache of last-known content length for UI hints.
    lastContentLength?: number;
    lastSyncedAt?: Date;
}

const WritingProfileSchema = new mongoose.Schema(
    {
        // One WRITING.md profile per user.
        userId: { type: String, required: true, unique: true, index: true },
        lettaAgentId: { type: String, required: true },
        blockLabel: { type: String, default: 'writing_md' },
        modelHandle: { type: String },
        embeddingHandle: { type: String },
        lastContentLength: { type: Number, default: 0 },
        lastSyncedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Typed as an AccessibleRecordModel so `.accessibleBy(ability)` (added by the
// CASL accessibleRecordsPlugin registered in dbConnect) type-checks.
const WritingProfile =
    (mongoose.models.WritingProfile as AccessibleRecordModel<IWritingProfile>) ||
    mongoose.model<IWritingProfile, AccessibleRecordModel<IWritingProfile>>(
        'WritingProfile',
        WritingProfileSchema
    );

export default WritingProfile;
