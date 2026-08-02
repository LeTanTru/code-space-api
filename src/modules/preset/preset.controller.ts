import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { ApiSingleResponse, ApiListResponse } from '@/common/decorators/swagger-response.decorator';
import { PresetService } from '@/modules/preset/preset.service';
import {
  CreatePresetDto,
  UpdatePresetDto,
  PresetResponseDto,
} from '@/modules/preset/dto/preset.dto';

type RequestWithUser = Request & {
  user: {
    id: string;
    email: string;
    role: string;
  };
};

@ApiTags('Preset')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('preset')
export class PresetController {
  constructor(private readonly presetService: PresetService) {}

  @Get('list')
  @ResponseMessage('Get presets successfully')
  @ApiOperation({
    summary: 'List Saved Layout Presets',
    description: 'Retrieves all saved layout presets for the logged-in user.',
  })
  @ApiListResponse(
    PresetResponseDto,
    HttpStatus.OK,
    'Get presets successfully',
    '/api/v1/preset/list'
  )
  async getPresets(@Req() req: RequestWithUser): Promise<PresetResponseDto[]> {
    return this.presetService.getPresets(req.user.id);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Create preset successfully')
  @ApiOperation({
    summary: 'Create Layout Preset',
    description: 'Saves a custom multi-terminal layout preset profile.',
  })
  @ApiSingleResponse(
    PresetResponseDto,
    HttpStatus.CREATED,
    'Create preset successfully',
    '/api/v1/preset/create'
  )
  async createPreset(
    @Req() req: RequestWithUser,
    @Body() dto: CreatePresetDto
  ): Promise<PresetResponseDto> {
    return this.presetService.createPreset(req.user.id, dto);
  }

  @Get('get/:id')
  @ResponseMessage('Get preset details successfully')
  @ApiOperation({
    summary: 'Get Layout Preset Details',
    description: 'Retrieves details of a specific layout preset by ID.',
  })
  @ApiParam({ name: 'id', description: 'Preset ID' })
  @ApiSingleResponse(
    PresetResponseDto,
    HttpStatus.OK,
    'Get preset details successfully',
    '/api/v1/preset/get'
  )
  async getPresetById(
    @Req() req: RequestWithUser,
    @Param('id') id: string
  ): Promise<PresetResponseDto> {
    return this.presetService.getPresetById(req.user.id, id);
  }

  @Put('update/:id')
  @ResponseMessage('Update preset successfully')
  @ApiOperation({
    summary: 'Update Layout Preset',
    description: 'Updates an existing layout preset profile by ID.',
  })
  @ApiParam({ name: 'id', description: 'Preset ID' })
  @ApiSingleResponse(
    PresetResponseDto,
    HttpStatus.OK,
    'Update preset successfully',
    '/api/v1/preset/update'
  )
  async updatePreset(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdatePresetDto
  ): Promise<PresetResponseDto> {
    return this.presetService.updatePreset(req.user.id, id, dto);
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Delete preset successfully')
  @ApiOperation({
    summary: 'Delete Layout Preset',
    description: 'Deletes a saved layout preset profile.',
  })
  @ApiParam({ name: 'id', description: 'Preset ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Delete preset successfully',
  })
  async deletePreset(@Req() req: RequestWithUser, @Param('id') id: string): Promise<void> {
    return this.presetService.deletePreset(req.user.id, id);
  }
}
