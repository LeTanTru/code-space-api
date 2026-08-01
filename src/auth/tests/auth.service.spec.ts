import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from '../auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;

  const mockUser = {
    id: BigInt(1),
    email: 'developer@codespace.dev',
    passwordHash: '',
    name: 'Alex Dev',
    avatarUrl: null,
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSessions = [
    {
      id: BigInt(10),
      deviceName: 'Windows Desktop',
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
    },
  ];

  beforeAll(async () => {
    mockUser.passwordHash = await argon2.hash('Password123!');
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            refreshToken: {
              create: jest.fn().mockResolvedValue({ id: BigInt(1) }),
              findMany: jest.fn().mockResolvedValue(mockSessions),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mocked-jwt-access-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'secret';
              if (key === 'NODE_ENV') return 'development';
              return null;
            }),
            getOrThrow: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'secret';
              if (key === 'NODE_ENV') return 'development';
              throw new Error(`Missing config key ${key}`);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate and return user for valid credentials', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.validateUser('developer@codespace.dev', 'Password123!');
      expect(result).toBeDefined();
      expect(result.email).toEqual('developer@codespace.dev');
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.validateUser('unknown@codespace.dev', 'Password123!')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        service.validateUser('developer@codespace.dev', 'WrongPassword!')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should issue tokens, save refresh token to DB, and set cookie', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      const mockResponse: any = {
        cookie: jest.fn(),
      };

      const result = await service.login(
        { email: 'developer@codespace.dev', password: 'Password123!', deviceName: 'Test Machine' },
        mockResponse,
        { ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0' }
      );

      expect(result).toEqual({
        accessToken: 'mocked-jwt-access-token',
        tokenType: 'Bearer',
        expiresIn: 900,
        user: {
          id: '1',
          email: 'developer@codespace.dev',
          name: 'Alex Dev',
          avatarUrl: null,
          role: UserRole.USER,
        },
      });

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          path: '/api/v1/auth',
        })
      );
    });
  });

  describe('getActiveSessions', () => {
    it('should return list of active device sessions', async () => {
      const result = await service.getActiveSessions('1');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '10',
        deviceName: 'Windows Desktop',
        userAgent: 'Mozilla/5.0',
        ipAddress: '127.0.0.1',
        createdAt: mockSessions[0].createdAt,
        expiresAt: mockSessions[0].expiresAt,
      });
    });
  });

  describe('getMe', () => {
    it('should return user profile with active sessions list', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.getMe('1');
      expect(result).toEqual({
        id: '1',
        email: 'developer@codespace.dev',
        name: 'Alex Dev',
        avatarUrl: null,
        role: UserRole.USER,
        activeSessions: [
          {
            id: '10',
            deviceName: 'Windows Desktop',
            userAgent: 'Mozilla/5.0',
            ipAddress: '127.0.0.1',
            createdAt: mockSessions[0].createdAt,
            expiresAt: mockSessions[0].expiresAt,
          },
        ],
      });
    });
  });
});
