import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from '@/modules/mail/mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;
  let mockTransporter: {
    verify: jest.Mock;
    sendMail: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockTransporter = {
      verify: jest.fn().mockResolvedValue(true),
      sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                SMTP_HOST: 'smtp.example.com',
                SMTP_PORT: 587,
                SMTP_SECURE: 'false',
                SMTP_USER: 'user@example.com',
                SMTP_PASS: 'password',
                SMTP_FROM: 'CodeSpace <no-reply@codespace.dev>',
              };
              return config[key] !== undefined ? config[key] : defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyConnection', () => {
    it('should return true when SMTP verification succeeds', async () => {
      const result = await service.verifyConnection();
      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should return false when SMTP verification fails', async () => {
      mockTransporter.verify.mockRejectedValueOnce(new Error('Connection refused'));
      const result = await service.verifyConnection();
      expect(result).toBe(false);
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with HTML and text content', async () => {
      await service.sendVerificationEmail('test@example.com', '123456', 'Alice');

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];

      expect(mailOptions.to).toBe('test@example.com');
      expect(mailOptions.subject).toBe('CodeSpace — Verify your email address');
      expect(mailOptions.text).toContain('123456');
      expect(mailOptions.html).toContain('123456');
      expect(mailOptions.html).toContain('Hello Alice,');
      expect(mailOptions.html).toContain('CodeSpace');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with HTML and text content', async () => {
      await service.sendPasswordResetEmail('test@example.com', '654321', 'Bob');

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];

      expect(mailOptions.to).toBe('test@example.com');
      expect(mailOptions.subject).toBe('CodeSpace — Password reset request');
      expect(mailOptions.text).toContain('654321');
      expect(mailOptions.html).toContain('654321');
      expect(mailOptions.html).toContain('Hello Bob,');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with feature grid and CTA link', async () => {
      await service.sendWelcomeEmail('newuser@example.com', 'Charlie');

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const mailOptions = mockTransporter.sendMail.mock.calls[0][0];

      expect(mailOptions.to).toBe('newuser@example.com');
      expect(mailOptions.subject).toBe('Welcome to CodeSpace — Your Multi-Terminal Workspace!');
      expect(mailOptions.text).toContain('Welcome to CodeSpace, Charlie!');
      expect(mailOptions.html).toContain('Multi-Terminal Grid');
      expect(mailOptions.html).toContain('Remote SSH Connections');
    });
  });

  describe('Dev mode without SMTP_HOST', () => {
    it('should log to console and not attempt sendMail when SMTP_HOST is unset', async () => {
      const devModule: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(undefined),
            },
          },
        ],
      }).compile();

      const devService = devModule.get<MailService>(MailService);
      const verifyResult = await devService.verifyConnection();
      expect(verifyResult).toBe(false);

      await devService.sendVerificationEmail('dev@example.com', '999888');
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });
  });
});
