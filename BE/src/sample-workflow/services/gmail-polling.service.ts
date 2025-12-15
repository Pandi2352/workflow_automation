import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as cron from 'node-cron';
import { gmail_v1 } from 'googleapis';
import { SampleWorkflowService } from '../sample-workflow.service';
import { GmailService } from '../node-services/gmail.service';
import { WorkflowExecutorService } from './workflow-executor.service';
import { TriggerState, TriggerStateDocument } from '../schemas/trigger-state.schema';
import { SampleNodeType } from '../enums/node-type.enum';

@Injectable()
export class GmailPollingService implements OnModuleInit {
    private readonly logger = new Logger(GmailPollingService.name);
    private isPolling = false;

    constructor(
        private readonly sampleWorkflowService: SampleWorkflowService,
        private readonly gmailService: GmailService,
        private readonly workflowExecutorService: WorkflowExecutorService,
        @InjectModel(TriggerState.name) private triggerStateModel: Model<TriggerStateDocument>,
    ) { }

    onModuleInit() {
        this.logger.log('Initializing Gmail Polling Service...');
        // Poll every 1 minute (Standard interval)
        cron.schedule('*/1 * * * *', () => this.pollGmail());
    }

    async pollGmail() {
        if (this.isPolling) {
            return;
        }

        this.isPolling = true;
        try {
            // Fetch all active workflows
            const response = await this.sampleWorkflowService.findAll(1, 1000, true);
            const workflows = response.data;

            for (const workflow of workflows) {
                if (!workflow.isActive) continue;

                const gmailNodes = workflow.nodes.filter(
                    node => node.type === SampleNodeType.GMAIL && node.data?.config?.mode === 'trigger'
                );

                for (const node of gmailNodes) {
                    await this.processNode(workflow, node);
                }
            }
        } catch (error) {
            this.logger.error('Error during Gmail polling:', error);
        } finally {
            this.isPolling = false;
        }
    }

    private async processNode(workflow: any, node: any) {
        const config = node.data?.config;
        if (!config || !config.credentialId) return;

        try {
            // Get last state
            let stateDoc = await this.triggerStateModel.findOne({
                workflowId: workflow._id,
                nodeId: node.id
            });

            if (!stateDoc) {
                // First run: Initialize state.
                // We use a slight lookback (e.g., 2 minutes) to ensure we catch any emails 
                // that arrived while the user was activating the workflow or just before the first poll tick.
                const lookbackWindow = 2 * 60 * 1000; // 2 minutes
                stateDoc = await this.triggerStateModel.create({
                    workflowId: workflow._id,
                    nodeId: node.id,
                    provider: 'gmail',
                    state: { lastPollTime: Date.now() - lookbackWindow }
                });
                this.logger.log(`Initialized trigger state for ${workflow.name} - ${node.nodeName} with lookback`);
            }

            const lastPollTime = stateDoc.state.lastPollTime;

            // Search Query
            const userQuery = config.query || '';
            const afterSeconds = Math.floor(lastPollTime / 1000);
            const finalQuery = `${userQuery} after:${afterSeconds}`.trim();

            // this.logger.debug(`[${workflow.name}] Querying Gmail: "${finalQuery}"`); 

            const messages = await this.gmailService.fetchMessages(
                config.credentialId,
                20, // Limit check to 20 to avoid overload
                finalQuery
            );

            // Filter strictly by internalDate to be precise
            const recentMessages: gmail_v1.Schema$Message[] = [];
            let maxInternalDate = lastPollTime;

            for (const msgStub of messages) {
                const details = await this.gmailService.getMessageDetails(config.credentialId, msgStub.id!);
                const internalDate = parseInt(details.internalDate || '0');

                if (internalDate > lastPollTime) {
                    recentMessages.push(details);
                    if (internalDate > maxInternalDate) {
                        maxInternalDate = internalDate;
                    }
                }
            }

            if (recentMessages.length > 0) {
                this.logger.log(`[${workflow.name}] Found ${recentMessages.length} new emails. Triggering executions...`);

                // Execute Workflow for EACH email
                for (const msg of recentMessages) {
                    const triggerData = {
                        source: 'gmail',
                        event: 'email_received',
                        email: msg
                    };

                    // START EXECUTION
                    this.logger.log(`Triggering workflow ${workflow._id} for message ${msg.id}`);
                    await this.workflowExecutorService.startExecution(
                        workflow,
                        {}, // options
                        triggerData
                    );
                }

                // Save new state
                stateDoc.state = { lastPollTime: maxInternalDate };
                stateDoc.markModified('state');
                await stateDoc.save();
            }

        } catch (error: any) {
            this.logger.error(`Failed to process Gmail trigger for ${workflow._id}: ${error.message}`);
        }
    }
}
