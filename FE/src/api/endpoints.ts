export const API_ENDPOINTS = {
    AUTH: {
        GOOGLE: '/auth/google',
    },
    WORKFLOWS: {
        LIST: '/sample-workflows', // Corrected from /workflows
        CREATE: '/sample-workflows',
        GET: (id: string) => `/sample-workflows/${id}`,
        UPDATE: (id: string) => `/sample-workflows/${id}`,
        DELETE: (id: string) => `/sample-workflows/${id}`,
        EXECUTE: (id: string) => `/sample-workflows/${id}/execute`,
    },
    GOOGLE_DRIVE: {
        LIST: '/google-drive/list',
    },
    CREDENTIALS: {
        LIST: '/credentials',
    },
    EXECUTIONS: {
        LIST: '/sample-workflows/executions/list',
    }
};
