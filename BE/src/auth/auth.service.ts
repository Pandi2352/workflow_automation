import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
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
            'https://www.googleapis.com/auth/userinfo.email'
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
            }) as any; // Cast to any to avoid strict check issues temporarily or rely on updated service return type

            return credential._id.toString();
        } catch (error) {
            console.error('Error in Google Callback:', error);
            throw new InternalServerErrorException('Failed to authenticate with Google');
        }
    }
}
