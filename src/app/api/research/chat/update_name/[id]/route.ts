import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ResearchChat from '@/models/ResearchChat';
import { getAccessContext, ownerId } from '@/lib/access-control';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await getAccessContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name } = body;

        await dbConnect();

        // Owner-scoped update; write to the real `name` field (the schema has no
        // `title` field, so the previous `{ title: name }` silently no-op'd).
        const chat = await ResearchChat.findOneAndUpdate(
            { _id: id, userId: ownerId(ctx.user) },
            { name },
            { new: true }
        );

        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        return NextResponse.json(chat);

    } catch (error) {
        console.error('Error updating chat name:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
