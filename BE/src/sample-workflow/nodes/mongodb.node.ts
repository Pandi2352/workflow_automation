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

        // Data to insert
        let documentsToInsert: any[] = [];

        if (inputs.length > 0) {
            const input = inputs[0];
            if (Array.isArray(input)) {
                // Batch insert
                documentsToInsert = input;
            } else {
                documentsToInsert = [input];
            }
        } else {
            documentsToInsert = [{ info: 'No input data' }];
        }

        const results: any[] = [];
        for (const doc of documentsToInsert) {
            try {
                // If the doc has a 'parsedData' wrapper (from parsing node), extract it
                const actualDoc = doc.parsedData || doc;

                const resultId = await this.mongoService.insertOne(connectionString, dbName, collectionName, actualDoc);
                results.push({ success: true, insertedId: resultId });
            } catch (e: any) {
                this.log('ERROR', `Failed to insert doc: ${e.message}`);
                results.push({ success: false, error: e.message });
            }
        }

        this.log('INFO', `Batch operation complete. Inserted ${results.filter(r => r.success).length} documents.`);

        return {
            success: true,
            collection: collectionName,
            results
        };
    }
}
