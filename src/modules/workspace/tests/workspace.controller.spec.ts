import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceController } from '@/modules/workspace/workspace.controller';
import { WorkspaceService } from '@/modules/workspace/workspace.service';

describe('WorkspaceController', () => {
  let controller: WorkspaceController;
  let service: WorkspaceService;

  const mockService = {
    getWorkspaces: jest.fn(),
    getWorkspaceById: jest.fn(),
    createWorkspace: jest.fn(),
    updateWorkspace: jest.fn(),
    deleteWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceController],
      providers: [{ provide: WorkspaceService, useValue: mockService }],
    }).compile();

    controller = module.get<WorkspaceController>(WorkspaceController);
    service = module.get<WorkspaceService>(WorkspaceService);
    jest.clearAllMocks();
  });

  it('should list workspaces', async () => {
    const mockList = [
      {
        id: 'ws_1',
        userId: 'u_1',
        name: 'WS1',
        color: '#fff',
        rootPath: '/a',
        terminalCount: 1,
        ideVscode: false,
        ideAntigravity: false,
        createdAt: 100,
        updatedAt: 200,
      },
    ];
    mockService.getWorkspaces.mockResolvedValue(mockList);

    const req = { user: { id: 'u_1' } } as any;
    const res = await controller.getWorkspaces(req);
    expect(res).toEqual(mockList);
    expect(mockService.getWorkspaces).toHaveBeenCalledWith('u_1');
  });
});
