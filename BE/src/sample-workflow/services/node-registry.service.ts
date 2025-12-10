import { Injectable } from '@nestjs/common';
import { SampleNodeType } from '../enums/node-type.enum';
import { BaseWorkflowNode } from '../nodes/workflow-node.interface';
import { GoogleDriveNode } from '../nodes/google-drive.node';
import { GoogleDriveService } from '../node-services/google-drive.service';

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

    constructor(private readonly googleDriveService: GoogleDriveService) {
        this.registerDefaultNodes();
    }

    private registerDefaultNodes(): void {
        // Register node instances
        this.nodeInstances.set(SampleNodeType.GOOGLE_DRIVE, new GoogleDriveNode(this.googleDriveService));

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
