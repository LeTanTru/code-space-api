import { Module } from '@nestjs/common';
import { SyncController } from '@/modules/sync/sync.controller';
import { SyncService } from '@/modules/sync/sync.service';

@Module({
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
