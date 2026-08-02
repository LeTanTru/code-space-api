import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { ApiSingleResponse } from '@/common/decorators/swagger-response.decorator';
import { UploadService } from '@/modules/upload/upload.service';
import {
  FileUploadResponseDto,
  SoundUploadResponseDto,
  FileDeleteResponseDto,
} from '@/modules/upload/dto/upload-response.dto';

type RequestWithUser = Request & {
  user: {
    id: string;
    email: string;
    role: string;
  };
};

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @ResponseMessage('Image uploaded successfully')
  @ApiOperation({
    summary: 'Upload Image Asset',
    description: 'Uploads an image file. Maximum size: 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiSingleResponse(
    FileUploadResponseDto,
    HttpStatus.CREATED,
    'Image uploaded successfully',
    '/api/v1/upload/image'
  )
  async uploadImage(
    @Req() req: RequestWithUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
        fileIsRequired: true,
      })
    )
    file: Express.Multer.File
  ): Promise<FileUploadResponseDto> {
    return this.uploadService.uploadImage(req.user.id, file);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ResponseMessage('Avatar uploaded successfully')
  @ApiOperation({
    summary: 'Upload User Avatar Image',
    description: 'Uploads avatar image file and updates user profile avatarUrl.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiSingleResponse(
    FileUploadResponseDto,
    HttpStatus.CREATED,
    'Avatar uploaded successfully',
    '/api/v1/upload/avatar'
  )
  async uploadAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
        fileIsRequired: true,
      })
    )
    file: Express.Multer.File
  ): Promise<FileUploadResponseDto & { avatarUrl: string }> {
    return this.uploadService.uploadAvatar(req.user.id, file);
  }

  @Delete('avatar')
  @ResponseMessage('Avatar reset successfully')
  @ApiOperation({
    summary: 'Delete User Avatar Image',
    description: 'Deletes user avatar image and resets profile avatarUrl to null.',
  })
  @ApiSingleResponse(
    FileDeleteResponseDto,
    HttpStatus.OK,
    'Avatar reset successfully',
    '/api/v1/upload/avatar'
  )
  async deleteAvatar(@Req() req: RequestWithUser): Promise<FileDeleteResponseDto> {
    return this.uploadService.deleteAvatar(req.user.id);
  }

  @Post('sound')
  @UseInterceptors(FileInterceptor('file'))
  @ResponseMessage('Sound file uploaded successfully')
  @ApiOperation({
    summary: 'Upload Custom Sound Asset',
    description: 'Uploads custom sound clip file. Maximum size: 10MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        name: { type: 'string', example: 'Custom Chime' },
      },
      required: ['file'],
    },
  })
  @ApiSingleResponse(
    SoundUploadResponseDto,
    HttpStatus.CREATED,
    'Sound file uploaded successfully',
    '/api/v1/upload/sound'
  )
  async uploadSound(
    @Req() req: RequestWithUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
        fileIsRequired: true,
      })
    )
    file: Express.Multer.File,
    @Body('name') name?: string
  ): Promise<SoundUploadResponseDto> {
    return this.uploadService.uploadSound(req.user.id, file, name);
  }

  @Delete('sound/:id')
  @ResponseMessage('Custom sound deleted successfully')
  @ApiOperation({
    summary: 'Delete Custom Sound Asset',
    description: 'Deletes custom sound clip record by ID.',
  })
  @ApiSingleResponse(
    FileDeleteResponseDto,
    HttpStatus.OK,
    'Custom sound deleted successfully',
    '/api/v1/upload/sound'
  )
  async deleteSound(
    @Req() req: RequestWithUser,
    @Param('id') id: string
  ): Promise<FileDeleteResponseDto> {
    return this.uploadService.deleteSound(req.user.id, id);
  }

  @Delete('delete/:filename')
  @ResponseMessage('File deleted successfully')
  @ApiOperation({
    summary: 'Delete Uploaded Asset',
    description: 'Removes a previously uploaded media file.',
  })
  @ApiSingleResponse(
    FileDeleteResponseDto,
    HttpStatus.OK,
    'File deleted successfully',
    '/api/v1/upload/delete'
  )
  async deleteFile(
    @Req() req: RequestWithUser,
    @Param('filename') filename: string
  ): Promise<FileDeleteResponseDto> {
    return this.uploadService.deleteFile(req.user.id, filename);
  }
}
