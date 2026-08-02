import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { AccountService } from '@/modules/account/account.service';
import { SessionService } from '@/modules/session/session.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('AccountService', () => {
  let service: AccountService;
  let prismaService: PrismaService;
  let sessionService: SessionService;

  const mockUser = {
    id: '1',
    email: 'developer@codespace.dev',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$mockHash',
    name: 'Alex Dev',
    avatarUrl: null,
    role: UserRole.USER,
  };

  const mockSessions = [
    {
      id: '10',
      deviceName: 'Windows PC',
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1',
      createdAt: new Date('2026-08-01T11:45:00.000Z'),
      expiresAt: new Date('2026-08-08T11:45:00.000Z'),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: SessionService,
          useValue: {
            getSessions: jest.fn().mockResolvedValue(mockSessions),
            revokeSession: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((cb: any) => cb(prismaService)),
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            refreshToken: {
              findMany: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    sessionService = module.get<SessionService>(SessionService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile and active device sessions', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.refreshToken, 'findMany').mockResolvedValue(mockSessions as any);

      const result = await service.getProfile('1');

      expect(result.id).toEqual('1');
      expect(result.email).toEqual('developer@codespace.dev');
      expect(result.activeSessions).toHaveLength(1);
      expect(result.activeSessions[0].id).toEqual('10');
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getProfile('999')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateProfile', () => {
    it('should update user fields and return refreshed profile', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({
        ...mockUser,
        name: 'New Name',
      } as any);
      jest.spyOn(prismaService.refreshToken, 'findMany').mockResolvedValue(mockSessions as any);

      const result = await service.updateProfile('1', { name: 'New Name' });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'New Name' },
      });
      expect(result).toBeDefined();
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.updateProfile('999', { name: 'New Name' })).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('getSessions', () => {
    it('should return mapped active sessions list', async () => {
      jest.spyOn(prismaService.refreshToken, 'findMany').mockResolvedValue(mockSessions as any);

      const result = await service.getSessions('1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual('10');
      expect(result[0].deviceName).toEqual('Windows PC');
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session owned by user', async () => {
      await service.revokeSession('1', '10');
      expect(sessionService.revokeSession).toHaveBeenCalledWith('1', '10');
    });

    it('should throw NotFoundException if session not found or not owned by user', async () => {
      jest
        .spyOn(sessionService, 'revokeSession')
        .mockRejectedValue(new NotFoundException('Session not found'));

      await expect(service.revokeSession('1', '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account when correct password is provided', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true as any);
      jest.spyOn(prismaService.user, 'delete').mockResolvedValue(mockUser as any);

      await expect(service.deleteAccount('1', 'Password123!')).resolves.not.toThrow();
      expect(prismaService.user.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false as any);

      await expect(service.deleteAccount('1', 'WrongPassword')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('changePassword', () => {
    it('should update password and revoke refresh sessions when current password is correct', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true as any);
      jest.spyOn(argon2, 'hash').mockResolvedValue('newHashedPassword' as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.refreshToken, 'updateMany').mockResolvedValue({ count: 2 } as any);

      const result = await service.changePassword('1', {
        oldPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      });

      expect(result).toEqual({ message: 'Change password successfully' });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { passwordHash: 'newHashedPassword' },
      });
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: '1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException when current password is incorrect', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false as any);

      await expect(
        service.changePassword('1', {
          oldPassword: 'WrongOldPassword',
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
