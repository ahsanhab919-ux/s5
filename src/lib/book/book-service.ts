/**
 * Book Authoring — persistence service (Track D wiring, data layer).
 *
 * The thin layer between the pure book logic (ingest/bible/author/export) and the
 * API routes. Validation + DB access live here; routes stay dumb (auth → parse →
 * service call → JSON), mirroring the Re-educator/Second-Me service split.
 *
 * Pure parse (`parseCreateBook`) is unit-testable with no I/O; the create/get/
 * list/save helpers touch Mongo and are mocked in tests (same discipline as
 * skill-profile.ts). Ownership is enforced by always scoping queries to userId.
 */
import dbConnect from '@/lib/dbConnect';
import Book, { IBook, BOOK_KINDS, BookKindValue } from '@/models/Book';
import Chapter, { IChapter, CHAPTER_STATUSES, ChapterStatusValue } from '@/models/Chapter';
import { ingestBookDocument, type BookKind } from './ingest';

/** Thrown when a book request payload is invalid or an owned record is missing. */
export class BookServiceError extends Error {
    constructor(
        message: string,
        /** HTTP-ish hint the route maps to a status (400 default, 404 for not-found). */
        public readonly notFound = false
    ) {
        super(message);
        this.name = 'BookServiceError';
    }
}

/** Max length of a user-supplied title/subtitle/author, to keep records sane. */
export const MAX_TITLE_LEN = 300;

/** The validated shape for creating a book from an uploaded document. */
export interface CreateBookInput {
    title: string;
    subtitle?: string;
    author?: string;
    /** Optional kind override; otherwise the ingest heuristic decides. */
    kindOverride?: BookKind;
    /** The raw uploaded markdown (outline or partial manuscript). */
    document: string;
}

function optionalBoundedString(v: unknown, field: string): string | undefined {
    if (v === undefined || v === null) return undefined;
    if (typeof v !== 'string') throw new BookServiceError(`"${field}" must be a string.`);
    const t = v.trim();
    if (t.length === 0) return undefined;
    if (t.length > MAX_TITLE_LEN) {
        throw new BookServiceError(`"${field}" exceeds ${MAX_TITLE_LEN} characters.`);
    }
    return t;
}

/**
 * Validate an incoming create-book payload. Pure; no I/O.
 * Rules:
 *  - `title` required, non-empty, bounded.
 *  - `subtitle`/`author` optional, bounded.
 *  - `document` required, non-empty string (further validated by ingest).
 *  - `kindOverride` optional; must be a known BookKind when present.
 */
export function parseCreateBook(body: unknown): CreateBookInput {
    if (typeof body !== 'object' || body === null) {
        throw new BookServiceError('Body must be a JSON object.');
    }
    const b = body as Record<string, unknown>;

    const title = optionalBoundedString(b.title, 'title');
    if (!title) throw new BookServiceError('Body must include a non-empty "title".');

    if (typeof b.document !== 'string' || b.document.trim().length === 0) {
        throw new BookServiceError('Body must include a non-empty "document".');
    }

    let kindOverride: BookKind | undefined;
    if (b.kindOverride !== undefined) {
        if (!(BOOK_KINDS as readonly string[]).includes(b.kindOverride as string)) {
            throw new BookServiceError(
                `"kindOverride" must be one of: ${BOOK_KINDS.join(', ')}.`
            );
        }
        kindOverride = b.kindOverride as BookKindValue;
    }

    return {
        title,
        subtitle: optionalBoundedString(b.subtitle, 'subtitle'),
        author: optionalBoundedString(b.author, 'author'),
        kindOverride,
        document: b.document,
    };
}

/**
 * Create a book: ingest the document into a chapter plan, persist a Book record.
 * The plan is stored; chapter TEXT is written later by the loop.
 */
export async function createBook(userId: string, body: unknown): Promise<IBook> {
    if (!userId) throw new BookServiceError('createBook: userId is required');
    const input = parseCreateBook(body);
    // Ingest is pure and throws its own BookIngestError on a bad document; let it
    // surface (the route maps any parse-family error to 400).
    const ingested = ingestBookDocument(input.document, input.kindOverride);

    await dbConnect();
    return Book.create({
        userId,
        title: input.title,
        subtitle: input.subtitle,
        author: input.author,
        kind: ingested.kind,
        sourceKind: ingested.sourceKind,
        status: 'draft',
        plan: ingested.chapters.map((c) => ({
            index: c.index,
            intent: c.intent,
            beats: c.beats,
        })),
    });
}

/** List a user's books (newest first), scoped to the owner. */
export async function listBooks(userId: string): Promise<IBook[]> {
    if (!userId) throw new BookServiceError('listBooks: userId is required');
    await dbConnect();
    return Book.find({ userId }).sort({ createdAt: -1 });
}

/** Fetch one owned book or throw a not-found BookServiceError. */
export async function getBook(userId: string, bookId: string): Promise<IBook> {
    if (!userId) throw new BookServiceError('getBook: userId is required');
    if (!bookId) throw new BookServiceError('getBook: bookId is required');
    await dbConnect();
    const book = await Book.findOne({ _id: bookId, userId });
    if (!book) throw new BookServiceError('Book not found.', true);
    return book;
}

/**
 * Atomically claim an owned book for a run: transition `draft → authoring` in a
 * single conditional write, returning the updated book. This is the ONE gate that
 * starts a run — it closes the check-then-set race where two concurrent POST /run
 * could both pass a prior read-guard and both spend on the model.
 *
 * STRICT: only a `draft` book can be claimed. A book already `authoring` (a prior
 * crash/failure left it there) is NOT re-runnable via the API — it must be
 * explicitly reset to `draft` first. Fail-closed: keep a human in the loop before
 * re-spending money on a book that already failed.
 *
 * Mirrors the atomic custody claim (second-me/key-custody.ts): a `findOneAndUpdate`
 * whose filter carries the expected precondition (`status: 'draft'`). On a null
 * result we disambiguate to preserve the 404-vs-400 contract.
 */
export async function claimBookForRun(userId: string, bookId: string): Promise<IBook> {
    if (!userId) throw new BookServiceError('claimBookForRun: userId is required');
    if (!bookId) throw new BookServiceError('claimBookForRun: bookId is required');
    await dbConnect();
    const claimed = await Book.findOneAndUpdate(
        { _id: bookId, userId, status: 'draft' },
        { $set: { status: 'authoring' } },
        { new: true }
    );
    if (claimed) return claimed;
    // The claim missed: either the book isn't owned/doesn't exist (404), or it
    // exists but is not `draft` (400). Disambiguate with a plain owner-scoped read.
    const existing = await Book.findOne({ _id: bookId, userId });
    if (!existing) throw new BookServiceError('Book not found.', true);
    throw new BookServiceError(
        `Book is "${existing.status}" and cannot be started; reset it to draft to run again.`
    );
}

/** Fetch the accepted chapters of an owned book, in reading order. */
export async function getAcceptedChapters(
    userId: string,
    bookId: string
): Promise<IChapter[]> {
    if (!userId) throw new BookServiceError('getAcceptedChapters: userId is required');
    if (!bookId) throw new BookServiceError('getAcceptedChapters: bookId is required');
    await dbConnect();
    return Chapter.find({ userId, bookId, status: 'accepted' }).sort({ index: 1 });
}

/**
 * Persist a chapter outcome (accepted or failed), upserting on (bookId, index).
 * Used by the loop's saveChapter hook.
 */
export async function saveChapterRecord(
    userId: string,
    bookId: string,
    chapter: {
        index: number;
        intent: string;
        content: string;
        status: ChapterStatusValue;
        attempts: number;
    }
): Promise<IChapter> {
    if (!userId) throw new BookServiceError('saveChapterRecord: userId is required');
    if (!bookId) throw new BookServiceError('saveChapterRecord: bookId is required');
    if (!(CHAPTER_STATUSES as readonly string[]).includes(chapter.status)) {
        throw new BookServiceError(`Invalid chapter status "${chapter.status}".`);
    }
    await dbConnect();
    const existing = await Chapter.findOne({ userId, bookId, index: chapter.index });
    if (existing) {
        existing.intent = chapter.intent;
        existing.content = chapter.content;
        existing.status = chapter.status;
        existing.attempts = chapter.attempts;
        return existing.save();
    }
    return Chapter.create({ userId, bookId, ...chapter });
}

/** Update a book's lifecycle status (owner-scoped). */
export async function setBookStatus(
    userId: string,
    bookId: string,
    status: IBook['status']
): Promise<IBook> {
    const book = await getBook(userId, bookId);
    book.status = status;
    return book.save();
}
