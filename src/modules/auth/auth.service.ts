import { Injectable, Logger } from '@nestjs/common';
import {
  EmailAlreadyExistsException,
  EmailNotVerifiedException,
  InvalidCredentialsException,
  InvalidSessionException,
  InvalidVerificationCodeException,
  MissingRefreshTokenException,
  SessionNotFoundException,
  UserNotFoundException,
} from '@/common/exceptions/app.exception';
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

const ARGON2_OPTIONS: argon2.Options & { raw?: boolean } = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

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

  private sha256(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private hashEquals(hexA: string, hexB: string): boolean {
    const bufA = Buffer.from(hexA, 'hex');
    const bufB = Buffer.from(hexB, 'hex');
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  }

  private generateOtp(): string {
    return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private async signAccessToken(user: {
    id: bigint | string;
    email: string;
    role: string;
  }): Promise<{ accessToken: string; expiresIn: number }> {
    const payload = {
      sub: user.id.toString(),
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
    userId: bigint,
    clientInfo?: ClientInfo,
    deviceName?: string
  ): Promise<{ refreshToken: string; refreshTokenHash: string; expiresAt: Date }> {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = this.sha256(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DEFAULT_REFRESH_TOKEN_EXPIRES_IN_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: refreshTokenHash,
        deviceName: deviceName || clientInfo?.userAgent || 'Unknown Device',
        userAgent: clientInfo?.userAgent || null,
        ipAddress: clientInfo?.ipAddress || null,
        expiresAt,
      },
    });

    return { refreshToken, refreshTokenHash, expiresAt };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/api/v1',
      maxAge: DEFAULT_REFRESH_TOKEN_EXPIRES_IN_DAYS * ONE_DAY_IN_MS,
    });
  }

  private async issueTokenPair(
    user: { id: bigint; email: string; name: string; avatarUrl: string | null; role: UserRole },
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
        id: user.id.toString(),
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
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, pass);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    if (!user.emailVerifiedAt) {
      throw new EmailNotVerifiedException();
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
      throw new EmailAlreadyExistsException();
    }

    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTIONS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
      },
    });

    const code = this.generateOtp();
    await this.prisma.emailVerification.create({
      data: {
        email: dto.email,
        codeHash: this.sha256(code),
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

    if (!verification || !this.hashEquals(verification.codeHash, this.sha256(dto.code))) {
      throw new InvalidVerificationCodeException();
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
      throw new MissingRefreshTokenException();
    }

    const tokenHash = this.sha256(refreshToken);
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const session = await tx.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!session || session.revokedAt !== null || session.expiresAt <= now) {
        throw new InvalidSessionException();
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
          tokenHash: this.sha256(newRefreshToken),
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
      throw new UserNotFoundException('User account no longer exists');
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
  async logout(refreshToken: string | undefined, userIdStr: string, res?: Response): Promise<void> {
    if (refreshToken) {
      const userId = BigInt(userIdStr);
      await this.prisma.refreshToken.updateMany({
        where: {
          tokenHash: this.sha256(refreshToken),
          userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    if (res) {
      res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    }

    this.logger.log(`User logged out (session revoked): ${userIdStr}`);
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
      throw new UserNotFoundException('Email not registered');
    }

    const code = this.generateOtp();
    await this.prisma.passwordResetToken.create({
      data: {
        email,
        codeHash: this.sha256(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    void this.mailService.sendPasswordResetEmail(email, code, user.name).catch((err: Error) => {
      this.logger.error(
        `Background password reset email delivery failed for ${email}: ${err.message}`
      );
    });
  }

  /**
   * Validate reset OTP, set a new password, and revoke all sessions for the user
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const token = await this.prisma.passwordResetToken.findFirst({
      where: {
        email: dto.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!token || !this.hashEquals(token.codeHash, this.sha256(dto.code))) {
      throw new InvalidVerificationCodeException('Invalid or expired reset code');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (!user) {
      throw new InvalidVerificationCodeException('Invalid or expired reset code');
    }

    const newPasswordHash = await argon2.hash(dto.newPassword, ARGON2_OPTIONS);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: token.id },
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
  async revokeSession(userIdStr: string, sessionIdStr: string): Promise<void> {
    const userId = BigInt(userIdStr);
    const sessionId = BigInt(sessionIdStr);

    const result = await this.prisma.refreshToken.updateMany({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    if (result.count === 0) {
      throw new SessionNotFoundException();
    }

    this.logger.log(`Session ${sessionIdStr} revoked for user ${userIdStr}`);
  }

  /**
   * Get active logged-in device sessions for user
   */
  async getActiveSessions(userIdStr: string): Promise<SessionResponseDto[]> {
    const userId = BigInt(userIdStr);
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
      id: s.id.toString(),
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
  async getMe(userIdStr: string): Promise<UserMeResponseDto> {
    const userId = BigInt(userIdStr);
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
      throw new UserNotFoundException('User account no longer exists');
    }

    const activeSessions = await this.getActiveSessions(userIdStr);

    return {
      id: user.id.toString(),
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
  async deleteAccount(userIdStr: string, password: string): Promise<void> {
    const userId = BigInt(userIdStr);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundException('User account not found');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password, ARGON2_OPTIONS);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException('Incorrect password');
    }

    await this.prisma.user.delete({ where: { id: userId } });

    this.logger.log(`Account permanently deleted: ${user.email}`);
  }
}
