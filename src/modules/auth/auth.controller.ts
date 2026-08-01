import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from '@/modules/auth/auth.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { VerifyEmailDto } from '@/modules/auth/dto/verify-email.dto';
import { ForgotPasswordDto } from '@/modules/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';
import {
  LoginResponseDataDto,
  RegisterResponseDto,
  RefreshResponseDto,
} from '@/modules/auth/dto/auth-response.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import {
  ApiSingleResponse,
  ApiNoDataResponse,
  ApiMutateResponse,
} from '@/common/decorators/swagger-response.decorator';
import { AUTH_THROTTLE_LIMIT, AUTH_THROTTLE_TTL_MS } from '@/constants/time';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private extractClientInfo(req: Request): { ipAddress: string; userAgent: string } {
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.ip || req.socket?.remoteAddress || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    return { ipAddress, userAgent };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })
  @ResponseMessage('Login successfully')
  @ApiOperation({
    summary: 'User Login',
    description:
      'Authenticates user credentials, issues a short-lived JWT Access Token, creates a database session with device tracking, and sets an HTTP-only Refresh Token cookie.',
  })
  @ApiBody({ type: LoginDto })
  @ApiSingleResponse(
    LoginResponseDataDto,
    HttpStatus.OK,
    'Login successfully',
    '/api/v1/auth/login'
  )
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or user account no longer exists.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (e.g. invalid email format or missing password).',
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<LoginResponseDataDto> {
    return this.authService.login(dto, res, this.extractClientInfo(req));
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })
  @ResponseMessage('Register account successfully')
  @ApiOperation({
    summary: 'User Registration',
    description:
      'Creates a new unverified user account, generates a 6-digit OTP, and dispatches it via email. The account must be verified via POST /auth/verify-email before the user can fully log in.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiMutateResponse(
    RegisterResponseDto,
    HttpStatus.CREATED,
    'Register account successfully',
    '/api/v1/auth/register'
  )
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already registered.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (weak password or invalid payload).',
  })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })
  @ResponseMessage('Verify email successfully')
  @ApiOperation({
    summary: 'Verify Email with OTP',
    description:
      'Validates the 6-digit OTP for a pending email verification and marks the user email verified. The user must then log in via POST /auth/login.',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiNoDataResponse(HttpStatus.OK, 'Verify email successfully', '/api/v1/auth/verify-email')
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid, expired, or already used verification code.',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    return this.authService.verifyEmail(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Access token refreshed successfully')
  @ApiOperation({
    summary: 'Refresh Access Token',
    description:
      'Rotates the refresh token presented in the HTTP-only cookie: revokes the old session, creates a new one, and returns a fresh Access Token.',
  })
  @ApiSingleResponse(
    RefreshResponseDto,
    HttpStatus.OK,
    'Access token refreshed successfully',
    '/api/v1/auth/refresh'
  )
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token missing, expired, or revoked.',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<RefreshResponseDto> {
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.refreshToken;
    return this.authService.refresh(refreshToken, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Logout successfully')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout & Revoke Current Session',
    description:
      'Revokes the current refresh session (scoped to the authenticated user) and clears the HTTP-only refresh token cookie.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Logout successfully',
  })
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response): Promise<void> {
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.refreshToken;
    return this.authService.logout(refreshToken, req.user.id, res);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })
  @ResponseMessage('Send password reset code successfully')
  @ApiOperation({
    summary: 'Request Password Reset Code',
    description:
      'Dispatches a 6-digit password reset OTP via email if registered. Returns 404 if the email does not exist.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiNoDataResponse(
    HttpStatus.OK,
    'Send password reset code successfully',
    '/api/v1/auth/forgot-password'
  )
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Email not registered.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })
  @ResponseMessage('Password reset successfully')
  @ApiOperation({
    summary: 'Submit New Password',
    description:
      'Validates the reset OTP, updates the account password, and revokes ALL active sessions for security (forces re-login on every device).',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiNoDataResponse(HttpStatus.OK, 'Password reset successfully', '/api/v1/auth/reset-password')
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired reset code.',
  })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }
}
