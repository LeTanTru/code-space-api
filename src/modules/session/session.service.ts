import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SessionResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { SessionNotFoundException } from '@/common/exceptions/app.exception';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly prisma: PrismaService) {}

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
      throw new SessionNotFoundException();
    }

    this.logger.log(`Session ${sessionIdStr} revoked for user ${userIdStr}`);
  }
}
