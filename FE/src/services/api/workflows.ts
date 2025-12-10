import { axiosInstance } from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { SampleWorkflow, CreateWorkflowPayload } from '../../types/workflow.types';

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

    initiate: async (id: string): Promise<any> => {
        const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOWS.GET(id) + '/executions');
        return response.data;
    },

    start: async (executionId: string): Promise<any> => {
        const response = await axiosInstance.post(`/sample-workflows/executions/${executionId}/start`);
        return response.data;
    }
};
