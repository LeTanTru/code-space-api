import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import {
  ONE_DAY_IN_MS,
  DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  DEFAULT_REFRESH_TOKEN_EXPIRES_IN_DAYS,
} from '@/constants/time';
import { LoginDto } from './dto/login.dto';
import {
  LoginResponseDataDto,
  SessionResponseDto,
  UserMeResponseDto,
} from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Validate user credentials using Argon2id
   */
  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, pass);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  /**
   * Login user: Issue Access Token, hash Refresh Token session into DB, track device & IP address, and set HTTP-only cookie
   */
  async login(
    dto: LoginDto,
    res?: Response,
    clientInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<LoginResponseDataDto> {
    const user = await this.validateUser(dto.email, dto.password);

    const payload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    };

    // 1. Generate JWT Access Token
    const accessTokenSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    const expiresInSeconds = DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessTokenSecret,
      expiresIn: `${expiresInSeconds}s`,
    });

    // 2. Generate Refresh Token string & its hash
    const refreshTokenPlain = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenPlain).digest('hex');

    const refreshExpiresDays = DEFAULT_REFRESH_TOKEN_EXPIRES_IN_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresDays);

    const deviceName = dto.deviceName || clientInfo?.userAgent || 'Unknown Device';
    const userAgent = clientInfo?.userAgent || null;
    const ipAddress = clientInfo?.ipAddress || null;

    // 3. Save Refresh Token session & device metadata in Database
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        deviceName,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    // 4. Set HTTP-Only Cookie if Response object is available
    if (res) {
      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
      res.cookie('refreshToken', refreshTokenPlain, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/api/v1/auth',
        maxAge: refreshExpiresDays * ONE_DAY_IN_MS,
      });
    }

    this.logger.log(
      `User logged in successfully from device "${deviceName}" (IP: ${ipAddress || 'Unknown'}): ${user.email}`
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: expiresInSeconds,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
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
      throw new UnauthorizedException('User account no longer exists');
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
}
