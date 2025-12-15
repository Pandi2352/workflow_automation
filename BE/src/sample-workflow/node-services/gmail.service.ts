import { Injectable } from '@nestjs/common';
import { google, gmail_v1 } from 'googleapis';
import { CredentialsService } from '../../credentials/credentials.service';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GmailService {
    constructor(
        private readonly credentialsService: CredentialsService,
        private readonly configService: ConfigService
    ) { }

    private async getClient(credentialId: string): Promise<gmail_v1.Gmail> {
        const credential = await this.credentialsService.findById(credentialId);
        if (!credential) {
            throw new Error(`Credential with ID ${credentialId} not found`);
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

        return google.gmail({ version: 'v1', auth: authClient });
    }

    async fetchMessages(credentialId: string, maxResults: number = 10, q: string = ''): Promise<gmail_v1.Schema$Message[]> {
        const res = await this.listMessages(credentialId, maxResults, q);
        return res.messages || [];
    }

    async listMessages(credentialId: string, maxResults: number = 10, q: string = '', pageToken?: string): Promise<{ messages?: gmail_v1.Schema$Message[], nextPageToken?: string }> {
        const gmail = await this.getClient(credentialId);

        try {
            const res = await gmail.users.messages.list({
                userId: 'me',
                maxResults,
                q: q,
                pageToken,
            });

            return {
                messages: res.data.messages,
                nextPageToken: res.data.nextPageToken || undefined
            };
        } catch (error: any) {
            console.error(`Failed to fetch Gmail messages:`, error.message);
            throw new Error(`Failed to fetch messages: ${error.message}`);
        }
    }

    async getMessageDetails(credentialId: string, messageId: string): Promise<gmail_v1.Schema$Message> {
        const gmail = await this.getClient(credentialId);
        try {
            const res = await gmail.users.messages.get({
                userId: 'me',
                id: messageId,
            });
            return res.data;
        } catch (error: any) {
            console.error(`Failed to get message details ${messageId}:`, error.message);
            throw new Error(`Failed to get message details: ${error.message}`);
        }
    }

    async getAttachment(credentialId: string, messageId: string, attachmentId: string): Promise<Readable> {
        const gmail = await this.getClient(credentialId);
        try {
            const res = await gmail.users.messages.attachments.get({
                userId: 'me',
                messageId: messageId,
                id: attachmentId
            });

            if (res.data.data) {
                // Attachments are base64url encoded
                const buffer = Buffer.from(res.data.data, 'base64url');
                return Readable.from(buffer);
            }
            throw new Error('No data found in attachment');
        } catch (error: any) {
            console.error(`Failed to download attachment ${attachmentId}:`, error.message);
            throw new Error(`Failed to download attachment: ${error.message}`);
        }
    }
}
