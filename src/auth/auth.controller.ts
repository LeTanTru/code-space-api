import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  LoginResponseDataDto,
  RegisterResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

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
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ResponseMessage('Logged in successfully')
  @ApiOperation({
    summary: 'User Login',
    description:
      'Authenticates user credentials, issues a short-lived JWT Access Token, creates a database session with device tracking, and sets an HTTP-only Refresh Token cookie.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated.',
    type: LoginResponseDataDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or user account no longer exists.',
  })
  @ApiResponse({
    status: 400,
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
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ResponseMessage(
    'Account created successfully. Please check your email for the verification code.'
  )
  @ApiOperation({
    summary: 'User Registration',
    description:
      'Creates a new unverified user account, generates a 6-digit OTP, and dispatches it via email. The account must be verified via POST /auth/verify-email before the user can fully log in.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User account created; verification email dispatched.',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (weak password or invalid payload).',
  })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ResponseMessage('Email verified successfully')
  @ApiOperation({
    summary: 'Verify Email with OTP',
    description:
      'Validates the 6-digit OTP for a pending email verification and marks the user email verified. The user must then log in via POST /auth/login.',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully.',
  })
  @ApiResponse({
    status: 401,
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
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed; new refresh cookie set.',
    type: RefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
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
  @ResponseMessage('Logged out successfully')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout & Revoke Current Session',
    description:
      'Revokes the current refresh session (scoped to the authenticated user) and clears the HTTP-only refresh token cookie.',
  })
  @ApiResponse({
    status: 204,
    description: 'Session revoked and cookie cleared.',
  })
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response): Promise<void> {
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.refreshToken;
    return this.authService.logout(refreshToken, req.user.id, res);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ResponseMessage('If this email is registered, a reset code has been sent')
  @ApiOperation({
    summary: 'Request Password Reset Code',
    description:
      'Dispatches a 6-digit password reset OTP via email. Always returns 200 regardless of whether the email exists to prevent user enumeration.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Reset code dispatched if the email is registered.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ResponseMessage('Password reset successfully')
  @ApiOperation({
    summary: 'Submit New Password',
    description:
      'Validates the reset OTP, updates the account password, and revokes ALL active sessions for security (forces re-login on every device).',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully; all sessions revoked.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired reset code.',
  })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }
}
