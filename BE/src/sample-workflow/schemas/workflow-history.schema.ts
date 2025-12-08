import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ExecutionStatus, NodeExecutionStatus, LogLevel } from '../enums/execution-status.enum';

export type WorkflowHistoryDocument = WorkflowHistory & Document;

// ==================== CLIENT INFO ====================

@Schema({ _id: false })
export class BrowserInfo {
    @Prop()
    name: string;

    @Prop()
    version: string;
}

@Schema({ _id: false })
export class EngineInfo {
    @Prop()
    name: string;

    @Prop()
    version: string;
}

@Schema({ _id: false })
export class SystemInfo {
    @Prop()
    os: string;

    @Prop()
    osVersion?: string;

    @Prop()
    cpuArchitecture: string;
}

@Schema({ _id: false })
export class ClientInfo {
    @Prop({ type: BrowserInfo })
    browser: BrowserInfo;

    @Prop({ type: EngineInfo })
    engine: EngineInfo;

    @Prop({ type: SystemInfo })
    system: SystemInfo;

    @Prop()
    userAgent: string;

    @Prop()
    ip?: string;

    @Prop()
    timestamp: Date;
}

// ==================== ERROR TRACKING ====================

@Schema({ _id: false })
export class ErrorDetail {
    @Prop({ required: true })
    code: string;

    @Prop({ required: true })
    message: string;

    @Prop()
    stack?: string;

    @Prop()
    timestamp: Date;

    @Prop()
    nodeId?: string;

    @Prop()
    nodeName?: string;

    @Prop({ type: Object })
    context?: Record<string, any>; // Additional context about the error
}

// ==================== EXECUTION LOGS ====================

@Schema({ _id: false })
export class ExecutionLogEntry {
    @Prop({ required: true })
    timestamp: Date;

    @Prop({ enum: LogLevel, default: LogLevel.INFO })
    level: LogLevel;

    @Prop({ required: true })
    message: string;

    @Prop({ type: Object })
    data?: any;

    @Prop()
    nodeId?: string;

    @Prop()
    nodeName?: string;
}

// ==================== NODE INPUT SOURCE ====================

@Schema({ _id: false })
export class NodeInputSource {
    @Prop({ required: true })
    nodeId: string;

    @Prop({ required: true })
    nodeName: string;

    /**
     * The value from the source node - can be any type:
     * string, number, boolean, array, object, or nested structures
     */
    @Prop({ type: Object })
    value: any;

    /**
     * Type of the value for quick reference
     */
    @Prop()
    type?: string;
}

// ==================== NODE INPUT DATA ====================

@Schema({ _id: false })
export class NodeInputData {
    /**
     * Sources - inputs from connected nodes
     * Each source contains the full output from a previous node
     */
    @Prop({ type: [NodeInputSource], default: [] })
    sources: NodeInputSource[];

    /**
     * Raw values array (flattened source values for quick access)
     */
    @Prop({ type: [Object], default: [] })
    rawValues: any[];

    /**
     * Resolved input mappings after expression evaluation
     * Key-value pairs where expressions have been resolved to actual values
     * Example: { "url": "https://api.example.com", "userId": 123, "items": [...] }
     */
    @Prop({ type: Object })
    resolved?: Record<string, any>;

    /**
     * Original expressions before evaluation (for debugging)
     * Example: { "url": "{{Config.output.baseUrl}}", "userId": "{{User.output.id}}" }
     */
    @Prop({ type: Object })
    expressions?: Record<string, string>;
}

// ==================== NODE OUTPUT DATA ====================

@Schema({ _id: false })
export class NodeOutputData {
    /**
     * The output value - can be any type:
     * - Simple: string, number, boolean
     * - Complex: array, object
     * - Nested: { data: { users: [...], meta: { total: 100 } } }
     */
    @Prop({ type: Object })
    value: any;

    /**
     * Type of the output value
     */
    @Prop()
    type: string;

    /**
     * Timestamp when output was produced
     */
    @Prop()
    timestamp: Date;

    /**
     * If output was transformed via outputMapping, store the original
     */
    @Prop({ type: Object })
    originalValue?: any;

    /**
     * Schema/structure of the output for documentation
     * Example: { "users": "array", "meta": { "total": "number", "page": "number" } }
     */
    @Prop({ type: Object })
    schema?: Record<string, any>;
}

// ==================== NODE OUTPUT (Quick Access Collection) ====================

@Schema({ _id: false })
export class NodeOutput {
    @Prop({ required: true })
    nodeId: string;

    @Prop({ required: true })
    nodeName: string;

    /**
     * The output value - supports any type: string, number, boolean, array, object, nested
     */
    @Prop({ type: Object })
    value: any;

    @Prop()
    type: string;

    @Prop()
    timestamp: Date;

    /**
     * Keys available in the output (for object types)
     * Helps with autocomplete/intellisense in UI
     */
    @Prop({ type: [String], default: [] })
    keys?: string[];
}

// ==================== NODE EXECUTION ====================

@Schema({ _id: false })
export class NodeExecutionEntry {
    @Prop({ required: true })
    nodeId: string;

    @Prop({ required: true })
    nodeName: string;

    @Prop({ required: true })
    nodeType: string;

    @Prop({ enum: NodeExecutionStatus, default: NodeExecutionStatus.PENDING })
    status: NodeExecutionStatus;

    @Prop()
    startTime?: Date;

    @Prop()
    endTime?: Date;

    @Prop()
    duration?: number; // milliseconds

    /**
     * Comprehensive input data received by this node
     * Contains sources, resolved values, and original expressions
     */
    @Prop({ type: NodeInputData })
    input?: NodeInputData;

    /**
     * Comprehensive output data produced by this node
     * Can be any structure: simple values, arrays, objects, nested
     */
    @Prop({ type: NodeOutputData })
    output?: NodeOutputData;

    // Node-level error details
    @Prop({ type: ErrorDetail })
    error?: ErrorDetail;

    @Prop({ default: 0 })
    retryCount: number;

    @Prop({ type: [ExecutionLogEntry], default: [] })
    logs: ExecutionLogEntry[];

    /**
     * Additional metadata about the execution
     * Can store node-specific information
     */
    @Prop({ type: Object })
    metadata?: Record<string, any>;

    /**
     * Configuration used for this execution (after expression resolution)
     */
    @Prop({ type: Object })
    resolvedConfig?: Record<string, any>;
}

// ==================== NODE PERFORMANCE INFO ====================

@Schema({ _id: false })
export class NodePerformanceInfo {
    @Prop({ required: true })
    nodeId: string;

    @Prop({ required: true })
    nodeName: string;

    @Prop({ required: true })
    duration: number;
}

// ==================== EXECUTION METRICS ====================

@Schema({ _id: false })
export class ExecutionMetrics {
    @Prop({ default: 0 })
    totalNodes: number;

    @Prop({ default: 0 })
    completedNodes: number;

    @Prop({ default: 0 })
    failedNodes: number;

    @Prop({ default: 0 })
    skippedNodes: number;

    @Prop()
    totalDuration?: number; // milliseconds

    @Prop()
    averageNodeDuration?: number;

    @Prop({ type: NodePerformanceInfo })
    fastestNode?: NodePerformanceInfo;

    @Prop({ type: NodePerformanceInfo })
    slowestNode?: NodePerformanceInfo;
}

// ==================== WORKFLOW EXECUTION ERRORS ====================

@Schema({ _id: false })
export class WorkflowErrors {
    // Workflow-level errors (validation, configuration, etc.)
    @Prop({ type: [ErrorDetail], default: [] })
    workflowErrors: ErrorDetail[];

    // Execution-level errors (timeout, system errors, etc.)
    @Prop({ type: [ErrorDetail], default: [] })
    executionErrors: ErrorDetail[];

    // Node-level errors summary
    @Prop({ type: [ErrorDetail], default: [] })
    nodeErrors: ErrorDetail[];

    // Total error count
    @Prop({ default: 0 })
    totalErrors: number;

    // First error that caused failure
    @Prop({ type: ErrorDetail })
    primaryError?: ErrorDetail;
}

// ==================== MAIN WORKFLOW HISTORY SCHEMA ====================

@Schema({ timestamps: true, collection: 'workflow_executions' })
export class WorkflowHistory {
    @Prop({ type: Types.ObjectId, required: true, index: true })
    workflowId: Types.ObjectId;

    @Prop({ required: true })
    workflowName: string;

    @Prop({ default: 1 })
    executionNumber: number;

    @Prop({ enum: ExecutionStatus, default: ExecutionStatus.PENDING, index: true })
    status: ExecutionStatus;

    @Prop()
    startTime?: Date;

    @Prop()
    endTime?: Date;

    @Prop()
    duration?: number; // milliseconds

    // All node executions with their inputs/outputs
    @Prop({ type: [NodeExecutionEntry], default: [] })
    nodeExecutions: NodeExecutionEntry[];

    // Quick access to all node outputs
    @Prop({ type: [NodeOutput], default: [] })
    nodeOutputs: NodeOutput[];

    // Execution logs
    @Prop({ type: [ExecutionLogEntry], default: [] })
    logs: ExecutionLogEntry[];

    // Final result of the workflow
    @Prop({ type: Object })
    finalResult?: {
        value: any;
        fromNodeId: string;
        fromNodeName: string;
        timestamp: Date;
    };

    // Comprehensive error tracking
    @Prop({ type: WorkflowErrors, default: {} })
    errors: WorkflowErrors;

    // Legacy error fields for backward compatibility
    @Prop()
    errorMessage?: string;

    @Prop()
    errorNodeId?: string;

    // Execution metrics
    @Prop({ type: ExecutionMetrics })
    metrics: ExecutionMetrics;

    // Data that triggered the workflow
    @Prop({ type: Object })
    triggerData?: any;

    // Execution options
    @Prop({ type: Object })
    options?: {
        timeout?: number;
        maxRetries?: number;
        continueOnError?: boolean;
    };

    // Cancellation info
    @Prop()
    cancelledAt?: Date;

    @Prop()
    cancelledBy?: string;

    @Prop()
    cancelReason?: string;

    // Client Information
    @Prop({ type: ClientInfo })
    clientInfo?: ClientInfo;
}

export const WorkflowHistorySchema = SchemaFactory.createForClass(WorkflowHistory);

// Indexes for better query performance
WorkflowHistorySchema.index({ workflowId: 1, createdAt: -1 });
WorkflowHistorySchema.index({ status: 1, createdAt: -1 });
WorkflowHistorySchema.index({ 'nodeExecutions.status': 1 });
WorkflowHistorySchema.index({ 'errors.totalErrors': 1 });
