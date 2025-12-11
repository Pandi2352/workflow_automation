import { BaseWorkflowNode } from './workflow-node.interface';
import { GoogleDriveService } from '../node-services/google-drive.service';
import * as fs from 'fs';
import * as path from 'path';

export class GoogleDriveNode extends BaseWorkflowNode {
    constructor(
        private readonly driveService: GoogleDriveService
    ) {
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
            let files: any[] = [];
            if (operation === 'list_files' || operation === 'fetch_files') {
                files = await this.driveService.fetchFiles(credentialId, config.folderId);
            } else if (operation === 'list_folders' || operation === 'fetch_folders') {
                files = await this.driveService.fetchFolders(credentialId, config.parentId);
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
                // Skip folders
                if (file.mimeType === 'application/vnd.google-apps.folder') continue;

                const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                const destPath = path.join(uploadsDir, fileName);
                const fileUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/uploads/${fileName}`;

                try {
                    const fileStream = await this.driveService.getFileStream(credentialId, file.id);
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
                        file_type: file.mimeType,
                        file_size: file.size,
                        file_page: ''
                    });
                } catch (err: any) {
                    this.log('WARN', `Failed to download file ${file.name}: ${err.message}`);
                }
            }

            return processedFiles;
        } catch (error: any) {
            this.log('ERROR', `Google Drive operation failed: ${error.message}`);
            throw error;
        }
    }
}
