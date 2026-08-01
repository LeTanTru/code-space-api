import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '@/prisma/prisma.service';
import { SessionResponseDto, UserMeResponseDto } from '@/auth/dto/auth-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const ARGON2_OPTIONS: argon2.Options & { raw?: boolean } = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get authenticated user profile with active device sessions list
   */
  async getProfile(userIdStr: string): Promise<UserMeResponseDto> {
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

    const activeSessions = await this.getSessions(userIdStr);

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
   * Update authenticated user's profile metadata (name, avatarUrl)
   */
  async updateProfile(userIdStr: string, dto: UpdateProfileDto): Promise<UserMeResponseDto> {
    const userId = BigInt(userIdStr);

    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      throw new UnauthorizedException('User account no longer exists');
    }

    const dataToUpdate: { name?: string; avatarUrl?: string | null } = {};
    if (dto.name !== undefined) dataToUpdate.name = dto.name;
    if (dto.avatarUrl !== undefined) dataToUpdate.avatarUrl = dto.avatarUrl;

    if (Object.keys(dataToUpdate).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });
      this.logger.log(`User profile updated: ${userIdStr}`);
    }

    return this.getProfile(userIdStr);
  }

  /**
   * Get active logged-in device sessions for user
   */
  async getSessions(userIdStr: string): Promise<SessionResponseDto[]> {
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
      throw new NotFoundException('Session not found');
    }

    this.logger.log(`Session ${sessionIdStr} revoked for user ${userIdStr}`);
  }

  /**
   * Permanently delete the authenticated user's account.
   * Requires password confirmation to prevent accidental or unauthorised deletion.
   */
  async deleteAccount(userIdStr: string, password: string): Promise<void> {
    const userId = BigInt(userIdStr);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password, ARGON2_OPTIONS);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password');
    }

    await this.prisma.user.delete({ where: { id: userId } });

    this.logger.log(`Account permanently deleted: ${user.email}`);
  }

  /**
   * Change authenticated user's password and revoke active refresh sessions
   */
  async changePassword(userIdStr: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const userId = BigInt(userIdStr);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    const isOldPasswordValid = await argon2.verify(
      user.passwordHash,
      dto.oldPassword,
      ARGON2_OPTIONS
    );
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Incorrect current password');
    }

    const newPasswordHash = await argon2.hash(dto.newPassword, ARGON2_OPTIONS);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    this.logger.log(`Password changed for user: ${user.email}`);
    return { message: 'Change password successfully' };
  }
}
