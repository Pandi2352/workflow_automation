import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SampleNodeType } from '../enums/node-type.enum';

export type SampleWorkflowDocument = SampleWorkflow & Document;

@Schema({ _id: false })
export class NodePosition {
    @Prop({ default: 0 })
    x: number;

    @Prop({ default: 0 })
    y: number;
}

@Schema({ _id: false })
export class NodeData {
    @Prop()
    value?: number;

    @Prop({ type: Object })
    config?: Record<string, any>;
}

@Schema({ _id: false })
export class WorkflowNode {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true })
    nodeName: string;

    @Prop({ required: true, enum: SampleNodeType })
    type: SampleNodeType;

    @Prop({ type: NodeData, default: {} })
    data: NodeData;

    @Prop({ type: NodePosition, default: { x: 0, y: 0 } })
    position: NodePosition;

    @Prop()
    description?: string;
}

@Schema({ _id: false })
export class WorkflowEdge {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true })
    source: string;

    @Prop({ required: true })
    target: string;

    @Prop()
    sourceHandle?: string;

    @Prop()
    targetHandle?: string;

    @Prop()
    label?: string;
}

@Schema({ timestamps: true, collection: 'sample_workflows' })
export class SampleWorkflow {
    @Prop({ required: true })
    name: string;

    @Prop()
    description?: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: [WorkflowNode], default: [] })
    nodes: WorkflowNode[];

    @Prop({ type: [WorkflowEdge], default: [] })
    edges: WorkflowEdge[];

    @Prop({ default: 0 })
    executionCount: number;

    @Prop()
    lastExecutedAt?: Date;

    @Prop({ type: Object })
    settings?: {
        timeout?: number;
        maxRetries?: number;
        continueOnError?: boolean;
    };

    @Prop({ type: [String], default: [] })
    tags: string[];
}

export const SampleWorkflowSchema = SchemaFactory.createForClass(SampleWorkflow);

// Indexes
SampleWorkflowSchema.index({ name: 1 });
SampleWorkflowSchema.index({ isActive: 1 });
SampleWorkflowSchema.index({ tags: 1 });
