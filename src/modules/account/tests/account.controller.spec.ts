import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { AccountController } from '@/modules/account/account.controller';
import { AccountService } from '@/modules/account/account.service';

describe('AccountController', () => {
  let controller: AccountController;
  let accountService: AccountService;

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

  const mockProfile = {
    id: '1',
    email: 'developer@codespace.dev',
    name: 'Alex Dev',
    avatarUrl: null,
    role: UserRole.USER,
    activeSessions: mockSessions,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: AccountService,
          useValue: {
            getProfile: jest.fn().mockResolvedValue(mockProfile),
            updateProfile: jest.fn().mockResolvedValue(mockProfile),
            deleteAccount: jest.fn().mockResolvedValue(undefined),
            changePassword: jest
              .fn()
              .mockResolvedValue({ message: 'Change password successfully' }),
          },
        },
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
    accountService = module.get<AccountService>(AccountService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile and active device sessions', async () => {
      const mockReq: any = { user: { id: '1' } };
      const result = await controller.getProfile(mockReq);

      expect(accountService.getProfile).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('should delegate profile update to AccountService', async () => {
      const mockReq: any = { user: { id: '1' } };
      const dto = { name: 'Updated Name' };

      const result = await controller.updateProfile(dto, mockReq);

      expect(accountService.updateProfile).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual(mockProfile);
    });
  });

  describe('deleteAccount', () => {
    it('should delegate account deletion with password', async () => {
      const mockReq: any = { user: { id: '1' } };
      const dto = { password: 'Password123!' };

      await controller.deleteAccount(dto, mockReq);

      expect(accountService.deleteAccount).toHaveBeenCalledWith('1', 'Password123!', undefined);
    });
  });

  describe('changePassword', () => {
    it('should delegate password change to AccountService', async () => {
      const mockReq: any = { user: { id: '1' } };
      const dto = { oldPassword: 'OldPassword123!', newPassword: 'NewPassword123!' };

      const result = await controller.changePassword(dto, mockReq);

      expect(accountService.changePassword).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual({ message: 'Change password successfully' });
    });
  });
});
