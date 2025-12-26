import { Injectable } from '@nestjs/common';
import { BaseOCRService } from './base-ocr.service';
import * as Tesseract from 'tesseract.js';
import * as fs from 'fs';
import * as mime from 'mime-types';

@Injectable()
export class TesseractOCRService extends BaseOCRService {
    constructor() {
        super(TesseractOCRService.name);
    }

    async processFile(
        fileIdentifier: string,
        config: { lang?: string } = {}
    ): Promise<any> {
        let filePaths: string[] = [];
        const initialFilePath = await this.resolveFilePath(fileIdentifier);

        try {
            const isPdf = await this.isPdfFile(initialFilePath);
            const mimeType = mime.lookup(initialFilePath) || 'application/octet-stream';

            if (isPdf) {
                this.logger.log(`PDF detected, converting to images: ${initialFilePath}`);
                filePaths = await this.convertPdfToImages(initialFilePath);
            } else if (mimeType.startsWith('image/')) {
                filePaths = [initialFilePath];
            } else {
                throw new Error(`Unsupported file type for Tesseract OCR: ${mimeType}. Please provide an image (PNG, JPG, BMP) or PDF.`);
            }

            const lang = config.lang || 'eng';
            let combinedText = '';
            let totalConfidence = 0;
            const pageResults: { text: string; confidence: number }[] = [];

            for (const filePath of filePaths) {
                this.logger.log(`Performing Tesseract OCR on: ${filePath} (Language: ${lang})`);

                const result = await Tesseract.recognize(
                    filePath,
                    lang,
                    { logger: m => this.logger.debug(JSON.stringify(m)) }
                );

                const text = result.data.text;
                const confidence = result.data.confidence;

                combinedText += text + '\n\n';
                totalConfidence += confidence;
                pageResults.push({
                    text,
                    confidence: confidence / 100
                });
            }

            const averageConfidence = filePaths.length > 0 ? (totalConfidence / filePaths.length) / 100 : 0;

            return {
                text: combinedText.trim(),
                confidence: averageConfidence,
                metadata: {
                    engine: 'tesseract',
                    lang: lang,
                    pages: pageResults.length,
                    processedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            this.logger.error(`Tesseract OCR failed: ${error.message}`);
            throw error;
        } finally {
            // Cleanup original file if it was temporary
            this.cleanupTempFile(initialFilePath);

            // Cleanup generated images
            if (filePaths && filePaths.length > 0) {
                for (const path of filePaths) {
                    if (path !== initialFilePath) {
                        try {
                            this.cleanupTempFile(path);
                        } catch (e) {
                            // ignore cleanup errors
                        }
                    }
                }
            }
        }
    }
}
