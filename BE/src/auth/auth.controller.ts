import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('google')
    googleAuth(@Res() res: Response) {
        const url = this.authService.getGoogleAuthUrl();
        res.redirect(url);
    }

    @Get('google/callback')
    async googleAuthCallback(@Query('code') code: string, @Res() res: Response) {
        if (!code) {
            return res.status(400).send('No code provided');
        }

        try {
            const credentialId = await this.authService.handleGoogleCallback(code);

            const html = `
                <html>
                    <body>
                        <h1>Authentication Successful</h1>
                        <p>You can close this window now.</p>
                        <script>
                            if (window.opener) {
                                window.opener.postMessage({ 
                                    type: 'GOOGLE_AUTH_SUCCESS', 
                                    credentialId: '${credentialId}',
                                    provider: 'google'
                                }, '*');
                                window.close();
                            }
                        </script>
                    </body>
                </html>
            `;
            res.send(html);
        } catch (error) {
            res.status(500).send(`Authentication failed: ${error.message}`);
        }
    }

    @Get('microsoft')
    microsoftAuth(@Res() res: Response) {
        const url = this.authService.getMicrosoftAuthUrl();
        res.redirect(url);
    }

    @Get('microsoft/callback')
    async microsoftAuthCallback(@Query('code') code: string, @Res() res: Response) {
        if (!code) {
            return res.status(400).send('No code provided');
        }

        try {
            const credentialId = await this.authService.handleMicrosoftCallback(code);

            const html = `
                <html>
                    <body>
                        <h1>Authentication Successful</h1>
                        <p>You can close this window now.</p>
                        <script>
                            if (window.opener) {
                                window.opener.postMessage({ 
                                    type: 'GOOGLE_AUTH_SUCCESS', // Using same message type for simplicity
                                    credentialId: '${credentialId}',
                                    provider: 'microsoft'
                                }, '*');
                                window.close();
                            }
                        </script>
                    </body>
                </html>
            `;
            res.send(html);
        } catch (error) {
            res.status(500).send(`Authentication failed: ${error.message}`);
        }
    }
}
