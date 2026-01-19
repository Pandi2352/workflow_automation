import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { ClientInfo } from '../../common/utils/client-info.util';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
    @Prop({ required: true, index: true })
    action: string;

    @Prop({ required: true, index: true })
    entityType: string;

    @Prop({ index: true })
    entityId?: string;

    @Prop({ type: Object })
    metadata?: Record<string, any>;

    @Prop({ type: Object })
    clientInfo?: ClientInfo;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
