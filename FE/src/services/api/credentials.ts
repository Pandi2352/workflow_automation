import { axiosInstance } from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface Credential {
    _id: string;
    provider: string; // 'GEMINI', 'GOOGLE', etc.
    name: string;
    accessToken: string; // or value, heavily masked
    createdAt: string;
    updatedAt: string;
}

export const credentialsService = {
    getAll: async (provider?: string): Promise<Credential[]> => {
        const response = await axiosInstance.get(API_ENDPOINTS.CREDENTIALS.LIST, {
            params: provider ? { provider } : {}
        });
        return response.data;
    },

    create: async (data: Partial<Credential>): Promise<Credential> => {
        const response = await axiosInstance.post(API_ENDPOINTS.CREDENTIALS.LIST, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await axiosInstance.delete(`${API_ENDPOINTS.CREDENTIALS.LIST}/${id}`);
    }
};
