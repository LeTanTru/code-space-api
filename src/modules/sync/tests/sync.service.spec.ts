import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from '@/modules/sync/sync.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('SyncService', () => {
  let service: SyncService;
  let prisma: PrismaService;

  const mockPrisma = {
    syncLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    userSettings: {
      findUnique: jest.fn(),
    },
    workspacePreset: {
      findMany: jest.fn(),
    },
    directoryHistory: {
      findMany: jest.fn(),
    },
    cliTool: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<SyncService>(SyncService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should push sync snapshot and record sync log', async () => {
    mockPrisma.syncLog.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.pushSync('user-1', {
      clientDeviceId: 'dev-1',
      updatedAt: '2026-08-02T10:00:00.000Z',
      dbState: { workspaces: [], presets: [] },
    });

    expect(result.synced).toBe(true);
    expect(mockPrisma.syncLog.create).toHaveBeenCalled();
  });

  it('should pull sync snapshot data', async () => {
    mockPrisma.userSettings.findUnique.mockResolvedValue({ userId: 'user-1', theme: 'dracula' });
    mockPrisma.workspacePreset.findMany.mockResolvedValue([]);
    mockPrisma.directoryHistory.findMany.mockResolvedValue([]);
    mockPrisma.cliTool.findMany.mockResolvedValue([]);

    const result = await service.pullSync('user-1');
    expect(result.dbState).toBeDefined();
    expect((result.dbState.settings as any).theme).toBe('dracula');
  });

  it('should return sync logs for user', async () => {
    const mockLog = {
      id: 'l-1',
      clientDeviceId: 'dev-1',
      clientVersion: '1.0.0',
      status: 'SUCCESS',
      payloadSummary: 'Summary',
      syncedAt: new Date(),
    };
    mockPrisma.syncLog.findMany.mockResolvedValue([mockLog]);

    const result = await service.getSyncLogs('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('l-1');
  });
});
