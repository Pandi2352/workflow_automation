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
            // Search Query: We just ask for "newer than X"
            // Note: Gmail API "after:X" returns list in default order (usually Date DESC).
            // We must fetch pages until we find messages <= lastPollTime to catch the full backlog gap.

            const afterSeconds = Math.floor(lastPollTime / 1000);
            const finalQuery = `${userQuery} after:${afterSeconds}`.trim();

            const allNewMessages: gmail_v1.Schema$Message[] = [];
            let pageToken: string | undefined = undefined;
            let keepFetching = true;

            while (keepFetching) {
                // Fetch next page
                const response: any = await this.gmailService.listMessages(
                    config.credentialId,
                    50, // Larger batch size
                    finalQuery,
                    pageToken
                );

                const messagesStub = response.messages || [];
                pageToken = response.nextPageToken;

                if (messagesStub.length === 0) {
                    keepFetching = false;
                    break;
                }

                // We need details to check internalDate
                // Optimization: In a real system, we might batch request details. 
                // Here we fetch one by one but in parallel for the batch.
                const detailsPromises = messagesStub.map((stub: any) =>
                    this.gmailService.getMessageDetails(config.credentialId, stub.id!)
                );
                const batchDetails = await Promise.all(detailsPromises);

                let foundOldMessage = false;

                for (const details of batchDetails) {
                    const internalDate = parseInt(details.internalDate || '0');
                    if (internalDate > lastPollTime) {
                        allNewMessages.push(details);
                    } else {
                        // We reached messages older than our high-water mark.
                        // Assuming the API returns somewhat ordered list, we *could* stop.
                        // But Gmail order isn't strictly guaranteed by time. 
                        // However, 'after:X' query usually filters them out server side.
                        // So technically we shouldn't receive any <= lastPollTime if the query worked.
                        // BUT if we rely purely on query, and there are 1000 messages, we need to page all of them.
                        // We rely on pageToken.
                    }
                }

                if (!pageToken) {
                    keepFetching = false;
                }

                // Safety break for massive backlogs to avoid infinite loop in one tick
                if (allNewMessages.length >= 200) {
                    this.logger.warn(`Fetched 200 new messages. Pausing fetch to process backlog.`);
                    keepFetching = false;
                }
            }

            if (allNewMessages.length > 0) {
                // SORT CHRONOLOGICALLY (Oldest First)
                // This ensures we process "backlog" in order and don't skip "middle" messages if we crash/stop.
                allNewMessages.sort((a, b) => {
                    return parseInt(a.internalDate || '0') - parseInt(b.internalDate || '0');
                });

                this.logger.log(`[${workflow.name}] Found ${allNewMessages.length} new emails. Triggering executions (Oldest First)...`);

                // CHANGED TO SEQUENTIAL EXECUTION to prevent rate limits
                // We launch executions sequentially to avoid overwhelming the OCD/AI quotas
                const waitForCompletion = false;

                let maxInternalDate = lastPollTime;

                // Launch executions sequentially
                for (const msg of allNewMessages) {
                    const triggerData = {
                        source: 'gmail',
                        event: 'email_received',
                        email: msg
                    };

                    const msgTime = parseInt(msg.internalDate || '0');

                    try {
                        this.logger.log(`Triggering workflow ${workflow._id} for message ${msg.id} (Mode: sequential)`);

                        await this.workflowExecutorService.startExecution(
                            workflow,
                            { waitForCompletion },
                            triggerData
                        );

                        if (msgTime > maxInternalDate) {
                            maxInternalDate = msgTime;
                        }

                        // Add a small delay between triggers to verify pacing
                        await new Promise(resolve => setTimeout(resolve, 500));

                    } catch (execErr) {
                        this.logger.error(`Failed to trigger workflow for message ${msg.id}`, execErr);
                    }
                }

                // await Promise.all(triggerPromises); // Removed parallel execution

                // Final Save: Update the checkpoint to the latest successfully triggered message
                stateDoc.state = { lastPollTime: maxInternalDate };
                stateDoc.markModified('state');
                await stateDoc.save();
            }

        } catch (error: any) {
            this.logger.error(`Failed to process Gmail trigger for ${workflow._id}: ${error.message}`);
        }
    }
}
