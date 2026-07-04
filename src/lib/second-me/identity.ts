/**
 * Server-side helper: get-or-create a user's Second Me identity.
 *
 * A Second Me reuses the user's EXISTING Letta agent (from their WritingProfile)
 * and adds a verifiable identity row on top. This helper is idempotent: it
 * returns the existing identity if one exists, otherwise it provisions one —
 * generating an Ed25519 keypair and persisting only the PUBLIC half.
 *
 * Boundary (Step 1): this makes a Second Me *addressable*, not *acting*. Private
 * key custody + signing are Step 4 / Phase 3. See SECOND-ME-STEP1-SCOPE.md.
 */
import { generateKeyPairSync, createHash } from 'node:crypto';
import dbConnect from '@/lib/dbConnect';
import SecondMeIdentity, {
    ISecondMeIdentity,
} from '@/models/SecondMeIdentity';
import WritingProfile from '@/models/WritingProfile';

/** Generate an Ed25519 identity: base64 SPKI public key + short stable fingerprint. */
export function generatePublicIdentity(): { publicKey: string; keyId: string } {
    const { publicKey } = generateKeyPairSync('ed25519');
    const spki = publicKey.export({ type: 'spki', format: 'der' });
    return {
        publicKey: spki.toString('base64'),
        // First 16 hex chars of sha256(spki) — stable across restarts, collision-safe
        // enough to identify a key in logs and the ledger.
        keyId: createHash('sha256').update(spki).digest('hex').slice(0, 16),
    };
}

/**
 * Find-or-create the Second Me identity for a user. Idempotent.
 *
 * Reuses the SAME Letta agent as the user's WritingProfile (Twin and Second Me
 * share one agent / one WRITING.md). If the user has no WritingProfile yet, this
 * throws — provisioning an agent is the existing Phase 1 path (getOrCreate-
 * WritingProfile), not this step's job.
 */
export async function ensureSecondMeIdentity(
    userId: string
): Promise<ISecondMeIdentity> {
    if (!userId) {
        throw new Error('ensureSecondMeIdentity: userId is required');
    }

    await dbConnect();

    const existing = await SecondMeIdentity.findOne({ userId });
    if (existing) return existing;

    // Reuse the user's existing Letta agent — do NOT create a new one here.
    const profile = await WritingProfile.findOne({ userId });
    if (!profile) {
        throw new Error(
            `ensureSecondMeIdentity: user ${userId} has no WritingProfile / Letta agent; ` +
                'create the agent first (getOrCreateWritingProfile) before establishing a Second Me identity'
        );
    }

    const { publicKey, keyId } = generatePublicIdentity();

    return SecondMeIdentity.create({
        userId,
        lettaAgentId: profile.lettaAgentId,
        publicKey,
        keyId,
        revoked: false,
    });
}
