import { Injectable, NotFoundException } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { CredentialsService } from '../../credentials/credentials.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService {
    constructor(
        private credentialsService: CredentialsService,
        private configService: ConfigService,
    ) { }

    private async getClient(credentialId: string): Promise<drive_v3.Drive> {
        const credential = await this.credentialsService.findById(credentialId);
        if (!credential) {
            throw new NotFoundException(`Credential with ID ${credentialId} not found`);
        }

        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL');

        const authClient = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        authClient.setCredentials({
            access_token: credential.accessToken,
            refresh_token: credential.refreshToken,
            expiry_date: credential.expiryDate,
        });

        return google.drive({ version: 'v3', auth: authClient });
    }

    async fetchFiles(credentialId: string, folderId?: string): Promise<any[]> {
        const client = await this.getClient(credentialId);
        const q = folderId
            ? `'${folderId}' in parents and trashed = false`
            : "'root' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'";

        const res = await client.files.list({
            pageSize: 100,
            fields: 'nextPageToken, files(id, name, mimeType, webViewLink, parents, owners(displayName, emailAddress, photoLink), size, createdTime, modifiedTime, iconLink, thumbnailLink)',
            q: q,
        });

        return res.data.files || [];
    }

    async fetchFolders(credentialId: string, parentId?: string): Promise<any[]> {
        const client = await this.getClient(credentialId);
        let q = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
        if (parentId) {
            q += ` and '${parentId}' in parents`;
        } else {
            q += " and 'root' in parents";
        }

        const res = await client.files.list({
            pageSize: 100,
            fields: 'nextPageToken, files(id, name, mimeType, webViewLink, owners(displayName, emailAddress), createdTime, modifiedTime)',
            q: q,
        });

        return res.data.files || [];
    }

    async getFileStream(credentialId: string, fileId: string): Promise<Readable> {
        const client = await this.getClient(credentialId);

        try {
            const res = await client.files.get(
                { fileId: fileId, alt: 'media' },
                { responseType: 'stream' }
            );

            return res.data;
        } catch (error: any) {
            console.error(`Failed to get stream for file ${fileId}:`, error.message);
            throw new Error(`Failed to get file stream: ${error.message}`);
        }
    }

    async fetchFilesAfter(credentialId: string, folderId: string, date: Date): Promise<any[]> {
        const client = await this.getClient(credentialId);
        const timeString = date.toISOString();
        const q = `'${folderId}' in parents and trashed = false and createdTime > '${timeString}' and mimeType != 'application/vnd.google-apps.folder'`;

        const res = await client.files.list({
            pageSize: 100,
            fields: 'files(id, name, mimeType, webViewLink, parents, size, createdTime, modifiedTime)',
            q: q,
            orderBy: 'createdTime asc' // Process oldest to newest
        });

        return res.data.files || [];
    }
}
