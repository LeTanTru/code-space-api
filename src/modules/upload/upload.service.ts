import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/modules/prisma/prisma.service';
import {
  FileUploadResponseDto,
  SoundUploadResponseDto,
  FileDeleteResponseDto,
} from '@/modules/upload/dto/upload-response.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private readonly uploadDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
  }

  private async ensureDirExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (err) {
      // Ignore if dir exists
    }
  }

  private getAppBaseUrl(): string {
    const port = this.configService.get<number>('PORT', 8080);
    const host = this.configService.get<string>('HOST', 'http://localhost');
    return `${host}:${port}`;
  }

  async uploadImage(userId: string, file: Express.Multer.File): Promise<FileUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No image file provided in upload request');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid image file type (${file.mimetype}). Allowed types: JPEG, PNG, WebP, GIF, SVG.`
      );
    }

    const imageSubDir = path.join(this.uploadDir, 'images');
    await this.ensureDirExists(imageSubDir);

    const ext = path.extname(file.originalname) || '.png';
    const uniqueId = `img-${userId.slice(0, 8)}-${Date.now()}`;
    const filename = `${uniqueId}${ext}`;
    const filePath = path.join(imageSubDir, filename);

    await fs.writeFile(filePath, file.buffer);

    const url = `${this.getAppBaseUrl()}/uploads/images/${filename}`;

    return {
      id: uniqueId,
      filename,
      originalName: file.originalname,
      url,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      createdAt: new Date().toISOString(),
    };
  }

  async uploadSound(
    userId: string,
    file: Express.Multer.File,
    displayName?: string
  ): Promise<SoundUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No sound file provided in upload request');
    }

    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/x-wav',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid audio file type (${file.mimetype}). Allowed types: MP3, WAV, OGG, WebM.`
      );
    }

    const soundSubDir = path.join(this.uploadDir, 'sounds');
    await this.ensureDirExists(soundSubDir);

    const ext = path.extname(file.originalname) || '.mp3';
    const uniqueId = `sound-${userId.slice(0, 8)}-${Date.now()}`;
    const filename = `${uniqueId}${ext}`;
    const filePath = path.join(soundSubDir, filename);

    await fs.writeFile(filePath, file.buffer);

    const url = `${this.getAppBaseUrl()}/uploads/sounds/${filename}`;
    const name = displayName || path.parse(file.originalname).name;

    // Save to Prisma CustomSound model if database record is needed
    try {
      const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      await this.prisma.customSound.create({
        data: {
          id: uniqueId,
          userId,
          name,
          dataUrl,
          mimeType: file.mimetype,
          sizeBytes: file.size,
        },
      });
    } catch {
      // Non-blocking catch if DB save fails
    }

    return {
      id: uniqueId,
      filename,
      originalName: file.originalname,
      name,
      url,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      createdAt: new Date().toISOString(),
    };
  }

  async deleteFile(userId: string, filename: string): Promise<FileDeleteResponseDto> {
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('Invalid filename');
    }

    const imagePath = path.join(this.uploadDir, 'images', filename);
    const soundPath = path.join(this.uploadDir, 'sounds', filename);

    let deleted = false;

    try {
      await fs.unlink(imagePath);
      deleted = true;
    } catch {
      try {
        await fs.unlink(soundPath);
        deleted = true;
      } catch {
        // File not found in either images or sounds
      }
    }

    if (!deleted) {
      throw new NotFoundException(`File '${filename}' not found or already deleted.`);
    }

    return { filename, deleted: true };
  }
}
