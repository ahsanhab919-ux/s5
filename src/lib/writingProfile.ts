/**
 * Server-side helper: get-or-create a user's WRITING.md profile + Letta agent.
 *
 * Keeps the "one agent per user" invariant and lazily provisions a Letta agent
 * (with the default WRITING.md) the first time a user opens the feature.
 */
import dbConnect from '@/lib/dbConnect';
import WritingProfile, { IWritingProfile } from '@/models/WritingProfile';
import {
    createWritingAgent,
    DEFAULT_WRITING_MD,
    WRITING_MD_BLOCK_LABEL,
} from '@/lib/letta';

export async function getOrCreateWritingProfile(
    userId: string
): Promise<IWritingProfile> {
    await dbConnect();

    let profile = await WritingProfile.findOne({ userId });
    if (profile) return profile;

    // First time: provision a Letta agent that owns this user's WRITING.md.
    const agentId = await createWritingAgent(userId, DEFAULT_WRITING_MD);

    profile = await WritingProfile.create({
        userId,
        lettaAgentId: agentId,
        blockLabel: WRITING_MD_BLOCK_LABEL,
        lastContentLength: DEFAULT_WRITING_MD.length,
        lastSyncedAt: new Date(),
    });

    return profile;
}
