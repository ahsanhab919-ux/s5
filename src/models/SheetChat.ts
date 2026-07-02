import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ISheetChat extends Document {
    userId: string;
    title: string;
    status: 'idle' | 'generating' | 'completed' | 'failed' | 'cancelled';
    events: { step?: string; message?: string; timestamp?: Date }[];
    response: Record<string, unknown>;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const SheetChatSchema = new Schema<ISheetChat>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        title: {
            type: String,
            default: 'New Spreadsheet',
        },
        status: {
            type: String,
            enum: ['idle', 'generating', 'completed', 'failed', 'cancelled'],
            default: 'idle',
        },
        events: [
            {
                step: String,
                message: String,
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        response: {
            type: Object, // Stores the rows/columns often
            default: {},
        },
        metadata: {
            type: Object,
            default: {},
        },
    },
    { timestamps: true }
);

// Explicitly typed model export for Mongoose 9's stricter Query generics.
const SheetChat: Model<ISheetChat> =
    (mongoose.models.SheetChat as Model<ISheetChat>) ||
    mongoose.model<ISheetChat>('SheetChat', SheetChatSchema);

export default SheetChat;
