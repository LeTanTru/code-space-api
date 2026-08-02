import { Test, TestingModule } from '@nestjs/testing';
import { DirectoryHistoryController } from '@/modules/directory-history/directory-history.controller';
import { DirectoryHistoryService } from '@/modules/directory-history/directory-history.service';

describe('DirectoryHistoryController', () => {
  let controller: DirectoryHistoryController;
  let service: DirectoryHistoryService;

  const mockService = {
    getDirectoryHistory: jest.fn(),
    upsertDirectoryHistory: jest.fn(),
    deleteDirectoryHistoryById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectoryHistoryController],
      providers: [{ provide: DirectoryHistoryService, useValue: mockService }],
    }).compile();

    controller = module.get<DirectoryHistoryController>(DirectoryHistoryController);
    service = module.get<DirectoryHistoryService>(DirectoryHistoryService);
    jest.clearAllMocks();
  });

  it('should get directory history', async () => {
    const mockList = [
      {
        id: 'd1',
        userId: 'u1',
        path: '/a',
        position: 0,
        updatedAt: new Date(),
      },
    ];
    mockService.getDirectoryHistory.mockResolvedValue(mockList);

    const req = { user: { id: 'u1' } } as any;
    const res = await controller.getDirectoryHistory(req);
    expect(res).toEqual(mockList);
    expect(mockService.getDirectoryHistory).toHaveBeenCalledWith('u1');
  });

  it('should delete directory history item by id', async () => {
    mockService.deleteDirectoryHistoryById.mockResolvedValue(undefined);
    const req = { user: { id: 'u1' } } as any;
    await controller.deleteDirectoryHistoryById(req, 'd1');
    expect(mockService.deleteDirectoryHistoryById).toHaveBeenCalledWith('u1', 'd1');
  });
});
