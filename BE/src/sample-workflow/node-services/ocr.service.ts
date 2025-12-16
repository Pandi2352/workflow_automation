import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import * as mammoth from 'mammoth';
import * as mime from 'mime-types';
import * as fs from 'fs';
import * as path from 'path';

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
export class OCRService {
    private readonly logger = new Logger(OCRService.name);
    private genAI: GoogleGenerativeAI;
    private fileManager: GoogleAIFileManager;
    private model: any;

    constructor(private configService: ConfigService) { }

    private initializeAI(apiKey: string, modelName: string = 'gemini-1.5-flash') {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.fileManager = new GoogleAIFileManager(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: modelName });
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
            // For now, assume fileIdentifier is a local path (downloaded by executor or previous node)
            // If it's a URL, we might need to download it first.
            // But Workflow Executor usually handles file movements.
            // Let's assume we get a valid local path for simplicity or handle URL download if needed.

            // Check if file exists locally
            let filePath = fileIdentifier;
            if (!fs.existsSync(filePath)) {
                // Try to strip file:// prefix if present
                if (filePath.startsWith('file://')) {
                    filePath = filePath.replace('file://', '');
                } else if (filePath.startsWith('http')) {
                    // TODO: Implement URL download if needed, but for now expect local path from upstream
                    // Ideally, the WorkflowExecutor should have downloaded this to a temp folder already
                    throw new Error(`Remote URLs not yet fully supported in direct path: ${filePath}`);
                }
            }

            // Handle URL query params if any (from local static serve)
            if (filePath.includes('?')) {
                filePath = filePath.split('?')[0];
            }

            if (!fs.existsSync(filePath)) {
                // Last ditch attempt: check if it's in the uploads directory relative to root
                const uploadPath = path.join(process.cwd(), 'uploads', path.basename(filePath));
                if (fs.existsSync(uploadPath)) {
                    filePath = uploadPath;
                } else {
                    throw new Error(`File not found at path: ${filePath}`);
                }
            }

            const mimeType = mime.lookup(filePath) || 'application/octet-stream';
            this.logger.log(`Processing file: ${filePath} (${mimeType})`);

            let analysisResult = '';
            let jsonResult = {};

            // 1. Text Processing (TXT/CSV/DOCX)
            if (mimeType === 'text/plain' || mimeType === 'text/csv' || filePath.endsWith('.txt') || filePath.endsWith('.csv')) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const prompt = `${PDF_EXTRACTION_PROMPT}\n\nDOCUMENT CONTENT:\n${content}`;
                const result = await this.model.generateContent(prompt);
                analysisResult = result.response.text();

            } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || filePath.endsWith('.docx')) {
                const result = await mammoth.extractRawText({ path: filePath });
                const content = result.value;
                const prompt = `${PDF_EXTRACTION_PROMPT}\n\nDOCUMENT CONTENT:\n${content}`;
                const genResult = await this.model.generateContent(prompt);
                analysisResult = genResult.response.text();

            } else {
                // 2. Multimodal Processing (Images, PDF, Audio, Video)
                let contextPrompt = PDF_EXTRACTION_PROMPT;
                if (mimeType.startsWith('image/')) contextPrompt = IMAGE_CONTEXT_PROMPT;
                else if (mimeType.startsWith('audio/')) contextPrompt = AUDIO_CONTEXT_PROMPT;
                else if (mimeType.startsWith('video/')) contextPrompt = VIDEO_CONTEXT_PROMPT;

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

                const result = await this.model.generateContent([
                    {
                        fileData: {
                            mimeType: uploadResponse.file.mimeType,
                            fileUri: uploadResponse.file.uri
                        }
                    },
                    { text: `${contextPrompt}` }
                ]);

                analysisResult = result.response.text();
            }

            // Clean up any Markdown JSON blocks if LLM still hallucinates them, purely for cleanup
            // but we are NOT parsing metadata anymore.
            analysisResult = analysisResult.replace(/```json\n[\s\S]*?\n```/, '').trim();

            return {
                analysis: analysisResult,
                // metadata: {}, // Explicitly removed
                source: path.basename(filePath)
            };

        } catch (error) {
            this.logger.error(`OCR Processing failed: ${error.message}`, error.stack);
            throw error;
        }
    }
}
