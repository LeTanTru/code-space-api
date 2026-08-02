import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UploadService } from '@/modules/upload/upload.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

describe('UploadService', () => {
  let service: UploadService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultVal?: any) => {
      if (key === 'PORT') return 8080;
      if (key === 'HOST') return 'http://localhost';
      return defaultVal;
    }),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    customSound: {
      findFirst: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'sound-123' }),
      delete: jest.fn().mockResolvedValue({ id: 'sound-123' }),
    },
  };

  const dummyImageFile = {
    originalname: 'test-avatar.png',
    mimetype: 'image/png',
    size: 5000,
    buffer: Buffer.from('fake image data'),
  } as Express.Multer.File;

  const dummySoundFile = {
    originalname: 'test-sound.mp3',
    mimetype: 'audio/mpeg',
    size: 15000,
    buffer: Buffer.from('fake sound data'),
  } as Express.Multer.File;

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  describe('uploadImage & uploadAvatar', () => {
    it('should successfully save image file and return metadata', async () => {
      const res = await service.uploadImage('user-123', dummyImageFile);

      expect(res).toHaveProperty('id');
      expect(res.originalName).toBe('test-avatar.png');
      expect(res.mimeType).toBe('image/png');
      expect(res.url).toContain('http://localhost:8080/uploads/images/');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should upload avatar and update user avatarUrl in Prisma', async () => {
      mockPrismaService.user.update.mockResolvedValue({ id: 'user-123', avatarUrl: 'http://url' });
      const res = await service.uploadAvatar('user-123', dummyImageFile);

      expect(res.avatarUrl).toContain('http://localhost:8080/uploads/images/');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if image MIME type is invalid', async () => {
      const invalidFile = { ...dummyImageFile, mimetype: 'application/exe' };
      await expect(service.uploadImage('user-123', invalidFile)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('deleteAvatar', () => {
    it('should reset avatarUrl for user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        avatarUrl: 'http://localhost/images/img.png',
      });
      mockPrismaService.user.update.mockResolvedValue({ id: 'user-123', avatarUrl: null });

      const res = await service.deleteAvatar('user-123');
      expect(res.deleted).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { avatarUrl: null },
      });
    });
  });

  describe('uploadSound & deleteSound', () => {
    it('should successfully save sound file and return metadata', async () => {
      const res = await service.uploadSound('user-123', dummySoundFile, 'My Sound');

      expect(res).toHaveProperty('id');
      expect(res.originalName).toBe('test-sound.mp3');
      expect(res.name).toBe('My Sound');
      expect(res.mimeType).toBe('audio/mpeg');
      expect(res.url).toContain('http://localhost:8080/uploads/sounds/');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should delete custom sound', async () => {
      mockPrismaService.customSound.findFirst.mockResolvedValue({ id: 'sound-123' });
      const res = await service.deleteSound('user-123', 'sound-123');
      expect(res.deleted).toBe(true);
      expect(mockPrismaService.customSound.delete).toHaveBeenCalledWith({
        where: { id: 'sound-123' },
      });
    });
  });

  describe('deleteFile', () => {
    it('should delete existing file', async () => {
      const res = await service.deleteFile('user-123', 'test-file.png');

      expect(res).toEqual({ filename: 'test-file.png', deleted: true });
      expect(fs.unlink).toHaveBeenCalled();
    });

    it('should throw BadRequestException on path traversal attempt', async () => {
      await expect(service.deleteFile('user-123', '../secret.txt')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException if file delete fails', async () => {
      (fs.unlink as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(service.deleteFile('user-123', 'nonexistent.png')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
