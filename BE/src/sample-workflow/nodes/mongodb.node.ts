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

        // Check if specific document data is provided in config
        if (config.documentData) {
            const resolvedData = this.resolveVariables(config.documentData);

            if (Array.isArray(resolvedData)) {
                documentsToInsert = resolvedData;
            } else if (resolvedData && typeof resolvedData === 'object') {
                documentsToInsert = [resolvedData];
            } else if (typeof resolvedData === 'string') {
                try {
                    // Try to parse if it's a JSON string
                    const parsed = JSON.parse(resolvedData);
                    documentsToInsert = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    // If not JSON, insert as a simple object with a value key
                    documentsToInsert = [{ value: resolvedData }];
                }
            } else {
                documentsToInsert = [resolvedData];
            }
        } else if (inputs.length > 0) {
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
        // Efficient Batch Insertion
        try {
            // Extract the actual documents to insert
            const docsToInsert = documentsToInsert.map(doc => doc.parsedData || doc);

            if (docsToInsert.length > 0) {
                const insertedIds = await this.mongoService.insertMany(connectionString, dbName, collectionName, docsToInsert);
                insertedIds.forEach(id => results.push({ success: true, insertedId: id }));
            }
        } catch (e: any) {
            this.log('ERROR', `Batch insertion failed: ${e.message}`);
            // Fallback to retry individually if bulk fails, or just log error for the batch
            results.push({ success: false, error: e.message });
        }

        this.log('INFO', `Batch operation complete. Inserted ${results.filter(r => r.success).length} documents.`);

        return {
            success: true,
            collection: collectionName,
            results
        };
    }
}
