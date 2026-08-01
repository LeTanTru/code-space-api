import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { UserRole } from '@prisma/client';

const MOCK_EXPIRES_IN = 900;

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockSessions = [
    {
      id: '10',
      deviceName: 'Windows Desktop',
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1',
      createdAt: new Date(),
      expiresAt: new Date(),
    },
  ];

  const mockLoginResponse = {
    accessToken: 'mocked-jwt-access-token',
    tokenType: 'Bearer',
    expiresIn: MOCK_EXPIRES_IN,
    user: {
      id: '1',
      email: 'developer@codespace.dev',
      name: 'Alex Dev',
      avatarUrl: null,
      role: UserRole.USER,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue(mockLoginResponse),
            register: jest.fn().mockResolvedValue({
              id: '1',
              email: 'developer@codespace.dev',
              name: 'Alex Dev',
              avatarUrl: null,
              role: UserRole.USER,
              createdAt: new Date('2026-08-01T11:45:00.000Z'),
            }),
            verifyEmail: jest.fn().mockResolvedValue({ message: 'Verify email successfully' }),
            refresh: jest.fn().mockResolvedValue({
              accessToken: 'mocked-jwt-access-token',
              tokenType: 'Bearer',
              expiresIn: MOCK_EXPIRES_IN,
            }),
            logout: jest.fn().mockResolvedValue(undefined),
            forgotPassword: jest.fn().mockResolvedValue(undefined),
            resetPassword: jest.fn().mockResolvedValue({
              message: 'Reset password successfully',
            }),
            revokeSession: jest.fn().mockResolvedValue(undefined),
            getMe: jest.fn().mockResolvedValue({
              id: '1',
              email: 'developer@codespace.dev',
              name: 'Alex Dev',
              avatarUrl: null,
              role: UserRole.USER,
              activeSessions: mockSessions,
            }),
            getActiveSessions: jest.fn().mockResolvedValue(mockSessions),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should delegate login to AuthService and return response payload', async () => {
      const dto = {
        email: 'developer@codespace.dev',
        password: 'Password123!',
        deviceName: 'Test Desktop',
      };
      const mockReq: any = {
        headers: { 'user-agent': 'Mozilla/5.0' },
        ip: '127.0.0.1',
      };
      const mockRes: any = { cookie: jest.fn() };

      const result = await controller.login(dto, mockReq, mockRes);

      expect(authService.login).toHaveBeenCalledWith(dto, mockRes, {
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(result).toEqual(mockLoginResponse);
    });
  });

  describe('register', () => {
    it('should delegate register to AuthService', async () => {
      const dto = {
        email: 'developer@codespace.dev',
        password: 'Password123!',
        name: 'Alex Dev',
      };

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(
        expect.objectContaining({
          id: '1',
          email: 'developer@codespace.dev',
          name: 'Alex Dev',
        })
      );
    });
  });

  describe('verifyEmail', () => {
    it('should delegate verify-email to AuthService and return success message', async () => {
      const dto = { email: 'developer@codespace.dev', code: '123456' };

      const result = await controller.verifyEmail(dto);

      expect(authService.verifyEmail).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'Verify email successfully' });
    });
  });

  describe('refresh', () => {
    it('should pass the refresh cookie to AuthService', async () => {
      const mockReq: any = { cookies: { refreshToken: 'some-refresh-token' } };
      const mockRes: any = { cookie: jest.fn() };

      const result = await controller.refresh(mockReq, mockRes);

      expect(authService.refresh).toHaveBeenCalledWith('some-refresh-token', mockRes);
      expect(result).toEqual({
        accessToken: 'mocked-jwt-access-token',
        tokenType: 'Bearer',
        expiresIn: MOCK_EXPIRES_IN,
      });
    });
  });

  describe('logout', () => {
    it('should revoke current session and clear cookie', async () => {
      const mockReq: any = {
        cookies: { refreshToken: 'some-refresh-token' },
        user: { id: '1' },
      };
      const mockRes: any = { clearCookie: jest.fn() };

      await controller.logout(mockReq, mockRes);

      expect(authService.logout).toHaveBeenCalledWith('some-refresh-token', '1', mockRes);
    });
  });

  describe('forgotPassword', () => {
    it('should delegate forgot-password to AuthService', async () => {
      const dto = { email: 'developer@codespace.dev' };

      const result = await controller.forgotPassword(dto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(dto.email);
      expect(result).toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    it('should delegate reset-password to AuthService', async () => {
      const dto = {
        email: 'developer@codespace.dev',
        code: '123456',
        newPassword: 'NewPassword123!',
      };

      const result = await controller.resetPassword(dto);

      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
      expect(result.message).toEqual('Reset password successfully');
    });
  });
});
