import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ParsingService {
    private readonly logger = new Logger(ParsingService.name);

    async parseText(text: string, schema: Record<string, string>, model: string = 'gemini-2.5-flash'): Promise<{ data: any; confidenceScore: number }> {
        this.logger.log(`Simulating AI parsing of text based on schema using model: ${model}`);

        // Mock parsing logic
        // In reality, this would call Gemini AI with the text and schema

        const extractedData: any = {};

        for (const key of Object.keys(schema)) {
            // Simulate extraction
            if (schema[key] === 'number') {
                extractedData[key] = Math.floor(Math.random() * 1000) + 100;
            } else if (key.toLowerCase().includes('date')) {
                extractedData[key] = new Date().toISOString().split('T')[0];
            } else {
                extractedData[key] = `Extracted ${key}`;
            }
        }

        // Simulate confidence score (high for demonstration, but can be variable)
        const confidenceScore = 0.85 + (Math.random() * 0.15); // 0.85 - 1.00

        return {
            data: extractedData,
            confidenceScore
        };
    }
}
