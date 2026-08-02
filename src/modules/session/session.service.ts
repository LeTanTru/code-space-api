import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SessionResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { NotFoundException } from '@/common/exceptions/app.exception';
import { ERROR_CODES } from '@/constants/error-code';
import { getLocationFromIp } from '@/utils/location.util';
import { sha256 } from '@/utils/crypto.util';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get active logged-in device sessions for user
   */
  async getSessions(userId: string, currentRefreshToken?: string): Promise<SessionResponseDto[]> {
    const sessions = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tokenHash: true,
        deviceName: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    const currentHash = currentRefreshToken ? sha256(currentRefreshToken) : null;

    return sessions.map((s, index) => ({
      id: s.id,
      deviceName: s.deviceName,
      userAgent: s.userAgent,
      location: getLocationFromIp(s.ipAddress),
      isCurrent: currentHash ? s.tokenHash === currentHash : sessions.length === 1 || index === 0,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
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
}
