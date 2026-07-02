import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SheetSession from '@/models/SheetSession';
import SheetConversation from '@/models/SheetConversation';
import { getAccessContext, ownerId } from '@/lib/access-control';

export async function POST(request: Request) {
    try {
        const ctx = await getAccessContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const uid = ownerId(ctx.user);

        const { prompt, chat: chatId } = await request.json();
        await dbConnect();

        // 1. Identify or Create Session (scoped to the authenticated owner)
        let session;
        if (chatId) {
            try {
                // Only load the session if it belongs to this user (prevents IDOR).
                session = await SheetSession.findOne({ _id: chatId, userId: uid });
            } catch (e) { }
        }

        if (!session) {
            session = await SheetSession.create({
                userId: uid,
                title: prompt.substring(0, 30) || 'New Spreadsheet',
            });
        } else {
            // Update updated_at of session
            session.title = prompt.substring(0, 30); // Optionally update title logic
            await session.save();
        }

        // 2. Create Conversation Turn
        const conversation = await SheetConversation.create({
            sessionId: session._id,
            prompt,
            events: [{ step: 'init', message: 'Request received', timestamp: new Date() }],
            status: 'generating'
        });

        // 3. Stream Response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const sendJSON = (data: any) => {
                    controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
                };

                // Send session info immediately if it was new (or always, for consistency)
                // Frontend might expect events.

                try {
                    // Send initial session ID if the client might need it? 
                    // Usually client waits for the full response or updates URL based on something.
                    // But strict SSE usually sends events.

                    sendJSON({ data: { message: "Analyzing your request...", step: "context_analysis", chatId: session._id } });
                    await new Promise(r => setTimeout(r, 600));

                    sendJSON({ data: { message: "Generating spreadsheet structure...", step: "llm_processing" } });
                    await new Promise(r => setTimeout(r, 1000));

                    // Mock Data
                    const mockRows = {
                        "0": { "0": { "value": "Item" }, "1": { "value": "Cost" }, "2": { "value": "Quantity" } },
                        "1": { "0": { "value": "Banana" }, "1": { "value": "$0.50" }, "2": { "value": "1000" } },
                        "2": { "0": { "value": "Apple" }, "1": { "value": "$1.20" }, "2": { "value": "500" } }
                    };
                    const mockColumns = ["0", "1", "2"];

                    // Update DB - Mark complete
                    conversation.response = { rows: mockRows, columns: mockColumns };
                    conversation.status = 'completed';
                    conversation.events.push({ step: 'completed', message: 'Sheet generated successfully' });
                    await conversation.save();

                    // Send final success payload
                    sendJSON({
                        data: {
                            success: true,
                            rows: mockRows,
                            columns: mockColumns,
                            metadata: { title: session.title },
                            conversationId: conversation._id,
                            chatId: session._id // Ensure frontend gets the session ID
                        }
                    });

                } catch (e) {
                    console.error("Streaming error", e);
                    sendJSON({ data: { error: { message: "Simulation failed" } } });
                    conversation.status = 'failed';
                    await conversation.save();
                }

                controller.close();
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
