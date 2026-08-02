import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { UploadController } from '@/modules/upload/upload.controller';
import { UploadService } from '@/modules/upload/upload.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
