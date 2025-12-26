import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MongoDBService {
    private readonly logger = new Logger(MongoDBService.name);

    async insertOne(connectionString: string, dbName: string, collectionName: string, document: any): Promise<string> {
        this.logger.log(`Simulating MongoDB Insert into ${dbName}.${collectionName}`);

        // Mock DB Insertion
        const mockId = 'mongo_' + Date.now().toString(36);
        return mockId;
    }

    async insertMany(connectionString: string, dbName: string, collectionName: string, documents: any[]): Promise<string[]> {
        this.logger.log(`Simulating MongoDB Batch Insert of ${documents.length} docs into ${dbName}.${collectionName}`);

        // Mock Batch Insertion
        return documents.map((_, index) => `mongo_${Date.now().toString(36)}_${index}`);
    }
}
