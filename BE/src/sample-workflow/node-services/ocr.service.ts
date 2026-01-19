import { Injectable, Logger } from '@nestjs/common';
import { BaseOCRService } from './base-ocr.service';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import * as mammoth from 'mammoth';
import * as mime from 'mime-types';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ProcessedItemService } from '../services/processed-item.service';

// Prompts
const PDF_EXTRACTION_PROMPT = `**Objective:** Perform a comprehensive extraction and analysis of the provided document.
**Instructions:**

1.  **Text Extraction:** Extract all textual content from the document. Preserve the logical flow.
2.  **Image Analysis:**
    *   **Identify & Locate:** State if images are present and their location.
    *   **Detailed Description:** Describe content, objects, scenes, colors.
    *   **Text within Image (OCR):** Transcribe visible text.
    *   **Data Extraction:** Extract structured data from charts/tables.
    *   **Context:** Explain relevance.
3.  **Document Summary:** Concise summary of main points.

**Output Format:**
*   Present extracted text first.
*   "Image Analysis" section.
*   "Document Summary" section.
`;

const IMAGE_CONTEXT_PROMPT = `Analyze the uploaded image in detail. Provide a comprehensive description covering:
1. Main Subject & Scene
2. Objects & Elements
3. People/Animals
4. Setting & Background
5. Text (OCR)
6. Composition & Style
7. Atmosphere & Mood
8. Inferences & Context`;

const AUDIO_CONTEXT_PROMPT = `Analyze the uploaded audio file in detail covering:
1. Audio Type & Summary
2. Speech Content (Transcription)
3. Speaker Details
4. Music Details
5. Sound Effects & Ambience
6. Overall Mood`;

const VIDEO_CONTEXT_PROMPT = `Analyze the uploaded video file from beginning to end covering:
1. Overall Summary & Type
2. Visual Scene Description (Settings, Subjects, Actions)
3. Audio Content Analysis (Speech, Music, SFX)
4. Cinematography & Style
5. Overall Mood
6. Inferences`;

const META_JSON_PROMPT = `
*** FINAL OUTPUT REQUIREMENT ***

After performing the analysis requested above, you MUST append a valid JSON object strictly following this structure at the very end of your response:

\`\`\`json
{
  "title": "A short, descriptive title for the content",
  "description": "A concise summary (1-2 sentences) of the content",
  "thumbnail": "A visual description of what a perfect thumbnail for this content would look like"
}
\`\`\`
`;

@Injectable()
export class OCRService extends BaseOCRService {
    private genAI: GoogleGenerativeAI;
    private fileManager: GoogleAIFileManager;
    private model: any;
    private readonly dedupCache = new Map<string, { timestamp: number; result: any }>();
    private readonly DEDUP_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
    private readonly DEDUP_MAX_ENTRIES = 200;

    constructor(
        private configService: ConfigService,
        private processedItemService: ProcessedItemService,
    ) {
        super(OCRService.name);
    }

    // Concurrency Control
    private requestQueue: (() => Promise<void>)[] = [];
    private activeRequests = 0;
    private readonly MAX_CONCURRENT_REQUESTS = 1; // Strict sequential processing for free tier
    private readonly REQUEST_COOLDOWN = 4000; // 4 seconds between requests
    private lastRequestTime = 0;

    private async scheduleRequest<T>(task: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const wrapper = async () => {
                this.activeRequests++;
                try {
                    // Enforce cooldown from previous request
                    const timeSinceLast = Date.now() - this.lastRequestTime;
                    if (timeSinceLast < this.REQUEST_COOLDOWN) {
                        const waitTime = this.REQUEST_COOLDOWN - timeSinceLast;
                        await new Promise(r => setTimeout(r, waitTime));
                    }

                    const result = await task();

                    // Update timestamp AFTER success to space out subsequent calls
                    this.lastRequestTime = Date.now();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.activeRequests--;
                    this.processQueue();
                }
            };

            if (this.activeRequests < this.MAX_CONCURRENT_REQUESTS) {
                wrapper();
            } else {
                this.requestQueue.push(wrapper);
            }
        });
    }

    private processQueue() {
        if (this.activeRequests < this.MAX_CONCURRENT_REQUESTS && this.requestQueue.length > 0) {
            const nextTask = this.requestQueue.shift();
            nextTask?.();
        }
    }

    private initializeAI(apiKey: string, modelName: string = 'gemini-2.5-flash') {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.fileManager = new GoogleAIFileManager(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: modelName });
    }

    private async hashFile(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            stream.on('data', (data) => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    private getCachedResult(key: string): any | null {
        const entry = this.dedupCache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > this.DEDUP_TTL_MS) {
            this.dedupCache.delete(key);
            return null;
        }
        return entry.result;
    }

    private setCachedResult(key: string, result: any) {
        this.dedupCache.set(key, { timestamp: Date.now(), result });
        if (this.dedupCache.size > this.DEDUP_MAX_ENTRIES) {
            const oldestKey = this.dedupCache.keys().next().value;
            if (oldestKey) this.dedupCache.delete(oldestKey);
        }
    }

    private async executeWithRetry<T>(
        operation: () => Promise<T>,
        maxRetries: number = 5,
        baseDelay: number = 4000 // Increased base delay
    ): Promise<T> {
        let lastError: any;
        for (let i = 0; i < maxRetries; i++) {
            try {
                // Wrap the operation in our scheduler
                return await this.scheduleRequest(async () => {
                    return await operation();
                });
            } catch (error: any) {
                lastError = error;
                const isRateLimit = error.message?.includes('429') || error.status === 429;
                const isServiceUnavailable = error.message?.includes('503') || error.status === 503;

                if (isRateLimit || isServiceUnavailable) {
                    // Calculate delay with exponential backoff
                    let delay = baseDelay * Math.pow(2, i);

                    // Parse Retry-After if available
                    const match = error.message?.match(/retry in (\d+(\.\d+)?)s/);
                    if (match && match[1]) {
                        delay = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
                    }

                    this.logger.warn(`Rate limit or service error hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw error; // Not a retryable error
            }
        }
        throw lastError;
    }

    async processFile(
        fileIdentifier: string, // URL or Local Path
        config: { apiKey: string; modelName?: string; prompt?: string }
    ): Promise<any> {
        if (!config.apiKey) {
            throw new Error('Gemini API Key is required');
        }

        const modelName = config.modelName || 'gemini-1.5-flash';
        this.initializeAI(config.apiKey, modelName);

        try {
            const filePath = await this.resolveFilePath(fileIdentifier);

            const mimeType = mime.lookup(filePath) || 'application/octet-stream';
            this.logger.log(`Processing file: ${filePath} (${mimeType})`);

            const promptHash = crypto.createHash('sha256').update(config.prompt || '').digest('hex');
            const fileHash = await this.hashFile(filePath);
            const dedupKey = `${fileHash}:${promptHash}:${modelName}`;
            const cached = this.getCachedResult(dedupKey);
            if (cached) {
                this.logger.log(`OCR cache hit (memory) for ${path.basename(filePath)} (${modelName})`);
                return { ...cached, cached: true };
            }

            const persisted = await this.processedItemService.getCompletedMetadata(dedupKey, 'OCR_HASH');
            if (persisted?.result) {
                this.logger.log(`OCR cache hit (db) for ${path.basename(filePath)} (${modelName})`);
                this.setCachedResult(dedupKey, persisted.result);
                return { ...persisted.result, cached: true };
            }

            await this.processedItemService.markPending(dedupKey, 'OCR_HASH', {
                modelName,
                fileHash,
                promptHash,
                timestamp: new Date(),
            });

            let analysisResult = '';
            let jsonResult = {};

            // 1. Text Processing (TXT/CSV/DOCX)
            if (mimeType === 'text/plain' || mimeType === 'text/csv' || filePath.endsWith('.txt') || filePath.endsWith('.csv')) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const prompt = config.prompt
                    ? `Analyze the provided document content based on the following specific instructions:\n\n${config.prompt}\n\nDOCUMENT CONTENT:\n${content}`
                    : `${PDF_EXTRACTION_PROMPT}\n\nDOCUMENT CONTENT:\n${content}`;
                const result = await this.executeWithRetry(() => this.model.generateContent(prompt)) as any;
                analysisResult = result.response.text();

            } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || filePath.endsWith('.docx')) {
                const result = await mammoth.extractRawText({ path: filePath });
                const content = result.value;
                const prompt = config.prompt
                    ? `Analyze the provided document content based on the following specific instructions:\n\n${config.prompt}\n\nDOCUMENT CONTENT:\n${content}`
                    : `${PDF_EXTRACTION_PROMPT}\n\nDOCUMENT CONTENT:\n${content}`;
                const genResult = await this.executeWithRetry(() => this.model.generateContent(prompt)) as any;
                analysisResult = genResult.response.text();

            } else {
                // 2. Multimodal Processing (Images, PDF, Audio, Video)
                // 2. Multimodal Processing (Images, PDF, Audio, Video)
                let contextPrompt = PDF_EXTRACTION_PROMPT;

                if (config.prompt) {
                    contextPrompt = `Analyze the uploaded file based on the following specific instructions:\n\n${config.prompt}`;
                } else {
                    if (mimeType.startsWith('image/')) contextPrompt = IMAGE_CONTEXT_PROMPT;
                    else if (mimeType.startsWith('audio/')) contextPrompt = AUDIO_CONTEXT_PROMPT;
                    else if (mimeType.startsWith('video/')) contextPrompt = VIDEO_CONTEXT_PROMPT;
                }

                const uploadResponse = await this.fileManager.uploadFile(filePath, {
                    mimeType: mimeType,
                    displayName: path.basename(filePath),
                });

                this.logger.log(`Uploaded to Gemini: ${uploadResponse.file.uri}`);

                // Wait for processing if video
                if (mimeType.startsWith('video/')) {
                    let file = await this.fileManager.getFile(uploadResponse.file.name);
                    while (file.state === 'PROCESSING') {
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                        file = await this.fileManager.getFile(uploadResponse.file.name);
                    }
                    if (file.state === 'FAILED') {
                        throw new Error('Video processing failed.');
                    }
                }

                const result = await this.executeWithRetry(() => this.model.generateContent([
                    {
                        fileData: {
                            mimeType: uploadResponse.file.mimeType,
                            fileUri: uploadResponse.file.uri
                        }
                    },
                    { text: `${contextPrompt}` }
                ])) as any;

                analysisResult = result.response.text();
            }

            // Clean up any Markdown JSON blocks if LLM still hallucinates them, purely for cleanup
            // but we are NOT parsing metadata anymore.
            analysisResult = analysisResult.replace(/```json\n[\s\S]*?\n```/, '').trim();

            const result = {
                analysis: analysisResult,
                // metadata: {}, // Explicitly removed
                source: path.basename(filePath)
            };
            this.setCachedResult(dedupKey, result);
            await this.processedItemService.markCompleted(dedupKey, 'OCR_HASH', {
                modelName,
                fileHash,
                promptHash,
                timestamp: new Date(),
                result,
            });
            return result;

        } catch (error) {
            this.logger.error(`OCR Processing failed: ${error.message}`, error.stack);
            try {
                const promptHash = crypto.createHash('sha256').update(config.prompt || '').digest('hex');
                const filePath = await this.resolveFilePath(fileIdentifier);
                const fileHash = await this.hashFile(filePath);
                const modelName = config.modelName || 'gemini-1.5-flash';
                const dedupKey = `${fileHash}:${promptHash}:${modelName}`;
                await this.processedItemService.markFailed(dedupKey, 'OCR_HASH', error.message);
            } catch { }
            throw error;
        }
    }

    async generateText(
        text: string,
        apiKey: string,
        modelName: string = 'gemini-1.5-flash'
    ): Promise<string> {
        if (!apiKey) {
            throw new Error('Gemini API Key is required');
        }

        this.initializeAI(apiKey, modelName);

        try {
            const result = await this.executeWithRetry(() => this.model.generateContent(text)) as any;
            const response = await result.response;
            return response.text();
        } catch (error) {
            this.logger.error(`Gemini Text Generation failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    async generateStructuredData(
        prompt: string,
        apiKey: string,
        modelName: string = 'gemini-1.5-flash'
    ): Promise<any> {
        const jsonPrompt = `${prompt}
        
        **CRITICAL OUTPUT INSTRUCTION:**
        Return strictly valid JSON only. Do not wrap in markdown code blocks. Do not add explanations.`;

        const responseText = await this.generateText(jsonPrompt, apiKey, modelName);

        try {
            // Attempt to clean markdown if present
            const cleanedText = responseText.replace(/```json\n|\n```/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (error) {
            this.logger.error(`Failed to parse AI JSON response: ${responseText}`);
            throw new Error('AI Response was not valid JSON');
        }
    }
}
