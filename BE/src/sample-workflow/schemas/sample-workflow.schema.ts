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

/**
 * Node Input Mapping - allows referencing other nodes' outputs
 * Example:
 * {
 *   "value1": "{{Input1.output}}",
 *   "value2": "{{Input2.output}}",
 *   "multiplier": "{{Config.output.multiplier}}"
 * }
 */
@Schema({ _id: false })
export class NodeInputMapping {
    @Prop({ type: Object })
    mappings: Record<string, string>; // key -> expression (e.g., "{{NodeName.output}}")
}

@Schema({ _id: false })
export class NodeData {
    @Prop()
    value?: number;

    @Prop({ type: Object })
    config?: Record<string, any>;

    /**
     * Input mappings - map input names to expressions
     * Example: { "a": "{{Input1.output}}", "b": "{{Input2.output}}" }
     */
    @Prop({ type: Object })
    inputMappings?: Record<string, string>;

    /**
     * Output mapping - how to structure the output
     * Can contain expressions to transform output
     */
    @Prop({ type: Object })
    outputMapping?: Record<string, any>;
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

    /**
     * Global variables that can be referenced in expressions
     * Example: { "apiKey": "xxx", "baseUrl": "https://..." }
     */
    @Prop({ type: Object })
    variables?: Record<string, any>;
}

export const SampleWorkflowSchema = SchemaFactory.createForClass(SampleWorkflow);

// Indexes
SampleWorkflowSchema.index({ name: 1 });
SampleWorkflowSchema.index({ isActive: 1 });
SampleWorkflowSchema.index({ tags: 1 });
