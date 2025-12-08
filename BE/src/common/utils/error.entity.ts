export class ErrorEntity {
    success: boolean = false;
    statusCode: number;
    message: string;
    timestamp: string;
    path?: string;
    error?: any;

    constructor(statusCode: number, message: string, path?: string, error?: any) {
        this.statusCode = statusCode;
        this.message = message;
        this.path = path;
        this.error = error;
        this.timestamp = new Date().toISOString();
    }
}
