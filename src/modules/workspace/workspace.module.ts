import { Module } from '@nestjs/common';
import { WorkspaceController } from '@/modules/workspace/workspace.controller';
import { WorkspaceService } from '@/modules/workspace/workspace.service';

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
