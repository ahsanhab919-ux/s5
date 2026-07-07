import mongoose, { Document } from 'mongoose';
import type { AccessibleRecordModel } from '@casl/mongoose';
import { CHAPTER_STATUSES, ChapterStatusValue } from './Chapter';

/**
 * ChapterAttempt — one try/gate outcome for a chapter during a book run (Track D).
 *
 * The author loop (src/lib/book/author.ts) generates a chapter, runs it through
 * the done-gate, and regenerates on failure up to a bound. Each try's RESULT is
 * recorded here so a run's per-chapter history (how many tries, what the gate
 * rejected) is durable and auditable — the observability side of the loop's
 * fail-closed discipline.
 *
 * This is OBSERVABILITY, not the source of truth: the accepted chapter text lives
 * in the Chapter model. We deliberately store only the gate OUTCOME + a bounded
 * issue summary + small metadata here — NEVER the full draft text — so history
 * cannot grow without bound across regenerations.
 *
 * Writing a ChapterAttempt is fail-soft (provider.ts swallows errors): a failed
 * history write must never abort authoring or lose an accepted chapter. This is
 * the intentional asymmetry with the Chapter save, which is fail-loud.
 *
 * Conventions mirror ReEducatorLedger.ts (guards, timestamps, AccessibleRecordModel).
 */
export interface IChapterAttempt extends Document {
    /** Owner — enables CASL accessibleBy() ownership scoping (IDOR protection). */
    userId: string;
    /** The book this attempt belongs to. */
    bookId: string;
    /** The chapter's index within the plan (0-based). */
    index: number;
    /** 1-based try number for this chapter (1 = first draft, 2 = first regen, ...). */
    attempt: number;
    /** Whether this try cleared the done-gate. Shares CHAPTER_STATUSES with Chapter. */
    status: ChapterStatusValue;
    /** Bounded, human-readable gate issues from this try (empty when accepted). */
    gateIssues: string[];
    /** Output tokens billed for this try, if known. */
    tokensUsed?: number;
    // NOTE: the model handle is persisted as `modelHandle`, NOT `model`: `model` is
    // a reserved method on Mongoose's Document (both a runtime reserved key and a
    // TS type clash), so the domain field `model` maps to this column.
    modelHandle?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ChapterAttemptSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        bookId: { type: String, required: true },
        index: { type: Number, required: true },
        attempt: { type: Number, required: true },
        status: { type: String, enum: CHAPTER_STATUSES, required: true },
        // Bounded summary only — the full draft text is never stored per attempt.
        gateIssues: { type: [String], default: [] },
        tokensUsed: { type: Number },
        // `model` is reserved by Mongoose Document; persist the handle as modelHandle.
        modelHandle: { type: String },
    },
    { timestamps: true }
);

// Most common query: a user's attempts for one book, newest first.
ChapterAttemptSchema.index({ userId: 1, bookId: 1, createdAt: -1 });
// Per-chapter history within a book.
ChapterAttemptSchema.index({ bookId: 1, index: 1 });

const ChapterAttempt =
    (mongoose.models.ChapterAttempt as AccessibleRecordModel<IChapterAttempt>) ||
    mongoose.model<IChapterAttempt, AccessibleRecordModel<IChapterAttempt>>(
        'ChapterAttempt',
        ChapterAttemptSchema
    );

export default ChapterAttempt;
