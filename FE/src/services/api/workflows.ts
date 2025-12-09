import apiClient from './client';
import type { SampleWorkflow } from '../../types/workflow.types';

export const workflowService = {
    getAll: async () => {
        const response = await apiClient.get<SampleWorkflow[]>('/sample-workflows');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get<SampleWorkflow>(`/sample-workflows/${id}`);
        return response.data;
    },

    create: async (data: Partial<SampleWorkflow>) => {
        const response = await apiClient.post<SampleWorkflow>('/sample-workflows', data);
        return response.data;
    },

    update: async (id: string, data: Partial<SampleWorkflow>) => {
        const response = await apiClient.put<SampleWorkflow>(`/sample-workflows/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await apiClient.delete(`/sample-workflows/${id}`);
        return response.data;
    },

    run: async (id: string) => {
        const response = await apiClient.post<{ executionId: string }>(`/sample-workflows/${id}/execute`);
        return response.data;
    },
};
