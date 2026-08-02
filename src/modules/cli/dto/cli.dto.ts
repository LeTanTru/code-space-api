import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCliToolDto {
  @ApiProperty({ example: 'Custom Deploy CLI' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: './deploy.sh' })
  @IsString()
  @IsNotEmpty()
  command: string;

  @ApiPropertyOptional({ example: 'which deploy' })
  @IsOptional()
  @IsString()
  checkCommand?: string;

  @ApiPropertyOptional({ example: 'https://example.com/docs' })
  @IsOptional()
  @IsString()
  link?: string;
}

export class UpdateCliToolDto {
  @ApiPropertyOptional({ example: 'Custom Deploy CLI Updated' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: './deploy-prod.sh' })
  @IsOptional()
  @IsString()
  command?: string;

  @ApiPropertyOptional({ example: 'which deploy' })
  @IsOptional()
  @IsString()
  checkCommand?: string;

  @ApiPropertyOptional({ example: 'https://example.com/docs' })
  @IsOptional()
  @IsString()
  link?: string;
}

export class UpsertCliOverrideDto {
  @ApiProperty({ example: 'antigravity' })
  @IsString()
  @IsNotEmpty()
  cliId: string;

  @ApiPropertyOptional({ example: 'Antigravity Dev' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'antigravity --dev' })
  @IsOptional()
  @IsString()
  command?: string;

  @ApiPropertyOptional({ example: 'antigravity --version' })
  @IsOptional()
  @IsString()
  checkCommand?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsString()
  link?: string;
}

export class CustomCliItemDto {
  @ApiProperty({ example: 'cli-custom-01' })
  id: string;

  @ApiProperty({ example: 'Custom Deploy CLI' })
  name: string;

  @ApiProperty({ example: './deploy.sh' })
  command: string;

  @ApiPropertyOptional({ example: 'which deploy' })
  checkCommand?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com' })
  link?: string | null;

  @ApiProperty({ example: true })
  isCustom: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CliOverrideItemDto {
  @ApiProperty({ example: 'override-uuid-01' })
  id: string;

  @ApiProperty({ example: 'antigravity' })
  cliId: string;

  @ApiPropertyOptional({ example: 'Antigravity Dev' })
  name?: string | null;

  @ApiPropertyOptional({ example: 'antigravity --dev' })
  command?: string | null;

  @ApiPropertyOptional({ example: 'antigravity --version' })
  checkCommand?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com' })
  link?: string | null;

  @ApiProperty()
  updatedAt: Date;
}

export class CliToolsListResponseDto {
  @ApiProperty({ type: [CustomCliItemDto] })
  customClis: CustomCliItemDto[];

  @ApiProperty({ type: [CliOverrideItemDto] })
  builtinOverrides: CliOverrideItemDto[];
}
