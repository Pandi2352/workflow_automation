import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { SchedulerService } from './services/scheduler.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SampleWorkflow, SampleWorkflowDocument } from './schemas/sample-workflow.schema';
import { CreateSampleWorkflowDto } from './dto/create-sample-workflow.dto';
import { UpdateSampleWorkflowDto } from './dto/update-sample-workflow.dto';
import { ExecuteWorkflowOptions } from './dto/execute-workflow.dto';
import { QueryHistoryDto } from './dto/query-history.dto';
import { WorkflowExecutorService } from './services/workflow-executor.service';
import { WorkflowValidatorService } from './services/workflow-validator.service';
import { NodeRegistryService } from './services/node-registry.service';
import { ExecutionStatus } from './enums/execution-status.enum';
import { WorkflowHistory, WorkflowHistoryDocument } from './schemas/workflow-history.schema';
import { CredentialsService } from '../credentials/credentials.service';
import { SampleNodeType } from './enums/node-type.enum';
import { OCRService } from './node-services/ocr.service';

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

@Injectable()
export class SampleWorkflowService {
    constructor(
        @InjectModel(SampleWorkflow.name) private workflowModel: Model<SampleWorkflowDocument>,
        @InjectModel(WorkflowHistory.name) private historyModel: Model<WorkflowHistoryDocument>,
        private executorService: WorkflowExecutorService,
        private validatorService: WorkflowValidatorService,
        private nodeRegistry: NodeRegistryService,
        private credentialsService: CredentialsService, // Injected
        private ocrService: OCRService,
        @Inject(forwardRef(() => SchedulerService)) private schedulerService: SchedulerService,
    ) { }

    // ==================== WORKFLOW CRUD ====================

    async create(createDto: CreateSampleWorkflowDto): Promise<SampleWorkflowDocument> {
        // Validate workflow structure
        this.validatorService.validateAndThrow(createDto);

        const workflow = new this.workflowModel(createDto);
        const savedWorkflow = await workflow.save();
        await this.schedulerService.refreshSchedule(savedWorkflow._id.toString());
        return savedWorkflow;
    }

    async findAll(
        page = 1,
        limit = 20,
        isActive?: boolean,
        tags?: string[],
    ): Promise<PaginatedResponse<SampleWorkflowDocument>> {
        const query: any = {};

        if (isActive !== undefined) {
            query.isActive = isActive;
        }

        if (tags && tags.length > 0) {
            query.tags = { $in: tags };
        }

        const total = await this.workflowModel.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        const data = await this.workflowModel
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    async findOne(id: string): Promise<SampleWorkflowDocument> {
        if (!Types.ObjectId.isValid(id)) {
            console.error(`[SampleWorkflowService.findOne] Invalid ID received: "${id}" (Type: ${typeof id})`);
            throw new BadRequestException('Invalid workflow ID');
        }

        const workflow = await this.workflowModel.findById(id).exec();
        if (!workflow) {
            throw new NotFoundException(`Workflow with ID ${id} not found`);
        }
        return workflow;
    }

    async update(id: string, updateDto: UpdateSampleWorkflowDto): Promise<SampleWorkflowDocument> {
        const existing = await this.findOne(id);

        // If nodes or edges are being updated, validate the new structure
        if (updateDto.nodes || updateDto.edges) {
            const mergedWorkflow = {
                ...existing.toObject(),
                ...updateDto,
            };
            this.validatorService.validateAndThrow(mergedWorkflow);
        }

        const updated = await this.workflowModel
            .findByIdAndUpdate(id, updateDto, { new: true })
            .exec();

        if (!updated) {
            throw new NotFoundException(`Workflow with ID ${id} not found`);
        }

        await this.schedulerService.refreshSchedule(id);
        return updated;
    }

    async delete(id: string): Promise<{ deleted: boolean; deletedExecutions: number }> {
        const workflow = await this.findOne(id);

        // Delete associated execution history
        const deleteResult = await this.historyModel.deleteMany({ workflowId: workflow._id });

        await this.workflowModel.findByIdAndDelete(id);

        return {
            deleted: true,
            deletedExecutions: deleteResult.deletedCount,
        };
    }

    async validate(createDto: CreateSampleWorkflowDto) {
        return this.validatorService.validate(createDto);
    }

    // ==================== SINGLE NODE EXECUTION ====================

    async executeNodeTest(dto: any): Promise<any> {
        const { nodeType, nodeData, inputs = [] } = dto;
        const strategy = this.nodeRegistry.getNode(nodeType);

        if (!strategy) {
            throw new BadRequestException(`Unknown node type: ${nodeType}`);
        }

        // Resolve Credentials if present in nodeData
        if (nodeData?.credentialId) {
            try {
                const credential = await this.credentialsService.findById(nodeData.credentialId);
                if (credential) {
                    if ((nodeType === SampleNodeType.OCR || nodeType === SampleNodeType.SMART_EXTRACTION || nodeType === SampleNodeType.SUMMARIZE) && credential.provider === 'GEMINI') {
                        // Inject API Key into config (nodeData)
                        nodeData.apiKey = credential.accessToken;
                    }
                }
            } catch (err) {
                console.error(`Failed to resolve credential for test execution: ${err.message}`);
            }
        }

        // Mock Context
        const context = {
            executionId: 'test-execution',
            workflowId: 'test-workflow',
            nodeId: 'test-node',
            nodeName: 'Test Node',
            nodeType: nodeType,
            inputs: inputs.map((val: any) => ({
                value: val.value || val,
                nodeId: val.nodeId || 'mock',
                nodeName: val.nodeName || 'Mock',
                edgeId: val.edgeId || 'mock'
            })),
            data: { config: nodeData },
            retryCount: 0,
            maxRetries: 1
        };

        return strategy.executeWithContext(context as any);
    }

    async execute(id: string, executeDto?: ExecuteWorkflowOptions): Promise<{
        message: string;
        executionId: string;
        workflowId: string;
        workflowName: string;
    }> {
        const workflow = await this.findOne(id);

        if (!workflow.isActive) {
            throw new BadRequestException('Cannot execute an inactive workflow');
        }

        // Validate before execution
        const validation = this.validatorService.validate(workflow);
        if (!validation.valid) {
            throw new BadRequestException({
                message: 'Workflow validation failed',
                errors: validation.errors,
            });
        }

        const options = {
            timeout: executeDto?.timeout || workflow.settings?.timeout,
            maxRetries: executeDto?.maxRetries || workflow.settings?.maxRetries,
            retryFailedNodes: executeDto?.retryFailedNodes,
            continueOnError: executeDto?.continueOnError || workflow.settings?.continueOnError,
        };

        const executionId = await this.executorService.startExecution(
            workflow,
            options,
            executeDto?.triggerData,
            executeDto?.clientInfo,
        );

        // Update workflow execution count and last executed time
        await this.workflowModel.findByIdAndUpdate(id, {
            $inc: { executionCount: 1 },
            lastExecutedAt: new Date(),
        });

        return {
            message: 'Execution started',
            executionId,
            workflowId: id,
            workflowName: workflow.name,
        };
    }

    async initiateExecution(id: string, executeDto?: ExecuteWorkflowOptions): Promise<{
        message: string;
        executionId: string;
        workflowId: string;
        workflowName: string;
    }> {
        const workflow = await this.findOne(id);

        if (!workflow.isActive) {
            throw new BadRequestException('Cannot execute an inactive workflow');
        }

        // Validate before execution
        const validation = this.validatorService.validate(workflow);
        if (!validation.valid) {
            throw new BadRequestException({
                message: 'Workflow validation failed',
                errors: validation.errors,
            });
        }

        const options = {
            timeout: executeDto?.timeout || workflow.settings?.timeout,
            maxRetries: executeDto?.maxRetries || workflow.settings?.maxRetries,
            retryFailedNodes: executeDto?.retryFailedNodes,
            continueOnError: executeDto?.continueOnError || workflow.settings?.continueOnError,
        };

        const executionId = await this.executorService.createExecutionEntry(
            workflow,
            options,
            executeDto?.triggerData,
            executeDto?.clientInfo,
        );

        // Update workflow execution count and last executed time
        await this.workflowModel.findByIdAndUpdate(id, {
            $inc: { executionCount: 1 },
            lastExecutedAt: new Date(),
        });

        return {
            message: 'Execution initialized',
            executionId,
            workflowId: id,
            workflowName: workflow.name,
        };
    }

    async startExecution(executionId: string): Promise<{ started: boolean }> {
        const history = await this.historyModel.findById(executionId);
        if (!history) {
            throw new NotFoundException(`Execution ${executionId} not found`);
        }

        const workflow = await this.findOne(history.workflowId.toString());

        await this.executorService.runExecution(executionId, workflow, history.options || {});

        return { started: true };
    }

    async cancelExecution(executionId: string, reason?: string): Promise<{ cancelled: boolean }> {
        if (!Types.ObjectId.isValid(executionId)) {
            throw new BadRequestException('Invalid execution ID');
        }

        const execution = await this.historyModel.findById(executionId);
        if (!execution) {
            throw new NotFoundException(`Execution with ID ${executionId} not found`);
        }

        if (execution.status !== ExecutionStatus.RUNNING && execution.status !== ExecutionStatus.PENDING) {
            throw new BadRequestException(`Cannot cancel execution with status: ${execution.status}`);
        }

        const cancelled = await this.executorService.cancelExecution(executionId, 'user', reason);

        return { cancelled };
    }

    // ==================== EXECUTION HISTORY ====================

    async getHistory(executionId: string): Promise<WorkflowHistoryDocument> {
        if (!Types.ObjectId.isValid(executionId)) {
            throw new BadRequestException('Invalid execution ID');
        }

        const history = await this.historyModel.findById(executionId).exec();
        if (!history) {
            throw new NotFoundException(`Execution with ID ${executionId} not found`);
        }
        return history;
    }

    async listExecutions(query: QueryHistoryDto): Promise<PaginatedResponse<WorkflowHistoryDocument>> {
        const page = query.page || 1;
        const limit = query.limit || 20;

        const filter: any = {};

        if (query.workflowId) {
            if (!Types.ObjectId.isValid(query.workflowId)) {
                throw new BadRequestException('Invalid workflow ID');
            }
            filter.workflowId = new Types.ObjectId(query.workflowId);
        }

        if (query.status) {
            filter.status = query.status;
        }

        const sortField = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

        const total = await this.historyModel.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        const data = await this.historyModel
            .find(filter)
            .sort({ [sortField]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    async getWorkflowExecutions(
        workflowId: string,
        page = 1,
        limit = 20,
    ): Promise<PaginatedResponse<WorkflowHistoryDocument>> {
        return this.listExecutions({
            workflowId,
            page,
            limit,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });
    }

    async getLatestExecutionMetadata(workflowId: string) {
        if (!Types.ObjectId.isValid(workflowId)) {
            throw new BadRequestException('Invalid workflow ID');
        }

        const latest = await this.historyModel
            .findOne({ workflowId: new Types.ObjectId(workflowId) })
            .sort({ updatedAt: -1 })
            .select('_id status updatedAt workflowId')
            .exec();

        return latest;
    }

    async getExecutionLogs(executionId: string) {
        const history = await this.getHistory(executionId);
        return {
            executionId,
            status: history.status,
            logs: history.logs,
            nodeExecutions: history.nodeExecutions.map(node => ({
                nodeId: node.nodeId,
                nodeName: node.nodeName,
                status: node.status,
                logs: node.logs,
            })),
        };
    }

    async getExecutionStats(workflowId?: string): Promise<{
        total: number;
        byStatus: Record<string, number>;
        averageDuration: number;
        successRate: number;
    }> {
        const filter: any = {};
        if (workflowId) {
            if (!Types.ObjectId.isValid(workflowId)) {
                throw new BadRequestException('Invalid workflow ID');
            }
            filter.workflowId = new Types.ObjectId(workflowId);
        }

        const [stats] = await this.historyModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', ExecutionStatus.COMPLETED] }, 1, 0] }
                    },
                    failed: {
                        $sum: { $cond: [{ $eq: ['$status', ExecutionStatus.FAILED] }, 1, 0] }
                    },
                    cancelled: {
                        $sum: { $cond: [{ $eq: ['$status', ExecutionStatus.CANCELLED] }, 1, 0] }
                    },
                    running: {
                        $sum: { $cond: [{ $eq: ['$status', ExecutionStatus.RUNNING] }, 1, 0] }
                    },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', ExecutionStatus.PENDING] }, 1, 0] }
                    },
                    totalDuration: { $sum: '$duration' },
                    completedCount: {
                        $sum: { $cond: [{ $ne: ['$duration', null] }, 1, 0] }
                    },
                },
            },
        ]);

        if (!stats) {
            return {
                total: 0,
                byStatus: {},
                averageDuration: 0,
                successRate: 0,
            };
        }

        return {
            total: stats.total,
            byStatus: {
                [ExecutionStatus.COMPLETED]: stats.completed,
                [ExecutionStatus.FAILED]: stats.failed,
                [ExecutionStatus.CANCELLED]: stats.cancelled,
                [ExecutionStatus.RUNNING]: stats.running,
                [ExecutionStatus.PENDING]: stats.pending,
            },
            averageDuration: stats.completedCount > 0
                ? Math.round(stats.totalDuration / stats.completedCount)
                : 0,
            successRate: stats.total > 0
                ? Math.round((stats.completed / stats.total) * 100)
                : 0,
        };
    }

    async deleteExecution(executionId: string): Promise<{ deleted: boolean }> {
        if (!Types.ObjectId.isValid(executionId)) {
            throw new BadRequestException('Invalid execution ID');
        }

        const result = await this.historyModel.findByIdAndDelete(executionId);
        if (!result) {
            throw new NotFoundException(`Execution with ID ${executionId} not found`);
        }

        return { deleted: true };
    }

    async clearExecutionHistory(workflowId: string): Promise<{ deletedCount: number }> {
        if (!Types.ObjectId.isValid(workflowId)) {
            throw new BadRequestException('Invalid workflow ID');
        }

        const result = await this.historyModel.deleteMany({
            workflowId: new Types.ObjectId(workflowId),
        });

        return { deletedCount: result.deletedCount };
    }

    // ==================== NODE REGISTRY ====================

    getAvailableNodes() {
        return this.nodeRegistry.getAllNodeDefinitions();
    }

    getNodesByCategory() {
        return this.nodeRegistry.getNodesByCategory();
    }

    // ==================== AI ASSISTANT ====================

    async getAIAssistance(dto: {
        type: 'SUGGEST_IDEAS' | 'GENERATE_CODE',
        context: string,
        currentCode?: string,
        prompt?: string,
        language: string,
        credentialId?: string,
        apiKey?: string,
        modelName?: string
    }) {
        let apiKey = dto.apiKey;

        if (dto.credentialId) {
            const credential = await this.credentialsService.findById(dto.credentialId);
            if (credential && credential.provider === 'GEMINI') {
                apiKey = credential.accessToken;
            }
        }

        if (!apiKey) throw new BadRequestException('API Key or Credential is required');

        const model = dto.modelName || 'gemini-1.5-flash';

        if (dto.type === 'SUGGEST_IDEAS') {
            const prompt = `You are an AI coding assistant for a workflow automation tool.
            The user is working on a "Code Node" that receives data from previous nodes.
            
            Incoming Data Context (Schema/Values):
            ${dto.context}
            
            Based on this data, suggest 3-4 creative and useful code ideas the user might want to implement in ${dto.language}.
            Keep ideas concise (max 1 sentence each).
            
            Return ONLY a valid JSON array of strings. No markdown, no explanations.
            Example: ["Combine firstName and lastName", "Calculate total sum of items", "Filter items where price > 100"]`;

            return this.ocrService.generateStructuredData(prompt, apiKey, model);
        } else {
            const prompt = `You are an AI coding assistant. Generate a ${dto.language} function for a workflow node.
            
            Context:
            - Incoming Data: ${dto.context}
            - Current Code: ${dto.currentCode || 'None'}
            - User Request: ${dto.prompt || 'Generate a useful processing function'}
            
            Requirements:
            - The function MUST be named "main".
            - It receives arguments based on the user's mapping (assume arg1, arg2, etc. match the keys in the data).
            - It MUST return an object.
            - Provide ONLY the code. No markdown code blocks, no explanations.
            
            Language: ${dto.language === 'python3' ? 'Python 3' : 'JavaScript (Node.js)'}`;

            const code = await this.ocrService.generateText(prompt, apiKey, model);
            // Clean markdown if AI included it
            return { code: code.replace(/```[a-z]*\n|```/g, '').trim() };
        }
    }
}
