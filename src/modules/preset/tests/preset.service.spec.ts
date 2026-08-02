import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PresetService } from '@/modules/preset/preset.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('PresetService', () => {
  let service: PresetService;
  let prisma: PrismaService;

  const mockPrisma = {
    workspacePreset: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PresetService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<PresetService>(PresetService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should list presets for user', async () => {
    const mockDbPreset = {
      id: 'p_1',
      userId: 'u_1',
      name: 'Full Stack Quad',
      description: 'Desc',
      rootPath: '',
      terminalCount: 4,
      layout: { orientation: 'grid', cliIds: ['antigravity'] },
      createdAt: BigInt(100),
      updatedAt: BigInt(200),
    };
    mockPrisma.workspacePreset.findMany.mockResolvedValue([mockDbPreset]);

    const result = await service.getPresets('u_1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Full Stack Quad');
    expect(result[0].count).toBe(4);
  });

  it('should throw NotFoundException if preset is not found', async () => {
    mockPrisma.workspacePreset.findFirst.mockResolvedValue(null);
    await expect(service.getPresetById('u_1', 'invalid')).rejects.toThrow(NotFoundException);
  });
});
