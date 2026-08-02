import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CliService } from '@/modules/cli/cli.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('CliService', () => {
  let service: CliService;
  let prisma: PrismaService;

  const mockPrisma = {
    cliTool: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    cliBuiltinOverride: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CliService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<CliService>(CliService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should get CLI tools and overrides for user', async () => {
    mockPrisma.cliTool.findMany.mockResolvedValue([
      {
        id: 'c1',
        name: 'Custom',
        command: './c.sh',
        checkCommand: null,
        link: null,
        isCustom: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mockPrisma.cliBuiltinOverride.findMany.mockResolvedValue([]);

    const result = await service.getCliTools('u1');
    expect(result.customClis).toHaveLength(1);
    expect(result.customClis[0].name).toBe('Custom');
  });

  it('should throw NotFoundException if deleting non-existing custom CLI', async () => {
    mockPrisma.cliTool.findFirst.mockResolvedValue(null);
    await expect(service.deleteCustomCli('u1', 'invalid')).rejects.toThrow(NotFoundException);
  });
});
