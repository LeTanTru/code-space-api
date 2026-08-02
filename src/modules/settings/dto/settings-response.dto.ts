import { ApiProperty } from '@nestjs/swagger';
import { TabOrientation, TerminalCursorStyle } from '@prisma/client';

export class SettingsResponseDto {
  @ApiProperty({ example: 'cyberpunk', description: 'Selected application color theme ID' })
  theme: string;

  @ApiProperty({ example: 'inter', description: 'Selected application font family ID' })
  font: string;

  @ApiProperty({
    enum: TabOrientation,
    example: TabOrientation.horizontal,
    description: 'Tab bar layout orientation',
  })
  tabOrientation: TabOrientation;

  @ApiProperty({ example: 14, description: 'Terminal font size in pixels' })
  terminalFontSize: number;

  @ApiProperty({
    enum: TerminalCursorStyle,
    example: TerminalCursorStyle.block,
    description: 'Terminal cursor shape style',
  })
  terminalCursorStyle: TerminalCursorStyle;

  @ApiProperty({ example: true, description: 'Whether terminal cursor blinks' })
  terminalCursorBlink: boolean;

  @ApiProperty({
    example: 'd:/CODE/Web/Projects',
    description: 'Default directory path for new terminal instances',
  })
  defaultDirectory: string;

  @ApiProperty({ example: true, description: 'Whether sound notifications are enabled' })
  soundNotifications: boolean;

  @ApiProperty({ example: true, description: 'Whether OS desktop notifications are enabled' })
  desktopNotifications: boolean;

  @ApiProperty({ example: 'default', description: 'Selected notification sound ID' })
  selectedSoundId: string;

  @ApiProperty({
    example: true,
    description: 'Whether to auto-restore active workspace sessions on startup',
  })
  autoRestoreSession: boolean;

  @ApiProperty({
    example: '2026-08-02T09:00:00.000Z',
    description: 'Timestamp when settings were last updated',
  })
  updatedAt: Date;
}
