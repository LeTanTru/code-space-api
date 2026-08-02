import { Controller, Get, Put, Body, Req, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { ApiSingleResponse } from '@/common/decorators/swagger-response.decorator';
import { SettingsService } from '@/modules/settings/settings.service';
import { SettingsResponseDto } from '@/modules/settings/dto/settings-response.dto';
import { UpdateSettingsDto } from '@/modules/settings/dto/update-settings.dto';

type RequestWithUser = Request & {
  user: {
    id: string;
    email: string;
    role: string;
  };
};

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('setting')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('get')
  @ResponseMessage('Get settings successfully')
  @ApiOperation({
    summary: 'Get Cloud User Settings',
    description:
      'Retrieves application preferences and terminal configurations for the authenticated user. Automatically initializes default settings if none exist.',
  })
  @ApiSingleResponse(
    SettingsResponseDto,
    HttpStatus.OK,
    'Get settings successfully',
    '/api/v1/setting/get'
  )
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access or invalid token.',
  })
  async getSettings(@Req() req: RequestWithUser): Promise<SettingsResponseDto> {
    return this.settingsService.getSettings(req.user.id);
  }

  @Put('update')
  @ResponseMessage('Update settings successfully')
  @ApiOperation({
    summary: 'Update Cloud User Settings',
    description:
      'Updates application preferences (theme, font, terminal cursor, sound, notification settings) for the authenticated user.',
  })
  @ApiBody({ type: UpdateSettingsDto })
  @ApiSingleResponse(
    SettingsResponseDto,
    HttpStatus.OK,
    'Update settings successfully',
    '/api/v1/setting/update'
  )
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access or invalid token.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed for input settings fields.',
  })
  async updateSettings(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateSettingsDto
  ): Promise<SettingsResponseDto> {
    return this.settingsService.updateSettings(req.user.id, dto);
  }
}
