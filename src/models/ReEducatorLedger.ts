import mongoose, { Document } from 'mongoose';
import type { AccessibleRecordModel } from '@casl/mongoose';

/**
 * ReEducatorLedger — the MongoDB mirror for one Re-educator run.
 *
 * The engine (src/lib/re-educator) produces an append-only, hash-chained ledger
 * per run (RE-EDUCATOR-SPEC.md §5). The chain itself is the source of truth and
 * is self-verifying via `verifyChain(ledger)`. This collection stores the ledger
 * blob so a run is durable and auditable after the response is sent — a run
 * isn't real until it's persisted.
 *
 * We store the ledger sub-documents loosely (Mixed) rather than re-declaring the
 * full LedgerEntry shape in Mongoose: the hash chain — not the schema — is what
 * guarantees integrity, and mirroring the TS types field-by-field here would
 * only create a second place to keep in sync. The verifiable unit is `ledger`.
 *
 * See: src/lib/re-educator/ledger.ts, src/lib/re-educator/service.ts
 */
export interface IReEducatorLedger extends Document {
    /** Owner — enables CASL accessibleBy() ownership scoping (IDOR protection). */
    userId: string;
    /** Which mode produced this run: nudge | review | auto | paraphrase. */
    mode: string;
    /** The verify profile that drove the run (e.g. 'standard' | 'paraphrase'). */
    profile: string;
    /** The full hash-chained ledger blob (meta + entries). Self-verifying. */
    ledger: unknown;
    /** Genesis + head hashes, denormalised for cheap listing/lookup. */
    genesisHash: string;
    headHash: string;
    /** Number of committed entries (0 for a Nudge, which writes no chain). */
    entryCount: number;
    /** WRITING.md version tag the run was evaluated against ('none' until #3). */
    writingMdVersion: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReEducatorLedgerSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        mode: { type: String, required: true },
        profile: { type: String, required: true, default: 'standard' },
        // Mixed: the ledger's integrity comes from its hash chain, not Mongoose
        // validation. Re-declaring every entry field would duplicate the TS types.
        ledger: { type: mongoose.Schema.Types.Mixed, required: true },
        genesisHash: { type: String, required: true },
        headHash: { type: String, required: true },
        entryCount: { type: Number, required: true, default: 0 },
        writingMdVersion: { type: String, default: 'none' },
    },
    { timestamps: true }
);

// Most common query: a user's runs, newest first.
ReEducatorLedgerSchema.index({ userId: 1, createdAt: -1 });

// Typed as AccessibleRecordModel so `.accessibleBy(ability)` (from the CASL
// accessibleRecordsPlugin registered in dbConnect) type-checks.
const ReEducatorLedger =
    (mongoose.models.ReEducatorLedger as AccessibleRecordModel<IReEducatorLedger>) ||
    mongoose.model<IReEducatorLedger, AccessibleRecordModel<IReEducatorLedger>>(
        'ReEducatorLedger',
        ReEducatorLedgerSchema
    );

export default ReEducatorLedger;
