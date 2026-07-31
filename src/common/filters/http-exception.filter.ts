import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: any =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const message =
      typeof exceptionResponse === 'object' && exceptionResponse.message
        ? exceptionResponse.message
        : typeof exceptionResponse === 'string'
          ? exceptionResponse
          : 'An unexpected error occurred';

    const errorDetails =
      typeof exceptionResponse === 'object' && exceptionResponse.error
        ? exceptionResponse.error
        : undefined;

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Message: ${JSON.stringify(message)}`
    );

    response.status(status).json({
      status: 'error',
      error: {
        code: HttpStatus[status] || 'ERROR',
        message: Array.isArray(message) ? message.join(', ') : message,
        details: errorDetails,
      },
      meta: {
        timestamp: Date.now(),
        path: request.url,
      },
    });
  }
}
