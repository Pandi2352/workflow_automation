import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private readonly logger = new Logger(AiService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.logger.log(`Initializing Gemini AI with API Key: ${apiKey.substring(0, 4)}...`);
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        } else {
            this.logger.error('GEMINI_API_KEY not found in environment variables');
        }
    }

    async generateWorkflow(prompt: string) {
        if (!this.model) {
            this.logger.error('Gemini model is not initialized. Aborting generation.');
            throw new Error('Gemini API not initialized. Check server configuration.');
        }

        const systemPrompt = `
        You are an AI workflow generator. Convert the user's natural language request into a valid JSON workflow structure.
        
        The Output must be a strictly valid JSON object with the following structure:
        {
            "nodes": [
                { "id": "node_1", "type": "TYPE", "position": { "x": 0, "y": 0 }, "data": { "label": "Label", "config": {} } }
            ],
            "edges": [
                { "id": "edge_1", "source": "node_1", "target": "node_2" }
            ]
        }

        AVAILABLE NODE TYPES:
        1. "GMAIL" (Trigger or Action)
           - config: { query: "label:inbox" } for trigger
        2. "SCHEDULE" (Trigger)
           - config: { cronExpression: "0 9 * * *" }
        3. "OCR" (Action)
           - config: { model: "gemini-1.5-flash-001" }
        4. "SMART_EXTRACTION" (Action)
           - config: { fields: ["invoice_number", "date", "total"], model: "gemini-1.5-flash-001" }
        5. "GOOGLE_DRIVE" (Action)
           - config: { folderId: "root" }
        6. "ONEDRIVE" (Action)
        7. "IF_ELSE" (Logic)
        8. "PARSING" (AI Logic)
        9. "SUMMARIZE" (AI Logic)
        10. "MONGODB" (Action)
        
        RULES:
        - Generate unique IDs for nodes (e.g., node_1, node_2).
        - Connect them logically with edges.
        - Spacing: Increment Y position by 150 for each step (0, 150, 300...).
        - Smart Extraction fields should be inferred from context if possible.
        - Only output valid JSON. Do not include markdown formatting like \`\`\`json.
        `;

        try {
            this.logger.log(`Generating workflow for prompt: ${prompt}`);
            const result = await this.model.generateContent([
                systemPrompt,
                `User Request: ${prompt}`
            ]);

            const response = result.response;
            const text = response.text();
            this.logger.debug(`Gemini Raw Response: ${text}`);

            // Clean markdown if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(cleanText);
        } catch (error) {
            this.logger.error('Failed to generate workflow', error.stack);
            if (error.response) {
                this.logger.error('API Error Details', JSON.stringify(error.response));
            }
            throw new Error('AI generation failed: ' + error.message);
        }
    }
}
