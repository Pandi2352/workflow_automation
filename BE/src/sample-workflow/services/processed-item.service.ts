
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProcessedItem, ProcessedItemDocument } from '../schemas/processed-item.schema';

@Injectable()
export class ProcessedItemService {
    private readonly logger = new Logger(ProcessedItemService.name);

    constructor(
        @InjectModel(ProcessedItem.name) private processedItemModel: Model<ProcessedItemDocument>,
    ) { }

    async shouldProcess(uniqueId: string, type: string): Promise<boolean> {
        const existing = await this.processedItemModel.findOne({ uniqueId, type });
        if (existing && existing.status === 'COMPLETED') {
            return false;
        }
        return true;
    }

    async markPending(uniqueId: string, type: string, metadata?: any): Promise<void> {
        await this.processedItemModel.updateOne(
            { uniqueId, type },
            { status: 'PENDING', metadata },
            { upsert: true }
        );
    }

    async markCompleted(uniqueId: string, type: string, metadata?: any): Promise<void> {
        await this.processedItemModel.updateOne(
            { uniqueId, type },
            { status: 'COMPLETED', metadata },
            { upsert: true }
        );
    }

    async markFailed(uniqueId: string, type: string, error: string): Promise<void> {
        await this.processedItemModel.updateOne(
            { uniqueId, type },
            { status: 'FAILED', metadata: { error } },
            { upsert: true }
        );
    }

    async getCompletedMetadata(uniqueId: string, type: string): Promise<any | null> {
        const existing = await this.processedItemModel
            .findOne({ uniqueId, type, status: 'COMPLETED' })
            .sort({ updatedAt: -1 })
            .exec();
        return existing?.metadata || null;
    }
}
