import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import {
  SyncPushDto,
  SyncPushResponseDto,
  SyncPullResponseDto,
  SyncLogResponseDto,
} from '@/modules/sync/dto/sync.dto';
import { SyncStatus } from '@prisma/client';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async pushSync(userId: string, dto: SyncPushDto): Promise<SyncPushResponseDto> {
    const now = new Date();
    const payloadSummary = `Workspaces: ${dto.dbState?.workspaces?.length || 0}, Presets: ${
      dto.dbState?.presets?.length || 0
    }, History: ${dto.dbState?.directoryHistory?.length || 0}`;

    await this.prisma.syncLog.create({
      data: {
        userId,
        clientDeviceId: dto.clientDeviceId,
        clientVersion: '1.0.0',
        status: SyncStatus.SUCCESS,
        payloadSummary,
        syncedAt: now,
      },
    });

    return {
      synced: true,
      serverUpdatedAt: dto.updatedAt || now.toISOString(),
    };
  }

  async pullSync(userId: string): Promise<SyncPullResponseDto> {
    const [settings, presets, history, cliTools] = await Promise.all([
      this.prisma.userSettings.findUnique({ where: { userId } }),
      this.prisma.workspacePreset.findMany({ where: { userId } }),
      this.prisma.directoryHistory.findMany({ where: { userId }, orderBy: { position: 'asc' } }),
      this.prisma.cliTool.findMany({ where: { userId } }),
    ]);

    const formattedPresets = presets.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      color: p.color,
      rootPath: p.rootPath,
      terminalCount: p.terminalCount,
      layout: p.layout,
      createdAt: Number(p.createdAt),
      updatedAt: Number(p.updatedAt),
    }));

    return {
      updatedAt: new Date().toISOString(),
      dbState: {
        settings: settings || {},
        presets: formattedPresets,
        directoryHistory: history,
        cliTools: cliTools,
      },
    };
  }

  async getSyncLogs(userId: string): Promise<SyncLogResponseDto[]> {
    const logs = await this.prisma.syncLog.findMany({
      where: { userId },
      orderBy: { syncedAt: 'desc' },
      take: 50,
    });

    return logs.map((log) => ({
      id: log.id,
      clientDeviceId: log.clientDeviceId,
      clientVersion: log.clientVersion,
      status: log.status,
      payloadSummary: log.payloadSummary || undefined,
      syncedAt: log.syncedAt,
    }));
  }
}
