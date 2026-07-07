import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));

const {
    mockBookCreate,
    mockBookFind,
    mockBookFindOne,
    mockBookFindOneAndUpdate,
    mockChapterFind,
    mockChapterFindOne,
    mockChapterCreate,
    mockChapterDeleteMany,
} = vi.hoisted(() => ({
    mockBookCreate: vi.fn(),
    mockBookFind: vi.fn(),
    mockBookFindOne: vi.fn(),
    mockBookFindOneAndUpdate: vi.fn(),
    mockChapterFind: vi.fn(),
    mockChapterFindOne: vi.fn(),
    mockChapterCreate: vi.fn(),
    mockChapterDeleteMany: vi.fn(),
}));

vi.mock('@/models/Book', () => ({
    default: {
        create: mockBookCreate,
        find: mockBookFind,
        findOne: mockBookFindOne,
        findOneAndUpdate: mockBookFindOneAndUpdate,
    },
    BOOK_KINDS: ['fiction', 'nonfiction'],
}));

vi.mock('@/models/Chapter', () => ({
    default: {
        find: mockChapterFind,
        findOne: mockChapterFindOne,
        create: mockChapterCreate,
        deleteMany: mockChapterDeleteMany,
    },
    CHAPTER_STATUSES: ['accepted', 'failed'],
}));

import {
    parseCreateBook,
    createBook,
    listBooks,
    getBook,
    claimBookForRun,
    resetBookToDraft,
    getAcceptedChapters,
    saveChapterRecord,
    setBookStatus,
    BookServiceError,
    MAX_TITLE_LEN,
} from './book-service';

const OUTLINE = '# Novel\n\n## Chapter 1\n- beat a\n\n## Chapter 2\n- beat b\n';

beforeEach(() => {
    vi.clearAllMocks();
    mockBookCreate.mockImplementation(async (doc) => ({ _id: 'b1', ...doc }));
    mockChapterCreate.mockImplementation(async (doc) => ({ _id: 'c1', ...doc }));
});

describe('parseCreateBook (pure validation)', () => {
    it('accepts a minimal valid payload', () => {
        const out = parseCreateBook({ title: 'My Book', document: OUTLINE });
        expect(out.title).toBe('My Book');
        expect(out.document).toBe(OUTLINE);
        expect(out.kindOverride).toBeUndefined();
    });

    it('rejects a non-object body', () => {
        expect(() => parseCreateBook(null)).toThrow(BookServiceError);
        expect(() => parseCreateBook('x')).toThrow(/JSON object/);
    });

    it('requires a non-empty title', () => {
        expect(() => parseCreateBook({ document: OUTLINE })).toThrow(/title/);
        expect(() => parseCreateBook({ title: '   ', document: OUTLINE })).toThrow(/title/);
    });

    it('requires a non-empty document', () => {
        expect(() => parseCreateBook({ title: 'T' })).toThrow(/document/);
        expect(() => parseCreateBook({ title: 'T', document: '  ' })).toThrow(/document/);
    });

    it('bounds the title length', () => {
        const long = 'x'.repeat(MAX_TITLE_LEN + 1);
        expect(() => parseCreateBook({ title: long, document: OUTLINE })).toThrow(/exceeds/);
    });

    it('accepts a valid kindOverride and rejects an invalid one', () => {
        expect(parseCreateBook({ title: 'T', document: OUTLINE, kindOverride: 'nonfiction' }).kindOverride).toBe(
            'nonfiction'
        );
        expect(() =>
            parseCreateBook({ title: 'T', document: OUTLINE, kindOverride: 'poetry' })
        ).toThrow(/kindOverride/);
    });

    it('normalizes optional subtitle/author, dropping empties', () => {
        const out = parseCreateBook({
            title: 'T',
            document: OUTLINE,
            subtitle: '  Sub  ',
            author: '',
        });
        expect(out.subtitle).toBe('Sub');
        expect(out.author).toBeUndefined();
    });
});

describe('createBook', () => {
    it('ingests the document and persists a Book with the chapter plan', async () => {
        const book = await createBook('user-1', { title: 'Novel', document: OUTLINE });
        expect(mockBookCreate).toHaveBeenCalledTimes(1);
        const arg = mockBookCreate.mock.calls[0][0];
        expect(arg.userId).toBe('user-1');
        expect(arg.status).toBe('draft');
        expect(arg.kind).toBe('fiction');
        expect(arg.plan.map((p: { intent: string }) => p.intent)).toEqual(['Chapter 1', 'Chapter 2']);
        expect(book._id).toBe('b1');
    });

    it('propagates ingest errors for a bad document (no headings)', async () => {
        await expect(
            createBook('user-1', { title: 'T', document: 'just prose no headings' })
        ).rejects.toThrow(/no headings/i);
        expect(mockBookCreate).not.toHaveBeenCalled();
    });

    it('requires a userId', async () => {
        await expect(createBook('', { title: 'T', document: OUTLINE })).rejects.toThrow(BookServiceError);
    });
});

describe('listBooks', () => {
    it('returns the owner\'s books newest-first', async () => {
        const sort = vi.fn().mockResolvedValue([{ _id: 'b1' }]);
        mockBookFind.mockReturnValue({ sort });
        const res = await listBooks('user-1');
        expect(mockBookFind).toHaveBeenCalledWith({ userId: 'user-1' });
        expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
        expect(res).toEqual([{ _id: 'b1' }]);
    });
});

describe('getBook', () => {
    it('returns an owned book', async () => {
        mockBookFindOne.mockResolvedValue({ _id: 'b1', userId: 'user-1' });
        const b = await getBook('user-1', 'b1');
        expect(mockBookFindOne).toHaveBeenCalledWith({ _id: 'b1', userId: 'user-1' });
        expect(b._id).toBe('b1');
    });

    it('throws a not-found error when missing', async () => {
        mockBookFindOne.mockResolvedValue(null);
        await expect(getBook('user-1', 'nope')).rejects.toMatchObject({ notFound: true });
    });
});

describe('claimBookForRun (atomic draft → authoring)', () => {
    it('claims a draft book and returns the updated (authoring) book', async () => {
        mockBookFindOneAndUpdate.mockResolvedValue({ _id: 'b1', userId: 'user-1', status: 'authoring' });
        const b = await claimBookForRun('user-1', 'b1');
        // The precondition (status: 'draft') is part of the atomic filter — this is
        // the single gate, not a prior read.
        expect(mockBookFindOneAndUpdate).toHaveBeenCalledWith(
            { _id: 'b1', userId: 'user-1', status: 'draft' },
            { $set: { status: 'authoring' } },
            { new: true }
        );
        expect(b.status).toBe('authoring');
        // A successful claim does not fall through to the disambiguation read.
        expect(mockBookFindOne).not.toHaveBeenCalled();
    });

    it('throws not-found (404-class) when no such owned book exists', async () => {
        mockBookFindOneAndUpdate.mockResolvedValue(null);
        mockBookFindOne.mockResolvedValue(null);
        await expect(claimBookForRun('user-1', 'nope')).rejects.toMatchObject({ notFound: true });
    });

    it('throws non-notFound (400-class) when the book exists but is not draft', async () => {
        mockBookFindOneAndUpdate.mockResolvedValue(null);
        mockBookFindOne.mockResolvedValue({ _id: 'b1', userId: 'user-1', status: 'authoring' });
        await expect(claimBookForRun('user-1', 'b1')).rejects.toMatchObject({ notFound: false });
        await expect(claimBookForRun('user-1', 'b1')).rejects.toThrow(/cannot be started|reset it to draft/i);
    });

    it('requires userId and bookId', async () => {
        await expect(claimBookForRun('', 'b1')).rejects.toThrow(BookServiceError);
        await expect(claimBookForRun('user-1', '')).rejects.toThrow(BookServiceError);
    });
});

describe('resetBookToDraft (re-arm: clear chapters → draft)', () => {
    it('deletes the book\'s chapters THEN sets draft, returning the updated book', async () => {
        mockBookFindOne.mockResolvedValue({ _id: 'b1', userId: 'user-1', status: 'failed' });
        mockChapterDeleteMany.mockResolvedValue({ deletedCount: 2 });
        mockBookFindOneAndUpdate.mockResolvedValue({ _id: 'b1', userId: 'user-1', status: 'draft' });

        const b = await resetBookToDraft('user-1', 'b1');

        // Chapters are cleared owner-scoped so a re-run starts clean.
        expect(mockChapterDeleteMany).toHaveBeenCalledWith({ bookId: 'b1', userId: 'user-1' });
        // Status flips to draft via an owner-scoped conditional write.
        expect(mockBookFindOneAndUpdate).toHaveBeenCalledWith(
            { _id: 'b1', userId: 'user-1' },
            { $set: { status: 'draft' } },
            { new: true }
        );
        expect(b.status).toBe('draft');
        // Delete must precede the status flip (crash-safe ordering).
        expect(mockChapterDeleteMany.mock.invocationCallOrder[0]).toBeLessThan(
            mockBookFindOneAndUpdate.mock.invocationCallOrder[0]
        );
    });

    it('throws not-found (404-class) for a missing/foreign book, deleting nothing', async () => {
        mockBookFindOne.mockResolvedValue(null);
        await expect(resetBookToDraft('user-1', 'nope')).rejects.toMatchObject({ notFound: true });
        // Ownership check fails before any mutation.
        expect(mockChapterDeleteMany).not.toHaveBeenCalled();
        expect(mockBookFindOneAndUpdate).not.toHaveBeenCalled();
    });

    it('requires userId and bookId', async () => {
        await expect(resetBookToDraft('', 'b1')).rejects.toThrow(BookServiceError);
        await expect(resetBookToDraft('user-1', '')).rejects.toThrow(BookServiceError);
    });
});

describe('getAcceptedChapters', () => {
    it('queries accepted chapters in reading order', async () => {
        const sort = vi.fn().mockResolvedValue([{ index: 0 }, { index: 1 }]);
        mockChapterFind.mockReturnValue({ sort });
        const res = await getAcceptedChapters('user-1', 'b1');
        expect(mockChapterFind).toHaveBeenCalledWith({
            userId: 'user-1',
            bookId: 'b1',
            status: 'accepted',
        });
        expect(sort).toHaveBeenCalledWith({ index: 1 });
        expect(res).toHaveLength(2);
    });
});

describe('saveChapterRecord', () => {
    const chapter = {
        index: 0,
        intent: 'Ch1',
        content: 'text',
        status: 'accepted' as const,
        attempts: 1,
    };

    it('creates a new chapter when none exists', async () => {
        mockChapterFindOne.mockResolvedValue(null);
        await saveChapterRecord('user-1', 'b1', chapter);
        expect(mockChapterCreate).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 'user-1', bookId: 'b1', index: 0, status: 'accepted' })
        );
    });

    it('updates an existing chapter (upsert on bookId,index)', async () => {
        const save = vi.fn().mockResolvedValue({});
        mockChapterFindOne.mockResolvedValue({ save, content: 'old', attempts: 1 });
        await saveChapterRecord('user-1', 'b1', { ...chapter, content: 'new', attempts: 3 });
        expect(mockChapterCreate).not.toHaveBeenCalled();
        expect(save).toHaveBeenCalled();
    });

    it('rejects an invalid status', async () => {
        await expect(
            saveChapterRecord('user-1', 'b1', { ...chapter, status: 'bogus' as never })
        ).rejects.toThrow(/Invalid chapter status/);
    });
});

describe('setBookStatus', () => {
    it('loads the owned book and saves the new status', async () => {
        const save = vi.fn().mockResolvedValue({ status: 'complete' });
        mockBookFindOne.mockResolvedValue({ _id: 'b1', userId: 'user-1', status: 'draft', save });
        await setBookStatus('user-1', 'b1', 'complete');
        expect(save).toHaveBeenCalled();
    });

    it('propagates not-found from getBook', async () => {
        mockBookFindOne.mockResolvedValue(null);
        await expect(setBookStatus('user-1', 'nope', 'complete')).rejects.toMatchObject({
            notFound: true,
        });
    });
});
