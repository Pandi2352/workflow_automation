import { LoggerService, Injectable } from '@nestjs/common';

@Injectable()
export class CustomLogger implements LoggerService {
    log(message: string) {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    }

    error(message: string, trace: string) {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, trace);
    }

    warn(message: string) {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
    }

    debug(message: string) {
        console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    }

    verbose(message: string) {
        console.log(`[VERBOSE] ${new Date().toISOString()} - ${message}`);
    }
}
