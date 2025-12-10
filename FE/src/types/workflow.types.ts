import type { Node, Edge } from '@xyflow/react';

export interface WorkflowNode extends Node {
    type: string;
    nodeName: string; // Custom BE field
    data: Record<string, any>;
}

export interface WorkflowEdge extends Edge {
    source: string;
    target: string;
}

export interface SampleWorkflow {
    _id: string;
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    variables?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    active: boolean;
}

export interface CreateWorkflowPayload {
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
}

export interface ExecutionHistory {
    _id: string;
    workflowId: string;
    workflowName: string;
    executionNumber: number;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    startTime?: string;
    endTime?: string;
    duration?: number;
    nodeExecutions: NodeExecution[];
    logs: any[];
    errors: any;
    finalResult?: any;
}

export interface NodeExecution {
    nodeId: string;
    nodeName: string;
    nodeType: string;
    status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
    startTime?: string;
    endTime?: string;
    duration?: number;
    inputs?: any;
    outputs?: any;
    error?: any;
}
