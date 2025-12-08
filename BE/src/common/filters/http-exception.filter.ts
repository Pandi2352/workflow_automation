import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { createApiResponse } from '../utils/response.util';
import { CustomLogger } from '../utils/logger.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private logger = new CustomLogger();

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.message
                : 'Internal server error';

        const errorDetails =
            exception instanceof HttpException
                ? exception.getResponse()
                : exception;

        this.logger.error(`Http Status: ${status} Error Message: ${JSON.stringify(message)}`, JSON.stringify(errorDetails));

        response
            .status(status)
            .json(createApiResponse(false, message, null, errorDetails));
    }
}
