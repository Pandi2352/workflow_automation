import { BaseWorkflowNode } from './workflow-node.interface';
import { GmailService } from '../node-services/gmail.service';
import * as fs from 'fs';
import * as path from 'path';

export class GmailNode extends BaseWorkflowNode {
    constructor(
        private readonly gmailService: GmailService
    ) {
        super();
    }

    async execute(inputs: any[], data?: any): Promise<any> {
        this.log('INFO', 'Starting Gmail Node execution');

        const config = data?.config || {};
        const credentialId = config.credentialId;
        const maxResults = config.maxResults || 5;
        const query = config.query || '';

        if (!credentialId) {
            throw new Error('No Gmail credential selected');
        }

        try {
            // Check if we were triggered by a specific email event
            const triggerData = data?._triggerData;
            let messages: any[] = [];

            if (triggerData && triggerData.source === 'gmail' && triggerData.email) {
                this.log('INFO', `Processing triggered execution for message: ${triggerData.email.id}`);
                // Use the email directly provided by the trigger service
                // Wrap it in a structure that matches the list response stub, but we already have the full details?
                // FetchMessages returns {id, threadId}. triggerData.email IS the full message usually.
                // But let's be safe. If we have the ID, let's treat it as the message list.
                messages = [{ id: triggerData.email.id, threadId: triggerData.email.threadId }];
            } else {
                // Normal "Action" mode or manual test: Fetch recent messages based on query
                messages = await this.gmailService.fetchMessages(credentialId, maxResults, query);
                this.log('INFO', `Found ${messages.length} messages from query`);
            }

            const processedItems: any[] = [];
            const uploadsDir = path.join(process.cwd(), 'uploads');

            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            for (const msgStub of messages) {
                try {
                    const msg = await this.gmailService.getMessageDetails(credentialId, msgStub.id!);

                    // Extract headers
                    const headers = msg.payload?.headers || [];
                    const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
                    const from = headers.find(h => h.name === 'From')?.value || '(Unknown)';
                    const date = headers.find(h => h.name === 'Date')?.value || '';

                    // Extract Body (simplistic snippet or text part)
                    const snippet = msg.snippet;
                    // Logic to extract full body is complex (multipart), using snippet for now is safer for stability, 
                    // or we can try to find text/plain part.

                    const parts = msg.payload?.parts || [];
                    let hasAttachments = false;

                    // Recursive function to find attachments in multipart
                    const findAttachments = async (parts: any[]) => {
                        for (const part of parts) {
                            if (part.filename && part.body?.attachmentId) {
                                hasAttachments = true;
                                const fileName = `${Date.now()}_${part.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                                const destPath = path.join(uploadsDir, fileName);
                                const fileUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/uploads/${fileName}`;

                                try {
                                    const fileStream = await this.gmailService.getAttachment(credentialId, msg.id!, part.body.attachmentId);
                                    const writer = fs.createWriteStream(destPath);

                                    await new Promise<void>((resolve, reject) => {
                                        fileStream.pipe(writer);
                                        writer.on('finish', () => resolve());
                                        writer.on('error', reject);
                                    });

                                    processedItems.push({
                                        file_id: msg.id, // Using message ID as base
                                        key: fileName,
                                        name: part.filename,
                                        url: fileUrl,
                                        file_type: part.mimeType,
                                        file_size: part.body.size,
                                        file_page: '',
                                        // Email Context
                                        email_subject: subject,
                                        email_from: from,
                                        email_date: date,
                                        email_body: snippet
                                    });

                                } catch (err: any) {
                                    this.log('WARN', `Failed to download attachment ${part.filename}: ${err.message}`);
                                }
                            }

                            if (part.parts) {
                                await findAttachments(part.parts);
                            }
                        }
                    };

                    await findAttachments(parts);

                    // If no attachments were found/added, push just the email info? 
                    // User requirements imply "if email have attachment what we do output... see we follow same array".
                    // If strictly mimicking Drive, maybe we ONLY return items if they have files?
                    // User said: "get that also put that also in gmail trigger node output" (referring to subject/body).
                    // If there are NO attachments, should we output strict JSON with NULL file fields?
                    // Let's do that for utility.
                    if (!hasAttachments) {
                        processedItems.push({
                            file_id: msg.id,
                            key: null,
                            name: null,
                            url: null,
                            file_type: 'email/message',
                            file_size: 0,
                            file_page: '',
                            email_subject: subject,
                            email_from: from,
                            email_date: date,
                            email_body: snippet
                        });
                    }

                } catch (err: any) {
                    this.log('WARN', `Failed to process message ${msgStub.id}: ${err.message}`);
                }
            }

            return processedItems;
        } catch (error: any) {
            this.log('ERROR', `Gmail operation failed: ${error.message}`);
            throw error;
        }
    }
}
