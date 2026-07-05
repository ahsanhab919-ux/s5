# Book Authoring — API & persistence surface (Track D)

Book Authoring turns an uploaded outline or partial manuscript into a persisted
book project that a chapter-authoring loop can drive to completion. This document
covers the **wired, reachable surface**: the MongoDB models, the service layer,
and the REST routes. It also states — deliberately and explicitly — the one thing
that is **not** wired yet (the run-loop endpoint) and why.

The design rule throughout is the one that governs the rest of this codebase:
**pure, unit-testable logic lives in `src/lib/book/`; the HTTP routes are thin
shells** (auth → parse → service → JSON). Every route mirrors the established
`/api/re-educator` template. No business logic lives in a route handler.

## Files

| File | Purpose |
|---|---|
| `src/models/Book.ts` | Mongo model for a book project (metadata + chapter `plan[]` + status) |
| `src/models/Chapter.ts` | Mongo model for a persisted chapter (compound-unique on `bookId,index`) |
| `src/lib/book/ingest.ts` | Pure: classify + split an uploaded document into a chapter plan (D1) |
| `src/lib/book/bible.ts` | Story-bible core-memory block on the user's writing agent (D2) |
| `src/lib/book/author.ts` | Pure chapter-loop orchestrator with injected deps (D3) |
| `src/lib/book/gate.ts` | Re-Educator review gate used by the loop (D3) |
| `src/lib/book/export.ts` | Pure: assemble accepted chapters into one `.md` manuscript (D5) |
| `src/lib/book/book-service.ts` | Service layer: parse + persist + retrieve (create/list/get/chapters/status) |
| `src/app/api/book/route.ts` | `POST` create / `GET` list |
| `src/app/api/book/[id]/route.ts` | `GET` snapshot (book + accepted chapters) |
| `src/app/api/book/[id]/export/route.ts` | `GET` assembled manuscript |

## Data model

A **Book** is one authoring project owned by a user. Its `plan[]` is the chapter
outline produced at ingest time; chapter *text* is written later by the loop and
stored as separate **Chapter** records.

**Book** (`src/models/Book.ts`)

| Field | Type | Notes |
|---|---|---|
| `userId` | string | Indexed, **not** unique — a user may own many books |
| `title` | string | Required |
| `subtitle` | string? | Optional |
| `author` | string? | Optional |
| `kind` | enum | `BOOK_KINDS = ['fiction', 'nonfiction']`, default `fiction` |
| `sourceKind` | enum | `BOOK_SOURCE_KINDS = ['outline', 'partial']`, default `outline` |
| `status` | enum | `BOOK_STATUSES = ['draft', 'authoring', 'complete', 'failed']`, default `draft` |
| `plan[]` | subdoc | `{ index, intent, beats }` (`_id: false`) — the chapter outline |

`kind` and `sourceKind` are **derived by ingest**, not supplied by the client
(the client may only *override* `kind` via `kindOverride`). `status` starts at
`draft` and is advanced by the loop, not by the create call.

**Chapter** (`src/models/Chapter.ts`)

| Field | Type | Notes |
|---|---|---|
| `userId` | string | Indexed |
| `bookId` | string | Indexed |
| `index` | number | Compound-unique with `bookId` — one record per `(book, index)` |
| `intent` | string | The plan intent this chapter fulfils |
| `content` | string | The accepted chapter text |
| `status` | enum | `CHAPTER_STATUSES = ['accepted', 'failed']` |
| `attempts` | number | How many generate/gate cycles it took |

Only **accepted** chapters are ever returned by the snapshot and export routes —
a `failed` chapter is recorded for auditability but never shipped.

## Endpoints

All routes are auth-guarded via `getAuthenticatedUser()`; an unauthenticated
request returns **401**. All ownership is enforced in the service layer (every
query is scoped to `userId`), so a book that does not exist *or* is not yours is
indistinguishable: both return **404**.

### `POST /api/book` — create a book

Ingests the uploaded document into a chapter plan and persists a `Book`
(`status: draft`). Chapter text is **not** written here.

Request body:

```json
{
  "title": "The Salt Road",
  "subtitle": "Book One",
  "author": "A. Author",
  "kindOverride": "fiction",
  "document": "# Chapter 1\n..."
}
```

- `title` — **required**, non-empty, ≤ `MAX_TITLE_LEN` (300 chars). `subtitle`
  and `author` are optional and bounded by the same limit.
- `document` — **required**, non-empty. The raw outline/manuscript to ingest.
- `kindOverride` — optional; if present must be one of `BOOK_KINDS`. When omitted,
  `kind` is inferred by ingest (citations/references → `nonfiction`, else
  `fiction`).

Response — **201**:

```json
{ "book": { "_id": "...", "title": "The Salt Road", "kind": "fiction",
            "sourceKind": "outline", "status": "draft", "plan": [ ... ] } }
```

### `GET /api/book` — list your books

Returns the authenticated user's books, newest first.

Response — **200**: `{ "books": [ ... ] }`

### `GET /api/book/[id]` — snapshot one book

Returns one owned book plus the chapters accepted so far, in reading order.

Response — **200**: `{ "book": { ... }, "chapters": [ ... ] }`

### `GET /api/book/[id]/export` — assemble the manuscript

Assembles the book's **accepted** chapters into a single markdown manuscript
(title page → optional TOC → chapters in ascending index order → back matter →
attribution colophon). Markdown only — no PDF/ePub in v1 (see non-goals).

Response — **200**:

```json
{ "filename": "the-salt-road.md", "markdown": "# The Salt Road\n...",
  "chapterCount": 12, "wordCount": 48211, "charCount": 291044 }
```

`assembleManuscript` is **fail-closed**: it refuses to export a book with no
accepted chapters, or one with gapped/blank/duplicate indices. That refusal
surfaces here as a **400** — you cannot download an unfinished book. This is the
export side of the "no silent shipping" rule.

## Error semantics

Routes translate domain errors to HTTP status; unknown errors are logged and
returned as a generic **500** (never leaking internals).

| Condition | Status | Source |
|---|---|---|
| Not authenticated | 401 | route (`getAuthenticatedUser`) |
| Malformed JSON body (`POST`) | 400 | route (`request.json()` catch) |
| Invalid input (missing/empty title or document, bad `kindOverride`, over length) | 400 | `BookServiceError` (`notFound = false`) |
| Un-ingestable document | 400 | `BookIngestError` |
| Book not found / not owned | 404 | `BookServiceError` (`notFound = true`) |
| Nothing exportable yet (no accepted chapters, gaps) | 400 | `BookExportError` |
| Unexpected failure | 500 | generic fallback |

## Deliberately deferred: the run-loop endpoint

There is **no `POST /api/book/[id]/run`** (or equivalent) that kicks off chapter
authoring over HTTP — and this is intentional, not an oversight.

The orchestrator `runChapterLoop` (`src/lib/book/author.ts`) is a **pure function
with injected dependencies**: `generateChapter`, `verifyChapter`, `readBible`,
`saveChapter`, `updateBible`, `writingMd`. Two of those — `generateChapter` and
`verifyChapter` — require a **real model provider with a real (paid) runtime**.
The codebase does not yet have a measured, cost-modelled provider for that work.

Wiring a run endpoint now would mean stubbing a paid runtime with no cost model —
the exact trap that keeps Track D's non-fiction path (D4) blocked on the Job
Router / GPU pilot. Rather than ship a route that either fakes generation or
silently depends on unmeasured infra, the callable surface stops cleanly at:

- **create** (ingest → plan → persist),
- **retrieve** (list / snapshot),
- **export** (assemble accepted chapters).

The orchestrator is fully built and unit-tested against injected fakes, so the
run endpoint becomes a thin shell the moment a provider interface exists. That
work belongs with D4 / a BYOK provider and is tracked there.

## Non-goals (v1)

Per the Book Authoring spec §7: no PDF or ePub export, and no
publishing-metadata (ISBN, distribution, etc.). Export is markdown only. These
are explicitly out of scope for the first cut and are not blockers on the wired
surface above.

## Testing

Every layer is unit-tested with DB and model calls mocked (`vi.mock`), so the
suite runs with no database and no network:

- `src/lib/book/*.test.ts` — ingest (19), bible (19), author (15), export (19)
- `src/lib/book/book-service.test.ts` — parse + persistence (19)
- `src/app/api/book/**/route.test.ts` — the three routes (auth, happy path,
  each error mapping)

Route tests mock `next/server` so `NextResponse.json(data, options)` returns a
plain `{ data, options, status }` at runtime; response variables are typed `any`
in the tests to bypass the real `NextResponse<...>` union (mirroring
`src/app/api/second-me/keys/route.test.ts`).
