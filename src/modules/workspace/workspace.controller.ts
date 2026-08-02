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
import { WorkspaceService } from '@/modules/workspace/workspace.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceResponseDto,
} from '@/modules/workspace/dto/workspace.dto';

type RequestWithUser = Request & {
  user: {
    id: string;
    email: string;
    role: string;
  };
};

@ApiTags('Workspace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get('list')
  @ResponseMessage('Get workspaces successfully')
  @ApiOperation({
    summary: 'List User Workspaces',
    description:
      'Retrieves all cloud-synced workspace configurations owned by the authenticated user.',
  })
  @ApiListResponse(
    WorkspaceResponseDto,
    HttpStatus.OK,
    'Get workspaces successfully',
    '/api/v1/workspace/list'
  )
  async getWorkspaces(@Req() req: RequestWithUser): Promise<WorkspaceResponseDto[]> {
    return this.workspaceService.getWorkspaces(req.user.id);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Create workspace successfully')
  @ApiOperation({
    summary: 'Create Workspace',
    description: 'Creates a new cloud workspace configuration with terminals.',
  })
  @ApiSingleResponse(
    WorkspaceResponseDto,
    HttpStatus.CREATED,
    'Create workspace successfully',
    '/api/v1/workspace/create'
  )
  async createWorkspace(
    @Req() req: RequestWithUser,
    @Body() dto: CreateWorkspaceDto
  ): Promise<WorkspaceResponseDto> {
    return this.workspaceService.createWorkspace(req.user.id, dto);
  }

  @Get('get/:id')
  @ResponseMessage('Get workspace details successfully')
  @ApiOperation({
    summary: 'Get Workspace Details',
    description: 'Retrieves details of a specific workspace owned by the user.',
  })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiSingleResponse(
    WorkspaceResponseDto,
    HttpStatus.OK,
    'Get workspace details successfully',
    '/api/v1/workspace/get'
  )
  async getWorkspaceById(
    @Req() req: RequestWithUser,
    @Param('id') id: string
  ): Promise<WorkspaceResponseDto> {
    return this.workspaceService.getWorkspaceById(req.user.id, id);
  }

  @Put('update/:id')
  @ResponseMessage('Update workspace successfully')
  @ApiOperation({
    summary: 'Update Workspace',
    description: 'Updates an existing workspace configuration by ID.',
  })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiSingleResponse(
    WorkspaceResponseDto,
    HttpStatus.OK,
    'Update workspace successfully',
    '/api/v1/workspace/update'
  )
  async updateWorkspace(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto
  ): Promise<WorkspaceResponseDto> {
    return this.workspaceService.updateWorkspace(req.user.id, id, dto);
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Delete workspace successfully')
  @ApiOperation({
    summary: 'Delete Workspace',
    description: 'Permanently deletes a cloud workspace configuration.',
  })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Delete workspace successfully',
  })
  async deleteWorkspace(@Req() req: RequestWithUser, @Param('id') id: string): Promise<void> {
    return this.workspaceService.deleteWorkspace(req.user.id, id);
  }
}
