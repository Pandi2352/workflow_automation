import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { Workflow } from './schemas/workflow.schema';

@ApiTags('workflows')
@Controller('workflows')
export class WorkflowsController {
    constructor(private readonly workflowsService: WorkflowsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new workflow' })
    @ApiResponse({ status: 201, description: 'The workflow has been successfully created.' })
    create(@Body() createWorkflowDto: CreateWorkflowDto): Promise<Workflow> {
        return this.workflowsService.create(createWorkflowDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all workflows' })
    @ApiResponse({ status: 200, description: 'Return all workflows.' })
    findAll(): Promise<Workflow[]> {
        return this.workflowsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a workflow by ID' })
    @ApiResponse({ status: 200, description: 'Return the workflow.' })
    @ApiResponse({ status: 404, description: 'Workflow not found.' })
    findOne(@Param('id') id: string): Promise<Workflow> {
        return this.workflowsService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a workflow' })
    @ApiResponse({ status: 200, description: 'The workflow has been successfully updated.' })
    @ApiResponse({ status: 404, description: 'Workflow not found.' })
    update(@Param('id') id: string, @Body() updateWorkflowDto: CreateWorkflowDto): Promise<Workflow> {
        return this.workflowsService.update(id, updateWorkflowDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a workflow' })
    @ApiResponse({ status: 200, description: 'The workflow has been successfully deleted.' })
    @ApiResponse({ status: 404, description: 'Workflow not found.' })
    remove(@Param('id') id: string): Promise<void> {
        return this.workflowsService.remove(id);
    }
}
