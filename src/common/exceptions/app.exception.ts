import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ERROR_CODES, ErrorCode } from '@/constants/error-code';

/**
 * Base application exception that carries a typed error code.
 * Use the domain-specific subclasses below instead of throwing raw NestJS exceptions.
 */
export class AppException extends HttpException {
  readonly errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, message: string, status: HttpStatus) {
    super({ message, code: errorCode }, status);
    this.errorCode = errorCode;
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export class InvalidCredentialsException extends UnauthorizedException {
  readonly errorCode = ERROR_CODES.INVALID_CREDENTIALS;
  constructor(message = 'Invalid email or password') {
    super({ message, code: ERROR_CODES.INVALID_CREDENTIALS });
  }
}

export class EmailNotVerifiedException extends UnauthorizedException {
  readonly errorCode = ERROR_CODES.EMAIL_NOT_VERIFIED;
  constructor(message = 'Email not verified. Please check your inbox for the verification code') {
    super({ message, code: ERROR_CODES.EMAIL_NOT_VERIFIED });
  }
}

export class InvalidVerificationCodeException extends UnauthorizedException {
  readonly errorCode = ERROR_CODES.INVALID_VERIFICATION_CODE;
  constructor(message = 'Invalid or expired verification code') {
    super({ message, code: ERROR_CODES.INVALID_VERIFICATION_CODE });
  }
}

export class IncorrectPasswordException extends UnauthorizedException {
  readonly errorCode = ERROR_CODES.INCORRECT_PASSWORD;
  constructor(message = 'Incorrect password') {
    super({ message, code: ERROR_CODES.INCORRECT_PASSWORD });
  }
}

export class MissingRefreshTokenException extends UnauthorizedException {
  readonly errorCode = ERROR_CODES.MISSING_REFRESH_TOKEN;
  constructor(message = 'Refresh token not provided') {
    super({ message, code: ERROR_CODES.MISSING_REFRESH_TOKEN });
  }
}

export class InvalidSessionException extends UnauthorizedException {
  readonly errorCode = ERROR_CODES.INVALID_SESSION;
  constructor(message = 'Session expired or invalid') {
    super({ message, code: ERROR_CODES.INVALID_SESSION });
  }
}

// ─── User / Account ──────────────────────────────────────────────────────────

export class UserNotFoundException extends UnauthorizedException {
  readonly errorCode = ERROR_CODES.USER_NOT_FOUND;
  constructor(message = 'User not found') {
    super({ message, code: ERROR_CODES.USER_NOT_FOUND });
  }
}

export class EmailAlreadyExistsException extends ConflictException {
  readonly errorCode = ERROR_CODES.EMAIL_ALREADY_EXISTS;
  constructor(message = 'Email already registered') {
    super({ message, code: ERROR_CODES.EMAIL_ALREADY_EXISTS });
  }
}

// ─── Session ─────────────────────────────────────────────────────────────────

export class SessionNotFoundException extends NotFoundException {
  readonly errorCode = ERROR_CODES.SESSION_NOT_FOUND;
  constructor(message = 'Session not found') {
    super({ message, code: ERROR_CODES.SESSION_NOT_FOUND });
  }
}
