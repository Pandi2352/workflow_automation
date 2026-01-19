import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import type { Request } from 'express';
import { SampleWorkflowService } from './sample-workflow.service';
import { AuditLogService } from './services/audit-log.service';
import { CreateSampleWorkflowDto } from './dto/create-sample-workflow.dto';
import { UpdateSampleWorkflowDto } from './dto/update-sample-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
import { QueryHistoryDto } from './dto/query-history.dto';
import { CancelExecutionDto } from './dto/cancel-execution.dto';
import { extractClientInfo } from '../common/utils/client-info.util';

@ApiTags('Sample Workflows')
@Controller('sample-workflows')
export class SampleWorkflowController {
    constructor(
        private readonly sampleWorkflowService: SampleWorkflowService,
        private readonly auditLogService: AuditLogService,
    ) { }

    // ==================== WORKFLOW CRUD ====================

    @Post()
    @ApiOperation({ summary: 'Create a new workflow' })
    @ApiResponse({ status: 201, description: 'Workflow created successfully' })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    async create(@Body() createDto: CreateSampleWorkflowDto, @Req() req: Request) {
        const workflow = await this.sampleWorkflowService.create(createDto);
        const clientInfo = extractClientInfo(req);
        await this.auditLogService.log('workflow_created', 'workflow', workflow._id.toString(), {
            name: workflow.name,
        }, clientInfo);
        return workflow;
    }

    @Get()
    @ApiOperation({ summary: 'Get all workflows with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    @ApiQuery({ name: 'tags', required: false, type: [String] })
    findAll(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('isActive') isActive?: boolean,
        @Query('tags') tags?: string[],
    ) {
        return this.sampleWorkflowService.findAll(
            page ? Number(page) : 1,
            limit ? Number(limit) : 20,
            isActive,
            tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
        );
    }

    @Get('nodes')
    @ApiOperation({ summary: 'Get all available node types' })
    getAvailableNodes() {
        return this.sampleWorkflowService.getAvailableNodes();
    }

    @Get('nodes/categories')
    @ApiOperation({ summary: 'Get available nodes grouped by category' })
    getNodesByCategory() {
        return this.sampleWorkflowService.getNodesByCategory();
    }

    @Get('audit-logs')
    @ApiOperation({ summary: 'List audit logs' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'action', required: false, type: String })
    @ApiQuery({ name: 'entityType', required: false, type: String })
    @ApiQuery({ name: 'entityId', required: false, type: String })
    listAuditLogs(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('action') action?: string,
        @Query('entityType') entityType?: string,
        @Query('entityId') entityId?: string,
    ) {
        return this.auditLogService.list({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            action,
            entityType,
            entityId,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a workflow by ID' })
    @ApiParam({ name: 'id', description: 'Workflow ID' })
    @ApiResponse({ status: 200, description: 'Workflow found' })
    @ApiResponse({ status: 404, description: 'Workflow not found' })
    findOne(@Param('id') id: string) {
        return this.sampleWorkflowService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a workflow' })
    @ApiParam({ name: 'id', description: 'Workflow ID' })
    @ApiResponse({ status: 200, description: 'Workflow updated successfully' })
    @ApiResponse({ status: 404, description: 'Workflow not found' })
    async update(@Param('id') id: string, @Body() updateDto: UpdateSampleWorkflowDto, @Req() req: Request) {
        const updated = await this.sampleWorkflowService.update(id, updateDto);
        const clientInfo = extractClientInfo(req);
        await this.auditLogService.log('workflow_updated', 'workflow', id, {
            name: updated.name,
        }, clientInfo);
        return updated;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a workflow and its execution history' })
    @ApiParam({ name: 'id', description: 'Workflow ID' })
    @ApiResponse({ status: 200, description: 'Workflow deleted successfully' })
    @ApiResponse({ status: 404, description: 'Workflow not found' })
    async delete(@Param('id') id: string, @Req() req: Request) {
        const result = await this.sampleWorkflowService.delete(id);
        const clientInfo = extractClientInfo(req);
        await this.auditLogService.log('workflow_deleted', 'workflow', id, {}, clientInfo);
        return result;
    }

    @Post('validate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Validate a workflow without saving' })
    @ApiResponse({ status: 200, description: 'Validation result' })
    validate(@Body() createDto: CreateSampleWorkflowDto) {
        return this.sampleWorkflowService.validate(createDto);
    }

    // ==================== WORKFLOW EXECUTION ====================

    @Post('nodes/test')
    @ApiOperation({ summary: 'Test execute a single node' })
    executeNodeTest(@Body() dto: any) {
        return this.sampleWorkflowService.executeNodeTest(dto);
    }

    @Post('ai/assist')
    @ApiOperation({ summary: 'Get AI assistance for coding nodes' })
    getAIAssistance(@Body() dto: any) {
        return this.sampleWorkflowService.getAIAssistance(dto);
    }

    @Post(':id/executions')
    @ApiOperation({ summary: 'Initialize workflow execution' })
    @ApiParam({ name: 'id', description: 'Workflow ID' })
    @ApiResponse({ status: 201, description: 'Execution initialized' })
    createExecution(
        @Param('id') id: string,
        @Body() executeDto: ExecuteWorkflowDto,
        @Req() req: Request,
    ) {
        const clientInfo = extractClientInfo(req);
        return this.sampleWorkflowService.initiateExecution(id, { ...executeDto, clientInfo }).then(async (res) => {
            await this.auditLogService.log('execution_initiated', 'execution', res.executionId, {
                workflowId: id,
                workflowName: res.workflowName,
            }, clientInfo);
            return res;
        });
    }

    @Post('executions/:executionId/start')
    @ApiOperation({ summary: 'Start initialized execution' })
    @ApiParam({ name: 'executionId', description: 'Execution ID' })
    @ApiResponse({ status: 200, description: 'Execution started' })
    async startExecution(@Param('executionId') executionId: string, @Req() req: Request) {
        const result = await this.sampleWorkflowService.startExecution(executionId);
        const clientInfo = extractClientInfo(req);
        await this.auditLogService.log('execution_started', 'execution', executionId, {}, clientInfo);
        return result;
    }

    @Post('executions/:executionId/replay')
    @ApiOperation({ summary: 'Replay an execution from a node (or from start)' })
    @ApiParam({ name: 'executionId', description: 'Execution ID' })
    replayExecution(
        @Param('executionId') executionId: string,
        @Body() body?: { nodeId?: string },
        @Req() req?: Request,
    ) {
        const clientInfo = req ? extractClientInfo(req) : undefined;
        return this.sampleWorkflowService.replayExecution(executionId, body?.nodeId).then(async (res) => {
            await this.auditLogService.log('execution_replayed', 'execution', res.executionId, {
                sourceExecutionId: executionId,
                fromNodeId: body?.nodeId,
                workflowId: res.workflowId,
            }, clientInfo);
            return res;
        });
    }

    @Post('executions/:executionId/retry-failed')
    @ApiOperation({ summary: 'Retry failed nodes for an execution' })
    @ApiParam({ name: 'executionId', description: 'Execution ID' })
    retryFailedNodes(@Param('executionId') executionId: string, @Req() req?: Request) {
        const clientInfo = req ? extractClientInfo(req) : undefined;
        return this.sampleWorkflowService.retryFailedNodes(executionId).then(async (res) => {
            await this.auditLogService.log('execution_retry_failed', 'execution', res.executionId, {
                sourceExecutionId: executionId,
                workflowId: res.workflowId,
            }, clientInfo);
            return res;
        });
    }

    @Post(':id/execute')
    @ApiOperation({ summary: 'Execute a workflow' })
    @ApiParam({ name: 'id', description: 'Workflow ID' })
    @ApiResponse({ status: 201, description: 'Execution started' })
    @ApiResponse({ status: 400, description: 'Workflow is inactive or validation failed' })
    @ApiResponse({ status: 404, description: 'Workflow not found' })
    execute(
        @Param('id') id: string,
        @Body() executeDto: ExecuteWorkflowDto,
        @Req() req: Request,
    ) {
        // Extract client information from request
        const clientInfo = extractClientInfo(req);

        return this.sampleWorkflowService.execute(id, {
            ...executeDto,
            clientInfo,
        }).then(async (res) => {
            await this.auditLogService.log('execution_started', 'execution', res.executionId, {
                workflowId: id,
                workflowName: res.workflowName,
            }, clientInfo);
            return res;
        });
    }

    @Get(':id/executions')
    @ApiOperation({ summary: 'Get all executions for a workflow' })
    @ApiParam({ name: 'id', description: 'Workflow ID' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    getWorkflowExecutions(
        @Param('id') id: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.sampleWorkflowService.getWorkflowExecutions(
            id,
            page ? Number(page) : 1,
            limit ? Number(limit) : 20,
        );
    }

    @Get(':id/executions/latest')
    @ApiOperation({ summary: 'Get lightweight metadata of the latest execution' })
    @ApiParam({ name: 'id', description: 'Workflow ID' })
    getLatestExecution(@Param('id') id: string) {
        return this.sampleWorkflowService.getLatestExecutionMetadata(id);
    }

    @Get(':id/stats')
    @ApiOperation({ summary: 'Get execution statistics for a workflow' })
    @ApiParam({ name: 'id', description: 'Workflow ID' })
    getWorkflowStats(@Param('id') id: string) {
        return this.sampleWorkflowService.getExecutionStats(id);
    }

    @Delete(':id/history')
    @ApiOperation({ summary: 'Clear all execution history for a workflow' })
    @ApiParam({ name: 'id', description: 'Workflow ID' })
    clearWorkflowHistory(@Param('id') id: string) {
        return this.sampleWorkflowService.clearExecutionHistory(id);
    }

    // ==================== EXECUTION HISTORY ====================

    @Get('executions/list')
    @ApiOperation({ summary: 'List all executions with filtering and pagination' })
    listExecutions(@Query() query: QueryHistoryDto) {
        return this.sampleWorkflowService.listExecutions(query);
    }


    @Get('executions/stats')
    @ApiOperation({ summary: 'Get global execution statistics' })
    getGlobalStats() {
        return this.sampleWorkflowService.getExecutionStats();
    }

    @Get('executions/:executionId')
    @ApiOperation({ summary: 'Get execution details by ID' })
    @ApiParam({ name: 'executionId', description: 'Execution ID' })
    @ApiResponse({ status: 200, description: 'Execution found' })
    @ApiResponse({ status: 404, description: 'Execution not found' })
    getExecution(@Param('executionId') executionId: string) {
        return this.sampleWorkflowService.getHistory(executionId);
    }

    @Get('executions/:executionId/logs')
    @ApiOperation({ summary: 'Get execution logs' })
    @ApiParam({ name: 'executionId', description: 'Execution ID' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    getExecutionLogs(
        @Param('executionId') executionId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.sampleWorkflowService.getExecutionLogs(
            executionId,
            page ? Number(page) : 1,
            limit ? Number(limit) : 200,
        );
    }

    @Get('executions/:executionId/nodes/:nodeId/logs')
    @ApiOperation({ summary: 'Get execution logs for a specific node' })
    @ApiParam({ name: 'executionId', description: 'Execution ID' })
    @ApiParam({ name: 'nodeId', description: 'Node ID' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    getNodeExecutionLogs(
        @Param('executionId') executionId: string,
        @Param('nodeId') nodeId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.sampleWorkflowService.getNodeExecutionLogs(
            executionId,
            nodeId,
            page ? Number(page) : 1,
            limit ? Number(limit) : 200,
        );
    }

    @Get('executions/:executionId/status')
    @ApiOperation({ summary: 'Get lightweight execution status' })
    @ApiParam({ name: 'executionId', description: 'Execution ID' })
    getExecutionStatus(@Param('executionId') executionId: string) {
        return this.sampleWorkflowService.getExecutionStatus(executionId);
    }

    @Post('executions/:executionId/cancel')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancel a running execution' })
    @ApiParam({ name: 'executionId', description: 'Execution ID' })
    @ApiResponse({ status: 200, description: 'Execution cancelled' })
    @ApiResponse({ status: 400, description: 'Execution cannot be cancelled' })
    @ApiResponse({ status: 404, description: 'Execution not found' })
    cancelExecution(
        @Param('executionId') executionId: string,
        @Body() cancelDto?: CancelExecutionDto,
    ) {
        return this.sampleWorkflowService.cancelExecution(executionId, cancelDto?.reason);
    }

    @Delete('executions/:executionId')
    @ApiOperation({ summary: 'Delete an execution record' })
    @ApiParam({ name: 'executionId', description: 'Execution ID' })
    @ApiResponse({ status: 200, description: 'Execution deleted' })
    @ApiResponse({ status: 404, description: 'Execution not found' })
    deleteExecution(@Param('executionId') executionId: string) {
        return this.sampleWorkflowService.deleteExecution(executionId);
    }
}
