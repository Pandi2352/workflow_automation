import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { ClientInfo } from '../../common/utils/client-info.util';

@Injectable()
export class AuditLogService {
    constructor(
        @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
    ) { }

    async log(
        action: string,
        entityType: string,
        entityId?: string,
        metadata?: Record<string, any>,
        clientInfo?: ClientInfo,
    ): Promise<void> {
        await this.auditModel.create({
            action,
            entityType,
            entityId,
            metadata,
            clientInfo,
        });
    }

    async list(params: {
        page?: number;
        limit?: number;
        action?: string;
        entityType?: string;
        entityId?: string;
    }) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const filter: any = {};

        if (params.action) filter.action = params.action;
        if (params.entityType) filter.entityType = params.entityType;
        if (params.entityId) filter.entityId = params.entityId;

        const total = await this.auditModel.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        const data = await this.auditModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .exec();

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }
}
