import { axiosInstance } from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { SampleWorkflow, CreateWorkflowPayload, WorkflowExportBundle } from '../../types/workflow.types';

export const workflowService = {
    getAll: async (): Promise<SampleWorkflow[]> => {
        const response = await axiosInstance.get(API_ENDPOINTS.WORKFLOWS.LIST);
        // Handle paginated response structure: { data: [...], pagination: ... }
        // If the API returns the array directly, utilize it. If nested in 'data', use that.
        return Array.isArray(response.data) ? response.data : (response.data.data || []);
    },

    getById: async (id: string): Promise<SampleWorkflow> => {
        const response = await axiosInstance.get(API_ENDPOINTS.WORKFLOWS.GET(id));
        return response.data;
    },

    create: async (payload: CreateWorkflowPayload): Promise<SampleWorkflow> => {
        const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOWS.CREATE, payload);
        return response.data;
    },

    update: async (id: string, payload: Partial<SampleWorkflow>): Promise<SampleWorkflow> => {
        const response = await axiosInstance.put(API_ENDPOINTS.WORKFLOWS.UPDATE(id), payload);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await axiosInstance.delete(API_ENDPOINTS.WORKFLOWS.DELETE(id));
    },

    exportWorkflow: async (id: string): Promise<WorkflowExportBundle> => {
        const response = await axiosInstance.get(API_ENDPOINTS.WORKFLOWS.EXPORT(id));
        return response.data;
    },

    importWorkflow: async (payload: WorkflowExportBundle & { name?: string }): Promise<SampleWorkflow> => {
        const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOWS.IMPORT, payload);
        return response.data;
    },

    run: async (id: string): Promise<any> => {
        const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOWS.EXECUTE(id));
        return response.data;
    },

    getExecutions: async (id: string, page = 1, limit = 20): Promise<any> => {
        const response = await axiosInstance.get(API_ENDPOINTS.WORKFLOWS.GET(id) + '/executions', {
            params: { page, limit }
        });
        return response.data;
    },

    getLatestExecution: async (id: string): Promise<any> => {
        const response = await axiosInstance.get(API_ENDPOINTS.WORKFLOWS.GET(id) + '/executions/latest');
        return response.data;
    },

    getExecution: async (executionId: string): Promise<any> => {
        const response = await axiosInstance.get(API_ENDPOINTS.EXECUTIONS.GET(executionId));
        return response.data;
    },

    getExecutionLogs: async (executionId: string, page = 1, limit = 200): Promise<any> => {
        const response = await axiosInstance.get(API_ENDPOINTS.EXECUTIONS.GET(executionId) + '/logs', {
            params: { page, limit }
        });
        return response.data;
    },

    getExecutionStatus: async (executionId: string): Promise<any> => {
        const response = await axiosInstance.get(API_ENDPOINTS.EXECUTIONS.GET(executionId) + '/status');
        return response.data;
    },

    getNodeExecutionLogs: async (executionId: string, nodeId: string, page = 1, limit = 200): Promise<any> => {
        const response = await axiosInstance.get(API_ENDPOINTS.EXECUTIONS.GET(executionId) + `/nodes/${nodeId}/logs`, {
            params: { page, limit }
        });
        return response.data;
    },

    replayExecution: async (executionId: string, nodeId?: string): Promise<any> => {
        const response = await axiosInstance.post(API_ENDPOINTS.EXECUTIONS.GET(executionId) + '/replay', {
            nodeId
        });
        return response.data;
    },

    retryFailedExecution: async (executionId: string): Promise<any> => {
        const response = await axiosInstance.post(API_ENDPOINTS.EXECUTIONS.GET(executionId) + '/retry-failed');
        return response.data;
    },

    getAuditLogs: async (page = 1, limit = 20, params: any = {}): Promise<any> => {
        const response = await axiosInstance.get('/sample-workflows/audit-logs', {
            params: { page, limit, ...params }
        });
        return response.data;
    },

    initiate: async (id: string, payload: any = {}): Promise<any> => {
        const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOWS.GET(id) + '/executions', payload);
        return response.data;
    },

    start: async (executionId: string): Promise<any> => {
        const response = await axiosInstance.post(API_ENDPOINTS.EXECUTIONS.START(executionId));
        return response.data;
    },

    generateAIWorkflow: async (prompt: string, currentNodes: any[] = [], currentEdges: any[] = []): Promise<any> => {
        const response = await axiosInstance.post('/ai/generate-workflow', {
            prompt,
            currentNodes,
            currentEdges
        });
        return response.data;
    }
};
