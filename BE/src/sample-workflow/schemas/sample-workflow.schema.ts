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
 * Node Input Field - defines a single input field with value/expression and type
 * Used when frontend sends input configuration
 *
 * Example from frontend:
 * {
 *   "name": "file_ids",
 *   "type": "array",
 *   "valueType": "expression",
 *   "value": "{{DocumentStoreNode.outputs.file_ids}}"
 * }
 */
@Schema({ _id: false })
export class NodeInputField {
    @Prop({ required: true })
    name: string;

    /**
     * Data type of this input field
     * Used for validation and UI display
     */
    @Prop({ required: true, enum: ['string', 'number', 'boolean', 'array', 'object', 'any', 'date', 'file', 'json'] })
    type: string;

    /**
     * How the value is provided: 'static' (direct value) or 'expression' (reference to another node)
     */
    @Prop({ enum: ['static', 'expression'], default: 'static' })
    valueType: string;

    /**
     * The actual value - either a static value or an expression string
     * If valueType is 'expression': "{{NodeName.outputs.property}}"
     * If valueType is 'static': the actual value (string, number, object, array, etc.)
     */
    @Prop({ type: Object })
    value?: any;

    @Prop()
    description?: string;

    @Prop({ default: false })
    required: boolean;

    @Prop({ type: Object })
    defaultValue?: any;

    /**
     * For array/object types, define the schema of items/properties
     * Example for array: { "itemType": "string" }
     * Example for object: { "properties": { "name": "string", "age": "number" } }
     */
    @Prop({ type: Object })
    schema?: Record<string, any>;

    /**
     * Source node info - which node this input references (auto-populated from expression)
     */
    @Prop()
    sourceNodeName?: string;

    /**
     * Source property path - the path within the source node (auto-populated from expression)
     */
    @Prop()
    sourcePropertyPath?: string;
}

/**
 * Node Output Field - defines a single output field with its type
 * Used to declare what the node will output
 */
@Schema({ _id: false })
export class NodeOutputField {
    @Prop({ required: true })
    name: string;

    /**
     * Data type of this output field
     */
    @Prop({ required: true, enum: ['string', 'number', 'boolean', 'array', 'object', 'any', 'date', 'file', 'json'] })
    type: string;

    @Prop()
    description?: string;

    /**
     * For array/object types, define the schema of items/properties
     */
    @Prop({ type: Object })
    schema?: Record<string, any>;

    /**
     * Example value for documentation/UI
     */
    @Prop({ type: Object })
    example?: any;
}


/**
 * Node Data - comprehensive data structure for node configuration
 * Supports complex inputs/outputs like n8n
 *
 * Expression syntax supported:
 * - {{NodeName.output}} or {{NodeName.outputs}} - entire output of a node
 * - {{NodeName.output.propertyName}} - specific property
 * - {{NodeName.output.data[0]}} - array index access
 * - {{NodeName.output.users[0].name}} - deep nested access
 * - {{NodeName.input.fieldName}} - specific input field value
 * - {{$vars.variableName}} - workflow variables
 * - {{$input}} - current node's aggregated input
 * - {{$json}} - all previous outputs as JSON
 * - {{$first}}, {{$last}}, {{$items}} - input shortcuts
 */
@Schema({ _id: false })
export class NodeData {
    /**
     * Simple value for basic nodes (backward compatibility)
     * Can be any type: number, string, object, array
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
     * Structured input fields with types and values/expressions
     * This is the primary way frontend sends input configuration
     *
     * Example from frontend:
     * [
     *   {
     *     "name": "schema_id",
     *     "type": "string",
     *     "valueType": "expression",
     *     "value": "{{DocumentStoreNode.outputs.document_store_id}}"
     *   },
     *   {
     *     "name": "file_ids",
     *     "type": "array",
     *     "valueType": "expression",
     *     "value": "{{DocumentStoreNode.outputs.file_ids}}"
     *   },
     *   {
     *     "name": "timeout",
     *     "type": "number",
     *     "valueType": "static",
     *     "value": 5000
     *   },
     *   {
     *     "name": "headers",
     *     "type": "object",
     *     "valueType": "static",
     *     "value": { "Content-Type": "application/json" }
     *   }
     * ]
     */
    @Prop({ type: [NodeInputField], default: [] })
    inputs?: NodeInputField[];

    /**
     * Structured output fields - declares what this node will output
     *
     * Example:
     * [
     *   {
     *     "name": "document_store_id",
     *     "type": "string",
     *     "description": "The ID of the created document store"
     *   },
     *   {
     *     "name": "file_ids",
     *     "type": "array",
     *     "schema": { "itemType": "string" },
     *     "description": "Array of uploaded file IDs"
     *   },
     *   {
     *     "name": "analysis_result",
     *     "type": "object",
     *     "schema": {
     *       "properties": {
     *         "summary": "string",
     *         "entities": "array",
     *         "confidence": "number"
     *       }
     *     }
     *   }
     * ]
     */
    @Prop({ type: [NodeOutputField], default: [] })
    outputs?: NodeOutputField[];

    /**
     * Input mappings - simple key to expression mapping (alternative to structured inputs)
     * Useful for quick configuration without full type definitions
     *
     * Example: {
     *   "a": "{{Input1.outputs.value}}",
     *   "b": "{{Input2.outputs.data.count}}",
     *   "items": "{{HTTP.outputs.response.items}}",
     *   "firstUser": "{{Users.outputs.list[0]}}"
     * }
     */
    @Prop({ type: Object })
    inputMappings?: Record<string, string>;

    /**
     * Static input values (used when not using expressions)
     * Can be any type: string, number, boolean, array, object
     *
     * Example: {
     *   "timeout": 5000,
     *   "retries": 3,
     *   "headers": { "Authorization": "Bearer xxx" },
     *   "tags": ["important", "urgent"],
     *   "config": { "nested": { "deep": "value" } }
     * }
     */
    @Prop({ type: Object })
    inputValues?: Record<string, any>;

    /**
     * Output mapping - transform the output before passing to next nodes
     * Can use expressions to reshape data
     *
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
