import { Controller, Get, Query, BadRequestException, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GoogleDriveService } from '../node-services/google-drive.service';

@ApiTags('Google Drive')
@Controller('google-drive')
export class GoogleDriveController {
    constructor(
        private readonly googleDriveService: GoogleDriveService
    ) { }

    @Get('list')
    @ApiOperation({ summary: 'List files or folders from Google Drive using a stored credential' })
    @ApiQuery({ name: 'credentialId', required: true })
    @ApiQuery({ name: 'folderId', required: false, description: 'Parent folder ID to list contents of' })
    @ApiQuery({ name: 'type', required: false, enum: ['files', 'folders'], description: 'Filter by type (default: all)' })
    async listResources(
        @Query('credentialId') credentialId: string,
        @Query('folderId') folderId?: string,
        @Query('type') type?: 'files' | 'folders'
    ) {
        if (!credentialId) {
            throw new BadRequestException('Credential ID is required');
        }

        if (type === 'folders') {
            return this.googleDriveService.fetchFolders(credentialId, folderId);
        } else {
            // Fetch everything (files) - fetchFiles handles the 'trashed=false' query
            // If we want ONLY files (not folders), GoogleDriveService might need adjustment, but usually list is mixed.
            // My fetchFiles implementation excludes folders if folderId is NOT provided?
            // checking fetchFiles: `mimeType != 'application/vnd.google-apps.folder'` if folderId is undefined.
            // If folderId IS provided, it just lists children (could be folders or files).

            // For the purpose of "Folder Selector", we want `fetchFolders`.
            // For operation "List Files", we might want `fetchFiles`.
            return this.googleDriveService.fetchFiles(credentialId, folderId);
        }
    }
}
