import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FileUploadResponseDto {
  @ApiProperty({ example: 'img-e78ccd10-490a-4b6d-a22e-b9d5af49b055-1785645000000' })
  id: string;

  @ApiProperty({ example: 'avatar-user-123.webp' })
  filename: string;

  @ApiProperty({ example: 'my-avatar.png' })
  originalName: string;

  @ApiProperty({ example: 'http://localhost:8080/uploads/images/avatar-user-123.webp' })
  url: string;

  @ApiProperty({ example: 'image/webp' })
  mimeType: string;

  @ApiProperty({ example: 142580 })
  sizeBytes: number;

  @ApiProperty({ example: '2026-08-02T11:32:00.000Z' })
  createdAt: string;
}

export class SoundUploadResponseDto extends FileUploadResponseDto {
  @ApiPropertyOptional({ example: 'Custom Chime Alert' })
  name?: string;
}

export class FileDeleteResponseDto {
  @ApiProperty({ example: 'avatar-user-123.webp' })
  filename: string;

  @ApiProperty({ example: true })
  deleted: boolean;
}
