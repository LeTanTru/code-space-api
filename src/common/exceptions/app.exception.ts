import { HttpException, HttpStatus } from '@nestjs/common';
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

export class InvalidCredentialsException extends AppException {
  constructor(message = 'Invalid email or password') {
    super(ERROR_CODES.INVALID_CREDENTIALS, message, HttpStatus.UNAUTHORIZED);
  }
}

export class EmailNotVerifiedException extends AppException {
  constructor(message = 'Email not verified. Please check your inbox for the verification code') {
    super(ERROR_CODES.EMAIL_NOT_VERIFIED, message, HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidVerificationCodeException extends AppException {
  constructor(message = 'Invalid or expired verification code') {
    super(ERROR_CODES.INVALID_VERIFICATION_CODE, message, HttpStatus.UNAUTHORIZED);
  }
}

export class IncorrectPasswordException extends AppException {
  constructor(message = 'Incorrect password') {
    super(ERROR_CODES.INCORRECT_PASSWORD, message, HttpStatus.UNAUTHORIZED);
  }
}

export class MissingRefreshTokenException extends AppException {
  constructor(message = 'Refresh token not provided') {
    super(ERROR_CODES.MISSING_REFRESH_TOKEN, message, HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidSessionException extends AppException {
  constructor(message = 'Session expired or invalid') {
    super(ERROR_CODES.INVALID_SESSION, message, HttpStatus.UNAUTHORIZED);
  }
}

// ─── User / Account ──────────────────────────────────────────────────────────

export class UserNotFoundException extends AppException {
  constructor(message = 'User not found') {
    super(ERROR_CODES.USER_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

export class EmailAlreadyExistsException extends AppException {
  constructor(message = 'Email already registered') {
    super(ERROR_CODES.EMAIL_ALREADY_EXISTS, message, HttpStatus.CONFLICT);
  }
}

// ─── Session ─────────────────────────────────────────────────────────────────

export class SessionNotFoundException extends AppException {
  constructor(message = 'Session not found') {
    super(ERROR_CODES.SESSION_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}
