import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as cron from 'node-cron';
import { SampleWorkflowService } from '../sample-workflow.service';
import { GoogleDriveService } from '../node-services/google-drive.service';
import { WorkflowExecutorService } from './workflow-executor.service';
import { TriggerState, TriggerStateDocument } from '../schemas/trigger-state.schema';
import { SampleNodeType } from '../enums/node-type.enum';

@Injectable()
export class GoogleDrivePollingService implements OnModuleInit {
    private readonly logger = new Logger(GoogleDrivePollingService.name);
    private isPolling = false;

    constructor(
        private readonly sampleWorkflowService: SampleWorkflowService,
        private readonly googleDriveService: GoogleDriveService,
        private readonly workflowExecutorService: WorkflowExecutorService,
        @InjectModel(TriggerState.name) private triggerStateModel: Model<TriggerStateDocument>,
    ) { }

    onModuleInit() {
        this.logger.log('Initializing Google Drive Polling Service...');
        // Poll every 1 minute
        cron.schedule('*/1 * * * *', () => this.pollGoogleDrive());
    }

    async pollGoogleDrive() {
        if (this.isPolling) {
            this.logger.debug('Polling already in progress, skipping...');
            return;
        }

        this.isPolling = true;
        try {
            // Fetch all active workflows
            const response = await this.sampleWorkflowService.findAll(1, 1000, true);
            const workflows = response.data;

            for (const workflow of workflows) {
                if (!workflow.isActive) continue;

                const driveNodes = workflow.nodes.filter(
                    node => node.type === SampleNodeType.GOOGLE_DRIVE && node.data?.config?.mode === 'trigger'
                );

                for (const node of driveNodes) {
                    await this.processNode(workflow, node);
                }
            }
        } catch (error) {
            this.logger.error('Error during Google Drive polling:', error);
        } finally {
            this.isPolling = false;
        }
    }

    private async processNode(workflow: any, node: any) {
        const config = node.data?.config;
        if (!config || !config.credentialId || !config.folderId) return;

        try {
            // Get last state
            let stateDoc = await this.triggerStateModel.findOne({
                workflowId: workflow._id,
                nodeId: node.id
            });

            if (!stateDoc) {
                // First run: Initialize state, don't trigger (or optional backfill?)
                // Strategy: Trigger on NEW files from NOW.
                stateDoc = await this.triggerStateModel.create({
                    workflowId: workflow._id,
                    nodeId: node.id,
                    provider: 'google-drive',
                    state: { lastPollTime: new Date().toISOString() }
                });
                this.logger.log(`Initialized trigger state for ${workflow.name} - ${node.nodeName}`);
                return;
            }

            const lastPollTime = new Date(stateDoc.state.lastPollTime);

            // Fetch ONLY new files since lastPollTime
            const newFiles = await this.googleDriveService.fetchFilesAfter(
                config.credentialId,
                config.folderId,
                lastPollTime
            );

            if (newFiles.length > 0) {
                this.logger.log(`Found ${newFiles.length} new files for ${workflow.name} in folder ${config.folderId}`);

                // Update state to the LATEST file's createdTime (or current time)
                const maxCreatedTime = newFiles.reduce((max, file) => {
                    const t = new Date(file.createdTime).getTime();
                    return t > max ? t : max;
                }, lastPollTime.getTime());

                // Execute Workflow for EACH file (Iterative Trigger)
                for (const file of newFiles) {
                    // Prepare trigger data
                    const triggerData = {
                        source: 'google-drive',
                        event: 'file_created',
                        file: file
                    };

                    // START EXECUTION
                    await this.workflowExecutorService.startExecution(
                        workflow,
                        {}, // options
                        triggerData
                    );
                }

                // Save new state
                stateDoc.state = { lastPollTime: new Date(maxCreatedTime).toISOString() };
                stateDoc.markModified('state');
                await stateDoc.save();
            }

        } catch (error: any) {
            this.logger.error(`Failed to process drive trigger for ${workflow._id}: ${error.message}`);
        }
    }
}
