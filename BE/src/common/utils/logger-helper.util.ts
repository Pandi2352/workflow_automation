export class LoggerHelper {
    static log(context: string, message: string, data?: any) {
        console.log(`[INFO] [${context}] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data) : '');
    }

    static error(context: string, message: string, trace?: string) {
        console.error(`[ERROR] [${context}] ${new Date().toISOString()} - ${message}`, trace || '');
    }

    static warn(context: string, message: string, data?: any) {
        console.warn(`[WARN] [${context}] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data) : '');
    }

    static debug(context: string, message: string, data?: any) {
        console.debug(`[DEBUG] [${context}] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data) : '');
    }
}
