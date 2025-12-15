
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProcessedItemDocument = ProcessedItem & Document;

@Schema({ timestamps: true })
export class ProcessedItem {
    @Prop({ required: true, index: true })
    uniqueId: string; // file_id, message_id, or hash

    @Prop({ required: true, index: true })
    type: string; // e.g., 'OCR', 'PARSING'

    @Prop({ required: true, default: 'PENDING' })
    status: string; // 'PENDING', 'COMPLETED', 'FAILED'

    @Prop({ type: Object })
    metadata: Record<string, any>;
}

export const ProcessedItemSchema = SchemaFactory.createForClass(ProcessedItem);
