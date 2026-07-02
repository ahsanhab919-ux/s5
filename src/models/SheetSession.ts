import mongoose, { Schema, Document } from 'mongoose';
import type { AccessibleRecordModel } from '@casl/mongoose';

export interface ISheetSession extends Document {
    userId: string;
    title: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const SheetSessionSchema = new Schema<ISheetSession>(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, default: 'New Chat' },
        status: { type: String, default: 'active' },
    },
    { timestamps: true }
);

// Typed as an AccessibleRecordModel so `.accessibleBy(ability)` (added by the
// CASL accessibleRecordsPlugin registered in dbConnect) type-checks, and so
// Mongoose 9's stricter Query generics resolve through the models-cache fallback.
const SheetSession =
    (mongoose.models.SheetSession as AccessibleRecordModel<ISheetSession>) ||
    mongoose.model<ISheetSession, AccessibleRecordModel<ISheetSession>>(
        'SheetSession',
        SheetSessionSchema
    );

export default SheetSession;
