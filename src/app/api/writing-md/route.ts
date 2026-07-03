import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getOrCreateWritingProfile } from '@/lib/writingProfile';
import { getWritingMd, saveWritingMd, WRITING_MD_BLOCK_LIMIT } from '@/lib/letta';
import WritingProfile from '@/models/WritingProfile';

/**
 * GET /api/writing-md
 * Return the current user's WRITING.md (creating the Letta agent on first use).
 */
export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = String(user._id || user.id);
        const profile = await getOrCreateWritingProfile(userId);
        const result = await getWritingMd(profile.lettaAgentId);

        return NextResponse.json({
            content: result.content,
            limit: result.limit,
            agentId: profile.lettaAgentId,
            updatedAt: profile.lastSyncedAt,
        });
    } catch (error) {
        console.error('Error reading WRITING.md:', error);
        return NextResponse.json(
            { error: 'Failed to read WRITING.md' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/writing-md
 * Save (overwrite) the current user's WRITING.md content.
 * Body: { content: string }
 */
export async function PATCH(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const content = typeof body?.content === 'string' ? body.content : null;

        if (content === null) {
            return NextResponse.json(
                { error: 'Body must include a string "content" field.' },
                { status: 400 }
            );
        }

        if (content.length > WRITING_MD_BLOCK_LIMIT) {
            return NextResponse.json(
                {
                    error: `WRITING.md exceeds the ${WRITING_MD_BLOCK_LIMIT}-character limit.`,
                    limit: WRITING_MD_BLOCK_LIMIT,
                    length: content.length,
                },
                { status: 413 }
            );
        }

        const userId = String(user._id || user.id);
        const profile = await getOrCreateWritingProfile(userId);
        const result = await saveWritingMd(profile.lettaAgentId, content);

        // Update the local metadata mirror.
        await WritingProfile.updateOne(
            { userId },
            { lastContentLength: content.length, lastSyncedAt: new Date() }
        );

        return NextResponse.json({
            content: result.content,
            limit: result.limit,
            agentId: profile.lettaAgentId,
            updatedAt: new Date(),
        });
    } catch (error) {
        console.error('Error saving WRITING.md:', error);
        return NextResponse.json(
            { error: 'Failed to save WRITING.md' },
            { status: 500 }
        );
    }
}
