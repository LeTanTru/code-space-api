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
    customSound: {
      create: jest.fn().mockResolvedValue({ id: 'sound-123' }),
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

  describe('uploadImage', () => {
    it('should successfully save image file and return metadata', async () => {
      const res = await service.uploadImage('user-123', dummyImageFile);

      expect(res).toHaveProperty('id');
      expect(res.originalName).toBe('test-avatar.png');
      expect(res.mimeType).toBe('image/png');
      expect(res.url).toContain('http://localhost:8080/uploads/images/');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should throw BadRequestException if image MIME type is invalid', async () => {
      const invalidFile = { ...dummyImageFile, mimetype: 'application/exe' };
      await expect(service.uploadImage('user-123', invalidFile)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('uploadSound', () => {
    it('should successfully save sound file and return metadata', async () => {
      const res = await service.uploadSound('user-123', dummySoundFile, 'My Sound');

      expect(res).toHaveProperty('id');
      expect(res.originalName).toBe('test-sound.mp3');
      expect(res.name).toBe('My Sound');
      expect(res.mimeType).toBe('audio/mpeg');
      expect(res.url).toContain('http://localhost:8080/uploads/sounds/');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should throw BadRequestException if sound MIME type is invalid', async () => {
      const invalidFile = { ...dummySoundFile, mimetype: 'text/plain' };
      await expect(service.uploadSound('user-123', invalidFile)).rejects.toThrow(
        BadRequestException
      );
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
