import { Injectable } from '@nestjs/common';
import { SampleNodeType } from '../enums/node-type.enum';
import { BaseWorkflowNode } from '../nodes/workflow-node.interface';
import { GoogleDriveNode } from '../nodes/google-drive.node';
import { OneDriveNode } from '../nodes/onedrive.node';
import { GmailNode } from '../nodes/gmail.node';
import { GoogleDriveService } from '../node-services/google-drive.service';
import { OneDriveService } from '../node-services/onedrive.service';
import { GmailService } from '../node-services/gmail.service';
import { ScheduleNode } from '../nodes/schedule.node';
import { OCRNodeStrategy } from '../nodes/ocr.node';
import { OCRService } from '../node-services/ocr.service';

export interface NodeDefinition {
    type: string;
    name: string;
    description: string;
    category: string;
    inputs: number;
    outputs: number;
    configSchema?: Record<string, any>;
}

@Injectable()
export class NodeRegistryService {
    private nodeInstances: Map<string, BaseWorkflowNode> = new Map();
    private nodeDefinitions: Map<string, NodeDefinition> = new Map();

    constructor(
        private readonly googleDriveService: GoogleDriveService,
        private readonly oneDriveService: OneDriveService,
        private readonly gmailService: GmailService,
        private readonly ocrService: OCRService
    ) {
        this.registerDefaultNodes();
    }

    private registerDefaultNodes(): void {
        // Register node instances
        this.nodeInstances.set(SampleNodeType.GOOGLE_DRIVE, new GoogleDriveNode(this.googleDriveService));
        this.nodeInstances.set(SampleNodeType.ONEDRIVE, new OneDriveNode(this.oneDriveService));
        this.nodeInstances.set(SampleNodeType.GMAIL, new GmailNode(this.gmailService));
        this.nodeInstances.set(SampleNodeType.SCHEDULE, new ScheduleNode());
        this.nodeInstances.set(SampleNodeType.OCR, new OCRNodeStrategy(this.ocrService));

        // Register node definitions
        this.nodeDefinitions.set(SampleNodeType.GOOGLE_DRIVE, {
            type: SampleNodeType.GOOGLE_DRIVE,
            name: 'Google Drive',
            description: 'Fetch files and folders from Google Drive',
            category: 'Google',
            inputs: 0,
            outputs: 1,
            configSchema: {
                operation: {
                    type: 'select',
                    options: ['fetch_files', 'fetch_folders'],
                    default: 'fetch_files',
                    description: 'Operation to perform'
                },
                folderId: {
                    type: 'folder_selector',
                    description: 'Folder ID to list files from (optional)',
                    condition: { operation: 'fetch_files' }
                },
                parentId: {
                    type: 'string',
                    description: 'Parent Folder ID to list folders from (optional)',
                    condition: { operation: 'fetch_folders' }
                },
                credentials: {
                    type: 'credential',
                    provider: 'google',
                    description: 'Google Drive Credentials'
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.ONEDRIVE, {
            type: SampleNodeType.ONEDRIVE,
            name: 'OneDrive (Microsoft)',
            description: 'Fetch files and folders from OneDrive',
            category: 'Microsoft',
            inputs: 0,
            outputs: 1,
            configSchema: {
                operation: {
                    type: 'select',
                    options: ['fetch_files', 'fetch_folders'],
                    default: 'fetch_files',
                    description: 'Operation to perform'
                },
                folderId: {
                    type: 'string', // Eventually could be folder_selector if UI supports it for OneDrive
                    description: 'Folder ID to list files from (optional)',
                    condition: { operation: 'fetch_files' }
                },
                parentId: {
                    type: 'string',
                    description: 'Parent Folder ID to list folders from (optional)',
                    condition: { operation: 'fetch_folders' }
                },
                credentials: {
                    type: 'credential',
                    provider: 'microsoft',
                    description: 'OneDrive (Microsoft) Credentials'
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.GMAIL, {
            type: SampleNodeType.GMAIL,
            name: 'Gmail (Trigger)',
            description: 'Fetch emails and attachments from Gmail',
            category: 'Google',
            inputs: 0,
            outputs: 1,
            configSchema: {
                query: {
                    type: 'string',
                    description: 'Search Query (e.g. "subject:invoice has:attachment")',
                    default: ''
                },
                maxResults: {
                    type: 'number',
                    description: 'Max emails to fetch',
                    default: 5
                },
                credentials: {
                    type: 'credential',
                    provider: 'gmail',
                    description: 'Gmail Credentials'
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.SCHEDULE, {
            type: SampleNodeType.SCHEDULE,
            name: 'Schedule Trigger',
            description: 'Trigger workflow at specific intervals',
            category: 'Trigger',
            inputs: 0,
            outputs: 1,
            configSchema: {
                interval: {
                    type: 'select',
                    options: ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'custom'],
                    default: 'hours',
                    description: 'Trigger Interval'
                },
                value: {
                    type: 'number',
                    description: 'Value (e.g., every N seconds)',
                    condition: { interval: ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months'] }
                },
                cronExpression: {
                    type: 'string',
                    description: 'Cron Expression (e.g. "*/5 * * * *")',
                    condition: { interval: 'custom' }
                }
            }
        });

        this.nodeDefinitions.set(SampleNodeType.OCR, {
            type: SampleNodeType.OCR,
            name: 'OCR Processing (Gemini)',
            description: 'Extract text and analyze files using Gemini AI',
            category: 'AI / Machine Learning',
            inputs: 1,
            outputs: 1,
            configSchema: {
                apiKey: {
                    type: 'string',
                    description: 'Gemini API Key',
                    default: ''
                },
                modelName: {
                    type: 'select',
                    options: ['gemini-1.5-flash', 'gemini-1.5-pro'],
                    default: 'gemini-1.5-flash',
                    description: 'Model Name'
                },
                prompt: {
                    type: 'string',
                    description: 'Custom Prompt (Optional)',
                    default: ''
                }
            }
        });
    }

    getNode(type: string): BaseWorkflowNode | undefined {
        return this.nodeInstances.get(type);
    }

    getNodeDefinition(type: string): NodeDefinition | undefined {
        return this.nodeDefinitions.get(type);
    }

    getAllNodeDefinitions(): NodeDefinition[] {
        return Array.from(this.nodeDefinitions.values());
    }

    getNodesByCategory(): Record<string, NodeDefinition[]> {
        const categorized: Record<string, NodeDefinition[]> = {};

        for (const def of this.nodeDefinitions.values()) {
            if (!categorized[def.category]) {
                categorized[def.category] = [];
            }
            categorized[def.category].push(def);
        }

        return categorized;
    }

    hasNode(type: string): boolean {
        return this.nodeInstances.has(type);
    }
}
