import { BaseWorkflowNode } from './workflow-node.interface';
import { GoogleDriveService } from '../node-services/google-drive.service';

export class GoogleDriveNode extends BaseWorkflowNode {
    constructor(private readonly driveService: GoogleDriveService) {
        super();
    }

    async execute(inputs: any[], data?: any): Promise<any> {
        this.log('INFO', 'Starting Google Drive Node execution');

        const config = data?.config || {};
        const operation = config.operation || 'list_files';
        const credentialId = config.credentialId;

        if (!credentialId) {
            throw new Error('No Google Drive credential selected');
        }

        this.log('DEBUG', `Operation: ${operation}, Credential ID: ${credentialId}`);

        try {
            let result;
            if (operation === 'list_files' || operation === 'fetch_files') {
                result = await this.driveService.fetchFiles(credentialId, config.folderId);
            } else if (operation === 'list_folders' || operation === 'fetch_folders') {
                result = await this.driveService.fetchFolders(credentialId, config.parentId);
            } else {
                throw new Error(`Unknown operation: ${operation}`);
            }

            this.log('INFO', `Successfully fetched ${result.length} items`);
            return result;
        } catch (error) {
            this.log('ERROR', `Google Drive operation failed: ${error.message}`);
            throw error;
        }
    }
}
