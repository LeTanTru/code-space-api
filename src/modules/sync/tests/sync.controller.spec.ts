import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from '@/modules/sync/sync.controller';
import { SyncService } from '@/modules/sync/sync.service';

describe('SyncController', () => {
  let controller: SyncController;
  let service: SyncService;

  const mockSyncService = {
    pushSync: jest.fn(),
    pullSync: jest.fn(),
    getSyncLogs: jest.fn(),
  };

  const mockReq = {
    user: { id: 'u_1', email: 'test@example.com', role: 'USER' },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [{ provide: SyncService, useValue: mockSyncService }],
    }).compile();

    controller = module.get<SyncController>(SyncController);
    service = module.get<SyncService>(SyncService);
    jest.clearAllMocks();
  });

  it('should handle pushSync request', async () => {
    const mockRes = { synced: true, serverUpdatedAt: '2026-08-02T10:00:00.000Z' };
    mockSyncService.pushSync.mockResolvedValue(mockRes);

    const dto = { clientDeviceId: 'dev-1', updatedAt: '2026-08-02T10:00:00.000Z', dbState: {} };
    const result = await controller.pushSync(mockReq, dto);

    expect(result).toEqual(mockRes);
    expect(mockSyncService.pushSync).toHaveBeenCalledWith('u_1', dto);
  });

  it('should handle pullSync request', async () => {
    const mockRes = { updatedAt: '2026-08-02T10:00:00.000Z', dbState: {} };
    mockSyncService.pullSync.mockResolvedValue(mockRes);

    const result = await controller.pullSync(mockReq);
    expect(result).toEqual(mockRes);
    expect(mockSyncService.pullSync).toHaveBeenCalledWith('u_1');
  });

  it('should handle getSyncLogs request', async () => {
    const mockLogs = [
      {
        id: 'l-1',
        clientDeviceId: 'dev-1',
        clientVersion: '1.0.0',
        status: 'SUCCESS',
        syncedAt: new Date(),
      },
    ];
    mockSyncService.getSyncLogs.mockResolvedValue(mockLogs);

    const result = await controller.getSyncLogs(mockReq);
    expect(result).toEqual(mockLogs);
    expect(mockSyncService.getSyncLogs).toHaveBeenCalledWith('u_1');
  });
});
