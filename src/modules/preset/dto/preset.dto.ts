import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreatePresetDto {
  @ApiProperty({ example: 'Full Stack Dev Quad' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '2x2 Grid with Node, Vite, Prisma, and Claude' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  count?: number;

  @ApiPropertyOptional({ example: 'grid' })
  @IsOptional()
  @IsString()
  orientation?: string;

  @ApiPropertyOptional({ example: ['antigravity', 'claude', 'codex'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cliIds?: string[];
}

export class UpdatePresetDto {
  @ApiPropertyOptional({ example: 'Full Stack Dev Quad Updated' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  count?: number;

  @ApiPropertyOptional({ example: 'grid' })
  @IsOptional()
  @IsString()
  orientation?: string;

  @ApiPropertyOptional({ example: ['antigravity', 'claude'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cliIds?: string[];
}

export class PresetResponseDto {
  @ApiProperty({ example: 'preset_01' })
  id: string;

  @ApiProperty({ example: '10' })
  userId: string;

  @ApiProperty({ example: 'Full Stack Dev Quad' })
  name: string;

  @ApiPropertyOptional({ example: '2x2 Grid with Node, Vite, Prisma, and Claude' })
  description?: string | null;

  @ApiProperty({ example: 4 })
  count: number;

  @ApiPropertyOptional({ example: 'grid' })
  orientation?: string;

  @ApiPropertyOptional({ example: ['antigravity', 'claude'] })
  cliIds?: string[];

  @ApiProperty()
  createdAt: number;

  @ApiProperty()
  updatedAt: number;
}
