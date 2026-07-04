import mongoose, { Document } from 'mongoose';
import type { AccessibleRecordModel } from '@casl/mongoose';

/**
 * SecondMeReputation — the per-user track record a Second Me accrues.
 *
 * Step 3 of the Second Me build order (SECOND-ME-SPEC.md §6): a SCAFFOLD only —
 * storage + a seed value + a read API. There is deliberately NO scoring logic
 * here. The fields exist so Phase 3 (delegation) has an addressable place to
 * write, and so the Phase 4 Reviewer Fund can pay against a shape it already
 * understands.
 *
 * Field shape intentionally matches shothik-web's `userReputation`
 * (PHASE4-REVIEWER-FUND-REFERENCE.md §1): karma / reviewCount / helpfulnessScore,
 * with `level` DERIVED, not stored — `level = min(5, floor(karma/100))`. Storing
 * only the raw signals keeps a single source of truth; level is computed on read.
 *
 * Conventions match SecondMeIdentity.ts / SecondMeSkillProfile.ts exactly.
 */

/** Max reputation level (matches the fund reference eligibility ladder). */
export const MAX_REPUTATION_LEVEL = 5;

/** Derive level from karma. Pure. `level = min(5, floor(karma/100))`. */
export function deriveLevel(karma: number): number {
    if (!Number.isFinite(karma) || karma < 0) return 0;
    return Math.min(MAX_REPUTATION_LEVEL, Math.floor(karma / 100));
}

export interface ISecondMeReputation extends Document {
    userId: string;
    /** Long-term standing. Seeded 0; written by Phase 3+, never here. */
    karma: number;
    /** Count of completed delegated jobs/reviews. Seeded 0. */
    reviewCount: number;
    /** Primary quality signal (0..1 scale). Seeded 0. */
    helpfulnessScore: number;
}

const SecondMeReputationSchema = new mongoose.Schema(
    {
        // One reputation record per user.
        userId: { type: String, required: true, unique: true, index: true },
        karma: { type: Number, default: 0, min: 0 },
        reviewCount: { type: Number, default: 0, min: 0 },
        helpfulnessScore: { type: Number, default: 0, min: 0, max: 1 },
    },
    { timestamps: true }
);

const SecondMeReputation =
    (mongoose.models.SecondMeReputation as AccessibleRecordModel<ISecondMeReputation>) ||
    mongoose.model<ISecondMeReputation, AccessibleRecordModel<ISecondMeReputation>>(
        'SecondMeReputation',
        SecondMeReputationSchema
    );

export default SecondMeReputation;
