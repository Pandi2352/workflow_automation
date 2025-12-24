import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Get,
    Param,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Express } from 'express';

@ApiTags('Uploads')
@Controller('upload')
export class UploadController {
    @Post()
    @ApiOperation({ summary: 'Upload a single file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'File uploaded successfully' })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    cb(null, `${Date.now()}_${file.originalname}`);
                },
            }),
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
            },
        }),
    )
    uploadFile(@UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        const baseUrl = process.env.API_URL || 'http://localhost:4000/api';

        return {
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            url: `${baseUrl}/uploads/${file.filename}`,
            key: file.filename // standardized key for downstream nodes
        };
    }
}
