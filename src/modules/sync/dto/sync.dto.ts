import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class SyncPushDto {
  @ApiProperty({ example: 'win-desktop-01', description: 'Client device unique identifier' })
  @IsString()
  @IsNotEmpty()
  clientDeviceId: string;

  @ApiProperty({
    example: '2026-08-02T09:30:00.000Z',
    description: 'ISO timestamp when the snapshot was generated',
  })
  @IsString()
  @IsNotEmpty()
  updatedAt: string;

  @ApiProperty({
    example: { workspaces: [], presets: [], settings: {}, directoryHistory: [] },
    description: 'Full database state snapshot object',
  })
  @IsObject()
  dbState: Record<string, any>;
}

export class SyncPushResponseDto {
  @ApiProperty({ example: true })
  synced: boolean;

  @ApiProperty({ example: '2026-08-02T09:30:00.000Z' })
  serverUpdatedAt: string;

  @ApiPropertyOptional({ description: 'Authoritative server backup state if sync failed' })
  dbState?: Record<string, any>;
}

export class SyncPullResponseDto {
  @ApiProperty({ example: '2026-08-02T09:30:00.000Z' })
  updatedAt: string;

  @ApiProperty({ example: { workspaces: [], presets: [], settings: {}, directoryHistory: [] } })
  dbState: Record<string, any>;
}

export class SyncLogResponseDto {
  @ApiProperty({ example: 'log-uuid-01' })
  id: string;

  @ApiProperty({ example: 'win-desktop-01' })
  clientDeviceId: string;

  @ApiProperty({ example: '1.0.0' })
  clientVersion: string;

  @ApiProperty({ example: 'SUCCESS' })
  status: string;

  @ApiPropertyOptional({ example: 'Workspaces: 2, Presets: 3' })
  payloadSummary?: string;

  @ApiProperty({ example: '2026-08-02T09:30:00.000Z' })
  syncedAt: Date;
}
