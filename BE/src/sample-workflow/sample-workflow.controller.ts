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
import { CreateSampleWorkflowDto } from './dto/create-sample-workflow.dto';
import { UpdateSampleWorkflowDto } from './dto/update-sample-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
import { QueryHistoryDto } from './dto/query-history.dto';
import { CancelExecutionDto } from './dto/cancel-execution.dto';
import { extractClientInfo } from '../common/utils/client-info.util';

@ApiTags('Sample Workflows')
@Controller('sample-workflows')
export class SampleWorkflowController {
    constructor(private readonly sampleWorkflowService: SampleWorkflowService) { }

    // ==================== WORKFLOW CRUD ====================

    @Post()
    @ApiOperation({ summary: 'Create a new workflow' })
    @ApiResponse({ status: 201, description: 'Workflow created successfully' })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    create(@Body() createDto: CreateSampleWorkflowDto) {
        return this.sampleWorkflowService.create(createDto);
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
    update(@Param('id') id: string, @Body() updateDto: UpdateSampleWorkflowDto) {
        return this.sampleWorkflowService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a workflow and its execution history' })
    @ApiParam({ name: 'id', description: 'Workflow ID' })
    @ApiResponse({ status: 200, description: 'Workflow deleted successfully' })
    @ApiResponse({ status: 404, description: 'Workflow not found' })
    delete(@Param('id') id: string) {
        return this.sampleWorkflowService.delete(id);
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
        return this.sampleWorkflowService.initiateExecution(id, { ...executeDto, clientInfo });
    }

    @Post('executions/:executionId/start')
    @ApiOperation({ summary: 'Start initialized execution' })
    @ApiParam({ name: 'executionId', description: 'Execution ID' })
    @ApiResponse({ status: 200, description: 'Execution started' })
    startExecution(@Param('executionId') executionId: string) {
        return this.sampleWorkflowService.startExecution(executionId);
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
