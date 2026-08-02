import { Module } from '@nestjs/common';
import { DirectoryHistoryController } from '@/modules/directory-history/directory-history.controller';
import { DirectoryHistoryService } from '@/modules/directory-history/directory-history.service';

@Module({
  controllers: [DirectoryHistoryController],
  providers: [DirectoryHistoryService],
  exports: [DirectoryHistoryService],
})
export class DirectoryHistoryModule {}
