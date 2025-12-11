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
    async googleAuthCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
        if (!code) {
            return res.status(400).send('No code provided');
        }

        try {
            let credentialId;
            let provider = 'google';

            // If state is 'gmail', handle as Gmail 
            // (Note: This depends on if we share the callback URL. 
            // If we use specific callback route /auth/gmail/callback, we don't need state check here.
            // But since I used standard redirectUri in `getGmailAuthUrl`, it comes back here.)
            // Correction: I should probably just make a separate callback route if I can, 
            // BUT Google Console only allows registered redirect URIs. 
            // If `http://localhost:4000/api/auth/google/callback` is the only one registered, we MUST handle it here.

            if (state === 'gmail') {
                credentialId = await this.authService.handleGmailCallback(code);
                provider = 'gmail';
            } else {
                credentialId = await this.authService.handleGoogleCallback(code);
            }

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
                                    provider: '${provider}'
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

    @Get('gmail')
    gmailAuth(@Res() res: Response) {
        const url = this.authService.getGmailAuthUrl();
        res.redirect(url);
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
