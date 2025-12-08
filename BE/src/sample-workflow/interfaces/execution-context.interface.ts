export interface NodeInput {
    sourceNodeId: string;
    sourceNodeName: string;
    value: any;
    edgeId: string;
}

export interface NodeExecutionContext {
    executionId: string;
    workflowId: string;
    nodeId: string;
    nodeName: string;
    nodeType: string;
    inputs: NodeInput[];
    data: Record<string, any>;
    retryCount: number;
    maxRetries: number;
}

export interface NodeExecutionResult {
    success: boolean;
    output: any;
    error?: string;
    errorStack?: string;
    logs: ExecutionLog[];
    metadata?: Record<string, any>;
}

export interface ExecutionLog {
    timestamp: Date;
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    message: string;
    data?: any;
}

export interface WorkflowExecutionOptions {
    timeout?: number; // milliseconds
    retryFailedNodes?: boolean;
    maxRetries?: number;
    continueOnError?: boolean;
}
