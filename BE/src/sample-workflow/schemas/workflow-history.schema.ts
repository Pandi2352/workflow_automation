import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ExecutionStatus, NodeExecutionStatus, LogLevel } from '../enums/execution-status.enum';

export type WorkflowHistoryDocument = WorkflowHistory & Document;

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

    @Prop({ type: Object })
    input?: any;

    @Prop({ type: Object })
    output?: any;

    @Prop()
    error?: string;

    @Prop()
    errorStack?: string;

    @Prop({ default: 0 })
    retryCount: number;

    @Prop({ type: [Object], default: [] })
    logs: ExecutionLogEntry[];

    @Prop({ type: Object })
    metadata?: Record<string, any>;
}

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
}

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

    @Prop({ type: [NodeExecutionEntry], default: [] })
    nodeExecutions: NodeExecutionEntry[];

    @Prop({ type: [ExecutionLogEntry], default: [] })
    logs: ExecutionLogEntry[];

    @Prop({ type: Object })
    finalResult?: any;

    @Prop()
    errorMessage?: string;

    @Prop()
    errorNodeId?: string;

    @Prop({ type: ExecutionMetrics })
    metrics: ExecutionMetrics;

    @Prop({ type: Object })
    triggerData?: any; // Data that triggered the workflow

    @Prop({ type: Object })
    options?: {
        timeout?: number;
        maxRetries?: number;
        continueOnError?: boolean;
    };

    @Prop()
    cancelledAt?: Date;

    @Prop()
    cancelledBy?: string;

    @Prop()
    cancelReason?: string;

    // Client Information - Browser, System, etc.
    @Prop({ type: ClientInfo })
    clientInfo?: ClientInfo;
}

export const WorkflowHistorySchema = SchemaFactory.createForClass(WorkflowHistory);

// Indexes for better query performance
WorkflowHistorySchema.index({ workflowId: 1, createdAt: -1 });
WorkflowHistorySchema.index({ status: 1, createdAt: -1 });
WorkflowHistorySchema.index({ 'nodeExecutions.status': 1 });
