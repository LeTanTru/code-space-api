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

    let rawMessage =
      typeof exceptionResponse === 'object' && exceptionResponse.message
        ? exceptionResponse.message
        : typeof exceptionResponse === 'string'
          ? exceptionResponse
          : 'An unexpected error occurred';

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      rawMessage = 'Too many requests, please try again after 60 seconds';
    }

    const formattedMessage = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
    const errorCode = this.resolveErrorCode(status, rawMessage, exceptionResponse);

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Code: ${errorCode} - Message: ${formattedMessage}`
    );

    response.status(status).json({
      status: 'error',
      code: errorCode,
      message: formattedMessage,
      meta: {
        timestamp: Date.now(),
        path: request.url,
      },
    });
  }

  private resolveErrorCode(
    status: number,
    message: string | string[],
    exceptionResponse: any
  ): string {
    // 1. Explicit custom code provided in thrown exception response object
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      exceptionResponse.code
    ) {
      return String(exceptionResponse.code);
    }

    // 2. Class-validator validation pipe errors
    if (
      Array.isArray(message) ||
      (typeof exceptionResponse === 'object' && exceptionResponse.error === 'Bad Request')
    ) {
      return ERROR_CODES.VALIDATION_ERROR;
    }

    const msgLower = (Array.isArray(message) ? message.join(' ') : String(message)).toLowerCase();

    // 3. Domain-specific error code mappings by status & message hints
    if (status === HttpStatus.UNAUTHORIZED) {
      if (msgLower.includes('credentials') || msgLower.includes('email or password')) {
        return ERROR_CODES.INVALID_CREDENTIALS;
      }
      if (
        msgLower.includes('verification') ||
        msgLower.includes('code') ||
        msgLower.includes('otp')
      ) {
        return ERROR_CODES.INVALID_VERIFICATION_CODE;
      }
      if (msgLower.includes('incorrect password') || msgLower.includes('current password')) {
        return ERROR_CODES.INCORRECT_PASSWORD;
      }
      if (msgLower.includes('refresh token')) {
        return ERROR_CODES.MISSING_REFRESH_TOKEN;
      }
      if (msgLower.includes('session')) {
        return ERROR_CODES.INVALID_SESSION;
      }
      return ERROR_CODES.UNAUTHORIZED;
    }

    if (status === HttpStatus.CONFLICT) {
      if (msgLower.includes('email')) {
        return ERROR_CODES.EMAIL_ALREADY_EXISTS;
      }
      return ERROR_CODES.RESOURCE_CONFLICT;
    }

    if (status === HttpStatus.NOT_FOUND) {
      if (msgLower.includes('session')) {
        return ERROR_CODES.SESSION_NOT_FOUND;
      }
      if (msgLower.includes('user')) {
        return ERROR_CODES.USER_NOT_FOUND;
      }
      return ERROR_CODES.NOT_FOUND;
    }

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      return ERROR_CODES.TOO_MANY_REQUESTS;
    }

    if (status === HttpStatus.BAD_REQUEST) {
      return ERROR_CODES.BAD_REQUEST;
    }

    if (status === HttpStatus.FORBIDDEN) {
      return ERROR_CODES.FORBIDDEN;
    }

    return ERROR_CODES.INTERNAL_SERVER_ERROR;
  }
}
