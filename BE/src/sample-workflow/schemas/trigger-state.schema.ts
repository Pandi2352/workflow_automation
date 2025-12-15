import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TriggerStateDocument = TriggerState & Document;

@Schema({ timestamps: true })
export class TriggerState {
    @Prop({ required: true })
    workflowId: string;

    @Prop({ required: true })
    nodeId: string;

    @Prop({ required: true })
    provider: string; // e.g., 'google-drive', 'gmail'

    @Prop({ type: Object, default: {} })
    state: Record<string, any>; // Flexible state storage (e.g., { lastPollTime: '...', lastId: '...' })
}

export const TriggerStateSchema = SchemaFactory.createForClass(TriggerState);

// Index for fast lookups
TriggerStateSchema.index({ workflowId: 1, nodeId: 1 }, { unique: true });
