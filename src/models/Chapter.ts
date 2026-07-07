import mongoose, { Document } from 'mongoose';
import type { AccessibleRecordModel } from '@casl/mongoose';

/**
 * Chapter — one chapter's full text within a Book (Track D).
 *
 * Separated from the Book document so the chapter loop (src/lib/book/author.ts)
 * can write chapters independently and the Book record stays small (spec §3: full
 * chapters live in MongoDB, the bible block stays a bounded summary).
 *
 * A chapter is written ONLY after it passes the done-gate — the `status` field
 * records whether it was accepted or failed, and `attempts` how many
 * regenerations it took. This is the persistence side of the loop's fail-closed
 * discipline (a chapter is a candidate until it passes).
 *
 * Keyed by (bookId, index) compound-unique — a book cannot have two chapter 3s.
 * `userId` is denormalized for ownership/authorization checks without a join.
 * Conventions match SecondMeKeyCustody.ts (which also uses a compound unique key).
 */

export const CHAPTER_STATUSES = ['accepted', 'failed'] as const;
export type ChapterStatusValue = (typeof CHAPTER_STATUSES)[number];

export interface IChapter extends Document {
    userId: string;
    bookId: string;
    index: number;
    intent: string;
    content: string;
    status: ChapterStatusValue;
    attempts: number;
}

const ChapterSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        bookId: { type: String, required: true, index: true },
        index: { type: Number, required: true },
        intent: { type: String, required: true },
        content: { type: String, required: true },
        status: { type: String, enum: CHAPTER_STATUSES, required: true },
        attempts: { type: Number, required: true, default: 1 },
    },
    { timestamps: true }
);

// A book cannot have two chapters at the same index.
ChapterSchema.index({ bookId: 1, index: 1 }, { unique: true });

// Backs getAcceptedChapters' hottest read: { userId, bookId, status: 'accepted' }.
ChapterSchema.index({ bookId: 1, userId: 1, status: 1 });

const Chapter =
    (mongoose.models.Chapter as AccessibleRecordModel<IChapter>) ||
    mongoose.model<IChapter, AccessibleRecordModel<IChapter>>('Chapter', ChapterSchema);

export default Chapter;
