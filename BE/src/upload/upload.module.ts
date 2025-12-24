import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';

@Module({
    controllers: [UploadController],
    providers: [],
    exports: [],
})
export class UploadModule { }
