import { Controller, Get, Post, Body, Req, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { SyncService } from '@/modules/sync/sync.service';
import {
  SyncPushDto,
  SyncPushResponseDto,
  SyncPullResponseDto,
  SyncLogResponseDto,
} from '@/modules/sync/dto/sync.dto';

type RequestWithUser = Request & {
  user: {
    id: string;
    email: string;
    role: string;
  };
};

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @ResponseMessage('State synchronized successfully')
  @ApiOperation({
    summary: 'Push Local State Snapshot to Cloud Backup',
    description: 'Pushes client snapshot database state to sync log and cloud backup.',
  })
  @ApiBody({ type: SyncPushDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'State synchronized successfully' })
  async pushSync(
    @Req() req: RequestWithUser,
    @Body() dto: SyncPushDto
  ): Promise<SyncPushResponseDto> {
    return this.syncService.pushSync(req.user.id, dto);
  }

  @Get('pull')
  @ResponseMessage('Pull state successfully')
  @ApiOperation({
    summary: 'Pull Latest Cloud Backup Snapshot State',
    description: 'Retrieves user settings, presets, directory history, and CLI tools.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pull state successfully' })
  async pullSync(@Req() req: RequestWithUser): Promise<SyncPullResponseDto> {
    return this.syncService.pullSync(req.user.id);
  }

  @Get('logs')
  @ResponseMessage('Get sync logs successfully')
  @ApiOperation({
    summary: 'Get Cloud Sync Audit History Logs',
    description: 'Retrieves audit logs of device state sync executions for the authenticated user.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Get sync logs successfully' })
  async getSyncLogs(@Req() req: RequestWithUser): Promise<SyncLogResponseDto[]> {
    return this.syncService.getSyncLogs(req.user.id);
  }
}
