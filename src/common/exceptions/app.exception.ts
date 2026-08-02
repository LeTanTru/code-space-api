import {
  HttpException,
  HttpStatus,
  UnauthorizedException as NestUnauthorizedException,
  NotFoundException as NestNotFoundException,
  ConflictException as NestConflictException,
  BadRequestException as NestBadRequestException,
  ForbiddenException as NestForbiddenException,
} from '@nestjs/common';
import { ERROR_CODES, ErrorCode } from '@/constants/error-code';

/**
 * Base application exception that carries a typed error code.
 * Use base HTTP status exceptions below directly in services with ERROR_CODES.
 */
export class AppException extends HttpException {
  readonly errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, message: string, status: HttpStatus) {
    super({ message, code: errorCode }, status);
    this.errorCode = errorCode;
  }
}

// ─── Base HTTP Status Subclasses ──────────────────────────────────────────────

export class UnauthorizedException extends NestUnauthorizedException {
  readonly errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, message: string) {
    super({ message, code: errorCode });
    this.errorCode = errorCode;
  }
}

export class NotFoundException extends NestNotFoundException {
  readonly errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, message: string) {
    super({ message, code: errorCode });
    this.errorCode = errorCode;
  }
}

export class ConflictException extends NestConflictException {
  readonly errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, message: string) {
    super({ message, code: errorCode });
    this.errorCode = errorCode;
  }
}

export class BadRequestException extends NestBadRequestException {
  readonly errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, message: string) {
    super({ message, code: errorCode });
    this.errorCode = errorCode;
  }
}

export class ForbiddenException extends NestForbiddenException {
  readonly errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, message: string) {
    super({ message, code: errorCode });
    this.errorCode = errorCode;
  }
}
