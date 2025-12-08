import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WorkflowDocument = Workflow & Document;

@Schema({ timestamps: true })
export class Workflow {
    @Prop({ required: true })
    name: string;

    @Prop()
    description: string;

    @Prop({ default: false })
    isActive: boolean;

    @Prop({ type: [Object], default: [] })
    nodes: any[];

    @Prop({ type: [Object], default: [] })
    edges: any[];

    @Prop({ type: Object })
    meta: {
        tags: string[];
        createdBy: string;
    };
}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow);
