import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ResearchChat from '@/models/ResearchChat';

export async function POST(request: Request) {
    try {
        const { chat: chatId, query, config } = await request.json();
        await dbConnect();

        // 1. Validate chat exists
        const chat = await ResearchChat.findById(chatId);
        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        // 2. Add User Message
        chat.messages.push({
            role: 'user',
            content: query,
            timestamp: new Date()
        });
        // Don't save yet, wait for job ID or save now? Save now.
        await chat.save();

        // 3. Mock Streaming
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const sendStep = (data: any) => {
                    controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
                };

                const jobId = `job-${Date.now()}`;

                try {
                    // Initial ack
                    sendStep({ step: 'init', data: { jobId, message: "Research started" } });
                    await new Promise(r => setTimeout(r, 600));

                    // Step 1: Query Plans
                    sendStep({ step: 'planning', data: { message: "Generating search queries..." } });
                    await new Promise(r => setTimeout(r, 800));

                    // Step 2: Searching
                    sendStep({ step: 'searching', data: { message: "Searching the web...", queries: [query] } });
                    await new Promise(r => setTimeout(r, 1200));

                    // Step 3: Synthesis
                    sendStep({ step: 'synthesizing', data: { message: "Synthesizing results..." } });
                    await new Promise(r => setTimeout(r, 800));

                    // Step 4: Complete
                    const mockResult = `Here is a research summary for "${query}". \n\nBased on the analysis, we found key insights... \n1. Insight A \n2. Insight B`;
                    const mockSources = [
                        { title: "Source 1", url: "https://example.com/1" },
                        { title: "Source 2", url: "https://example.com/2" }
                    ];

                    sendStep({
                        step: 'completed',
                        data: {
                            result: mockResult,
                            sources: mockSources,
                            images: []
                        }
                    });

                    // Update DB with Assistant Message
                    // We need to re-fetch or use logic to update DB asynchronously
                    // Since this is a stream, we can't easily wait for DB save inside the controller without keeping connection open.
                    // In a real app, a background job does this.
                    // For now, we'll just try to update.

                    await ResearchChat.findByIdAndUpdate(chatId, {
                        $push: {
                            messages: {
                                role: 'assistant',
                                content: mockResult,
                                timestamp: new Date(),
                                metadata: { sources: mockSources }
                            }
                        }
                    });


                } catch (e) {
                    console.error("Streaming error", e);
                    sendStep({ step: 'error', error: "Simulation failed" });
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
