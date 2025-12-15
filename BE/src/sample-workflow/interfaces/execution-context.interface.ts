export interface NodeInput {
    nodeId: string;
    nodeName: string;
    value: any;
    type?: string;
    edgeId?: string; // Optional now as per usage
    sourceNodeId?: string; // Optional for compatibility
    sourceNodeName?: string; // Optional for compatibility
}

export interface NodeExecutionContext {
    executionId: string;
    workflowId: string;
    nodeId: string;
    nodeName: string;
    nodeType: string;
    inputs: NodeInput[];
    data?: any;
    triggerData?: any; // Data passed from the trigger event (e.g. email)
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

export interface INodeStrategy {
    execute(context: NodeExecutionContext): Promise<NodeExecutionResult>;
    executeWithContext(context: NodeExecutionContext): Promise<NodeExecutionResult>;
}
