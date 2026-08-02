import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class UpsertDirectoryHistoryDto {
  @ApiProperty({ example: 'd:/CODE/Web/Projects/code-space-api' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  position?: number;
}

export class DirectoryHistoryItemDto {
  @ApiProperty({ example: 'dir-uuid-01' })
  id: string;

  @ApiProperty({ example: '10' })
  userId: string;

  @ApiProperty({ example: 'd:/CODE/Web/Projects/code-space-api' })
  path: string;

  @ApiProperty({ example: 0 })
  position: number;

  @ApiProperty()
  updatedAt: Date;
}
