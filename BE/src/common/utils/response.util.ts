export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    error?: any;
    timestamp: string;
}

export const createApiResponse = <T>(
    success: boolean,
    message: string,
    data: T | null = null,
    error: any = null,
): ApiResponse<T> => {
    return {
        success,
        message,
        data,
        error,
        timestamp: new Date().toISOString(),
    };
};
