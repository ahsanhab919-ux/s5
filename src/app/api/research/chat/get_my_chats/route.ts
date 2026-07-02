import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ResearchChat from '@/models/ResearchChat';
import { getAuthenticatedUser } from '@/lib/server-auth';

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const chats = await ResearchChat.find({ userId: user._id || user.id })
            .select('-messages') // Optimization: Exclude messages to reduce payload size
            .sort({ updatedAt: -1 })
            .lean(); // Optimization: Return plain JS objects instead of Mongoose documents
        return NextResponse.json(chats);
    } catch (error) {
        console.error('Error fetching research chats:', error);
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }
}
