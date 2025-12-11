import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CredentialsService } from '../../credentials/credentials.service';

import { URLSearchParams } from 'url';

@Injectable()
export class OneDriveService {
    private readonly GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

    constructor(
        private credentialsService: CredentialsService,
        private configService: ConfigService,
    ) { }

    private async getAccessToken(credentialId: string): Promise<string> {
        const credential = await this.credentialsService.findById(credentialId);
        if (!credential) {
            throw new NotFoundException(`Credential with ID ${credentialId} not found`);
        }

        // Check if token is expired (expiryDate is in milliseconds usually, or seconds dependent on provider implementation)
        // Google usually stores as Date.now() + expires_in * 1000.
        // Assuming OneDrive stores similar or same.
        const now = Date.now();
        if (credential.expiryDate && now >= credential.expiryDate - 60000) { // Refresh if within 1 minute of expiring
            return this.refreshAccessToken(credential);
        }

        return credential.accessToken;
    }

    private async refreshAccessToken(credential: any): Promise<string> {
        const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID') || '';
        const clientSecret = this.configService.get<string>('MICROSOFT_CLIENT_SECRET') || '';
        const redirectUri = this.configService.get<string>('MICROSOFT_CALLBACK_URL');

        try {
            const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
            const params = new URLSearchParams();
            params.append('client_id', clientId);
            params.append('scope', 'offline_access user.read files.read.all'); // Scopes should match initial auth
            params.append('refresh_token', credential.refreshToken);
            params.append('grant_type', 'refresh_token');
            params.append('client_secret', clientSecret);

            const response = await axios.post(tokenUrl, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { access_token, refresh_token, expires_in } = response.data;

            // Update credential in DB
            await this.credentialsService.update(credential._id, {
                accessToken: access_token,
                refreshToken: refresh_token || credential.refreshToken, // detailed refreshing behavior
                expiryDate: Date.now() + (expires_in * 1000),
            });

            return access_token;
        } catch (error: any) {
            console.error('Failed to refresh OneDrive token:', error.response?.data || error.message);
            throw new Error('Failed to refresh OneDrive access token. Please re-authenticate.');
        }
    }

    async fetchFiles(credentialId: string, folderId?: string): Promise<any[]> {
        const accessToken = await this.getAccessToken(credentialId);

        // If folderId is provided, list children of that folder. Otherwise root.
        const endpoint = folderId
            ? `/me/drive/items/${folderId}/children`
            : '/me/drive/root/children';

        try {
            const response = await axios.get(`${this.GRAPH_API_URL}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                params: {
                    $select: 'id,name,webUrl,file,folder,size,createdDateTime,lastModifiedDateTime,parentReference',
                    $top: 100
                }
            });

            // Filter for files only (exclude folders if exact same behavior as GDrive 'list_files' defaults? 
            // GDrive service query: "mimeType != 'application/vnd.google-apps.folder'"
            // So we should filter out folders here too.
            const items = response.data.value || [];
            return items.filter((item: any) => item.file); // items with 'file' property are files
        } catch (error: any) {
            console.error('OneDrive fetchFiles error:', error.response?.data || error.message);
            throw new Error(`Failed to fetch OneDrive files: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    async fetchFolders(credentialId: string, parentId?: string): Promise<any[]> {
        const accessToken = await this.getAccessToken(credentialId);

        const endpoint = parentId
            ? `/me/drive/items/${parentId}/children`
            : '/me/drive/root/children';

        try {
            const response = await axios.get(`${this.GRAPH_API_URL}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                params: {
                    $select: 'id,name,webUrl,folder,createdDateTime,lastModifiedDateTime',
                    $top: 100
                }
            });

            const items = response.data.value || [];
            return items.filter((item: any) => item.folder); // items with 'folder' property
        } catch (error: any) {
            console.error('OneDrive fetchFolders error:', error.response?.data || error.message);
            throw new Error(`Failed to fetch OneDrive folders: ${error.response?.data?.error?.message || error.message}`);
        }
    }
}
