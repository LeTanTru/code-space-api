import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SessionService } from '@/modules/session/session.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('SessionService', () => {
  let service: SessionService;
  let prismaService: PrismaService;

  const mockSessions = [
    {
      id: BigInt(10),
      deviceName: 'Windows Workstation',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
      ipAddress: '127.0.0.1',
      createdAt: new Date('2026-08-01T11:45:00.000Z'),
      expiresAt: new Date('2026-08-08T11:45:00.000Z'),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              findMany: jest.fn().mockResolvedValue(mockSessions),
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSessions', () => {
    it('should return active logged-in device sessions list', async () => {
      const result = await service.getSessions('1');

      expect(prismaService.refreshToken.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '10',
        deviceName: 'Windows Workstation',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
        ipAddress: '127.0.0.1',
        createdAt: mockSessions[0].createdAt,
        expiresAt: mockSessions[0].expiresAt,
      });
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session owned by the authenticated user', async () => {
      await service.revokeSession('1', '10');

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          id: BigInt(10),
          userId: BigInt(1),
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if session does not exist or is not owned by user', async () => {
      jest.spyOn(prismaService.refreshToken, 'updateMany').mockResolvedValue({ count: 0 });

      await expect(service.revokeSession('1', '999')).rejects.toThrow(NotFoundException);
    });
  });
});
