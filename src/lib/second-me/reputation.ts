/**
 * Second Me — reputation scaffold (Step 3 of SECOND-ME-SPEC.md §6).
 *
 * SCAFFOLD ONLY: seed + read. No scoring, no mutation of the signals — Phase 3
 * (delegation) writes karma/reviewCount/helpfulnessScore against completed,
 * ledger-anchored work; Phase 4 (Reviewer Fund) reads them to distribute. This
 * module just makes the record exist and readable, with `level` derived.
 */
import dbConnect from '@/lib/dbConnect';
import SecondMeReputation, {
    ISecondMeReputation,
    deriveLevel,
} from '@/models/SecondMeReputation';

export class ReputationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ReputationError';
    }
}

/** A reputation record plus its derived level (the read-API shape). */
export interface ReputationView {
    userId: string;
    karma: number;
    reviewCount: number;
    helpfulnessScore: number;
    /** Derived, not stored: min(5, floor(karma/100)). */
    level: number;
}

function toView(doc: ISecondMeReputation): ReputationView {
    return {
        userId: doc.userId,
        karma: doc.karma,
        reviewCount: doc.reviewCount,
        helpfulnessScore: doc.helpfulnessScore,
        level: deriveLevel(doc.karma),
    };
}

/**
 * Find-or-create a user's reputation record, seeded at zero. Idempotent.
 * The seed is the whole point of Step 3: every user has an addressable
 * reputation row from day one, so Phase 3 never has to special-case "no row yet".
 */
export async function ensureReputation(
    userId: string
): Promise<ISecondMeReputation> {
    if (!userId) throw new ReputationError('ensureReputation: userId is required');
    await dbConnect();

    const existing = await SecondMeReputation.findOne({ userId });
    if (existing) return existing;

    return SecondMeReputation.create({
        userId,
        karma: 0,
        reviewCount: 0,
        helpfulnessScore: 0,
    });
}

/**
 * Read a user's reputation as a view (with derived level). Seeds the row if it
 * does not exist yet, so callers always get a well-formed view.
 */
export async function getReputation(userId: string): Promise<ReputationView> {
    const doc = await ensureReputation(userId);
    return toView(doc);
}
