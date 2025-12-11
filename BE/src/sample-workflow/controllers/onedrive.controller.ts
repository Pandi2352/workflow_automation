import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { OneDriveService } from '../node-services/onedrive.service';

@Controller('onedrive')
export class OneDriveController {
    constructor(private readonly oneDriveService: OneDriveService) { }

    @Get('list')
    async listItems(
        @Query('type') type: string,
        @Query('credentialId') credentialId: string,
        @Query('folderId') folderId?: string
    ) {
        if (!credentialId) {
            throw new BadRequestException('Credential ID is required');
        }

        if (type === 'folders') {
            return await this.oneDriveService.fetchFolders(credentialId, folderId);
        } else if (type === 'files') {
            // Note: fetchFiles in service might expect folderId for children
            return await this.oneDriveService.fetchFiles(credentialId, folderId);
        } else {
            // Default or fallback
            return await this.oneDriveService.fetchFiles(credentialId, folderId);
        }
    }
}
