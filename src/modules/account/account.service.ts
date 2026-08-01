import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SessionResponseDto, UserMeResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { UpdateProfileDto } from '@/modules/account/dto/update-profile.dto';
import { ChangePasswordDto } from '@/modules/account/dto/change-password.dto';
import { SessionService } from '@/modules/session/session.service';

const ARGON2_OPTIONS: argon2.Options & { raw?: boolean } = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService
  ) {}

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

    const activeSessions = await this.sessionService.getSessions(userIdStr);

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
   * Get active logged-in device sessions for user (delegates to SessionService)
   */
  async getSessions(userIdStr: string): Promise<SessionResponseDto[]> {
    return this.sessionService.getSessions(userIdStr);
  }

  /**
   * Revoke a specific session owned by the authenticated user (delegates to SessionService)
   */
  async revokeSession(userIdStr: string, sessionIdStr: string): Promise<void> {
    return this.sessionService.revokeSession(userIdStr, sessionIdStr);
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
