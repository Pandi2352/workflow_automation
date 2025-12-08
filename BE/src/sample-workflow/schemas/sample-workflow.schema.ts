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
 * Node Input Definition - defines the structure and type of each input field
 * Similar to n8n's input definition
 */
@Schema({ _id: false })
export class NodeInputDefinition {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, enum: ['string', 'number', 'boolean', 'array', 'object', 'any'] })
    type: string;

    @Prop()
    description?: string;

    @Prop({ default: false })
    required: boolean;

    @Prop({ type: Object })
    defaultValue?: any;

    /**
     * Expression to get value from another node
     * Example: "{{Input1.output}}", "{{HTTP.output.data.users[0]}}"
     */
    @Prop()
    expression?: string;

    /**
     * Static value (used if no expression)
     */
    @Prop({ type: Object })
    value?: any;
}

/**
 * Node Output Definition - defines what the node outputs
 */
@Schema({ _id: false })
export class NodeOutputDefinition {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, enum: ['string', 'number', 'boolean', 'array', 'object', 'any'] })
    type: string;

    @Prop()
    description?: string;
}

/**
 * Node Data - comprehensive data structure for node configuration
 * Supports complex inputs/outputs like n8n
 *
 * Expression syntax supported:
 * - {{NodeName.output}} - entire output of a node
 * - {{NodeName.output.propertyName}} - specific property
 * - {{NodeName.output.data[0]}} - array index access
 * - {{NodeName.output.users[0].name}} - deep nested access
 * - {{NodeName.input.fieldName}} - specific input field value
 * - {{$vars.variableName}} - workflow variables
 * - {{$input}} - current node's aggregated input
 * - {{$json}} - all previous outputs as JSON
 */
@Schema({ _id: false })
export class NodeData {
    /**
     * Simple value for basic nodes (backward compatibility)
     */
    @Prop({ type: Object })
    value?: any;

    /**
     * Node configuration/settings
     * Can contain any key-value pairs, arrays, nested objects
     */
    @Prop({ type: Object })
    config?: Record<string, any>;

    /**
     * Structured input fields with types and expressions
     * Example:
     * [
     *   { name: "url", type: "string", expression: "{{Config.output.baseUrl}}/api" },
     *   { name: "headers", type: "object", value: { "Content-Type": "application/json" } },
     *   { name: "body", type: "object", expression: "{{Transform.output.payload}}" }
     * ]
     */
    @Prop({ type: [NodeInputDefinition], default: [] })
    inputs?: NodeInputDefinition[];

    /**
     * Input mappings - simple key to expression mapping (alternative to structured inputs)
     * Example: {
     *   "a": "{{Input1.output}}",
     *   "b": "{{Input2.output.value}}",
     *   "items": "{{HTTP.output.data.items}}",
     *   "firstUser": "{{Users.output[0]}}"
     * }
     */
    @Prop({ type: Object })
    inputMappings?: Record<string, string>;

    /**
     * Static input values (used when not using expressions)
     * Can be any type: string, number, boolean, array, object
     * Example: {
     *   "timeout": 5000,
     *   "retries": 3,
     *   "headers": { "Authorization": "Bearer xxx" },
     *   "tags": ["important", "urgent"]
     * }
     */
    @Prop({ type: Object })
    inputValues?: Record<string, any>;

    /**
     * Output schema definition - describes what this node outputs
     * Example:
     * [
     *   { name: "data", type: "object", description: "Response data" },
     *   { name: "items", type: "array", description: "List of items" }
     * ]
     */
    @Prop({ type: [NodeOutputDefinition], default: [] })
    outputSchema?: NodeOutputDefinition[];

    /**
     * Output mapping - transform the output before passing to next nodes
     * Can use expressions to reshape data
     * Example: {
     *   "users": "{{$output.data.users}}",
     *   "count": "{{$output.data.total}}",
     *   "processed": true
     * }
     */
    @Prop({ type: Object })
    outputMapping?: Record<string, any>;

    /**
     * Credentials reference for nodes that need authentication
     */
    @Prop()
    credentialId?: string;

    /**
     * Custom parameters specific to the node type
     * Flexible object to hold any node-specific settings
     */
    @Prop({ type: Object })
    parameters?: Record<string, any>;
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
