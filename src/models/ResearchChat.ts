import mongoose, { Document } from 'mongoose';
import type { AccessibleRecordModel } from '@casl/mongoose';

interface IResearchMessage {
    role?: 'user' | 'assistant' | 'system';
    content?: string;
    timestamp?: Date;
    metadata?: unknown;
}

export interface IResearchChat extends Document {
    userId: string;
    name: string;
    messages: IResearchMessage[];
    status: string;
}

const ResearchChatSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        name: { type: String, default: 'New Research' },
        messages: [
            {
                role: { type: String, enum: ['user', 'assistant', 'system'] },
                content: String,
                timestamp: { type: Date, default: Date.now },
                metadata: Object, // citations, etc.
            }
        ],
        status: { type: String, default: 'active' },
    },
    { timestamps: true }
);

// Typed as an AccessibleRecordModel so `.accessibleBy(ability)` (added by the
// CASL accessibleRecordsPlugin registered in dbConnect) type-checks.
const ResearchChat =
    (mongoose.models.ResearchChat as AccessibleRecordModel<IResearchChat>) ||
    mongoose.model<IResearchChat, AccessibleRecordModel<IResearchChat>>(
        'ResearchChat',
        ResearchChatSchema
    );

export default ResearchChat;
