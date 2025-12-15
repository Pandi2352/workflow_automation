import { MongoDBService } from '../../node-services/mongodb.service';
import { BaseWorkflowNode } from './workflow-node.interface';

export class MongoDBNodeStrategy extends BaseWorkflowNode {
    constructor(private mongoService: MongoDBService) {
        super();
    }

    async execute(inputs: any[], data?: any): Promise<any> {
        this.log('INFO', 'Starting MongoDB Operation');

        const config = data?.config || {};
        const connectionString = config.connectionString;
        const dbName = config.dbName || 'automation_db';
        const collectionName = config.collectionName || 'manual_review';

        if (!connectionString) {
            // For now, warning about mock mode if no string
            this.log('WARN', 'No connection string provided, running in MOCK mode');
        }

        // Data to insert: usage of inputs
        const documentToInsert = inputs.length > 0 ? inputs[0] : { info: 'No input data' };

        try {
            const resultId = await this.mongoService.insertOne(connectionString, dbName, collectionName, documentToInsert);

            this.log('INFO', `Document inserted with ID: ${resultId}`);

            return {
                success: true,
                insertedId: resultId,
                collection: collectionName
            };
        } catch (error: any) {
            this.log('ERROR', `MongoDB operation failed: ${error.message}`);
            throw error;
        }
    }
}
