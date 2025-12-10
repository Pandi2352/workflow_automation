import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CredentialDocument = Credential & Document;

@Schema({ timestamps: true })
export class Credential {
    @Prop({ required: true })
    name: string; // e.g., "Pandiselvam's Google Drive"

    @Prop({ required: true })
    provider: string; // e.g., "google"

    @Prop({ required: true })
    accessToken: string;

    @Prop()
    refreshToken: string;

    @Prop()
    expiryDate: number;

    @Prop({ type: Object })
    metadata: Record<string, any>; // Stores user info (email, name, picture)
}

export const CredentialSchema = SchemaFactory.createForClass(Credential);
