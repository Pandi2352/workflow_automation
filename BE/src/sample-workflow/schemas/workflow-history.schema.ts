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

// ==================== NODE OUTPUT ====================

@Schema({ _id: false })
export class NodeOutput {
    @Prop({ required: true })
    nodeId: string;

    @Prop({ required: true })
    nodeName: string;

    @Prop({ type: Object })
    value: any;

    @Prop()
    type: string; // 'number', 'string', 'object', 'array', etc.

    @Prop()
    timestamp: Date;
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

    // Input data received by this node
    @Prop({ type: Object })
    input?: {
        sources: Array<{
            nodeId: string;
            nodeName: string;
            value: any;
        }>;
        rawValues: any[];
    };

    // Output produced by this node
    @Prop({ type: Object })
    output?: {
        value: any;
        type: string;
        timestamp: Date;
    };

    // Node-level error details
    @Prop({ type: ErrorDetail })
    error?: ErrorDetail;

    @Prop({ default: 0 })
    retryCount: number;

    @Prop({ type: [ExecutionLogEntry], default: [] })
    logs: ExecutionLogEntry[];

    @Prop({ type: Object })
    metadata?: Record<string, any>;
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
