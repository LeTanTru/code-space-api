import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WorkspaceService } from '@/modules/workspace/workspace.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let prisma: PrismaService;

  const mockPrisma = {
    workspacePreset: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    presetTerminal: {
      deleteMany: jest.fn(),
    },
    cliTool: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkspaceService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should return all workspaces for user', async () => {
    const mockDbWorkspace = {
      id: 'ws_1',
      userId: 'user_1',
      name: 'Dev Workspace',
      description: null,
      color: '#6366f1',
      rootPath: '/path',
      terminalCount: 1,
      selectedCli: null,
      ideVscode: false,
      ideAntigravity: false,
      layout: null,
      createdAt: BigInt(1000),
      updatedAt: BigInt(2000),
      terminals: [],
    };
    mockPrisma.workspacePreset.findMany.mockResolvedValue([mockDbWorkspace]);

    const result = await service.getWorkspaces('user_1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Dev Workspace');
    expect(result[0].createdAt).toBe(1000);
  });

  it('should throw NotFoundException if workspace does not exist', async () => {
    mockPrisma.workspacePreset.findFirst.mockResolvedValue(null);
    await expect(service.getWorkspaceById('user_1', 'invalid')).rejects.toThrow(NotFoundException);
  });

  it('should create a new workspace with a server-generated id', async () => {
    mockPrisma.cliTool.findUnique.mockResolvedValue({ id: 'antigravity' });

    const mockCreated = {
      id: 'generated-uuid-01',
      userId: 'user_1',
      name: 'New Workspace',
      description: '',
      color: '#6366f1',
      rootPath: '/path/to/project',
      terminalCount: 2,
      selectedCli: 'antigravity',
      ideVscode: false,
      ideAntigravity: true,
      layout: { kind: 'split' },
      createdAt: BigInt(1700000000),
      updatedAt: BigInt(1700000000),
      terminals: [
        {
          id: 'term_1',
          presetId: 'generated-uuid-01',
          cli: 'antigravity',
          cwd: '/path/to/project',
          customTitle: 'Term 1',
          command: null,
          position: 0,
        },
      ],
    };
    mockPrisma.workspacePreset.create.mockResolvedValue(mockCreated);

    const dto = {
      name: 'New Workspace',
      description: '',
      color: '#6366f1',
      rootPath: '/path/to/project',
      terminalCount: 2,
      selectedCli: 'antigravity',
      ideVscode: false,
      ideAntigravity: true,
      layout: { kind: 'split' },
      terminals: [
        {
          cli: 'antigravity',
          cwd: '/path/to/project',
          customTitle: 'Term 1',
        },
      ],
    };

    const result = await service.createWorkspace('user_1', dto);
    expect(result.id).toBe('generated-uuid-01');
    expect(result.name).toBe('New Workspace');
    expect(result.terminals).toHaveLength(1);
    expect(result.terminals![0].cli).toBe('antigravity');
    expect(mockPrisma.workspacePreset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ id: expect.anything() }),
      })
    );
  });

  it('should delete a workspace successfully', async () => {
    mockPrisma.workspacePreset.findFirst.mockResolvedValue({ id: 'ws_1', userId: 'user_1' });
    mockPrisma.workspacePreset.delete.mockResolvedValue({});

    await service.deleteWorkspace('user_1', 'ws_1');
    expect(mockPrisma.workspacePreset.delete).toHaveBeenCalledWith({ where: { id: 'ws_1' } });
  });
});
