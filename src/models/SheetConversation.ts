import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface ISheetConversation extends Document {
    sessionId: Types.ObjectId;
    prompt: string;
    response: Record<string, unknown>;
    events: { step?: string; message?: string; timestamp?: Date }[];
    status: 'idle' | 'generating' | 'completed' | 'failed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const SheetConversationSchema = new Schema<ISheetConversation>(
    {
        sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SheetSession', required: true, index: true },
        prompt: { type: String, required: true },
        response: { type: Object, default: {} },
        events: [
            {
                step: String,
                message: String,
                timestamp: { type: Date, default: Date.now },
            },
        ],
        status: {
            type: String,
            enum: ['idle', 'generating', 'completed', 'failed', 'cancelled'],
            default: 'generating',
        },
    },
    { timestamps: true }
);

// Explicitly typed model export for Mongoose 9's stricter Query generics.
const SheetConversation: Model<ISheetConversation> =
    (mongoose.models.SheetConversation as Model<ISheetConversation>) ||
    mongoose.model<ISheetConversation>('SheetConversation', SheetConversationSchema);

export default SheetConversation;
