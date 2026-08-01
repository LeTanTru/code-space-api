import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({
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
            }),
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
      expect(result).toEqual({
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
      });
    });
  });

  describe('getMe', () => {
    it('should return user profile and active device sessions', async () => {
      const mockReq: any = { user: { id: '1' } };
      const result = await controller.getMe(mockReq);

      expect(authService.getMe).toHaveBeenCalledWith('1');
      expect(result.activeSessions).toEqual(mockSessions);
    });
  });

  describe('getSessions', () => {
    it('should return active logged in device sessions list', async () => {
      const mockReq: any = { user: { id: '1' } };
      const result = await controller.getSessions(mockReq);

      expect(authService.getActiveSessions).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockSessions);
    });
  });
});
