import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkflowHistory, WorkflowHistoryDocument, ErrorDetail } from '../schemas/workflow-history.schema';
import { SampleWorkflowDocument, WorkflowNode as SchemaWorkflowNode, WorkflowEdge, SampleWorkflow } from '../schemas/sample-workflow.schema';
import { ExecutionStatus, NodeExecutionStatus, LogLevel } from '../enums/execution-status.enum';
import { NodeRegistryService } from './node-registry.service';
import { NodeInput, WorkflowExecutionOptions } from '../interfaces/execution-context.interface';
import { ClientInfo } from '../../common/utils/client-info.util';
import { ExpressionEvaluatorService, NodeData, ExpressionContext } from './expression-evaluator.service';
import { CredentialsService } from '../../credentials/credentials.service';
import { SampleNodeType } from '../enums/node-type.enum';

interface NodeOutputMap {
    [nodeId: string]: any;
}

interface ActiveExecution {
    executionId: string;
    cancelled: boolean;
    timeoutId?: NodeJS.Timeout;
}

interface RetryPolicy {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    jitter: number; // 0.2 => +/-20%
}

interface QueuedExecution {
    executionId: string;
    workflow: SampleWorkflowDocument;
    options: WorkflowExecutionOptions;
}

/**
 * Internal structure to track node data during execution
 * Used for expression evaluation context
 */
interface ExecutionNodeData {
    input?: {
        sources: Array<{
            nodeId: string;
            nodeName: string;
            value: any;
            type?: string;
        }>;
        rawValues: any[];
        resolved?: Record<string, any>;
        expressions?: Record<string, string>;
    };
    output?: {
        value: any;
        type: string;
        timestamp: Date;
        originalValue?: any;
        schema?: Record<string, any>;
    };
}

@Injectable()
export class WorkflowExecutorService {
    private readonly logger = new Logger(WorkflowExecutorService.name);
    private activeExecutions: Map<string, ActiveExecution> = new Map();
    private workflowQueues: Map<string, QueuedExecution[]> = new Map();
    private workflowActiveCounts: Map<string, number> = new Map();

    constructor(
        @InjectModel(WorkflowHistory.name) private historyModel: Model<WorkflowHistoryDocument>,
        private nodeRegistry: NodeRegistryService,
        private expressionEvaluator: ExpressionEvaluatorService,
        private credentialsService: CredentialsService, // Injected here
    ) { }

    async createExecutionEntry(
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
                data: node.data, // Initial snapshot of configuration
                position: node.position, // Saved position
                measured: node.measured, // Saved dimensions
            })),
            nodeOutputs: [],
            logs: [],
            errors: {
                workflowErrors: [],
                executionErrors: [],
                nodeErrors: [],
                totalErrors: 0,
            },
            metrics: {
                totalNodes: workflow.nodes.length,
                completedNodes: 0,
                failedNodes: 0,
                skippedNodes: 0,
            },
            triggerData,
            options: {
                timeout: options.timeout || 300000,
                maxRetries: options.maxRetries || 3,
                continueOnError: options.continueOnError || false,
                replay: options.replay,
            } as any,
            clientInfo,
        });

        await history.save();
        const executionId = history._id.toString();

        const activeExecution: ActiveExecution = {
            executionId,
            cancelled: false,
        };
        this.activeExecutions.set(executionId, activeExecution);

        return executionId;
    }

    async runExecution(
        executionId: string,
        workflow: SampleWorkflowDocument,
        options: WorkflowExecutionOptions,
    ): Promise<void> {
        await this.enqueueOrRunExecution(executionId, workflow, options);
    }

    private getConcurrencyLimit(
        workflow: SampleWorkflowDocument,
        options: WorkflowExecutionOptions,
    ): number {
        return options.maxConcurrency
            ?? workflow.settings?.maxConcurrency
            ?? 2;
    }

    private async enqueueOrRunExecution(
        executionId: string,
        workflow: SampleWorkflowDocument,
        options: WorkflowExecutionOptions,
    ): Promise<void> {
        const workflowId = workflow._id.toString();
        const limit = this.getConcurrencyLimit(workflow, options);
        const active = this.workflowActiveCounts.get(workflowId) || 0;

        if (active < limit) {
            this.workflowActiveCounts.set(workflowId, active + 1);
            await this.runExecutionInternal(executionId, workflow, options);
            return;
        }

        const queue = this.workflowQueues.get(workflowId) || [];
        queue.push({ executionId, workflow, options });
        this.workflowQueues.set(workflowId, queue);

        await this.updateExecutionStatus(executionId, ExecutionStatus.QUEUED);
        await this.addLog(
            executionId,
            LogLevel.INFO,
            `Execution queued. Active: ${active}/${limit}`,
        );
    }

    private async startNextInQueue(workflowId: string): Promise<void> {
        const queue = this.workflowQueues.get(workflowId) || [];
        if (queue.length === 0) return;

        const next = queue.shift();
        if (!next) return;
        this.workflowQueues.set(workflowId, queue);

        const active = this.workflowActiveCounts.get(workflowId) || 0;
        this.workflowActiveCounts.set(workflowId, active + 1);

        await this.runExecutionInternal(next.executionId, next.workflow, next.options);
    }

    private async runExecutionInternal(
        executionId: string,
        workflow: SampleWorkflowDocument,
        options: WorkflowExecutionOptions,
    ): Promise<void> {
        const activeExecution = this.activeExecutions.get(executionId);
        if (!activeExecution) {
            this.activeExecutions.set(executionId, { executionId, cancelled: false });
        }

        // Set timeout if specified
        if (options.timeout) {
            const existing = this.activeExecutions.get(executionId);
            if (existing) {
                existing.timeoutId = setTimeout(() => {
                    this.handleTimeout(executionId);
                }, options.timeout);
            }
        }

        // Start execution asynchronously
        this.executeWorkflowLogic(workflow, executionId, options).catch(async error => {
            this.logger.error(`Workflow execution failed: ${error.message}`, error.stack);
            await this.addExecutionError(executionId, {
                code: 'SYSTEM_ERROR',
                message: error.message,
                stack: error.stack,
                timestamp: new Date(),
            });
            await this.finalizeExecution(executionId, ExecutionStatus.FAILED, new Date());
        });
    }

    async startExecution(
        workflow: SampleWorkflowDocument,
        options: WorkflowExecutionOptions = {},
        triggerData?: any,
        clientInfo?: ClientInfo,
    ): Promise<string> {
        if (workflow.isActive === false) {
            this.logger.warn(`Attempted to execute inactive workflow ${workflow._id}`);
            throw new Error('Cannot execute an inactive workflow');
        }

        const executionId = await this.createExecutionEntry(workflow, options, triggerData, clientInfo);

        if (options.waitForCompletion) {
            await this.runExecution(executionId, workflow, options);
        } else {
            this.runExecution(executionId, workflow, options);
        }

        return executionId;
    }

    private async handleTimeout(executionId: string): Promise<void> {
        await this.addExecutionError(executionId, {
            code: 'EXECUTION_TIMEOUT',
            message: 'Workflow execution timed out',
            timestamp: new Date(),
        });
        await this.cancelExecution(executionId, 'system', 'Execution timeout');
    }

    private async executeWorkflowLogic(
        workflowDoc: SampleWorkflowDocument,
        executionId: string,
        options: WorkflowExecutionOptions,
    ): Promise<void> {
        // Convert to plain object to avoid Mongoose recursion issues in ExpressionEvaluator
        const workflow = (
            workflowDoc.toObject ? workflowDoc.toObject() : workflowDoc
        ) as SampleWorkflow & { _id: any };

        const startTime = new Date();

        await this.updateExecutionStatus(executionId, ExecutionStatus.RUNNING, { startTime });
        await this.addLog(executionId, LogLevel.INFO, `Starting workflow execution: ${workflow.name}`);

        const nodeOutputs: NodeOutputMap = {};
        const processedNodes = new Set<string>();
        const failedNodes = new Set<string>();

        // Build node map for quick lookup
        const nodeMap = new Map(workflow.nodes.map(n => [n.id, n]));
        const incomingEdges = this.buildIncomingEdgesMap(workflow.edges);

        // Build expression context maps for dynamic input/output referencing
        const nodeDataMap = new Map<string, ExecutionNodeData>();
        const nodeNameMap = new Map<string, string>();
        workflow.nodes.forEach(node => {
            nodeNameMap.set(node.nodeName, node.id);
            nodeDataMap.set(node.id, {}); // Initialize empty data for each node
        });

        let pendingNodes = [...workflow.nodes];
        let iteration = 0;
        const maxIterations = workflow.nodes.length * 2;

        // Replay/Retry support: seed outputs + mark nodes as processed
        const replay = options.replay;
        if (replay) {
            let pendingSet: Set<string> | null = null;

            if (replay.runOnlyNodeIds && replay.runOnlyNodeIds.length > 0) {
                pendingSet = new Set(replay.runOnlyNodeIds);
                pendingNodes = workflow.nodes.filter(n => pendingSet!.has(n.id));
            } else if (replay.fromNodeId) {
                const downstream = this.buildDownstreamSet(replay.fromNodeId, workflow.edges);
                pendingSet = downstream;
                pendingNodes = workflow.nodes.filter(n => downstream.has(n.id));
            }

            const now = new Date();
            const cachedOutputs = replay.cachedOutputs || [];
            for (const cached of cachedOutputs) {
                if (!cached?.nodeId) continue;
                if (pendingSet && pendingSet.has(cached.nodeId)) continue;

                nodeOutputs[cached.nodeId] = cached.value;
                processedNodes.add(cached.nodeId);

                const node = nodeMap.get(cached.nodeId);
                if (node) {
                    await this.updateNodeStatus(executionId, node.id, NodeExecutionStatus.SUCCESS, {
                        startTime: now,
                        endTime: now,
                        duration: 0,
                        outputs: cached.value,
                    });
                    await this.addNodeOutput(executionId, node.id, node.nodeName, cached.value);
                    await this.addLog(
                        executionId,
                        LogLevel.INFO,
                        `Using cached output for node: ${node.nodeName}`,
                        node.id,
                        node.nodeName,
                    );
                }
            }
        }

        while (pendingNodes.length > 0 && iteration < maxIterations) {
            iteration++;

            // Check for cancellation
            const activeExec = this.activeExecutions.get(executionId);
            if (activeExec?.cancelled) {
                await this.addLog(executionId, LogLevel.WARN, 'Execution cancelled by user');
                await this.finalizeExecution(executionId, ExecutionStatus.CANCELLED, startTime);
                return;
            }

            // Find nodes ready to execute
            const readyNodes = pendingNodes.filter(node => {
                const deps = incomingEdges.get(node.id) || [];
                return deps.every(edge =>
                    processedNodes.has(edge.source) || failedNodes.has(edge.source)
                );
            });

            if (readyNodes.length === 0) {
                if (options.replay) {
                    const error: ErrorDetail = {
                        code: 'REPLAY_MISSING_OUTPUTS',
                        message: 'Replay failed: missing cached outputs for required upstream nodes.',
                        timestamp: new Date(),
                    };
                    await this.addWorkflowError(executionId, error);
                    await this.addLog(executionId, LogLevel.ERROR, error.message);
                    await this.finalizeExecution(executionId, ExecutionStatus.FAILED, startTime);
                    return;
                }
                const error: ErrorDetail = {
                    code: 'CIRCULAR_DEPENDENCY',
                    message: 'Workflow stuck: circular dependency or missing inputs detected',
                    timestamp: new Date(),
                };
                await this.addWorkflowError(executionId, error);
                await this.addLog(executionId, LogLevel.ERROR, error.message);
                await this.finalizeExecution(executionId, ExecutionStatus.FAILED, startTime);
                return;
            }

            // Execute ready nodes in parallel
            const executionPromises = readyNodes.map(async (node) => {
                const deps = incomingEdges.get(node.id) || [];
                const hasFailedDep = deps.some(edge => failedNodes.has(edge.source));

                if (hasFailedDep && !options.continueOnError) {
                    await this.skipNode(executionId, node, 'Dependency failed');
                    failedNodes.add(node.id);
                    processedNodes.add(node.id);
                    return;
                }

                const success = await this.executeNode(
                    executionId,
                    workflow._id.toString(),
                    node,
                    nodeMap,
                    workflow.edges,
                    nodeOutputs,
                    nodeDataMap,
                    nodeNameMap,
                    options,
                    workflow.variables,
                );

                if (success) {
                    processedNodes.add(node.id);
                } else {
                    failedNodes.add(node.id);
                    processedNodes.add(node.id);

                    if (!options.continueOnError) {
                        await this.addLog(executionId, LogLevel.ERROR, `Stopping execution due to node failure: ${node.nodeName}`);
                        // We can't easily break from inside map, but finalizeExecution logic below handles it if needed
                    }
                }
            });

            await Promise.all(executionPromises);

            // Check if we should stop due to failures and !continueOnError
            if (failedNodes.size > 0 && !options.continueOnError) {
                await this.finalizeExecution(executionId, ExecutionStatus.FAILED, startTime);
                return;
            }

            pendingNodes = pendingNodes.filter(n => !processedNodes.has(n.id));
        }

        // Determine final result
        const terminalNodes = workflow.nodes.filter(node =>
            !workflow.edges.some(edge => edge.source === node.id)
        );

        let finalResult: any;
        if (terminalNodes.length === 1) {
            const terminalNode = terminalNodes[0];
            finalResult = {
                value: nodeOutputs[terminalNode.id],
                fromNodeId: terminalNode.id,
                fromNodeName: terminalNode.nodeName,
                timestamp: new Date(),
            };
        } else if (terminalNodes.length > 1) {
            finalResult = {
                value: terminalNodes.reduce((acc, node) => {
                    acc[node.nodeName] = nodeOutputs[node.id];
                    return acc;
                }, {} as Record<string, any>),
                fromNodeId: 'multiple',
                fromNodeName: terminalNodes.map(n => n.nodeName).join(', '),
                timestamp: new Date(),
            };
        }

        const status = failedNodes.size === 0 ? ExecutionStatus.COMPLETED : ExecutionStatus.COMPLETED;
        await this.addLog(executionId, LogLevel.INFO, `Workflow execution completed`);
        await this.finalizeExecution(executionId, status, startTime, finalResult);
    }

    private async executeNode(
        executionId: string,
        workflowId: string,
        node: SchemaWorkflowNode,
        nodeMap: Map<string, SchemaWorkflowNode>,
        edges: WorkflowEdge[],
        nodeOutputs: NodeOutputMap,
        nodeDataMap: Map<string, ExecutionNodeData>,
        nodeNameMap: Map<string, string>,
        options: WorkflowExecutionOptions,
        workflowVariables?: Record<string, any>,
    ): Promise<boolean> {
        const nodeStrategy = this.nodeRegistry.getNode(node.type);

        if (!nodeStrategy) {
            const error: ErrorDetail = {
                code: 'UNKNOWN_NODE_TYPE',
                message: `Unknown node type: ${node.type}`,
                timestamp: new Date(),
                nodeId: node.id,
                nodeName: node.nodeName,
            };
            await this.addNodeError(executionId, node.id, error);
            await this.updateNodeStatus(executionId, node.id, NodeExecutionStatus.FAILED, { error });
            return false;
        }

        const startTime = new Date();
        await this.updateNodeStatus(executionId, node.id, NodeExecutionStatus.RUNNING, { startTime });
        await this.addLog(executionId, LogLevel.INFO, `Executing node: ${node.nodeName}`, node.id, node.nodeName);

        // Gather inputs with source info and type information
        const inputEdges = edges.filter(e => e.target === node.id);
        const inputSources = inputEdges.map(edge => {
            const sourceNode = nodeMap.get(edge.source);
            const value = nodeOutputs[edge.source];
            return {
                nodeId: edge.source,
                nodeName: sourceNode?.nodeName || edge.source,
                value: value,
                type: this.getValueType(value),
                targetHandleId: edge.targetHandle,
            };
        });
        const rawValues = inputSources.map(s => s.value);

        // Update current node's input data in the nodeDataMap for expression context
        const currentNodeData = nodeDataMap.get(node.id) || {} as any;
        currentNodeData.input = {
            sources: inputSources,
            rawValues,
            expressions: node.data?.inputMappings, // Store original expressions for debugging
        };
        nodeDataMap.set(node.id, currentNodeData);

        // Build expression context for this node
        const expressionContext: ExpressionContext = {
            executionId,
            workflowId,
            currentNodeId: node.id,
            currentNodeName: node.nodeName,
            nodeDataMap: nodeDataMap as Map<string, NodeData>,
            nodeNameMap,
            triggerData: undefined, // Trigger data from external sources
            variables: workflowVariables, // Workflow-level variables accessible via {{$vars.name}}
        };

        // Evaluate expressions in node data (inputMappings, config, etc.)
        let evaluatedData = node.data || {};

        // Debug: Log original node data before evaluation
        await this.addLog(
            executionId,
            LogLevel.DEBUG,
            `Original node.data for ${node.nodeName}: ${JSON.stringify(node.data)}`,
            node.id,
            node.nodeName,
        );

        if (node.data) {
            try {
                evaluatedData = this.expressionEvaluator.evaluate(node.data, expressionContext);
                await this.addLog(
                    executionId,
                    LogLevel.DEBUG,
                    `Evaluated expressions for node ${node.nodeName}`,
                    node.id,
                    node.nodeName,
                );
            } catch (evalError) {
                const errorMessage = evalError instanceof Error ? evalError.message : String(evalError);
                await this.addLog(
                    executionId,
                    LogLevel.WARN,
                    `Expression evaluation warning: ${errorMessage}`,
                    node.id,
                    node.nodeName,
                );
                // Continue with original data if evaluation fails partially
            }

            // If inputMappings exist, resolve them and merge into inputs
            if (node.data.inputMappings) {
                const resolvedMappings = this.expressionEvaluator.evaluate(
                    node.data.inputMappings,
                    expressionContext,
                );
                // Merge resolved mappings into the evaluatedData.config
                evaluatedData.config = {
                    ...evaluatedData.config,
                    ...resolvedMappings,
                };

                // Store resolved mappings in node data for history tracking
                const nodeDataForHistory = nodeDataMap.get(node.id);
                if (nodeDataForHistory?.input) {
                    nodeDataForHistory.input.resolved = resolvedMappings;
                }
            }

            // Resolve Credentials if present
            if (evaluatedData.config?.credentialId) {
                try {
                    const credential = await this.credentialsService.findById(evaluatedData.config.credentialId);
                    if (credential) {
                        // Standardize injection based on node type
                        const geminiNodes = [
                            SampleNodeType.OCR,
                            SampleNodeType.SMART_EXTRACTION,
                            SampleNodeType.SUMMARIZE,
                            SampleNodeType.AI_AGENT,
                            SampleNodeType.GEMINI_MODEL
                        ];
                        if (geminiNodes.includes(node.type as SampleNodeType) && credential.provider === 'GEMINI') {
                            evaluatedData.config.apiKey = credential.accessToken;
                        }
                        // Add other node type mappings here as needed
                    } else {
                        await this.addLog(
                            executionId,
                            LogLevel.WARN,
                            `Credential not found for ID: ${evaluatedData.config.credentialId}`,
                            node.id,
                            node.nodeName
                        );
                    }
                } catch (credError) {
                    await this.addLog(
                        executionId,
                        LogLevel.ERROR,
                        `Failed to resolve credential: ${credError.message}`,
                        node.id,
                        node.nodeName
                    );
                }
            }

            // Handle inputs: Support both Array (Legacy) and Object (New/Simplified) structures
            if (node.data.inputs) {
                const resolvedInputs: Record<string, any> = {};

                if (Array.isArray(node.data.inputs)) {
                    // Legacy Array Loop
                    for (const inputField of node.data.inputs) {
                        let resolvedValue: any;

                        if (inputField.valueType === 'expression' && inputField.value) {
                            resolvedValue = this.expressionEvaluator.evaluate(inputField.value, expressionContext);
                        } else if (inputField.valueType === 'static' || !inputField.valueType) {
                            if (inputField.value !== undefined) {
                                resolvedValue = inputField.value;
                            } else if (inputField.defaultValue !== undefined) {
                                resolvedValue = inputField.defaultValue;
                            }
                        }

                        if (resolvedValue !== undefined) {
                            resolvedInputs[inputField.name] = resolvedValue;
                        }
                    }
                } else if (typeof node.data.inputs === 'object') {
                    evaluatedData.inputs = node.data.inputs;

                    await this.addLog(
                        executionId,
                        LogLevel.DEBUG,
                        `Resolved structured inputs for ${node.nodeName}: ${JSON.stringify(resolvedInputs)}`,
                        node.id,
                        node.nodeName,
                    );

                    // Store resolved structured inputs for history
                    const nodeDataForHistory = nodeDataMap.get(node.id);
                    if (nodeDataForHistory?.input) {
                        nodeDataForHistory.input.resolved = {
                            ...nodeDataForHistory.input.resolved,
                            ...resolvedInputs,
                        };
                    }
                }
            }
        }

        const inputs: NodeInput[] = inputEdges.map(edge => ({
            nodeId: edge.source,
            nodeName: nodeMap.get(edge.source)?.nodeName || edge.source,
            value: nodeOutputs[edge.source],
            edgeId: edge.id,
            sourceNodeId: edge.source, // Keep for legacy if needed
            sourceNodeName: nodeMap.get(edge.source)?.nodeName || edge.source,
        }));

        let simplifiedInputs: any = {};

        // Add configured inputs from node.data.inputs (for INPUT nodes and any node with structured inputs)
        if (node.data?.inputs) {
            if (Array.isArray(node.data.inputs)) {
                // Convert array to object for simplified view
                node.data.inputs.forEach(inp => {
                    if (inp.name) simplifiedInputs[inp.name] = inp.value;
                });
            } else if (typeof node.data.inputs === 'object') {
                simplifiedInputs = node.data.inputs;
            }
        }

        // Add resolved values from the nodeDataMap
        const nodeDataForInput = nodeDataMap.get(node.id);
        if (nodeDataForInput?.input?.resolved) {
            // Merge resolved values into simplified inputs
            simplifiedInputs = { ...simplifiedInputs, ...nodeDataForInput.input.resolved };
        }

        // Update the simplified 'inputs' field (user requested to remove the complex 'input' field)
        await this.historyModel.updateOne(
            { _id: executionId, 'nodeExecutions.nodeId': node.id },
            {
                $set: {
                    'nodeExecutions.$.inputs': simplifiedInputs
                }
            },
        );

        const retryPolicy = this.resolveRetryPolicy(node.type, options, evaluatedData?.config?.retryPolicy);
        const maxRetries = retryPolicy.maxRetries;
        let retryCount = 0;
        let lastError: ErrorDetail | undefined;

        while (retryCount <= maxRetries) {
            try {
                const result = await nodeStrategy.executeWithContext({
                    executionId,
                    workflowId,
                    nodeId: node.id,
                    nodeName: node.nodeName,
                    nodeType: node.type,
                    inputs,
                    data: evaluatedData, // Use evaluated data with resolved expressions
                    retryCount,
                    maxRetries,
                });

                // Add node logs
                for (const log of result.logs) {
                    await this.addNodeLog(executionId, node.id, log);
                }

                if (result.success) {
                    nodeOutputs[node.id] = result.output;
                    const endTime = new Date();
                    const duration = endTime.getTime() - startTime.getTime();

                    // Store output with comprehensive type information
                    const outputInfo = {
                        value: result.output,
                        type: this.getValueType(result.output),
                        timestamp: endTime,
                        schema: this.buildSchema(result.output),
                    };

                    // Update nodeDataMap with output for expression referencing by subsequent nodes
                    const nodeData = nodeDataMap.get(node.id) || {};
                    nodeData.output = outputInfo;
                    nodeDataMap.set(node.id, nodeData);

                    await this.updateNodeStatus(executionId, node.id, NodeExecutionStatus.SUCCESS, {
                        endTime,
                        duration,
                        outputs: typeof result.output === 'object' && result.output !== null ? result.output : { output: result.output }, // Store raw output if object, otherwise wrap
                        metadata: result.metadata,
                        resolvedConfig: evaluatedData.config, // Store the resolved configuration
                    });

                    // Add to nodeOutputs collection with keys for UI autocomplete
                    await this.addNodeOutput(
                        executionId,
                        node.id,
                        node.nodeName,
                        result.output,
                        this.extractKeys(result.output),
                    );

                    await this.addLog(
                        executionId,
                        LogLevel.INFO,
                        `Node ${node.nodeName} completed in ${duration}ms with output: ${JSON.stringify(result.output)}`,
                        node.id,
                        node.nodeName,
                    );

                    return true;
                } else {
                    lastError = {
                        code: 'NODE_EXECUTION_FAILED',
                        message: result.error || 'Unknown error',
                        stack: result.errorStack,
                        timestamp: new Date(),
                        nodeId: node.id,
                        nodeName: node.nodeName,
                        context: { retryCount, inputs: rawValues },
                    };

                    retryCount++;
                    if (retryCount <= maxRetries && options.retryFailedNodes !== false) {
                        const delay = this.computeBackoffDelay(retryPolicy, retryCount);
                        await this.addLog(
                            executionId,
                            LogLevel.WARN,
                            `Node ${node.nodeName} failed, retrying (${retryCount}/${maxRetries}) in ${delay}ms: ${result.error}`,
                            node.id,
                            node.nodeName,
                        );
                        await this.updateNodeRetryCount(executionId, node.id, retryCount);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const errorStack = error instanceof Error ? error.stack : undefined;

                lastError = {
                    code: 'NODE_EXCEPTION',
                    message: errorMessage,
                    stack: errorStack,
                    timestamp: new Date(),
                    nodeId: node.id,
                    nodeName: node.nodeName,
                    context: { retryCount, inputs: rawValues },
                };

                retryCount++;
                if (retryCount <= maxRetries && options.retryFailedNodes !== false) {
                    const delay = this.computeBackoffDelay(retryPolicy, retryCount);
                    await this.addLog(
                        executionId,
                        LogLevel.WARN,
                        `Node ${node.nodeName} threw exception, retrying (${retryCount}/${maxRetries}) in ${delay}ms: ${errorMessage}`,
                        node.id,
                        node.nodeName,
                    );
                    await this.updateNodeRetryCount(executionId, node.id, retryCount);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // All retries exhausted
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        if (lastError) {
            await this.addNodeError(executionId, node.id, lastError);
        }

        await this.updateNodeStatus(executionId, node.id, NodeExecutionStatus.FAILED, {
            endTime,
            duration,
            error: lastError,
            retryCount: retryCount - 1,
        });

        await this.addLog(
            executionId,
            LogLevel.ERROR,
            `Node ${node.nodeName} failed after ${retryCount - 1} retries: ${lastError?.message}`,
            node.id,
            node.nodeName,
        );

        return false;
    }

    private async skipNode(executionId: string, node: SchemaWorkflowNode, reason: string): Promise<void> {
        await this.updateNodeStatus(executionId, node.id, NodeExecutionStatus.SKIPPED);
        await this.addLog(executionId, LogLevel.WARN, `Skipping node ${node.nodeName}: ${reason}`, node.id, node.nodeName);
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

    private buildOutgoingEdgesMap(edges: WorkflowEdge[]): Map<string, WorkflowEdge[]> {
        const map = new Map<string, WorkflowEdge[]>();
        for (const edge of edges) {
            const existing = map.get(edge.source) || [];
            existing.push(edge);
            map.set(edge.source, existing);
        }
        return map;
    }

    private buildDownstreamSet(startNodeId: string, edges: WorkflowEdge[]): Set<string> {
        const outgoing = this.buildOutgoingEdgesMap(edges);
        const visited = new Set<string>();
        const queue: string[] = [startNodeId];
        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) continue;
            visited.add(current);
            const nextEdges = outgoing.get(current) || [];
            for (const edge of nextEdges) {
                if (!visited.has(edge.target)) {
                    queue.push(edge.target);
                }
            }
        }
        return visited;
    }

    // ==================== ERROR MANAGEMENT ====================

    private async addWorkflowError(executionId: string, error: ErrorDetail): Promise<void> {
        await this.historyModel.findByIdAndUpdate(executionId, {
            $push: { 'issueDetails.workflowErrors': error },
            $inc: { 'issueDetails.totalErrors': 1 },
            $set: { 'issueDetails.primaryError': error },
            errorMessage: error.message,
        });
    }

    private async addExecutionError(executionId: string, error: ErrorDetail): Promise<void> {
        await this.historyModel.findByIdAndUpdate(executionId, {
            $push: { 'issueDetails.executionErrors': error },
            $inc: { 'issueDetails.totalErrors': 1 },
            $set: { 'issueDetails.primaryError': error },
            errorMessage: error.message,
        });
    }

    private async addNodeError(executionId: string, nodeId: string, error: ErrorDetail): Promise<void> {
        await this.historyModel.findByIdAndUpdate(executionId, {
            $push: { 'issueDetails.nodeErrors': error },
            $inc: { 'issueDetails.totalErrors': 1 },
            errorNodeId: nodeId,
        });

        // Also check if this is the first/primary error
        const history = await this.historyModel.findById(executionId);
        if (history && !history.issueDetails?.primaryError) {
            await this.historyModel.findByIdAndUpdate(executionId, {
                $set: { 'issueDetails.primaryError': error },
                errorMessage: error.message,
            });
        }
    }

    // ==================== NODE OUTPUT MANAGEMENT ====================

    private async addNodeOutput(
        executionId: string,
        nodeId: string,
        nodeName: string,
        value: any,
        keys?: string[],
    ): Promise<void> {
        await this.historyModel.findByIdAndUpdate(executionId, {
            $push: {
                nodeOutputs: {
                    nodeId,
                    nodeName,
                    value,
                    type: this.getValueType(value),
                    timestamp: new Date(),
                    keys: keys || [],
                },
            },
        });
    }

    private async updateNodeInput(executionId: string, nodeId: string, input: any): Promise<void> {
        await this.historyModel.updateOne(
            { _id: executionId, 'nodeExecutions.nodeId': nodeId },
            { $set: { 'nodeExecutions.$.input': input } },
        );
    }

    // ==================== STATUS MANAGEMENT ====================

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
        this.removeFromQueue(executionId);
        await this.onExecutionFinished(executionId);
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
            outputs?: any;
            error?: ErrorDetail;
            metadata?: Record<string, any>;
            retryCount?: number;
            resolvedConfig?: Record<string, any>;
            data?: any;
        } = {},
    ): Promise<void> {
        const updateFields: Record<string, any> = {
            'nodeExecutions.$.status': status,
        };

        if (updates.startTime) updateFields['nodeExecutions.$.startTime'] = updates.startTime;
        if (updates.endTime) updateFields['nodeExecutions.$.endTime'] = updates.endTime;
        if (updates.duration !== undefined) updateFields['nodeExecutions.$.duration'] = updates.duration;
        if (updates.duration !== undefined) updateFields['nodeExecutions.$.duration'] = updates.duration;
        if (updates.outputs !== undefined) updateFields['nodeExecutions.$.outputs'] = updates.outputs;
        if (updates.error) updateFields['nodeExecutions.$.error'] = updates.error;
        if (updates.error) updateFields['nodeExecutions.$.error'] = updates.error;
        if (updates.metadata) updateFields['nodeExecutions.$.metadata'] = updates.metadata;
        if (updates.retryCount !== undefined) updateFields['nodeExecutions.$.retryCount'] = updates.retryCount;
        if (updates.resolvedConfig) updateFields['nodeExecutions.$.resolvedConfig'] = updates.resolvedConfig;
        if (updates.data) updateFields['nodeExecutions.$.data'] = updates.data;

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

    // ==================== LOGGING ====================

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

    // ==================== FINALIZATION ====================

    private async finalizeExecution(
        executionId: string,
        status: ExecutionStatus,
        startTime: Date,
        finalResult?: any,
    ): Promise<void> {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        // Calculate metrics
        const history = await this.historyModel.findById(executionId);
        let averageNodeDuration = 0;
        let fastestNode: { nodeId: string; nodeName: string; duration: number } | undefined;
        let slowestNode: { nodeId: string; nodeName: string; duration: number } | undefined;

        if (history) {
            const completedNodes = history.nodeExecutions.filter(
                n => n.status === NodeExecutionStatus.SUCCESS && n.duration,
            );

            if (completedNodes.length > 0) {
                const totalNodeDuration = completedNodes.reduce((sum, n) => sum + (n.duration || 0), 0);
                averageNodeDuration = Math.round(totalNodeDuration / completedNodes.length);

                // Find fastest and slowest
                const sorted = [...completedNodes].sort((a, b) => (a.duration || 0) - (b.duration || 0));
                if (sorted.length > 0) {
                    fastestNode = {
                        nodeId: sorted[0].nodeId,
                        nodeName: sorted[0].nodeName,
                        duration: sorted[0].duration || 0,
                    };
                    slowestNode = {
                        nodeId: sorted[sorted.length - 1].nodeId,
                        nodeName: sorted[sorted.length - 1].nodeName,
                        duration: sorted[sorted.length - 1].duration || 0,
                    };
                }
            }
        }

        await this.historyModel.findByIdAndUpdate(executionId, {
            status,
            endTime,
            duration,
            finalResult,
            'metrics.totalDuration': duration,
            'metrics.averageNodeDuration': averageNodeDuration,
            'metrics.fastestNode': fastestNode,
            'metrics.slowestNode': slowestNode,
        });

        // Clear timeout and remove from active executions
        const activeExec = this.activeExecutions.get(executionId);
        if (activeExec?.timeoutId) {
            clearTimeout(activeExec.timeoutId);
        }
        this.activeExecutions.delete(executionId);
        await this.onExecutionFinished(executionId);
    }

    private async onExecutionFinished(executionId: string): Promise<void> {
        const history = await this.historyModel.findById(executionId).select('workflowId').exec();
        if (!history) return;

        const workflowId = history.workflowId.toString();
        const active = this.workflowActiveCounts.get(workflowId) || 0;
        const nextActive = Math.max(active - 1, 0);
        this.workflowActiveCounts.set(workflowId, nextActive);

        await this.startNextInQueue(workflowId);
    }

    private removeFromQueue(executionId: string): void {
        for (const [workflowId, queue] of this.workflowQueues.entries()) {
            const nextQueue = queue.filter(item => item.executionId !== executionId);
            if (nextQueue.length !== queue.length) {
                this.workflowQueues.set(workflowId, nextQueue);
                break;
            }
        }
    }

    isExecutionActive(executionId: string): boolean {
        return this.activeExecutions.has(executionId);
    }

    getActiveExecutionCount(): number {
        return this.activeExecutions.size;
    }

    // ==================== HELPER METHODS ====================

    private resolveRetryPolicy(
        nodeType: string,
        options: WorkflowExecutionOptions,
        nodePolicy?: Partial<RetryPolicy>,
    ): RetryPolicy {
        const defaultPolicy: RetryPolicy = {
            maxRetries: 3,
            baseDelayMs: 1000,
            maxDelayMs: 30000,
            jitter: 0.2,
        };

        const policyByType: Record<string, Partial<RetryPolicy>> = {
            [SampleNodeType.OCR]: { maxRetries: 4, baseDelayMs: 2000, maxDelayMs: 60000, jitter: 0.3 },
            [SampleNodeType.SMART_EXTRACTION]: { maxRetries: 4, baseDelayMs: 2000, maxDelayMs: 60000, jitter: 0.3 },
            [SampleNodeType.SUMMARIZE]: { maxRetries: 4, baseDelayMs: 2000, maxDelayMs: 60000, jitter: 0.3 },
            [SampleNodeType.BROWSER_SCRAPER]: { maxRetries: 3, baseDelayMs: 1500, maxDelayMs: 30000, jitter: 0.2 },
            [SampleNodeType.HTTP_REQUEST]: { maxRetries: 5, baseDelayMs: 1000, maxDelayMs: 20000, jitter: 0.2 },
        };

        const typePolicy = policyByType[nodeType] || {};

        return {
            maxRetries: options.maxRetries ?? nodePolicy?.maxRetries ?? typePolicy.maxRetries ?? defaultPolicy.maxRetries,
            baseDelayMs: nodePolicy?.baseDelayMs ?? typePolicy.baseDelayMs ?? defaultPolicy.baseDelayMs,
            maxDelayMs: nodePolicy?.maxDelayMs ?? typePolicy.maxDelayMs ?? defaultPolicy.maxDelayMs,
            jitter: nodePolicy?.jitter ?? typePolicy.jitter ?? defaultPolicy.jitter,
        };
    }

    private computeBackoffDelay(policy: RetryPolicy, retryCount: number): number {
        const exponent = Math.max(retryCount - 1, 0);
        const baseDelay = policy.baseDelayMs * Math.pow(2, exponent);
        const cappedDelay = Math.min(policy.maxDelayMs, baseDelay);
        const jitterMultiplier = 1 + ((Math.random() * 2 - 1) * policy.jitter);
        return Math.max(0, Math.floor(cappedDelay * jitterMultiplier));
    }

    /**
     * Get the type of a value for metadata tracking
     * Handles complex types: arrays, objects, nested structures
     */
    private getValueType(value: any): string {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) {
            if (value.length === 0) return 'array';
            const firstItemType = this.getValueType(value[0]);
            return `array<${firstItemType}>`;
        }
        if (value instanceof Date) return 'date';
        if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 0) return 'object';
            return 'object';
        }
        return typeof value;
    }

    /**
     * Extract keys from an object value (for UI autocomplete)
     */
    private extractKeys(value: any): string[] {
        if (value === null || value === undefined) return [];
        if (typeof value !== 'object') return [];
        if (Array.isArray(value)) {
            // For arrays, return indices and common keys from first item
            const keys: string[] = [];
            if (value.length > 0) {
                keys.push('0', `[0..${value.length - 1}]`);
                if (typeof value[0] === 'object' && value[0] !== null) {
                    keys.push(...Object.keys(value[0]).map(k => `[].${k}`));
                }
            }
            return keys;
        }
        return Object.keys(value);
    }

    /**
     * Build a schema/structure representation of a value
     * Always returns an object for consistent typing
     */
    private buildSchema(value: any, depth: number = 0): Record<string, any> {
        if (depth > 3) return { type: 'any' };
        if (value === null) return { type: 'null' };
        if (value === undefined) return { type: 'undefined' };
        if (Array.isArray(value)) {
            if (value.length === 0) return { type: 'array', items: { type: 'unknown' } };
            return { type: 'array', items: this.buildSchema(value[0], depth + 1) };
        }
        if (value instanceof Date) return { type: 'date' };
        if (typeof value === 'object') {
            const schema: Record<string, any> = { type: 'object', properties: {} };
            for (const key of Object.keys(value).slice(0, 10)) { // Limit keys
                schema.properties[key] = this.buildSchema(value[key], depth + 1);
            }
            return schema;
        }
        return { type: typeof value };
    }
}
