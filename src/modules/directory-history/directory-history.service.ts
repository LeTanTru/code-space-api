import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import {
  UpsertDirectoryHistoryDto,
  DirectoryHistoryItemDto,
} from '@/modules/directory-history/dto/directory-history.dto';

@Injectable()
export class DirectoryHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getDirectoryHistory(userId: string): Promise<DirectoryHistoryItemDto[]> {
    const history = await this.prisma.directoryHistory.findMany({
      where: { userId },
      orderBy: [{ position: 'asc' }, { updatedAt: 'desc' }],
    });
    return history.map((item) => ({
      id: item.id,
      userId: item.userId,
      path: item.path,
      position: item.position,
      updatedAt: item.updatedAt,
    }));
  }

  async upsertDirectoryHistory(
    userId: string,
    dto: UpsertDirectoryHistoryDto
  ): Promise<DirectoryHistoryItemDto> {
    const targetPosition = dto.position ?? 0;

    const existing = await this.prisma.directoryHistory.findUnique({
      where: {
        userId_path: {
          userId,
          path: dto.path,
        },
      },
    });

    if (existing) {
      const oldPosition = existing.position;
      if (oldPosition !== targetPosition) {
        if (targetPosition < oldPosition) {
          await this.prisma.directoryHistory.updateMany({
            where: {
              userId,
              position: { gte: targetPosition, lt: oldPosition },
            },
            data: { position: { increment: 1 } },
          });
        } else {
          await this.prisma.directoryHistory.updateMany({
            where: {
              userId,
              position: { gt: oldPosition, lte: targetPosition },
            },
            data: { position: { decrement: 1 } },
          });
        }
      }

      const item = await this.prisma.directoryHistory.update({
        where: { id: existing.id },
        data: { position: targetPosition },
      });

      return {
        id: item.id,
        userId: item.userId,
        path: item.path,
        position: item.position,
        updatedAt: item.updatedAt,
      };
    } else {
      await this.prisma.directoryHistory.updateMany({
        where: {
          userId,
          position: { gte: targetPosition },
        },
        data: { position: { increment: 1 } },
      });

      const item = await this.prisma.directoryHistory.create({
        data: {
          userId,
          path: dto.path,
          position: targetPosition,
        },
      });

      return {
        id: item.id,
        userId: item.userId,
        path: item.path,
        position: item.position,
        updatedAt: item.updatedAt,
      };
    }
  }

  async deleteDirectoryHistoryById(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.directoryHistory.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Directory history item not found');
    }
    await this.prisma.directoryHistory.delete({
      where: { id },
    });
    await this.prisma.directoryHistory.updateMany({
      where: {
        userId,
        position: { gt: existing.position },
      },
      data: { position: { decrement: 1 } },
    });
  }
}
