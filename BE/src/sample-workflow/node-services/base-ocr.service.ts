import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import * as mime from 'mime-types';
import * as pdf2img from 'pdf-img-convert';

export abstract class BaseOCRService {
    protected readonly logger: Logger;

    constructor(name: string) {
        this.logger = new Logger(name);
    }

    protected async resolveFilePath(fileIdentifier: string): Promise<string> {
        let filePath = fileIdentifier;

        // 0. Handle URL query params
        if (filePath.includes('?')) {
            filePath = filePath.split('?')[0];
        }

        // 1. Handle URL
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            this.logger.log(`Downloading file from URL: ${fileIdentifier}`);
            return await this.downloadFile(fileIdentifier);
        }

        // 2. Handle file:// prefix
        if (filePath.startsWith('file://')) {
            filePath = filePath.replace('file://', '');
        }

        // 3. Handle relative paths or keys
        if (!fs.existsSync(filePath)) {
            // Check in uploads directory
            const uploadPath = path.join(process.cwd(), 'uploads', path.basename(filePath));
            if (fs.existsSync(uploadPath)) {
                filePath = uploadPath;
            } else {
                // Check if it's just a filename in uploads
                const justNamePath = path.join(process.cwd(), 'uploads', filePath);
                if (fs.existsSync(justNamePath)) {
                    filePath = justNamePath;
                }
            }
        }

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        return filePath;
    }

    private async downloadFile(url: string): Promise<string> {
        const tempDir = os.tmpdir();
        const fileName = `ocr_${Date.now()}_${path.basename(url.split('?')[0])}`;
        const filePath = path.join(tempDir, fileName);

        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filePath));
            writer.on('error', (err) => {
                this.logger.error(`Failed to download file: ${err.message}`);
                reject(err);
            });
        });
    }

    protected cleanupTempFile(filePath: string): void {
        const tempDir = os.tmpdir();
        if (filePath.startsWith(tempDir)) {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    this.logger.log(`Cleaned up temp file: ${filePath}`);
                }
            } catch (error) {
                this.logger.warn(`Failed to cleanup temp file ${filePath}: ${error.message}`);
            }
        }
    }

    protected async convertPdfToImages(pdfPath: string): Promise<string[]> {
        try {
            this.logger.log(`Converting PDF to images: ${pdfPath}`);
            const outputImages = await pdf2img.convert(pdfPath, {
                width: 2000,
                height: 2000,
                page_numbers: [] // all pages
            });

            const imagePaths: string[] = [];
            const tempDir = os.tmpdir();

            for (let i = 0; i < outputImages.length; i++) {
                const imageBuffer = outputImages[i];
                // Handle Uint8Array or Buffer
                const buffer = Buffer.isBuffer(imageBuffer) ? imageBuffer : Buffer.from(imageBuffer as Uint8Array);

                const imagePath = path.join(tempDir, `pdf_page_${Date.now()}_${i}.png`);
                fs.writeFileSync(imagePath, buffer);
                imagePaths.push(imagePath);
            }

            this.logger.log(`Converted PDF to ${imagePaths.length} images`);
            return imagePaths;
        } catch (error) {
            this.logger.error(`Failed to convert PDF to images: ${error.message}`);
            // If conversion fails, return original path and hope for best (or let caller handle)
            // But for now, rethrow to be safe
            throw new Error(`PDF Conversion failed: ${error.message}`);
        }
    }
    protected async isPdfFile(filePath: string): Promise<boolean> {
        try {
            // Check extension first as a quick path
            if (filePath.toLowerCase().endsWith('.pdf')) {
                return true;
            }

            // Check mime type via mime-types library
            const mimeType = mime.lookup(filePath);
            if (mimeType === 'application/pdf') {
                return true;
            }

            // Fallback: Check magic bytes
            const buffer = Buffer.alloc(5);
            const fd = fs.openSync(filePath, 'r');
            fs.readSync(fd, buffer, 0, 5, 0);
            fs.closeSync(fd);

            // PDF signature is %PDF-
            return buffer.toString().startsWith('%PDF-');
        } catch (error) {
            this.logger.warn(`Failed to check if file is PDF: ${error.message}`);
            return false;
        }
    }
}
