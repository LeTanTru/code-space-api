import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ERROR_CODES } from '@/constants/error-code';
import { AppException } from '@/common/exceptions/app.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const { errorCode, message } = this.resolveErrorDetails(status, exception);

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Code: ${errorCode} - Message: ${message}`
    );

    response.status(status).json({
      status: 'error',
      code: errorCode,
      message,
      meta: {
        timestamp: Date.now(),
        path: request.url,
      },
    });
  }

  private resolveErrorDetails(
    status: number,
    exception: unknown
  ): { errorCode: string; message: string } {
    // 1. Typed AppException or custom exception carrying explicit errorCode
    if (exception instanceof AppException || (exception as any)?.errorCode) {
      const res = (exception as HttpException).getResponse() as any;
      return {
        errorCode: (exception as any).errorCode ?? res?.code,
        message: typeof res === 'object' && res?.message ? res.message : (exception as any).message,
      };
    }

    // 2. Standard NestJS HttpException (e.g. class-validator ValidationPipe, guards)
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const resObj = typeof res === 'object' && res !== null ? (res as any) : {};

      // Custom code passed manually via: throw new HttpException({ code: '...', message: '...' }, status)
      if (resObj.code) {
        return {
          errorCode: String(resObj.code),
          message: this.extractMessage(res, status),
        };
      }

      // class-validator ValidationPipe produces an array of messages
      if (Array.isArray(resObj.message) || resObj.error === 'Bad Request') {
        return {
          errorCode: ERROR_CODES.VALIDATION_ERROR,
          message: Array.isArray(resObj.message)
            ? resObj.message.join(', ')
            : (resObj.message ?? 'Validation failed'),
        };
      }

      // Map remaining HTTP statuses to generic codes
      return {
        errorCode: this.statusToGenericCode(status),
        message: this.extractMessage(res, status),
      };
    }

    // 3. Unknown / unhandled errors
    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception)
    );
    return {
      errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
    };
  }

  private extractMessage(res: string | object, status: number): string {
    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      return 'Too many requests, please try again after 60 seconds';
    }
    if (typeof res === 'string') return res;
    const obj = res as any;
    if (Array.isArray(obj.message)) return obj.message.join(', ');
    return obj.message ?? 'An unexpected error occurred';
  }

  private statusToGenericCode(status: number): string {
    const map: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: ERROR_CODES.BAD_REQUEST,
      [HttpStatus.UNAUTHORIZED]: ERROR_CODES.UNAUTHORIZED,
      [HttpStatus.FORBIDDEN]: ERROR_CODES.FORBIDDEN,
      [HttpStatus.NOT_FOUND]: ERROR_CODES.NOT_FOUND,
      [HttpStatus.CONFLICT]: ERROR_CODES.RESOURCE_CONFLICT,
      [HttpStatus.TOO_MANY_REQUESTS]: ERROR_CODES.TOO_MANY_REQUESTS,
    };
    return map[status] ?? ERROR_CODES.INTERNAL_SERVER_ERROR;
  }
}
