import { Injectable, Logger } from '@nestjs/common';
import {
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@/common/exceptions/app.exception';
import { ERROR_CODES } from '@/constants/error-code';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { MailService } from '@/modules/mail/mail.service';
import { UserRole } from '@prisma/client';
import {
  ONE_DAY_IN_MS,
  DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  DEFAULT_REFRESH_TOKEN_EXPIRES_IN_DAYS,
  OTP_TTL_MS,
} from '@/constants/time';
import { resolvePublicIp } from '@/utils/location.util';
import { sha256, hashEquals, generateOtp, ARGON2_OPTIONS } from '@/utils/crypto.util';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { VerifyEmailDto } from '@/modules/auth/dto/verify-email.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';
import {
  LoginResponseDataDto,
  RefreshResponseDto,
  RegisterResponseDto,
  SessionResponseDto,
  UserMeResponseDto,
} from '@/modules/auth/dto/auth-response.dto';

type ClientInfo = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService
  ) {}

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async signAccessToken(user: {
    id: string;
    email: string;
    role: string;
  }): Promise<{ accessToken: string; expiresIn: number }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: `${DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS}s`,
    });

    return {
      accessToken,
      expiresIn: DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    };
  }

  private async createRefreshSession(
    userId: string,
    clientInfo?: ClientInfo,
    deviceName?: string
  ): Promise<{ refreshToken: string; refreshTokenHash: string; expiresAt: Date }> {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = sha256(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DEFAULT_REFRESH_TOKEN_EXPIRES_IN_DAYS);

    const resolvedIp = resolvePublicIp(clientInfo?.ipAddress);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: refreshTokenHash,
        deviceName: deviceName || clientInfo?.userAgent || 'Unknown Device',
        userAgent: clientInfo?.userAgent || null,
        ipAddress: resolvedIp,
        expiresAt,
      },
    });

    return { refreshToken, refreshTokenHash, expiresAt };
  }

  private getCookiePath(): string {
    const apiPrefix = this.configService.get<string>('API_PREFIX') || 'api/v1';
    return apiPrefix.startsWith('/') ? apiPrefix : `/${apiPrefix}`;
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: this.getCookiePath(),
      maxAge: DEFAULT_REFRESH_TOKEN_EXPIRES_IN_DAYS * ONE_DAY_IN_MS,
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: this.getCookiePath(),
    });
  }

  private async issueTokenPair(
    user: { id: string; email: string; name: string; avatarUrl: string | null; role: UserRole },
    res?: Response,
    clientInfo?: ClientInfo,
    deviceName?: string
  ): Promise<LoginResponseDataDto> {
    const { accessToken, expiresIn } = await this.signAccessToken(user);
    const { refreshToken } = await this.createRefreshSession(user.id, clientInfo, deviceName);

    if (res) {
      this.setRefreshTokenCookie(res, refreshToken);
    }

    this.logger.log(
      `User logged in successfully from device "${deviceName || clientInfo?.userAgent || 'Unknown'}" (IP: ${
        clientInfo?.ipAddress || 'Unknown'
      }): ${user.email}`
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Public auth flows
  // ---------------------------------------------------------------------------

  /**
   * Validate user credentials using Argon2id
   */
  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, pass);
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(
        ERROR_CODES.EMAIL_NOT_VERIFIED,
        'Email not verified. Please check your inbox for the verification code'
      );
    }

    return user;
  }

  /**
   * Login user: Issue Access Token, hash Refresh Token session into DB, track device & IP address, and set HTTP-only cookie
   */
  async login(
    dto: LoginDto,
    res?: Response,
    clientInfo?: ClientInfo
  ): Promise<LoginResponseDataDto> {
    const user = await this.validateUser(dto.email, dto.password);
    return this.issueTokenPair(user, res, clientInfo, dto.deviceName);
  }

  /**
   * Register a new user account and dispatch a verification OTP email
   */
  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(ERROR_CODES.EMAIL_ALREADY_EXISTS, 'Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTIONS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
      },
    });

    const code = generateOtp();
    await this.prisma.emailVerification.create({
      data: {
        email: dto.email,
        codeHash: sha256(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    void this.mailService.sendVerificationEmail(dto.email, code, dto.name).catch((err: Error) => {
      this.logger.error(
        `Background verification email delivery failed for ${dto.email}: ${err.message}`
      );
    });

    this.logger.log(`New user registered (unverified): ${dto.email}`);

    return {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  /**
   * Verify a 6-digit OTP and mark the user's email as verified
   */
  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const verification = await this.prisma.emailVerification.findFirst({
      where: {
        email: dto.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification || !hashEquals(verification.codeHash, sha256(dto.code))) {
      throw new UnauthorizedException(
        ERROR_CODES.INVALID_VERIFICATION_CODE,
        'Invalid or expired verification code'
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      });
      await tx.user.update({
        where: { email: dto.email },
        data: { emailVerifiedAt: new Date() },
      });
    });

    this.logger.log(`Email verified for user: ${dto.email}`);
    return { message: 'Verify email successfully' };
  }

  /**
   * Rotate a refresh token: revoke the current session row and issue a new pair
   */
  async refresh(refreshToken: string | undefined, res?: Response): Promise<RefreshResponseDto> {
    if (!refreshToken) {
      throw new UnauthorizedException(
        ERROR_CODES.MISSING_REFRESH_TOKEN,
        'Refresh token not provided'
      );
    }

    const tokenHash = sha256(refreshToken);
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const session = await tx.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!session || session.revokedAt !== null || session.expiresAt <= now) {
        throw new UnauthorizedException(ERROR_CODES.INVALID_SESSION, 'Session expired or invalid');
      }

      await tx.refreshToken.update({
        where: { id: session.id },
        data: { revokedAt: now },
      });

      const newRefreshToken = crypto.randomBytes(40).toString('hex');
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + DEFAULT_REFRESH_TOKEN_EXPIRES_IN_DAYS);

      await tx.refreshToken.create({
        data: {
          userId: session.userId,
          tokenHash: sha256(newRefreshToken),
          deviceName: session.deviceName,
          userAgent: session.userAgent,
          ipAddress: session.ipAddress,
          expiresAt: newExpiresAt,
        },
      });

      return { userId: session.userId, newRefreshToken };
    });

    const user = await this.prisma.user.findUnique({
      where: { id: result.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND, 'User account no longer exists');
    }

    if (res) {
      this.setRefreshTokenCookie(res, result.newRefreshToken);
    }

    const { accessToken, expiresIn } = await this.signAccessToken(user);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
    };
  }

  /**
   * Revoke the current refresh session and clear the HTTP-only cookie
   */
  async logout(refreshToken: string | undefined, userId: string, res?: Response): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: {
          tokenHash: sha256(refreshToken),
          userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    if (res) {
      this.clearRefreshTokenCookie(res);
    }

    this.logger.log(`User logged out (session revoked): ${userId}`);
  }

  /**
   * Request a password reset code. Validates email existence before sending OTP.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND, 'Email not registered');
    }

    const code = generateOtp();

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { email } }),
      this.prisma.passwordResetToken.create({
        data: {
          email,
          codeHash: sha256(code),
          expiresAt: new Date(Date.now() + OTP_TTL_MS),
        },
      }),
    ]);

    void this.mailService.sendPasswordResetEmail(email, code, user.name).catch((err: Error) => {
      this.logger.error(`Failed to send password reset email to ${email}: ${err.message}`);
    });
  }

  /**
   * Reset user password using OTP verification code
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        email: dto.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!tokenRecord || !hashEquals(tokenRecord.codeHash, sha256(dto.code))) {
      throw new UnauthorizedException(
        ERROR_CODES.INVALID_VERIFICATION_CODE,
        'Invalid or expired verification code'
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND, 'User account no longer exists');
    }

    const newPasswordHash = await argon2.hash(dto.newPassword, ARGON2_OPTIONS);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      });

      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    this.logger.log(`Password reset completed for user: ${dto.email}`);
    return { message: 'Reset password successfully' };
  }

  /**
   * Revoke a specific session owned by the authenticated user (IDOR-safe)
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException(ERROR_CODES.SESSION_NOT_FOUND, 'Session not found');
    }

    this.logger.log(`Session ${sessionId} revoked for user ${userId}`);
  }

  /**
   * Get active logged-in device sessions for user
   */
  async getActiveSessions(userId: string): Promise<SessionResponseDto[]> {
    const sessions = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.deviceName,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  /**
   * Get authenticated user profile with active device sessions list
   */
  async getMe(userId: string): Promise<UserMeResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND, 'User account no longer exists');
    }

    const activeSessions = await this.getActiveSessions(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      activeSessions,
    };
  }

  /**
   * Permanently delete the authenticated user's account.
   * Requires password confirmation to prevent accidental or unauthorised deletion.
   * All related data is removed via Prisma cascade rules.
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_CODES.USER_NOT_FOUND, 'User account not found');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password, ARGON2_OPTIONS);
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_CODES.INVALID_CREDENTIALS, 'Incorrect password');
    }

    await this.prisma.user.delete({ where: { id: userId } });

    this.logger.log(`Account permanently deleted: ${user.email}`);
  }
}
