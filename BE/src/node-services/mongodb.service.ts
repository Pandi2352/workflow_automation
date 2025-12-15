import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MongoDBService {
    private readonly logger = new Logger(MongoDBService.name);

    async insertOne(connectionString: string, dbName: string, collectionName: string, document: any): Promise<string> {
        this.logger.log(`Simulating MongoDB Insert into ${dbName}.${collectionName}`);

        // Mock DB Insertion
        // In real impl, would use mongoose or mongodb driver to connect and insert

        const mockId = 'mongo_' + Date.now().toString(36);
        return mockId;
    }
}
