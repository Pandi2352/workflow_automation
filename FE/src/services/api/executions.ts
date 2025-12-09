import apiClient from './client';
import type { ExecutionHistory } from '../../types/workflow.types';

export const executionService = {
    getAll: async (workflowId?: string) => {
        const url = workflowId
            ? `/executions?workflowId=${workflowId}`
            : '/executions';
        const response = await apiClient.get<ExecutionHistory[]>(url);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get<ExecutionHistory>(`/executions/${id}`);
        return response.data;
    },
};
