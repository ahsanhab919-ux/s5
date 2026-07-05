import mongoose, { Document } from 'mongoose';
import type { AccessibleRecordModel } from '@casl/mongoose';

/**
 * Book — a single long-form authoring project (Track D, BOOK-AUTHORING-SPEC.md).
 *
 * The book-level record: metadata + the ingested chapter plan + lifecycle status.
 * Full chapter TEXT lives in the Chapter model (one doc per chapter), never here —
 * the same separation the spec draws between the bounded story-bible block and the
 * full manuscript in MongoDB (§3). This keeps a Book document small and lets the
 * chapter loop write chapters independently.
 *
 * Storage only — validation/orchestration live in the services
 * (src/lib/book/*). Conventions match WritingProfile.ts / SecondMeSkillProfile.ts.
 *
 * NOTE: unlike the one-per-user Second Me records, a user owns MANY books, so
 * `userId` is indexed but NOT unique.
 */

/** Fiction vs non-fiction — mirrors BookKind in src/lib/book/ingest.ts. */
export const BOOK_KINDS = ['fiction', 'nonfiction'] as const;
export type BookKindValue = (typeof BOOK_KINDS)[number];

/** Whether the upload was a skeletal outline or a manuscript-in-progress. */
export const BOOK_SOURCE_KINDS = ['outline', 'partial'] as const;
export type BookSourceKindValue = (typeof BOOK_SOURCE_KINDS)[number];

/** Lifecycle of an authoring project. */
export const BOOK_STATUSES = ['draft', 'authoring', 'complete', 'failed'] as const;
export type BookStatusValue = (typeof BOOK_STATUSES)[number];

/** A single planned chapter as captured at ingest time. */
export interface IBookPlanChapter {
    index: number;
    intent: string;
    beats: string[];
}

export interface IBook extends Document {
    userId: string;
    title: string;
    subtitle?: string;
    author?: string;
    kind: BookKindValue;
    sourceKind: BookSourceKindValue;
    status: BookStatusValue;
    /** The ordered chapter plan extracted at ingest (structure, not text). */
    plan: IBookPlanChapter[];
}

const BookPlanChapterSchema = new mongoose.Schema<IBookPlanChapter>(
    {
        index: { type: Number, required: true },
        intent: { type: String, required: true },
        beats: { type: [String], default: [] },
    },
    { _id: false }
);

const BookSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, required: true },
        subtitle: { type: String },
        author: { type: String },
        kind: { type: String, enum: BOOK_KINDS, required: true, default: 'fiction' },
        sourceKind: { type: String, enum: BOOK_SOURCE_KINDS, required: true, default: 'outline' },
        status: { type: String, enum: BOOK_STATUSES, required: true, default: 'draft' },
        plan: { type: [BookPlanChapterSchema], default: [] },
    },
    { timestamps: true }
);

const Book =
    (mongoose.models.Book as AccessibleRecordModel<IBook>) ||
    mongoose.model<IBook, AccessibleRecordModel<IBook>>('Book', BookSchema);

export default Book;
