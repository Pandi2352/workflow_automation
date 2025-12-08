import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkflowHistory, WorkflowHistoryDocument } from '../schemas/workflow-history.schema';
import { SampleWorkflowDocument, WorkflowNode as SchemaWorkflowNode, WorkflowEdge } from '../schemas/sample-workflow.schema';
import { ExecutionStatus, NodeExecutionStatus, LogLevel } from '../enums/execution-status.enum';
import { NodeRegistryService } from './node-registry.service';
import { NodeInput, WorkflowExecutionOptions } from '../interfaces/execution-context.interface';
import { ClientInfo } from '../../common/utils/client-info.util';

interface NodeOutputMap {
    [nodeId: string]: any;
}

interface ActiveExecution {
    executionId: string;
    cancelled: boolean;
    timeoutId?: NodeJS.Timeout;
}

@Injectable()
export class WorkflowExecutorService {
    private readonly logger = new Logger(WorkflowExecutorService.name);
    private activeExecutions: Map<string, ActiveExecution> = new Map();

    constructor(
        @InjectModel(WorkflowHistory.name) private historyModel: Model<WorkflowHistoryDocument>,
        private nodeRegistry: NodeRegistryService,
    ) {}

    async startExecution(
        workflow: SampleWorkflowDocument,
        options: WorkflowExecutionOptions = {},
        triggerData?: any,
        clientInfo?: ClientInfo,
    ): Promise<string> {
        // Get execution count for this workflow
        const executionCount = await this.historyModel.countDocuments({
            workflowId: workflow._id,
        });

        // Create execution history record
        const history = new this.historyModel({
            workflowId: workflow._id,
            workflowName: workflow.name,
            executionNumber: executionCount + 1,
            status: ExecutionStatus.PENDING,
            nodeExecutions: workflow.nodes.map(node => ({
                nodeId: node.id,
                nodeName: node.nodeName,
                nodeType: node.type,
                status: NodeExecutionStatus.PENDING,
                retryCount: 0,
                logs: [],
            })),
            logs: [],
            metrics: {
                totalNodes: workflow.nodes.length,
                completedNodes: 0,
                failedNodes: 0,
                skippedNodes: 0,
            },
            triggerData,
            options: {
                timeout: options.timeout || 300000, // 5 minutes default
                maxRetries: options.maxRetries || 3,
                continueOnError: options.continueOnError || false,
            },
            clientInfo,
        });

        await history.save();

        const executionId = history._id.toString();

        // Track active execution
        const activeExecution: ActiveExecution = {
            executionId,
            cancelled: false,
        };
        this.activeExecutions.set(executionId, activeExecution);

        // Set timeout if specified
        if (options.timeout) {
            activeExecution.timeoutId = setTimeout(() => {
                this.cancelExecution(executionId, 'system', 'Execution timeout');
            }, options.timeout);
        }

        // Start execution asynchronously
        this.executeWorkflow(workflow, executionId, options).catch(error => {
            this.logger.error(`Workflow execution failed: ${error.message}`, error.stack);
        });

        return executionId;
    }

    private async executeWorkflow(
        workflow: SampleWorkflowDocument,
        executionId: string,
        options: WorkflowExecutionOptions,
    ): Promise<void> {
        const startTime = new Date();

        await this.updateExecutionStatus(executionId, ExecutionStatus.RUNNING, { startTime });
        await this.addLog(executionId, LogLevel.INFO, `Starting workflow execution: ${workflow.name}`);

        const nodeOutputs: NodeOutputMap = {};
        const processedNodes = new Set<string>();
        const failedNodes = new Set<string>();

        // Build dependency graph
        const nodeMap = new Map(workflow.nodes.map(n => [n.id, n]));
        const incomingEdges = this.buildIncomingEdgesMap(workflow.edges);

        let pendingNodes = [...workflow.nodes];
        let iteration = 0;
        const maxIterations = workflow.nodes.length * 2;

        while (pendingNodes.length > 0 && iteration < maxIterations) {
            iteration++;

            // Check for cancellation
            const activeExec = this.activeExecutions.get(executionId);
            if (activeExec?.cancelled) {
                await this.addLog(executionId, LogLevel.WARN, 'Execution cancelled by user');
                await this.finalizeExecution(executionId, ExecutionStatus.CANCELLED, startTime);
                return;
            }

            // Find nodes ready to execute (all dependencies met)
            const readyNodes = pendingNodes.filter(node => {
                const deps = incomingEdges.get(node.id) || [];
                return deps.every(edge =>
                    processedNodes.has(edge.source) || failedNodes.has(edge.source)
                );
            });

            if (readyNodes.length === 0) {
                await this.addLog(executionId, LogLevel.ERROR, 'Workflow stuck: circular dependency or missing inputs detected');
                await this.finalizeExecution(executionId, ExecutionStatus.FAILED, startTime, null, 'Circular dependency detected');
                return;
            }

            // Execute ready nodes (can be parallelized in future)
            for (const node of readyNodes) {
                // Check if any dependency failed
                const deps = incomingEdges.get(node.id) || [];
                const hasFailedDep = deps.some(edge => failedNodes.has(edge.source));

                if (hasFailedDep && !options.continueOnError) {
                    await this.updateNodeStatus(executionId, node.id, NodeExecutionStatus.SKIPPED);
                    failedNodes.add(node.id);
                    await this.addLog(executionId, LogLevel.WARN, `Skipping node ${node.nodeName} due to failed dependency`);
                    processedNodes.add(node.id);
                    continue;
                }

                const success = await this.executeNode(
                    executionId,
                    node,
                    workflow.edges,
                    nodeOutputs,
                    options,
                );

                if (success) {
                    processedNodes.add(node.id);
                } else {
                    failedNodes.add(node.id);
                    processedNodes.add(node.id);

                    if (!options.continueOnError) {
                        await this.addLog(executionId, LogLevel.ERROR, `Stopping execution due to node failure: ${node.nodeName}`);
                        await this.finalizeExecution(
                            executionId,
                            ExecutionStatus.FAILED,
                            startTime,
                            null,
                            `Node ${node.nodeName} failed`,
                            node.id,
                        );
                        return;
                    }
                }
            }

            pendingNodes = pendingNodes.filter(n => !processedNodes.has(n.id));
        }

        // Determine final result - output of terminal nodes (nodes with no outgoing edges)
        const terminalNodes = workflow.nodes.filter(node =>
            !workflow.edges.some(edge => edge.source === node.id)
        );

        const finalResult = terminalNodes.length === 1
            ? nodeOutputs[terminalNodes[0].id]
            : terminalNodes.reduce((acc, node) => {
                acc[node.nodeName] = nodeOutputs[node.id];
                return acc;
            }, {} as Record<string, any>);

        const status = failedNodes.size === 0 ? ExecutionStatus.COMPLETED : ExecutionStatus.COMPLETED;
        await this.addLog(executionId, LogLevel.INFO, `Workflow execution completed. Final result: ${JSON.stringify(finalResult)}`);
        await this.finalizeExecution(executionId, status, startTime, finalResult);
    }

    private async executeNode(
        executionId: string,
        node: SchemaWorkflowNode,
        edges: WorkflowEdge[],
        nodeOutputs: NodeOutputMap,
        options: WorkflowExecutionOptions,
    ): Promise<boolean> {
        const nodeStrategy = this.nodeRegistry.getNode(node.type);

        if (!nodeStrategy) {
            await this.addLog(executionId, LogLevel.ERROR, `Unknown node type: ${node.type}`, node.id, node.nodeName);
            await this.updateNodeStatus(executionId, node.id, NodeExecutionStatus.FAILED, {
                error: `Unknown node type: ${node.type}`,
            });
            return false;
        }

        const startTime = new Date();
        await this.updateNodeStatus(executionId, node.id, NodeExecutionStatus.RUNNING, { startTime });
        await this.addLog(executionId, LogLevel.INFO, `Executing node: ${node.nodeName}`, node.id, node.nodeName);

        // Gather inputs
        const inputEdges = edges.filter(e => e.target === node.id);
        const inputs: NodeInput[] = inputEdges.map(edge => ({
            sourceNodeId: edge.source,
            sourceNodeName: edge.source, // Could resolve actual name from nodeMap
            value: nodeOutputs[edge.source],
            edgeId: edge.id,
        }));

        const maxRetries = options.maxRetries || 3;
        let retryCount = 0;
        let lastError: string | undefined;

        while (retryCount <= maxRetries) {
            try {
                const result = await nodeStrategy.executeWithContext({
                    executionId,
                    workflowId: '',
                    nodeId: node.id,
                    nodeName: node.nodeName,
                    nodeType: node.type,
                    inputs,
                    data: node.data || {},
                    retryCount,
                    maxRetries,
                });

                // Add node logs to execution
                for (const log of result.logs) {
                    await this.addNodeLog(executionId, node.id, log);
                }

                if (result.success) {
                    nodeOutputs[node.id] = result.output;
                    const endTime = new Date();
                    const duration = endTime.getTime() - startTime.getTime();

                    await this.updateNodeStatus(executionId, node.id, NodeExecutionStatus.SUCCESS, {
                        endTime,
                        duration,
                        input: inputs.map(i => ({ from: i.sourceNodeId, value: i.value })),
                        output: result.output,
                        metadata: result.metadata,
                    });

                    await this.addLog(
                        executionId,
                        LogLevel.INFO,
                        `Node ${node.nodeName} completed in ${duration}ms with output: ${result.output}`,
                        node.id,
                        node.nodeName,
                    );

                    return true;
                } else {
                    lastError = result.error;
                    retryCount++;

                    if (retryCount <= maxRetries && options.retryFailedNodes !== false) {
                        await this.addLog(
                            executionId,
                            LogLevel.WARN,
                            `Node ${node.nodeName} failed, retrying (${retryCount}/${maxRetries}): ${result.error}`,
                            node.id,
                            node.nodeName,
                        );
                        await this.updateNodeRetryCount(executionId, node.id, retryCount);
                        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
                    }
                }
            } catch (error) {
                lastError = error instanceof Error ? error.message : String(error);
                retryCount++;

                if (retryCount <= maxRetries && options.retryFailedNodes !== false) {
                    await this.addLog(
                        executionId,
                        LogLevel.WARN,
                        `Node ${node.nodeName} threw exception, retrying (${retryCount}/${maxRetries}): ${lastError}`,
                        node.id,
                        node.nodeName,
                    );
                    await this.updateNodeRetryCount(executionId, node.id, retryCount);
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }
        }

        // All retries exhausted
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        await this.updateNodeStatus(executionId, node.id, NodeExecutionStatus.FAILED, {
            endTime,
            duration,
            error: lastError,
            retryCount: retryCount - 1,
        });

        await this.addLog(
            executionId,
            LogLevel.ERROR,
            `Node ${node.nodeName} failed after ${retryCount - 1} retries: ${lastError}`,
            node.id,
            node.nodeName,
        );

        return false;
    }

    private buildIncomingEdgesMap(edges: WorkflowEdge[]): Map<string, WorkflowEdge[]> {
        const map = new Map<string, WorkflowEdge[]>();
        for (const edge of edges) {
            const existing = map.get(edge.target) || [];
            existing.push(edge);
            map.set(edge.target, existing);
        }
        return map;
    }

    async cancelExecution(executionId: string, cancelledBy: string, reason?: string): Promise<boolean> {
        const activeExec = this.activeExecutions.get(executionId);

        if (activeExec) {
            activeExec.cancelled = true;
            if (activeExec.timeoutId) {
                clearTimeout(activeExec.timeoutId);
            }
        }

        await this.historyModel.findByIdAndUpdate(executionId, {
            status: ExecutionStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelledBy,
            cancelReason: reason,
        });

        await this.addLog(executionId, LogLevel.WARN, `Execution cancelled by ${cancelledBy}: ${reason || 'No reason provided'}`);

        this.activeExecutions.delete(executionId);
        return true;
    }

    private async updateExecutionStatus(
        executionId: string,
        status: ExecutionStatus,
        updates: Partial<WorkflowHistory> = {},
    ): Promise<void> {
        await this.historyModel.findByIdAndUpdate(executionId, {
            status,
            ...updates,
        });
    }

    private async updateNodeStatus(
        executionId: string,
        nodeId: string,
        status: NodeExecutionStatus,
        updates: {
            startTime?: Date;
            endTime?: Date;
            duration?: number;
            input?: any;
            output?: any;
            error?: string;
            errorStack?: string;
            metadata?: Record<string, any>;
            retryCount?: number;
        } = {},
    ): Promise<void> {
        const updateFields: Record<string, any> = {
            'nodeExecutions.$.status': status,
        };

        if (updates.startTime) updateFields['nodeExecutions.$.startTime'] = updates.startTime;
        if (updates.endTime) updateFields['nodeExecutions.$.endTime'] = updates.endTime;
        if (updates.duration !== undefined) updateFields['nodeExecutions.$.duration'] = updates.duration;
        if (updates.input !== undefined) updateFields['nodeExecutions.$.input'] = updates.input;
        if (updates.output !== undefined) updateFields['nodeExecutions.$.output'] = updates.output;
        if (updates.error) updateFields['nodeExecutions.$.error'] = updates.error;
        if (updates.errorStack) updateFields['nodeExecutions.$.errorStack'] = updates.errorStack;
        if (updates.metadata) updateFields['nodeExecutions.$.metadata'] = updates.metadata;
        if (updates.retryCount !== undefined) updateFields['nodeExecutions.$.retryCount'] = updates.retryCount;

        // Update metrics based on status
        const metricsUpdate: Record<string, any> = {};
        if (status === NodeExecutionStatus.SUCCESS) {
            metricsUpdate['$inc'] = { 'metrics.completedNodes': 1 };
        } else if (status === NodeExecutionStatus.FAILED) {
            metricsUpdate['$inc'] = { 'metrics.failedNodes': 1 };
        } else if (status === NodeExecutionStatus.SKIPPED) {
            metricsUpdate['$inc'] = { 'metrics.skippedNodes': 1 };
        }

        await this.historyModel.updateOne(
            { _id: executionId, 'nodeExecutions.nodeId': nodeId },
            { $set: updateFields, ...metricsUpdate },
        );
    }

    private async updateNodeRetryCount(executionId: string, nodeId: string, retryCount: number): Promise<void> {
        await this.historyModel.updateOne(
            { _id: executionId, 'nodeExecutions.nodeId': nodeId },
            { $set: { 'nodeExecutions.$.retryCount': retryCount } },
        );
    }

    private async addLog(
        executionId: string,
        level: LogLevel,
        message: string,
        nodeId?: string,
        nodeName?: string,
    ): Promise<void> {
        await this.historyModel.findByIdAndUpdate(executionId, {
            $push: {
                logs: {
                    timestamp: new Date(),
                    level,
                    message,
                    nodeId,
                    nodeName,
                },
            },
        });
    }

    private async addNodeLog(
        executionId: string,
        nodeId: string,
        log: { timestamp: Date; level: string; message: string; data?: any },
    ): Promise<void> {
        await this.historyModel.updateOne(
            { _id: executionId, 'nodeExecutions.nodeId': nodeId },
            {
                $push: {
                    'nodeExecutions.$.logs': {
                        timestamp: log.timestamp,
                        level: log.level as LogLevel,
                        message: log.message,
                        data: log.data,
                    },
                },
            },
        );
    }

    private async finalizeExecution(
        executionId: string,
        status: ExecutionStatus,
        startTime: Date,
        finalResult?: any,
        errorMessage?: string,
        errorNodeId?: string,
    ): Promise<void> {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        // Calculate average node duration
        const history = await this.historyModel.findById(executionId);
        let averageNodeDuration = 0;
        if (history) {
            const completedNodes = history.nodeExecutions.filter(
                n => n.status === NodeExecutionStatus.SUCCESS && n.duration,
            );
            if (completedNodes.length > 0) {
                averageNodeDuration = completedNodes.reduce((sum, n) => sum + (n.duration || 0), 0) / completedNodes.length;
            }
        }

        await this.historyModel.findByIdAndUpdate(executionId, {
            status,
            endTime,
            duration,
            finalResult,
            errorMessage,
            errorNodeId,
            'metrics.totalDuration': duration,
            'metrics.averageNodeDuration': averageNodeDuration,
        });

        // Clear timeout and remove from active executions
        const activeExec = this.activeExecutions.get(executionId);
        if (activeExec?.timeoutId) {
            clearTimeout(activeExec.timeoutId);
        }
        this.activeExecutions.delete(executionId);
    }

    isExecutionActive(executionId: string): boolean {
        return this.activeExecutions.has(executionId);
    }

    getActiveExecutionCount(): number {
        return this.activeExecutions.size;
    }
}
