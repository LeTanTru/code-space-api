import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { TabOrientation, TerminalCursorStyle } from '@prisma/client';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'dracula', description: 'Application color theme ID' })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ example: 'fira-code', description: 'Application font family ID' })
  @IsOptional()
  @IsString()
  font?: string;

  @ApiPropertyOptional({
    enum: TabOrientation,
    example: TabOrientation.horizontal,
    description: 'Tab bar layout orientation',
  })
  @IsOptional()
  @IsEnum(TabOrientation)
  tabOrientation?: TabOrientation;

  @ApiPropertyOptional({ example: 14, description: 'Terminal font size in pixels (8 to 48)' })
  @IsOptional()
  @IsInt()
  @Min(8)
  @Max(48)
  terminalFontSize?: number;

  @ApiPropertyOptional({
    enum: TerminalCursorStyle,
    example: TerminalCursorStyle.block,
    description: 'Terminal cursor shape style',
  })
  @IsOptional()
  @IsEnum(TerminalCursorStyle)
  terminalCursorStyle?: TerminalCursorStyle;

  @ApiPropertyOptional({ example: true, description: 'Whether terminal cursor blinks' })
  @IsOptional()
  @IsBoolean()
  terminalCursorBlink?: boolean;

  @ApiPropertyOptional({
    example: 'd:/CODE/Web/Projects',
    description: 'Default directory path for new terminal instances',
  })
  @IsOptional()
  @IsString()
  defaultDirectory?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether sound notifications are enabled' })
  @IsOptional()
  @IsBoolean()
  soundNotifications?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether OS desktop notifications are enabled',
  })
  @IsOptional()
  @IsBoolean()
  desktopNotifications?: boolean;

  @ApiPropertyOptional({ example: 'chime', description: 'Selected notification sound ID' })
  @IsOptional()
  @IsString()
  selectedSoundId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether to auto-restore active workspace sessions on startup',
  })
  @IsOptional()
  @IsBoolean()
  autoRestoreSession?: boolean;
}
