import { Test, TestingModule } from '@nestjs/testing';
import { DirectoryHistoryService } from '@/modules/directory-history/directory-history.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('DirectoryHistoryService', () => {
  let service: DirectoryHistoryService;
  let prisma: PrismaService;

  const mockPrisma = {
    directoryHistory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DirectoryHistoryService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<DirectoryHistoryService>(DirectoryHistoryService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should list directory history for user', async () => {
    mockPrisma.directoryHistory.findMany.mockResolvedValue([
      {
        id: 'd1',
        userId: 'u1',
        path: '/path/1',
        position: 0,
        updatedAt: new Date(),
      },
    ]);

    const res = await service.getDirectoryHistory('u1');
    expect(res).toHaveLength(1);
    expect(res[0].path).toBe('/path/1');
  });

  it('should upsert new directory history entry and shift positions', async () => {
    mockPrisma.directoryHistory.findUnique.mockResolvedValue(null);
    mockPrisma.directoryHistory.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.directoryHistory.create.mockResolvedValue({
      id: 'd2',
      userId: 'u1',
      path: '/path/2',
      position: 0,
      updatedAt: new Date(),
    });

    const res = await service.upsertDirectoryHistory('u1', { path: '/path/2', position: 0 });
    expect(res.path).toBe('/path/2');
    expect(res.position).toBe(0);
    expect(mockPrisma.directoryHistory.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', position: { gte: 0 } },
      data: { position: { increment: 1 } },
    });
  });

  it('should delete directory history item by id', async () => {
    mockPrisma.directoryHistory.findFirst.mockResolvedValue({
      id: 'd1',
      userId: 'u1',
      path: '/path/1',
      position: 0,
    });
    mockPrisma.directoryHistory.delete.mockResolvedValue({ id: 'd1' });
    mockPrisma.directoryHistory.updateMany.mockResolvedValue({ count: 0 });

    await service.deleteDirectoryHistoryById('u1', 'd1');
    expect(mockPrisma.directoryHistory.delete).toHaveBeenCalledWith({
      where: { id: 'd1' },
    });
  });
});
