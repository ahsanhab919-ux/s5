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
import ChapterAttempt, { IChapterAttempt } from '@/models/ChapterAttempt';
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

/**
 * Reset an owned book back to `draft` so it can be re-run after a
 * `failed`/`complete`/stuck-`authoring` state. The strict claim in
 * `claimBookForRun` only accepts `draft`, so this is the human-in-the-loop
 * counterpart that re-arms a book — deliberately explicit, not a side effect of
 * hitting run again.
 *
 * Order matters: delete the book's Chapter docs FIRST, then flip status to
 * `draft`. A crash between the two leaves a non-draft book with no chapters
 * (still not runnable, safe), never a `draft` book with stale accepted chapters
 * (which a re-run would treat as already-done). Owner-scoped throughout.
 */
export async function resetBookToDraft(userId: string, bookId: string): Promise<IBook> {
    if (!userId) throw new BookServiceError('resetBookToDraft: userId is required');
    if (!bookId) throw new BookServiceError('resetBookToDraft: bookId is required');
    await dbConnect();
    // Confirm ownership up front so we never delete chapters for a book the
    // caller doesn't own (the deleteMany is userId-scoped too, but this keeps
    // the 404 contract crisp before any mutation).
    const existing = await Book.findOne({ _id: bookId, userId });
    if (!existing) throw new BookServiceError('Book not found.', true);

    // Clear prior chapters so a re-run starts clean, THEN flip to draft.
    await Chapter.deleteMany({ bookId, userId });
    const reset = await Book.findOneAndUpdate(
        { _id: bookId, userId },
        { $set: { status: 'draft' } },
        { new: true }
    );
    if (!reset) throw new BookServiceError('Book not found.', true);
    return reset;
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

/** Max attempt-history rows returned by a single list call (keeps responses sane). */
export const MAX_CHAPTER_ATTEMPTS = 200;

/** One recorded try's gate outcome (observability; not the source of truth). */
export interface ChapterAttemptInput {
    index: number;
    attempt: number;
    status: ChapterStatusValue;
    gateIssues?: string[];
    tokensUsed?: number;
    model?: string;
}

/**
 * Record one chapter try's gate outcome for run history. Observability only — the
 * accepted chapter text lives in Chapter. Owner-scoped. Never stores draft text.
 * The provider wraps this fail-soft: a rejected write must not abort authoring.
 */
export async function recordChapterAttempt(
    userId: string,
    bookId: string,
    attempt: ChapterAttemptInput
): Promise<IChapterAttempt> {
    if (!userId) throw new BookServiceError('recordChapterAttempt: userId is required');
    if (!bookId) throw new BookServiceError('recordChapterAttempt: bookId is required');
    if (!(CHAPTER_STATUSES as readonly string[]).includes(attempt.status)) {
        throw new BookServiceError(`Invalid chapter status "${attempt.status}".`);
    }
    await dbConnect();
    return ChapterAttempt.create({
        userId,
        bookId,
        index: attempt.index,
        attempt: attempt.attempt,
        status: attempt.status,
        gateIssues: attempt.gateIssues ?? [],
        tokensUsed: attempt.tokensUsed,
        // Domain field `model` maps to the `modelHandle` column (see ChapterAttempt).
        modelHandle: attempt.model,
    });
}

/** List an owned book's chapter-attempt history, newest first (bounded). */
export async function listChapterAttempts(
    userId: string,
    bookId: string
): Promise<IChapterAttempt[]> {
    if (!userId) throw new BookServiceError('listChapterAttempts: userId is required');
    if (!bookId) throw new BookServiceError('listChapterAttempts: bookId is required');
    await dbConnect();
    return ChapterAttempt.find({ userId, bookId })
        .sort({ createdAt: -1 })
        .limit(MAX_CHAPTER_ATTEMPTS);
}

/** One chapter's latest known state, derived from its attempt history. */
export interface ChapterProgressItem {
    index: number;
    status: ChapterStatusValue;
    /** The (1-based) try number of the latest attempt for this index. */
    attempt: number;
}

/** A compact, prose-free progress summary for a book run (status-poll shape). */
export interface ChapterProgress {
    /** Chapters planned (plan length), or distinct indices touched if no plan. */
    total: number;
    /** Distinct chapter indices whose latest attempt was accepted. */
    accepted: number;
    /** Distinct chapter indices whose latest attempt failed. */
    failed: number;
    /** Highest chapter index with any recorded attempt, or null if none. */
    lastIndex: number | null;
    /** Latest state per touched index, ascending. NO prose, NO gate issues. */
    perIndex: ChapterProgressItem[];
}

/**
 * Compact, owner-scoped progress for a book run, derived from its ChapterAttempt
 * history (the source Wave 2 already persists — this only READS it). For each
 * touched index we keep the LATEST attempt (highest attempt number, newest on a
 * tie) and its accepted/failed status. Bounded by MAX_CHAPTER_ATTEMPTS like
 * listChapterAttempts. Deliberately withholds gate-issue detail and all prose so
 * the status endpoint stays a lightweight poll. Returns null when the book is not
 * found/owned so the route can 404.
 */
export async function getChapterProgress(
    userId: string,
    bookId: string
): Promise<ChapterProgress | null> {
    if (!userId) throw new BookServiceError('getChapterProgress: userId is required');
    if (!bookId) throw new BookServiceError('getChapterProgress: bookId is required');
    await dbConnect();
    const book = await Book.findOne({ _id: bookId, userId });
    if (!book) return null;

    const attempts = await ChapterAttempt.find({ userId, bookId })
        .sort({ createdAt: -1 })
        .limit(MAX_CHAPTER_ATTEMPTS);

    // Reduce to the latest attempt per index. Rows arrive newest-first, so a tie
    // on attempt number keeps the first (newest) seen; a strictly higher attempt
    // number always wins.
    const latest = new Map<number, ChapterProgressItem>();
    for (const a of attempts) {
        const seen = latest.get(a.index);
        if (!seen || a.attempt > seen.attempt) {
            latest.set(a.index, { index: a.index, status: a.status, attempt: a.attempt });
        }
    }

    const perIndex = Array.from(latest.values()).sort((x, y) => x.index - y.index);
    const accepted = perIndex.filter((p) => p.status === 'accepted').length;
    const failed = perIndex.filter((p) => p.status === 'failed').length;
    const lastIndex = perIndex.length > 0 ? perIndex[perIndex.length - 1].index : null;
    const total = Array.isArray(book.plan) && book.plan.length > 0 ? book.plan.length : perIndex.length;

    return { total, accepted, failed, lastIndex, perIndex };
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
