import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SheetSession from '@/models/SheetSession';
import { getAccessContext } from '@/lib/access-control';

export async function GET(request: Request) {
    try {
        const ctx = await getAccessContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        // Ownership filter is injected by CASL at the query layer, so only the
        // authenticated user's sessions are ever returned (prevents IDOR).
        const sessions = await SheetSession.accessibleBy(ctx.ability, 'read').sort({
            updatedAt: -1,
        });
        return NextResponse.json(sessions);
    } catch (error) {
        console.error('Error fetching sheet sessions:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
