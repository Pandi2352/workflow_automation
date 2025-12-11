import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import axios from 'axios';
import { URLSearchParams } from 'url';
import { CredentialsService } from '../credentials/credentials.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    private oauth2Client;

    constructor(
        private credentialsService: CredentialsService,
        private configService: ConfigService,
    ) {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:4000/api/auth/google/callback';

        console.log('Initializing GoogleOAuth:', {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            redirectUri
        });

        if (!clientId || !clientSecret) {
            console.warn('Google Client ID/Secret not found in environment variables.');
        }

        this.oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );
    }

    getGoogleAuthUrl(): string {
        const scopes = [
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/gmail.readonly'
        ];

        const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:4000/api/auth/google/callback';

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline', // Crucial for getting refresh_token
            scope: scopes,
            prompt: 'consent', // Force consent to ensure refresh_token is returned
            redirect_uri: redirectUri
        });
    }


    async handleGoogleCallback(code: string): Promise<string> {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);

            // Fetch user info to create a meaningful name for the credential
            const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
            const userInfo = await oauth2.userinfo.get();

            const name = userInfo.data.name || userInfo.data.email || 'Google Drive Account';

            const credential = await this.credentialsService.create({
                name: name,
                provider: 'google',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date,
                metadata: userInfo.data,
            }) as any;

            return credential._id.toString();
        } catch (error) {
            console.error('Error in Google Callback:', error);
            throw new InternalServerErrorException('Failed to authenticate with Google');
        }
    }

    getGmailAuthUrl(): string {
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/gmail.readonly'
        ];

        const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:4000/api/auth/google/callback';

        // Note: Using the same oauth2Client as Google Drive since it shares Client ID/Secret
        // But we generate a URL with DIFFERENT scopes.
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
            redirect_uri: redirectUri,
            state: 'gmail' // We can use state to distinguish in callback if needed, but we can also just use a separate callback route that calls a specific handler
        });
    }

    async handleGmailCallback(code: string): Promise<string> {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);

            const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
            const userInfo = await oauth2.userinfo.get();

            const name = (userInfo.data.name || userInfo.data.email || 'Gmail Account') + ' (Gmail)';

            // Save with provider 'gmail'
            const credential = await this.credentialsService.create({
                name: name,
                provider: 'gmail', // Distinct provider
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date,
                metadata: userInfo.data,
            }) as any;

            return credential._id.toString();
        } catch (error) {
            console.error('Error in Gmail Callback:', error);
            throw new InternalServerErrorException('Failed to authenticate with Gmail');
        }
    }

    getMicrosoftAuthUrl(): string {
        const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID');
        const redirectUri = this.configService.get<string>('MICROSOFT_CALLBACK_URL') || 'http://localhost:4000/api/auth/microsoft/callback';
        const scopes = [
            'offline_access',
            'user.read',
            'files.read.all'
        ];

        const params = new URLSearchParams({
            client_id: clientId || '',
            response_type: 'code',
            redirect_uri: redirectUri,
            response_mode: 'query',
            scope: scopes.join(' '),
            state: '12345' // Ideally random
        });

        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
    }

    async handleMicrosoftCallback(code: string): Promise<string> {
        const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID');
        const clientSecret = this.configService.get<string>('MICROSOFT_CLIENT_SECRET');
        const redirectUri = this.configService.get<string>('MICROSOFT_CALLBACK_URL') || 'http://localhost:4000/api/auth/microsoft/callback';

        try {
            // Exchange code for tokens
            const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
            const params = new URLSearchParams();
            params.append('client_id', clientId || '');
            params.append('scope', 'offline_access user.read files.read.all');
            params.append('code', code);
            params.append('redirect_uri', redirectUri);
            params.append('grant_type', 'authorization_code');
            params.append('client_secret', clientSecret || '');

            const tokenResponse = await axios.post(tokenUrl, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { access_token, refresh_token, expires_in } = tokenResponse.data;

            // Fetch User Profile
            const profileResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const profile = profileResponse.data;
            const name = profile.displayName || profile.mail || profile.userPrincipalName || 'OneDrive Account';

            // Create Credential
            const credential = await this.credentialsService.create({
                name: name,
                provider: 'microsoft',
                accessToken: access_token,
                refreshToken: refresh_token,
                expiryDate: Date.now() + (expires_in * 1000), // expires_in is seconds
                metadata: profile,
            }) as any;

            return credential._id.toString();

        } catch (error: any) {
            console.error('Error in Microsoft Callback:', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to authenticate with Microsoft');
        }
    }
}
