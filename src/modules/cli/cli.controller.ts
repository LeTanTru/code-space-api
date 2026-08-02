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
import { ApiSingleResponse } from '@/common/decorators/swagger-response.decorator';
import { CliService } from '@/modules/cli/cli.service';
import {
  CreateCliToolDto,
  UpdateCliToolDto,
  UpsertCliOverrideDto,
  CliToolsListResponseDto,
  CustomCliItemDto,
  CliOverrideItemDto,
} from '@/modules/cli/dto/cli.dto';

type RequestWithUser = Request & {
  user: {
    id: string;
    email: string;
    role: string;
  };
};

@ApiTags('CLI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cli')
export class CliController {
  constructor(private readonly cliService: CliService) {}

  @Get('list')
  @ResponseMessage('Get CLI tools successfully')
  @ApiOperation({
    summary: 'List CLI Tools & Overrides',
    description:
      'Retrieves custom CLI tools registered by the user alongside builtin CLI overrides.',
  })
  @ApiSingleResponse(
    CliToolsListResponseDto,
    HttpStatus.OK,
    'Get CLI tools successfully',
    '/api/v1/cli/list'
  )
  async getCliTools(@Req() req: RequestWithUser): Promise<CliToolsListResponseDto> {
    return this.cliService.getCliTools(req.user.id);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Create custom CLI tool successfully')
  @ApiOperation({
    summary: 'Create Custom CLI Tool',
    description: 'Registers a new user-defined custom CLI tool.',
  })
  @ApiSingleResponse(
    CustomCliItemDto,
    HttpStatus.CREATED,
    'Create custom CLI tool successfully',
    '/api/v1/cli/create'
  )
  async createCustomCli(
    @Req() req: RequestWithUser,
    @Body() dto: CreateCliToolDto
  ): Promise<CustomCliItemDto> {
    return this.cliService.createCustomCli(req.user.id, dto);
  }

  @Put('update/:id')
  @ResponseMessage('Update custom CLI tool successfully')
  @ApiOperation({
    summary: 'Update Custom CLI Tool',
    description: 'Updates an existing custom CLI tool configuration by ID.',
  })
  @ApiParam({ name: 'id', description: 'CLI Tool ID' })
  @ApiSingleResponse(
    CustomCliItemDto,
    HttpStatus.OK,
    'Update custom CLI tool successfully',
    '/api/v1/cli/update'
  )
  async updateCustomCli(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateCliToolDto
  ): Promise<CustomCliItemDto> {
    return this.cliService.updateCustomCli(req.user.id, id, dto);
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Delete custom CLI tool successfully')
  @ApiOperation({
    summary: 'Delete Custom CLI Tool',
    description: 'Deletes a user-defined custom CLI tool.',
  })
  @ApiParam({ name: 'id', description: 'CLI Tool ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Delete custom CLI tool successfully',
  })
  async deleteCustomCli(@Req() req: RequestWithUser, @Param('id') id: string): Promise<void> {
    return this.cliService.deleteCustomCli(req.user.id, id);
  }

  @Post('override/upsert')
  @ResponseMessage('Upsert CLI override successfully')
  @ApiOperation({
    summary: 'Upsert Builtin CLI Override',
    description: 'Creates or updates an override configuration for a built-in CLI tool.',
  })
  @ApiSingleResponse(
    CliOverrideItemDto,
    HttpStatus.OK,
    'Upsert CLI override successfully',
    '/api/v1/cli/override/upsert'
  )
  async upsertCliOverride(
    @Req() req: RequestWithUser,
    @Body() dto: UpsertCliOverrideDto
  ): Promise<CliOverrideItemDto> {
    return this.cliService.upsertCliOverride(req.user.id, dto);
  }

  @Delete('override/delete/:cliId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Delete CLI override successfully')
  @ApiOperation({
    summary: 'Delete Builtin CLI Override',
    description: 'Removes a custom override for a built-in CLI tool.',
  })
  @ApiParam({ name: 'cliId', description: 'Builtin CLI ID (e.g. antigravity)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Delete CLI override successfully',
  })
  async deleteCliOverride(
    @Req() req: RequestWithUser,
    @Param('cliId') cliId: string
  ): Promise<void> {
    return this.cliService.deleteCliOverride(req.user.id, cliId);
  }
}
