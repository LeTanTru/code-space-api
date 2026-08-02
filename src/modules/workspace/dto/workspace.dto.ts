import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PresetTerminalDto {
  @ApiPropertyOptional({ example: 'antigravity' })
  @IsOptional()
  @IsString()
  cli?: string;

  @ApiProperty({ example: 'd:/CODE/Web/Projects/code-space-api' })
  @IsString()
  @IsNotEmpty()
  cwd: string;

  @ApiPropertyOptional({ example: 'API Server' })
  @IsOptional()
  @IsString()
  customTitle?: string;

  @ApiPropertyOptional({ example: 'npm run start:dev' })
  @IsOptional()
  @IsString()
  command?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  position?: number;
}

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Backend Development' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Multi-terminal API development workspace' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#3b82f6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 'd:/CODE/Web/Projects/code-space-api' })
  @IsString()
  @IsNotEmpty()
  rootPath: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  terminalCount?: number;

  @ApiPropertyOptional({ example: 'antigravity' })
  @IsOptional()
  @IsString()
  selectedCli?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  ideVscode?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ideAntigravity?: boolean;

  @ApiPropertyOptional({ example: { count: 2, orientation: 'horizontal' } })
  @IsOptional()
  layout?: Record<string, any>;

  @ApiPropertyOptional({ type: [PresetTerminalDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresetTerminalDto)
  terminals?: PresetTerminalDto[];
}

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ example: 'Updated Backend Workspace' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#8b5cf6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'd:/CODE/Web/Projects/code-space-api' })
  @IsOptional()
  @IsString()
  rootPath?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  terminalCount?: number;

  @ApiPropertyOptional({ example: 'antigravity' })
  @IsOptional()
  @IsString()
  selectedCli?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  ideVscode?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ideAntigravity?: boolean;

  @ApiPropertyOptional({ example: { count: 2, orientation: 'horizontal' } })
  @IsOptional()
  layout?: Record<string, any>;

  @ApiPropertyOptional({ type: [PresetTerminalDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresetTerminalDto)
  terminals?: PresetTerminalDto[];
}

export class PresetTerminalResponseDto {
  @ApiProperty({ example: 'term-uuid-01' })
  id: string;

  @ApiPropertyOptional({ example: 'antigravity' })
  cli?: string | null;

  @ApiProperty({ example: 'd:/CODE/Web/Projects/code-space-api' })
  cwd: string;

  @ApiPropertyOptional({ example: 'API Server' })
  customTitle?: string | null;

  @ApiPropertyOptional({ example: 'npm run start:dev' })
  command?: string | null;

  @ApiProperty({ example: 0 })
  position: number;
}

export class WorkspaceResponseDto {
  @ApiProperty({ example: 'ws_12345' })
  id: string;

  @ApiProperty({ example: '10' })
  userId: string;

  @ApiProperty({ example: 'Backend Development' })
  name: string;

  @ApiPropertyOptional({ example: 'Multi-terminal API development workspace' })
  description?: string | null;

  @ApiProperty({ example: '#3b82f6' })
  color: string;

  @ApiProperty({ example: 'd:/CODE/Web/Projects/code-space-api' })
  rootPath: string;

  @ApiProperty({ example: 2 })
  terminalCount: number;

  @ApiPropertyOptional({ example: 'antigravity' })
  selectedCli?: string | null;

  @ApiProperty({ example: false })
  ideVscode: boolean;

  @ApiProperty({ example: true })
  ideAntigravity: boolean;

  @ApiPropertyOptional()
  layout?: any;

  @ApiProperty()
  createdAt: number;

  @ApiProperty()
  updatedAt: number;

  @ApiPropertyOptional({ type: [PresetTerminalResponseDto] })
  terminals?: PresetTerminalResponseDto[];
}
