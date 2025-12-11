import { BaseWorkflowNode } from './workflow-node.interface';
import { OneDriveService } from '../node-services/onedrive.service';
import * as fs from 'fs';
import * as path from 'path';

export class OneDriveNode extends BaseWorkflowNode {
    constructor(
        private readonly oneDriveService: OneDriveService
    ) {
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
            let files: any[] = [];
            if (operation === 'list_files' || operation === 'fetch_files') {
                files = await this.oneDriveService.fetchFiles(credentialId, config.folderId);
            } else if (operation === 'list_folders' || operation === 'fetch_folders') {
                files = await this.oneDriveService.fetchFolders(credentialId, config.parentId);
            } else {
                throw new Error(`Unknown operation: ${operation}`);
            }

            this.log('INFO', `Successfully fetched ${files.length} items`);

            // Download to Local Storage and Standardize
            const processedFiles: any[] = [];
            const uploadsDir = path.join(process.cwd(), 'uploads');

            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            for (const file of files) {
                if (file.folder) continue; // Skip folders

                const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                const destPath = path.join(uploadsDir, fileName);
                const fileUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/uploads/${fileName}`;
                const mimeType = file.file?.mimeType || 'application/octet-stream';

                try {
                    const fileStream = await this.oneDriveService.getFileStream(credentialId, file.id);
                    const writer = fs.createWriteStream(destPath);

                    await new Promise<void>((resolve, reject) => {
                        fileStream.pipe(writer);
                        writer.on('finish', () => resolve());
                        writer.on('error', reject);
                    });

                    processedFiles.push({
                        file_id: file.id,
                        key: fileName,
                        name: file.name,
                        url: fileUrl,
                        file_type: mimeType,
                        file_size: file.size,
                        file_page: ''
                    });
                } catch (err: any) {
                    this.log('WARN', `Failed to download file ${file.name}: ${err.message}`);
                }
            }

            return processedFiles;
        } catch (error: any) {
            this.log('ERROR', `OneDrive operation failed: ${error.message}`);
            throw error;
        }
    }
}
