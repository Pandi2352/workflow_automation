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

    async generateWorkflow(prompt: string, currentNodes: any[] = [], currentEdges: any[] = []) {
        if (!this.model) {
            this.logger.error('Gemini model is not initialized. Aborting generation.');
            throw new Error('Gemini API not initialized. Check server configuration.');
        }

        const isRefinement = currentNodes.length > 0;
        const contextStr = isRefinement ? `
        CURRENT WORKFLOW CONTEXT:
        Nodes: ${JSON.stringify(currentNodes.map(n => ({ id: n.id, type: n.type, label: n.data?.label })))}
        Edges: ${JSON.stringify(currentEdges)}
        
        INSTRUCTIONS FOR REFINEMENT:
        - The user wants to MODIFY this existing workflow.
        - You must return the COMPLETE updated workflow (all nodes and edges).
        - Preserve existing node IDs if they are still relevant.
        - Add new nodes with unique IDs (e.g., node_${Date.now()}_1).
        - Connect new nodes to the appropriate place in the flow.
        - If the user says "add X after Y", break the edge and insert X.
        ` : '';

        const systemPrompt = `
        You are an advanced AI workflow architect. Convert the user's natural language request into a valid JSON workflow structure.
        
        ${contextStr}

        The Output must be a strictly valid JSON object with the following structure:
        {
            "nodes": [
                { 
                    "id": "node_1", 
                    "type": "TYPE", 
                    "position": { "x": 0, "y": 0 }, 
                    "data": { 
                        "label": "Label", 
                        "config": {} 
                    } 
                }
            ],
            "edges": [...],
            "metadata": {
                "name": "Suggested Workflow Name",
                "description": "Short description of what this workflow does."
            }
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
        - Generate unique IDs for nodes.
        - Connect them logically with edges.
        - Spacing: Increment Y position by 150 for each step.
        - Smart Extraction fields should be inferred from context if possible.
        - **MANDATORY**: If the user asks to "parse", "extract", "summarize", or "analyze" a document (PDF, Image, etc.) from any source (Email, Drive, etc.), YOU MUST PLACE AN "OCR" NODE BEFORE the parsing/extraction/summary node. The AI models need text conversion first.
        - Only output valid JSON. Do not include markdown formatting.
        - If refining, Return the FULL updated workflow state.
        `;

        try {
            this.logger.log(`Generating workflow for prompt: ${prompt} (Refinement: ${isRefinement})`);
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
