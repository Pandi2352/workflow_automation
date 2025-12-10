import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Credential, CredentialDocument } from './schemas/credential.schema';

@Injectable()
export class CredentialsService {
    constructor(
        @InjectModel(Credential.name) private credentialModel: Model<CredentialDocument>,
    ) { }

    async create(data: Partial<Credential>): Promise<CredentialDocument> {
        const created = new this.credentialModel(data);
        return created.save();
    }

    async findById(id: string): Promise<Credential | null> {
        return this.credentialModel.findById(id).exec();
    }

    async findAll(): Promise<Credential[]> {
        return this.credentialModel.find().exec();
    }

    async update(id: string, updateData: Partial<Credential>): Promise<Credential | null> {
        return this.credentialModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }
}
