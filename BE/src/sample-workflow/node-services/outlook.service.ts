import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CredentialsService } from '../../credentials/credentials.service';
import { URLSearchParams } from 'url';

@Injectable()
export class OutlookService {
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

        const now = Date.now();
        if (credential.expiryDate && now >= credential.expiryDate - 60000) {
            return this.refreshAccessToken(credential);
        }

        return credential.accessToken;
    }

    private async refreshAccessToken(credential: any): Promise<string> {
        const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID') || '';
        const clientSecret = this.configService.get<string>('MICROSOFT_CLIENT_SECRET') || '';

        try {
            const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
            const params = new URLSearchParams();
            params.append('client_id', clientId);
            params.append('scope', 'offline_access user.read Mail.Read files.read.all');
            params.append('refresh_token', credential.refreshToken);
            params.append('grant_type', 'refresh_token');
            params.append('client_secret', clientSecret);

            const response = await axios.post(tokenUrl, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { access_token, refresh_token, expires_in } = response.data;

            await this.credentialsService.update(credential._id, {
                accessToken: access_token,
                refreshToken: refresh_token || credential.refreshToken,
                expiryDate: Date.now() + (expires_in * 1000),
            });

            return access_token;
        } catch (error: any) {
            console.error('Failed to refresh Outlook token:', error.response?.data || error.message);
            throw new Error('Failed to refresh Outlook access token. Please re-authenticate.');
        }
    }

    async listMessages(credentialId: string, top: number = 10, filter?: string): Promise<any[]> {
        const accessToken = await this.getAccessToken(credentialId);

        try {
            const response = await axios.get(`${this.GRAPH_API_URL}/me/messages`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                params: {
                    $top: top,
                    $select: 'id,subject,bodyPreview,receivedDateTime,from,toRecipients,hasAttachments',
                    $filter: filter,
                    $orderby: 'receivedDateTime desc'
                }
            });

            return response.data.value || [];
        } catch (error: any) {
            console.error('Outlook listMessages error:', error.response?.data || error.message);
            throw new Error(`Failed to fetch Outlook messages: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    async getMessage(credentialId: string, messageId: string): Promise<any> {
        const accessToken = await this.getAccessToken(credentialId);

        try {
            const response = await axios.get(`${this.GRAPH_API_URL}/me/messages/${messageId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('Outlook getMessage error:', error.response?.data || error.message);
            throw new Error(`Failed to fetch Outlook message: ${error.response?.data?.error?.message || error.message}`);
        }
    }
}
