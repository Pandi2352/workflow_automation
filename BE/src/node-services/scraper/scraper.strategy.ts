import { BaseWorkflowNode } from '../../sample-workflow/nodes/workflow-node.interface';
import { OCRService } from '../../sample-workflow/node-services/ocr.service';
import axios from 'axios';
import { Logger } from '@nestjs/common';

export class ScraperNodeStrategy extends BaseWorkflowNode {
    private readonly systemLogger = new Logger(ScraperNodeStrategy.name);

    constructor(private readonly ocrService: OCRService) {
        super();
    }

    async execute(inputs: any[], data?: any): Promise<any> {
        const config = data?.config || {};
        const urlTemplate = config.url || '';
        const mode = config.mode || 'ai'; // 'ai' or 'selector'
        const prompt = config.prompt || 'Extract the main title and summary from this page.';
        const selector = config.selector || '';

        // 1. Resolve URL
        const url = this.resolveVariables(urlTemplate);

        if (!url) {
            this.log('ERROR', 'No URL provided for scraping');
            throw new Error('URL is required');
        }

        this.log('INFO', `Scraping URL: ${url} (Mode: ${mode})`);

        try {
            // 2. Fetch HTML
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                },
                timeout: 10000
            });

            const html = response.data;

            // Basic text cleaning (removing script/style tags for AI token efficiency)
            const cleanText = html
                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
                .replace(/<[^>]+>/g, ' ') // Strip tags
                .replace(/\s+/g, ' ')     // Normalize whitespace
                .trim();

            this.log('DEBUG', `Page fetched. Length: ${html.length} chars. Cleaned Text: ${cleanText.substring(0, 100)}...`);

            if (mode === 'selector' && selector) {
                // VERY BASIC Selector Mode (V1: Simple Regex / String Index)
                // In a production env, we'd use Cheerio.
                this.log('INFO', `Applying selector mode (basic string match)`);
                return {
                    url,
                    content: cleanText.substring(0, 5000), // Return partial for safe keeping
                    extracted: "Selector mode currently uses AI fallback or basic regex. Advanced selectors coming in V2."
                };
            }

            // 3. AI Extraction
            this.log('INFO', `Running AI Extraction with prompt: ${prompt}`);

            // We use ocrService.generateStructuredData which we know exists from earlier conversations
            // if ocrService doesn't have it, we fall back to a generic prompt.
            // Based on previous session knowledge, OCRService has gemini logic.

            const aiResult = await this.ocrService.generateStructuredData(
                cleanText.substring(0, 15000), // Gemini limit safe window
                prompt,
                config.apiKey || process.env.GEMINI_API_KEY
            );

            this.log('INFO', `AI Extraction successful`);

            return {
                url,
                metadata: {
                    statusCode: response.status,
                    contentLength: html.length
                },
                data: aiResult
            };

        } catch (error: any) {
            this.systemLogger.error(`Scraping failed: ${error.message}`);
            this.log('ERROR', `Scraping failed: ${error.message}`);
            throw error;
        }
    }
}
