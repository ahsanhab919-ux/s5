import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ResearchChat from '@/models/ResearchChat';
import { getAccessContext, ownerId } from '@/lib/access-control';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await getAccessContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        // Owner-scoped delete: a user can only delete their own chat (prevents IDOR).
        const chat = await ResearchChat.findOneAndDelete({
            _id: id,
            userId: ownerId(ctx.user),
        });

        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting research chat:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
