import {
  Controller,
  Get,
  Delete,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SessionService } from '@/modules/session/session.service';
import { SessionResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { ApiListResponse } from '@/common/decorators/swagger-response.decorator';

@ApiTags('Session')
@Controller('session')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('list')
  @ResponseMessage('Get list of active sessions successfully')
  @ApiOperation({
    summary: 'List Active Logged-In Sessions',
    description:
      'Lists all active logged-in device sessions (IP, User Agent, device name, expiration) for the authenticated user.',
  })
  @ApiListResponse(
    SessionResponseDto,
    HttpStatus.OK,
    'Get list of active sessions successfully',
    '/api/v1/session/list'
  )
  async getSessions(@Req() req: any): Promise<SessionResponseDto[]> {
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.refreshToken;
    return this.sessionService.getSessions(req.user.id, refreshToken);
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Delete session successfully')
  @ApiOperation({
    summary: 'Revoke Specific Session',
    description:
      'Revokes a single active session owned by the authenticated user (prevents IDOR by scoping the lookup to the JWT userId).',
  })
  @ApiParam({ name: 'id', description: 'Session ID to revoke', example: '10' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Delete session successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found or not owned by the user.',
  })
  async revokeSession(@Param('id') sessionId: string, @Req() req: any): Promise<void> {
    return this.sessionService.revokeSession(req.user.id, sessionId);
  }
}
