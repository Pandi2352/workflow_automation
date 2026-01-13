import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as cron from 'node-cron';
import { SampleWorkflowService } from '../sample-workflow.service';
import { OutlookService } from '../node-services/outlook.service';
import { WorkflowExecutorService } from './workflow-executor.service';
import { TriggerState, TriggerStateDocument } from '../schemas/trigger-state.schema';
import { SampleNodeType } from '../enums/node-type.enum';
import { ProcessedItemService } from './processed-item.service';

@Injectable()
export class OutlookPollingService implements OnModuleInit {
    private readonly logger = new Logger(OutlookPollingService.name);
    private isPolling = false;

    constructor(
        private readonly sampleWorkflowService: SampleWorkflowService,
        private readonly outlookService: OutlookService,
        private readonly workflowExecutorService: WorkflowExecutorService,
        private readonly processedItemService: ProcessedItemService,
        @InjectModel(TriggerState.name) private triggerStateModel: Model<TriggerStateDocument>,
    ) { }

    onModuleInit() {
        this.logger.log('Initializing Outlook Polling Service...');
        // Poll every 1 minute
        cron.schedule('*/1 * * * *', () => this.pollOutlook());
    }

    async pollOutlook() {
        if (this.isPolling) {
            return;
        }

        this.isPolling = true;
        try {
            const response = await this.sampleWorkflowService.findAll(1, 1000, true);
            const workflows = response.data;

            for (const workflow of workflows) {
                if (!workflow.isActive) continue;

                const outlookNodes = workflow.nodes.filter(
                    node => node.type === SampleNodeType.OUTLOOK && node.data?.config?.mode === 'trigger'
                );

                for (const node of outlookNodes) {
                    await this.processNode(workflow, node);
                }
            }
        } catch (error) {
            this.logger.error('Error during Outlook polling:', error);
        } finally {
            this.isPolling = false;
        }
    }

    private async processNode(workflow: any, node: any) {
        const config = node.data?.config;
        if (!config || !config.credentialId) return;

        try {
            let stateDoc = await this.triggerStateModel.findOne({
                workflowId: workflow._id,
                nodeId: node.id
            });

            if (!stateDoc) {
                const lookbackWindow = 2 * 60 * 1000; // 2 minutes
                stateDoc = await this.triggerStateModel.create({
                    workflowId: workflow._id,
                    nodeId: node.id,
                    provider: 'outlook',
                    state: { lastPollTime: Date.now() - lookbackWindow }
                });
                this.logger.log(`Initialized trigger state for ${workflow.name} - ${node.nodeName} with lookback`);
            }

            const lastPollTime = stateDoc.state.lastPollTime;
            const lastPollDate = new Date(lastPollTime).toISOString();

            // Microsoft Graph OData Filter
            // Note: Wrap the ISO date in single quotes for OData.
            let filter = `receivedDateTime gt ${lastPollDate}`;
            if (config.query) {
                // If the user provided a custom query, we could combine it. 
                // For now we prioritize the time filter.
            }

            let newMessages = await this.outlookService.listMessages(
                config.credentialId,
                50,
                filter
            );

            // Filter out emails we've already processed (ID-based tracking for 100% deduplication)
            const unprocessedMessages: any[] = [];
            for (const msg of newMessages) {
                const canProcess = await this.processedItemService.shouldProcess(
                    msg.id,
                    `OUTLOOK_TRIGGER_${workflow._id}_${node.id}`
                );
                if (canProcess) {
                    unprocessedMessages.push(msg);
                }
            }

            // Filter by event type if configured
            let finalMessages: any[] = unprocessedMessages;
            if (config.eventType === 'email_with_attachment') {
                finalMessages = unprocessedMessages.filter(msg => msg.hasAttachments === true);
            }

            if (finalMessages.length > 0) {
                // Sort by receivedDateTime ASC (Oldest First)
                finalMessages.sort((a, b) => {
                    return new Date(a.receivedDateTime).getTime() - new Date(b.receivedDateTime).getTime();
                });

                this.logger.log(`[${workflow.name}] Found ${finalMessages.length} new Outlook emails. Triggering executions...`);

                let maxReceivedTime = lastPollTime;

                // Execute sequentially to avoid rate limits
                for (const msg of finalMessages) {
                    const msgTime = new Date(msg.receivedDateTime).getTime();

                    const triggerData = {
                        source: 'outlook',
                        event: 'email_received',
                        email: msg
                    };

                    try {
                        this.logger.log(`Triggering workflow ${workflow._id} for Outlook message ${msg.id} (Mode: sequential)`);

                        await this.workflowExecutorService.startExecution(
                            workflow,
                            { waitForCompletion: false },
                            triggerData
                        );

                        // Mark as processed immediately after starting execution
                        await this.processedItemService.markCompleted(
                            msg.id,
                            `OUTLOOK_TRIGGER_${workflow._id}_${node.id}`
                        );

                        if (msgTime > maxReceivedTime) {
                            maxReceivedTime = msgTime;
                        }

                        // Small delay
                        await new Promise(resolve => setTimeout(resolve, 500));

                    } catch (execErr) {
                        this.logger.error(`Failed to trigger workflow for Outlook message ${msg.id}`, execErr);
                    }
                }

                // await Promise.all(triggerPromises); // Removed parallel execution

                stateDoc.state = { lastPollTime: maxReceivedTime };
                stateDoc.markModified('state');
                await stateDoc.save();
            }
        } catch (error: any) {
            this.logger.error(`Failed to process Outlook trigger for ${workflow._id}: ${error.message}`);
        }
    }
}
