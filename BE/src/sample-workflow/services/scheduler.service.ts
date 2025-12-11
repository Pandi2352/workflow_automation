import { Injectable, OnModuleInit, Logger, Inject, forwardRef } from '@nestjs/common';
import * as cron from 'node-cron';
import { SampleWorkflowService } from '../sample-workflow.service';
import { WorkflowExecutorService } from './workflow-executor.service';
import { SampleNodeType } from '../enums/node-type.enum';

@Injectable()
export class SchedulerService implements OnModuleInit {
    private readonly logger = new Logger(SchedulerService.name);
    private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

    constructor(
        @Inject(forwardRef(() => SampleWorkflowService)) private readonly sampleWorkflowService: SampleWorkflowService,
        private readonly workflowExecutorService: WorkflowExecutorService,
    ) { }

    async onModuleInit() {
        this.logger.log('Initializing Scheduler Service...');
        await this.loadAndScheduleWorkflows();
    }

    async loadAndScheduleWorkflows() {
        // Clear existing tasks
        this.scheduledTasks.forEach(task => task.stop());
        this.scheduledTasks.clear();

        // Fetch all active workflows (limit 1000 for now)
        const response = await this.sampleWorkflowService.findAll(1, 1000, true);
        const workflows = response.data;

        for (const workflow of workflows) {
            if (!workflow.isActive) continue; // Double check

            const scheduleNode = workflow.nodes.find(node => node.type === SampleNodeType.SCHEDULE);

            if (scheduleNode && scheduleNode.data?.config) {
                this.scheduleWorkflow(workflow, scheduleNode);
            }
        }
    }

    private scheduleWorkflow(workflow: any, scheduleNode: any) {
        const config = scheduleNode.data.config;
        const cronPattern = this.getCronPattern(config);

        if (!cronPattern) {
            this.logger.warn(`Invalid schedule config for workflow ${workflow._id}:`, config);
            return;
        }

        if (!cron.validate(cronPattern)) {
            this.logger.warn(`Invalid cron pattern '${cronPattern}' for workflow ${workflow._id}`);
            return;
        }

        this.logger.log(`Scheduling workflow ${workflow.name} (${workflow._id}) with pattern: ${cronPattern}`);

        const task = cron.schedule(cronPattern, async () => {
            this.logger.log(`Triggering scheduled workflow: ${workflow.name}`);
            try {
                await this.workflowExecutorService.startExecution(
                    workflow,
                    {}, // options
                    {   // trigger data
                        source: 'scheduler',
                        executionTime: new Date().toISOString(),
                        pattern: cronPattern
                    }
                );
            } catch (error) {
                this.logger.error(`Failed to execute scheduled workflow ${workflow.name}:`, error);
            }
        });

        this.scheduledTasks.set(workflow._id.toString(), task);
        this.logger.log(`Task registered for workflow ${workflow._id.toString()}`);
        task.start();
    }

    private getCronPattern(config: any): string | null {
        const { interval, value, cronExpression } = config;

        if (interval === 'custom') {
            return cronExpression;
        }

        const val = parseInt(value, 10);
        if (isNaN(val)) return null;

        switch (interval) {
            case 'seconds':
                return `*/${val} * * * * *`;
            case 'minutes':
                return `*/${val} * * * *`;
            case 'hours':
                return `0 */${val} * * *`;
            case 'days':
                return `0 0 */${val} * *`;
            // Add weeks/months logic if needed, simplify for now
            default:
                return null;
        }
    }

    // Call this when a workflow is updated/saved
    async refreshSchedule(workflowId: string) {
        this.logger.log(`Refreshing schedule for workflow: ${workflowId}`);
        const workflow = await this.sampleWorkflowService.findOne(workflowId);
        if (!workflow) {
            this.logger.warn(`Workflow ${workflowId} not found during refresh`);
            return;
        }

        // Stop existing
        const existingTask = this.scheduledTasks.get(workflowId);
        if (existingTask) {
            this.logger.log(`Stopping existing schedule for workflow ${workflowId}`);
            existingTask.stop();
            this.scheduledTasks.delete(workflowId);
        } else {
            this.logger.log(`No existing schedule found for workflow ${workflowId} to stop.`);
        }

        // Reschedule if applicable AND active
        if (workflow.isActive) {
            const scheduleNode = workflow.nodes.find(n => n.type === SampleNodeType.SCHEDULE);
            if (scheduleNode && scheduleNode.data?.config) {
                this.scheduleWorkflow(workflow, scheduleNode);
            }
        }
    }
}
