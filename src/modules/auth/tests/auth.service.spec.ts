import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { AuthService } from '@/modules/auth/auth.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { MailService } from '@/modules/mail/mail.service';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let mailService: MailService;

  const mockUser = {
    id: BigInt(1),
    email: 'developer@codespace.dev',
    passwordHash: '',
    name: 'Alex Dev',
    avatarUrl: null,
    role: UserRole.USER,
    createdAt: new Date('2026-08-01T11:45:00.000Z'),
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

  const mockVerification = {
    id: BigInt(1),
    email: 'developer@codespace.dev',
    codeHash: '',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    usedAt: null,
    createdAt: new Date(),
  };

  beforeAll(async () => {
    mockUser.passwordHash = await argon2.hash('Password123!');
    mockVerification.codeHash = crypto.createHash('sha256').update('123456').digest('hex');
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
              create: jest.fn(),
              update: jest.fn(),
            },
            refreshToken: {
              create: jest.fn().mockResolvedValue({ id: BigInt(1) }),
              findMany: jest.fn().mockResolvedValue(mockSessions),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
            emailVerification: {
              create: jest.fn().mockResolvedValue({ id: BigInt(1) }),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            passwordResetToken: {
              create: jest.fn().mockResolvedValue({ id: BigInt(1) }),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (arg: any) => {
              if (typeof arg === 'function') {
                return arg({
                  emailVerification: {
                    update: jest.fn().mockResolvedValue({}),
                  },
                  passwordResetToken: {
                    update: jest.fn().mockResolvedValue({}),
                  },
                  user: {
                    update: jest.fn().mockResolvedValue({}),
                  },
                  refreshToken: {
                    update: jest.fn().mockResolvedValue({}),
                    updateMany: jest.fn().mockResolvedValue({ count: 3 }),
                    findUnique: jest.fn().mockResolvedValue({
                      id: BigInt(1),
                      userId: BigInt(1),
                      tokenHash: 'hash',
                      deviceName: 'Windows Desktop',
                      userAgent: 'Mozilla/5.0',
                      ipAddress: '127.0.0.1',
                      expiresAt: new Date(Date.now() + 86400000),
                      revokedAt: null,
                    }),
                    create: jest.fn().mockResolvedValue({ id: BigInt(2) }),
                  },
                });
              }
              return undefined;
            }),
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
        {
          provide: MailService,
          useValue: {
            sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailService>(MailService);
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

  describe('register', () => {
    it('should create a user with Argon2-hashed password and dispatch verification email', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      const createSpy = jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser as any);
      const hashSpy = jest.spyOn(argon2, 'hash');

      const result = await service.register({
        email: 'developer@codespace.dev',
        password: 'Password123!',
        name: 'Alex Dev',
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'developer@codespace.dev',
            passwordHash: expect.any(String),
            name: 'Alex Dev',
          }),
        })
      );
      expect(hashSpy).toHaveBeenCalledWith(
        'Password123!',
        expect.objectContaining({ type: argon2.argon2id, memoryCost: 65536, timeCost: 3 })
      );
      expect(prismaService.emailVerification.create).toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        'developer@codespace.dev',
        expect.stringMatching(/^\d{6}$/),
        'Alex Dev'
      );
      expect(result).toEqual({
        id: '1',
        email: 'developer@codespace.dev',
        name: 'Alex Dev',
        avatarUrl: null,
        role: UserRole.USER,
        createdAt: mockUser.createdAt,
      });
    });

    it('should throw ConflictException when email is already registered', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        service.register({
          email: 'developer@codespace.dev',
          password: 'Password123!',
          name: 'Alex Dev',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify OTP and return a success message', async () => {
      jest
        .spyOn(prismaService.emailVerification, 'findFirst')
        .mockResolvedValue(mockVerification as any);

      const result = await service.verifyEmail({
        email: 'developer@codespace.dev',
        code: '123456',
      });

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Verify email successfully' });
    });

    it('should throw UnauthorizedException for invalid code', async () => {
      jest
        .spyOn(prismaService.emailVerification, 'findFirst')
        .mockResolvedValue(mockVerification as any);

      await expect(
        service.verifyEmail({ email: 'developer@codespace.dev', code: '000000' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when no pending verification exists', async () => {
      jest.spyOn(prismaService.emailVerification, 'findFirst').mockResolvedValue(null);

      await expect(
        service.verifyEmail({ email: 'developer@codespace.dev', code: '123456' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should rotate the refresh token and return a new access token', async () => {
      const mockResponse: any = { cookie: jest.fn() };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.refresh('valid-refresh-token', mockResponse);

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(result.accessToken).toEqual('mocked-jwt-access-token');
      expect(result.tokenType).toEqual('Bearer');
      expect(result.expiresIn).toEqual(900);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.objectContaining({ httpOnly: true, path: '/api/v1/auth' })
      );
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      await expect(service.refresh('')).rejects.toThrow('Refresh token not provided');
    });

    it('should throw UnauthorizedException when session is expired or revoked', async () => {
      (prismaService.$transaction as jest.Mock).mockImplementationOnce(async (arg: any) =>
        arg({
          refreshToken: {
            findUnique: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
            create: jest.fn(),
          },
        })
      );

      await expect(service.refresh('expired-token')).rejects.toThrow('Session expired or invalid');
    });
  });

  describe('logout', () => {
    it('should revoke the session and clear the cookie', async () => {
      const mockResponse: any = {
        clearCookie: jest.fn(),
      };
      const updateManySpy = jest
        .spyOn(prismaService.refreshToken, 'updateMany')
        .mockResolvedValue({ count: 1 });

      await service.logout('some-refresh-token', '1', mockResponse);

      expect(updateManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: BigInt(1), revokedAt: null }),
          data: { revokedAt: expect.any(Date) },
        })
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: '/api/v1/auth',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should store OTP hashed and send email when user exists', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue({ id: BigInt(1), name: 'Alex Dev' } as any);
      const createSpy = jest.spyOn(prismaService.passwordResetToken, 'create');

      const result = await service.forgotPassword('developer@codespace.dev');

      expect(result).toBeUndefined();
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'developer@codespace.dev',
            codeHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          }),
        })
      );
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user email does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.forgotPassword('ghost@codespace.dev')).rejects.toThrow(
        new NotFoundException('Email not registered')
      );
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should update password and revoke all sessions on valid code', async () => {
      const token = {
        id: BigInt(1),
        email: 'developer@codespace.dev',
        codeHash: crypto.createHash('sha256').update('123456').digest('hex'),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(),
      };
      jest.spyOn(prismaService.passwordResetToken, 'findFirst').mockResolvedValue(token as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({ id: BigInt(1) } as any);

      const result = await service.resetPassword({
        email: 'developer@codespace.dev',
        code: '123456',
        newPassword: 'NewPassword123!',
      });

      expect(result.message).toEqual('Reset password successfully');
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on invalid code', async () => {
      const token = {
        id: BigInt(1),
        email: 'developer@codespace.dev',
        codeHash: crypto.createHash('sha256').update('654321').digest('hex'),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(),
      };
      jest.spyOn(prismaService.passwordResetToken, 'findFirst').mockResolvedValue(token as any);

      await expect(
        service.resetPassword({
          email: 'developer@codespace.dev',
          code: '123456',
          newPassword: 'NewPassword123!',
        })
      ).rejects.toThrow('Invalid or expired reset code');
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session scoped to the user', async () => {
      const updateManySpy = jest
        .spyOn(prismaService.refreshToken, 'updateMany')
        .mockResolvedValue({ count: 1 });

      await expect(service.revokeSession('1', '10')).resolves.toBeUndefined();
      expect(updateManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: BigInt(10), userId: BigInt(1), revokedAt: null }),
          data: { revokedAt: expect.any(Date) },
        })
      );
    });

    it('should throw NotFoundException when session is not owned by the user', async () => {
      jest.spyOn(prismaService.refreshToken, 'updateMany').mockResolvedValue({ count: 0 });

      await expect(service.revokeSession('1', '999')).rejects.toThrow(NotFoundException);
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
