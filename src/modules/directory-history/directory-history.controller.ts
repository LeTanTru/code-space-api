import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { ApiSingleResponse, ApiListResponse } from '@/common/decorators/swagger-response.decorator';
import { DirectoryHistoryService } from '@/modules/directory-history/directory-history.service';
import {
  UpsertDirectoryHistoryDto,
  DirectoryHistoryItemDto,
} from '@/modules/directory-history/dto/directory-history.dto';

type RequestWithUser = Request & {
  user: {
    id: string;
    email: string;
    role: string;
  };
};

@ApiTags('Directory History')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('directory-history')
export class DirectoryHistoryController {
  constructor(private readonly directoryHistoryService: DirectoryHistoryService) {}

  @Get('list')
  @ResponseMessage('Get directory history successfully')
  @ApiOperation({
    summary: 'List Directory History',
    description: 'Retrieves recently visited working directory paths for the user.',
  })
  @ApiListResponse(
    DirectoryHistoryItemDto,
    HttpStatus.OK,
    'Get directory history successfully',
    '/api/v1/directory-history/list'
  )
  async getDirectoryHistory(@Req() req: RequestWithUser): Promise<DirectoryHistoryItemDto[]> {
    return this.directoryHistoryService.getDirectoryHistory(req.user.id);
  }

  @Post('upsert')
  @ResponseMessage('Upsert directory history successfully')
  @ApiOperation({
    summary: 'Upsert Directory History Entry',
    description: 'Adds a new working directory path or updates its position in user history.',
  })
  @ApiSingleResponse(
    DirectoryHistoryItemDto,
    HttpStatus.OK,
    'Upsert directory history successfully',
    '/api/v1/directory-history/upsert'
  )
  async upsertDirectoryHistory(
    @Req() req: RequestWithUser,
    @Body() dto: UpsertDirectoryHistoryDto
  ): Promise<DirectoryHistoryItemDto> {
    return this.directoryHistoryService.upsertDirectoryHistory(req.user.id, dto);
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Delete directory history item successfully')
  @ApiOperation({
    summary: 'Delete Directory History Entry',
    description: 'Deletes a specific working directory history entry by ID.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Delete directory history item successfully',
  })
  async deleteDirectoryHistoryById(
    @Req() req: RequestWithUser,
    @Param('id') id: string
  ): Promise<void> {
    return this.directoryHistoryService.deleteDirectoryHistoryById(req.user.id, id);
  }
}
