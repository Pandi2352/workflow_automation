import { BaseWorkflowNode } from './workflow-node.interface';
import { OneDriveService } from '../node-services/onedrive.service';

export class OneDriveNode extends BaseWorkflowNode {
    constructor(private readonly oneDriveService: OneDriveService) {
        super();
    }

    async execute(inputs: any[], data?: any): Promise<any> {
        this.log('INFO', 'Starting OneDrive Node execution');

        const config = data?.config || {};
        const operation = config.operation || 'list_files';
        const credentialId = config.credentialId;

        if (!credentialId) {
            throw new Error('No OneDrive credential selected');
        }

        this.log('DEBUG', `Operation: ${operation}, Credential ID: ${credentialId}`);

        try {
            let result;
            if (operation === 'list_files' || operation === 'fetch_files') {
                result = await this.oneDriveService.fetchFiles(credentialId, config.folderId);
            } else if (operation === 'list_folders' || operation === 'fetch_folders') {
                result = await this.oneDriveService.fetchFolders(credentialId, config.parentId);
            } else {
                throw new Error(`Unknown operation: ${operation}`);
            }

            this.log('INFO', `Successfully fetched ${result.length} items`);
            return result;
        } catch (error) {
            this.log('ERROR', `OneDrive operation failed: ${error.message}`);
            throw error;
        }
    }
}
